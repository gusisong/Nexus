/**
 * Email Service — SMTP batch sending with rate limiting and retry logic.
 * Replaces Python send_emails_smtp.py using Nodemailer.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as nodemailer from 'nodemailer';
import { loadSmtpConfig, csvPath, loadSignature, logPath } from './config.service';
import type { EmailProgress, SendResult } from '../../shared/ipc';

// ---- Rate limiting parameters (uniform pacing: 5 emails / 60s window) ----
const SEND_INTERVAL = 12.0;  // seconds between emails
const SEND_JITTER = 1.0;     // random ±1s jitter
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 60.0;
const EMA_ALPHA = 0.3;

// ---- Logger ----
function appendLog(rootDir: string, level: string, message: string): void {
  const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
  const line = `${timestamp} - ${level} - ${message}\n`;
  try {
    fs.appendFileSync(logPath(rootDir), line, 'utf-8');
  } catch { /* ignore */ }
}

// ---- CSV parsing ----
export function readEmailAddresses(rootDir: string): Map<string, string> {
  const p = csvPath(rootDir);
  if (!fs.existsSync(p)) {
    appendLog(rootDir, 'ERROR', `EmailAddress.csv 不存在: ${p}`);
    return new Map();
  }
  try {
    let content: string;
    try {
      content = fs.readFileSync(p, 'utf-8');
      // Strip BOM
      if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    } catch {
      content = fs.readFileSync(p, 'latin1');
    }
    const byCode = new Map<string, string[]>();
    const lines = content.split(/\r?\n/);
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // Simple CSV split (no quoted fields expected)
      const parts = line.split(',');
      if (parts.length < 3) continue;
      const code = parts[0].trim();
      const email = parts[2].trim();
      if (!code || !email) continue;
      if (!byCode.has(code)) byCode.set(code, []);
      byCode.get(code)!.push(email);
    }
    const result = new Map<string, string>();
    for (const [code, emails] of byCode) {
      result.set(code, emails.join(';'));
    }
    return result;
  } catch (e) {
    appendLog(rootDir, 'ERROR', `读取 EmailAddress.csv 失败: ${e}`);
    return new Map();
  }
}

// ---- File scanning ----
interface SupplierTask {
  projectFolder: string;
  supplierCode: string;
  files: string[];
  toEmail: string;
}

function collectSupplierFiles(pendingPath: string): Map<string, string[]> {
  const result = new Map<string, string[]>();
  if (!fs.existsSync(pendingPath)) return result;
  for (const filename of fs.readdirSync(pendingPath)) {
    if (!filename.endsWith('.xlsx') || !filename.includes('_')) continue;
    const parts = filename.split('_');
    if (parts.length < 3) continue;
    const code = parts[parts.length - 2];
    if (!/^\d{5}$/.test(code)) continue;
    const filePath = path.join(pendingPath, filename);
    if (!result.has(code)) result.set(code, []);
    result.get(code)!.push(filePath);
  }
  return result;
}

// ---- Sending ----

let cancelFlag = false;

export function cancelSend(): void {
  cancelFlag = true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const interval = 500;
    let remaining = ms;
    const timer = setInterval(() => {
      if (cancelFlag) {
        clearInterval(timer);
        resolve();
        return;
      }
      remaining -= interval;
      if (remaining <= 0) {
        clearInterval(timer);
        resolve();
      }
    }, interval);
  });
}

export function countPendingTasks(
  rootDir: string,
  projectNames: string[],
): number {
  const emails = readEmailAddresses(rootDir);
  let count = 0;
  const projectSet = new Set(projectNames);
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.endsWith('项目')) continue;
    if (projectSet.size > 0 && !projectSet.has(entry.name)) continue;
    const pendingPath = path.join(rootDir, entry.name, '待外发');
    const supplierFiles = collectSupplierFiles(pendingPath);
    for (const code of supplierFiles.keys()) {
      if (emails.has(code)) count++;
    }
  }
  return count;
}

export async function sendBatch(
  rootDir: string,
  projectNames: string[],
  onProgress: (progress: EmailProgress) => void,
): Promise<SendResult> {
  cancelFlag = false;
  const result: SendResult = { success: 0, failed: 0, skipped: 0, cancelled: false };

  const smtpConfig = loadSmtpConfig(rootDir);
  if (!smtpConfig || !smtpConfig.host || !smtpConfig.username) {
    appendLog(rootDir, 'ERROR', 'SMTP 配置缺失或无效，退出。');
    return result;
  }

  const emailAddresses = readEmailAddresses(rootDir);
  const signature = loadSignature(rootDir);
  const ccEmail = smtpConfig.username;

  // Build task list
  const tasks: SupplierTask[] = [];
  const projectSet = new Set(projectNames);
  const allEntries = fs.readdirSync(rootDir, { withFileTypes: true });
  const projectDirs = allEntries
    .filter(e => e.isDirectory() && e.name.endsWith('项目'))
    .filter(e => projectSet.size === 0 || projectSet.has(e.name))
    .map(e => e.name)
    .sort();

  for (const projectFolder of projectDirs) {
    const pendingPath = path.join(rootDir, projectFolder, '待外发');
    const sentPath = path.join(rootDir, projectFolder, '已外发');
    if (!fs.existsSync(pendingPath) || !fs.existsSync(sentPath)) {
      appendLog(rootDir, 'WARNING', `项目文件夹 '${projectFolder}' 缺少「待外发」或「已外发」，跳过。`);
      continue;
    }
    const supplierFiles = collectSupplierFiles(pendingPath);
    for (const [code, files] of supplierFiles) {
      const toEmail = emailAddresses.get(code);
      if (!toEmail) {
        appendLog(rootDir, 'WARNING', `供应商 ${code} (${projectFolder}): 跳过 - 没有对应的邮箱地址。`);
        continue;
      }
      tasks.push({ projectFolder, supplierCode: code, files, toEmail });
    }
  }

  const total = tasks.length;
  if (total === 0) {
    appendLog(rootDir, 'INFO', '没有需要发送的任务。');
    return result;
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.use_ssl,
    auth: { user: smtpConfig.username, pass: smtpConfig.password },
    tls: smtpConfig.use_tls ? { rejectUnauthorized: false } : undefined,
  });

  const startTime = Date.now();
  let completed = 0;
  let rateEma: number | null = null;

  for (const task of tasks) {
    if (cancelFlag) {
      appendLog(rootDir, 'INFO', '发送已被用户取消，提前退出。');
      result.cancelled = true;
      break;
    }

    const logPrefix = `供应商 ${task.supplierCode} (${task.projectFolder}): `;

    // Uniform pacing — first email no wait, subsequent wait SEND_INTERVAL ± SEND_JITTER
    if (completed > 0) {
      const jitter = (Math.random() * 2 - 1) * SEND_JITTER;
      const waitMs = (SEND_INTERVAL + jitter) * 1000;
      appendLog(rootDir, 'INFO', `等待 ${(waitMs / 1000).toFixed(1)}s 后发送下一封 …`);
      await sleep(waitMs);
      if (cancelFlag) {
        result.cancelled = true;
        break;
      }
    }

    const subject = `${task.projectFolder}零件供货方式确认_${task.supplierCode}`;
    const bodyPlain =
      `供应商，你好：\n\n` +
      `附件是${task.projectFolder}零件《供货方式确认表》，烦请核对信息\n\n` +
      `如无问题，请在三个工作日内签字盖章回传，谢谢！\n\n` +
      signature;
    const bodyHtml = bodyPlain.replace(/\n/g, '<br>');

    const toList = task.toEmail.split(';').map(e => e.trim()).filter(Boolean);
    const attachments = task.files.map(f => ({
      filename: path.basename(f),
      path: f,
    }));

    appendLog(rootDir, 'INFO', `${logPrefix}正在发送邮件到 ${task.toEmail}，附件数量: ${task.files.length}`);

    let success = false;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (cancelFlag) break;
      try {
        await transporter.sendMail({
          from: smtpConfig.username,
          to: toList,
          cc: ccEmail,
          subject,
          html: bodyHtml,
          attachments,
        });
        success = true;
        break;
      } catch (e: any) {
        appendLog(rootDir, 'ERROR', `${logPrefix}发送失败 (第 ${attempt + 1}/${MAX_RETRIES} 次): ${e.message || e}`);
        if (attempt < MAX_RETRIES - 1) {
          const retryJitter = 0.8 + Math.random() * 0.4;
          const waitMs = RETRY_BASE_DELAY * retryJitter * 1000;
          appendLog(rootDir, 'INFO', `第 ${attempt + 1}/${MAX_RETRIES - 1} 次重试，等待 ${(waitMs / 1000).toFixed(1)}s …`);
          await sleep(waitMs);
        }
      }
    }

    if (success) {
      result.success++;
      appendLog(rootDir, 'INFO', `${logPrefix}成功 - 邮件发送成功。`);
      const sentDir = path.join(rootDir, task.projectFolder, '已外发');
      for (const fp of task.files) {
        try {
          fs.renameSync(fp, path.join(sentDir, path.basename(fp)));
          appendLog(rootDir, 'INFO', `${logPrefix}已移动文件到「已外发」: ${path.basename(fp)}`);
        } catch (e) {
          appendLog(rootDir, 'ERROR', `${logPrefix}文件移动失败: ${path.basename(fp)} - ${e}`);
        }
      }
    } else {
      result.failed++;
      appendLog(rootDir, 'ERROR', `${logPrefix}失败 - 邮件发送失败。`);
      const failedDir = path.join(rootDir, task.projectFolder, 'failed');
      try {
        fs.mkdirSync(failedDir, { recursive: true });
        for (const fp of task.files) {
          try {
            fs.renameSync(fp, path.join(failedDir, path.basename(fp)));
            appendLog(rootDir, 'INFO', `${logPrefix}已移动失败文件到 failed/: ${path.basename(fp)}`);
          } catch (e) {
            appendLog(rootDir, 'ERROR', `${logPrefix}failed 移动失败: ${path.basename(fp)} - ${e}`);
          }
        }
      } catch (e) {
        appendLog(rootDir, 'ERROR', `${logPrefix}创建 failed 目录失败: ${e}`);
      }
    }

    completed++;
    // Progress reporting
    const elapsed = (Date.now() - startTime) / 1000;
    const instRate = elapsed > 0 ? completed / elapsed : 0;
    rateEma = rateEma === null ? instRate : EMA_ALPHA * instRate + (1 - EMA_ALPHA) * rateEma;
    const etaSeconds = rateEma > 0 ? (total - completed) / rateEma : null;
    const percent = (completed / total) * 100;
    onProgress({
      percent,
      rate: rateEma,
      etaSeconds,
      completed,
      total,
      currentSupplier: task.supplierCode,
      currentProject: task.projectFolder,
      success: result.success,
      failed: result.failed,
    });
  }

  transporter.close();
  return result;
}

import { ok, err, type Result } from '../../shared/result';

// ... (existing code)

export async function testSmtpConnection(rootDir: string): Promise<Result> {
  const smtpConfig = loadSmtpConfig(rootDir);
  if (!smtpConfig || !smtpConfig.host || !smtpConfig.username) {
    return err('SMTP 配置缺失或无效，请先保存配置。');
  }
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.use_ssl,
    auth: { user: smtpConfig.username, pass: smtpConfig.password },
    tls: smtpConfig.use_tls ? { rejectUnauthorized: false } : undefined,
  });
  try {
    await transporter.verify();
    transporter.close();
    return ok(undefined, 'SMTP 连接成功！');
  } catch (e: any) {
    transporter.close();
    return err(`连接失败: ${e.message || e}`);
  }
}
