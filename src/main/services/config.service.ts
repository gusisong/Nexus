/**
 * Config Service — manages SMTP config, signature, and work directory.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ini from './ini-parser';
import { ok, err, type Result } from '../../shared/result';

const CONFIG_FILENAME = 'smtp_config.ini';
const SIGNATURE_FILENAME = 'Signature.txt';
const CSV_FILENAME = 'EmailAddress.csv';
const LOG_FILENAME = 'email_smtp_log.log';

let workDir = '';

export function setWorkDir(dir: string): void {
  workDir = dir;
}

export function getWorkDir(): string {
  return workDir;
}

// --- Path helpers (try dev/ first, then root) ---

function findFile(rootDir: string, filename: string): string {
  const devPath = path.join(rootDir, 'dev', filename);
  if (fs.existsSync(devPath)) return devPath;
  return path.join(rootDir, filename);
}

export function configPath(rootDir: string): string {
  return findFile(rootDir, CONFIG_FILENAME);
}

export function signaturePath(rootDir: string): string {
  return findFile(rootDir, SIGNATURE_FILENAME);
}

export function csvPath(rootDir: string): string {
  return path.join(rootDir, CSV_FILENAME);
}

export function logPath(rootDir: string): string {
  return path.join(rootDir, LOG_FILENAME);
}

// --- SMTP config ---

export interface SmtpFileConfig {
  host: string;
  port: number;
  use_ssl: boolean;
  use_tls: boolean;
  username: string;
  password: string;
}

export function loadSmtpConfig(rootDir: string): SmtpFileConfig | null {
  const p = configPath(rootDir);
  if (!fs.existsSync(p)) return null;
  try {
    const content = fs.readFileSync(p, 'utf-8');
    const parsed = ini.parse(content);
    const section = parsed['smtp'];
    if (!section) return null;
    return {
      host: (section['host'] || '').trim(),
      port: parseInt(section['port'] || '587', 10),
      use_ssl: (section['use_ssl'] || 'false').toLowerCase() === 'true',
      use_tls: (section['use_tls'] || 'true').toLowerCase() === 'true',
      username: (section['username'] || '').trim(),
      password: (section['password'] || '').trim(),
    };
  } catch {
    return null;
  }
}

export function saveSmtpCredentials(
  rootDir: string,
  username: string,
  password: string,
): Result {
  const p = configPath(rootDir);
  try {
    let parsed: Record<string, Record<string, string>> = {};
    if (fs.existsSync(p)) {
      parsed = ini.parse(fs.readFileSync(p, 'utf-8'));
    }
    if (!parsed['smtp']) parsed['smtp'] = {};
    const section = parsed['smtp'];
    if (!section['host']) section['host'] = 'smtp.csvw.com';
    if (!section['port']) section['port'] = '587';
    if (!section['use_ssl']) section['use_ssl'] = 'false';
    if (!section['use_tls']) section['use_tls'] = 'true';
    section['username'] = username;
    section['password'] = password;
    fs.writeFileSync(p, ini.stringify(parsed), 'utf-8');
    return ok(undefined, '保存成功');
  } catch (e) {
    return err(String(e));
  }
}

// --- Signature ---

export function loadSignature(rootDir: string): string {
  const p = signaturePath(rootDir);
  if (!fs.existsSync(p)) return '';
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return '';
  }
}

export function saveSignature(rootDir: string, content: string): Result {
  const p = signaturePath(rootDir);
  try {
    fs.writeFileSync(p, content, 'utf-8');
    return ok(undefined, '签名保存成功');
  } catch (e) {
    return err(String(e));
  }
}

// --- Log ---

export function loadLogContent(rootDir: string, maxLines = 500): string {
  const p = logPath(rootDir);
  if (!fs.existsSync(p)) return `[ 日志文件不存在: ${p} ]`;
  try {
    const content = fs.readFileSync(p, 'utf-8');
    const lines = content.split('\n');
    if (lines.length > maxLines) {
      return `[ 仅显示最后 ${maxLines} 行 ]…\n` + lines.slice(-maxLines).join('\n');
    }
    return content;
  } catch (e) {
    return `[ 读取失败: ${e} ]`;
  }
}
