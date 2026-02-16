/**
 * Project Service — manages project folders (listing, creation, deletion).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ProjectInfo } from '../../shared/ipc';
import { ok, err, type Result } from '../../shared/result';

const SKIP_NAMES = new Set(['已外发', '待外发', 'dev', '.git', '.venv', 'node_modules']);

function normalizeProjectName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.endsWith('项目') ? trimmed : trimmed + '项目';
}

export function listProjects(rootDir: string): ProjectInfo[] {
  if (!fs.existsSync(rootDir)) return [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const projects: ProjectInfo[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (SKIP_NAMES.has(entry.name)) continue;
    if (!entry.name.endsWith('项目')) continue;
    const projectPath = path.join(rootDir, entry.name);
    projects.push({
      name: entry.name,
      hasPending: fs.existsSync(path.join(projectPath, '待外发')),
      hasSent: fs.existsSync(path.join(projectPath, '已外发')),
    });
  }
  return projects.sort((a, b) => a.name.localeCompare(b.name));
}

export function createProject(
  rootDir: string,
  rawName: string,
): Result {
  const name = normalizeProjectName(rawName);
  if (!name) return err('请输入项目名称。');
  if (['已外发', '待外发'].includes(name)) {
    return err(`项目名称不能为「${name}」。`);
  }
  const projectPath = path.join(rootDir, name);
  const pending = path.join(projectPath, '待外发');
  const sent = path.join(projectPath, '已外发');
  try {
    fs.mkdirSync(pending, { recursive: true });
    fs.mkdirSync(sent, { recursive: true });
    return ok(undefined, `已创建：${pending}\n${sent}`);
  } catch (e) {
    return err(String(e));
  }
}

export function deleteProject(
  rootDir: string,
  projectName: string,
): Result {
  if (!projectName || !projectName.endsWith('项目')) {
    return err('无效的项目名称');
  }
  const projectPath = path.join(rootDir, projectName);
  const resolved = path.resolve(projectPath);
  const resolvedRoot = path.resolve(rootDir);
  if (!resolved.startsWith(resolvedRoot + path.sep)) {
    return err('路径不在工作目录内');
  }
  try {
    if (!fs.existsSync(projectPath)) {
      return err(`项目「${projectName}」不存在`);
    }
    fs.rmSync(projectPath, { recursive: true, force: true });
    return ok(undefined, `已删除项目「${projectName}」`);
  } catch (e) {
    return err(String(e));
  }
}
