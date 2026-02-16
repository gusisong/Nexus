/**
 * File Service — file browsing, upload, delete, move, rename, CSV read/write.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { dialog } from 'electron';
import Papa from 'papaparse';
import type { FileEntry } from '../../shared/ipc';
import { ok, err, type Result } from '../../shared/result';

/**
 * Security: ensure the resolved path is inside the allowed root directory.
 */
function assertInside(target: string, root: string): void {
  const resolved = path.resolve(target);
  const resolvedRoot = path.resolve(root);
  if (!resolved.startsWith(resolvedRoot + path.sep) && resolved !== resolvedRoot) {
    throw new Error(`路径不在工作目录内: ${resolved}`);
  }
}

/**
 * List files in a directory.
 */
export function listFiles(dirPath: string): FileEntry[] {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: FileEntry[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    try {
      const stat = fs.statSync(fullPath);
      files.push({
        name: entry.name,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        isDirectory: entry.isDirectory(),
      });
    } catch {
      // skip files we can't stat
    }
  }
  return files.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Delete files by absolute paths.
 */
export function deleteFiles(rootDir: string, filePaths: string[]): Result {
  try {
    for (const fp of filePaths) {
      assertInside(fp, rootDir);
      if (fs.existsSync(fp)) {
        const stat = fs.statSync(fp);
        if (stat.isDirectory()) {
          fs.rmSync(fp, { recursive: true });
        } else {
          fs.unlinkSync(fp);
        }
      }
    }
    return ok(undefined, `已删除 ${filePaths.length} 个文件`);
  } catch (e) {
    return err(String(e));
  }
}

/**
 * Move files to a destination directory.
 */
export function moveFiles(
  rootDir: string,
  filePaths: string[],
  destDir: string,
): Result {
  try {
    assertInside(destDir, rootDir);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    let moved = 0;
    for (const fp of filePaths) {
      assertInside(fp, rootDir);
      const basename = path.basename(fp);
      const dest = path.join(destDir, basename);
      if (fs.existsSync(fp)) {
        fs.renameSync(fp, dest);
        moved++;
      }
    }
    return ok(undefined, `已移动 ${moved} 个文件`);
  } catch (e) {
    return err(String(e));
  }
}

/**
 * Rename a file.
 */
export function renameFile(
  rootDir: string,
  oldPath: string,
  newName: string,
): Result {
  try {
    assertInside(oldPath, rootDir);
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName);
    assertInside(newPath, rootDir);
    if (fs.existsSync(newPath)) {
      return err(`文件 "${newName}" 已存在`);
    }
    fs.renameSync(oldPath, newPath);
    return ok(undefined, '重命名成功');
  } catch (e) {
    return err(String(e));
  }
}

/**
 * Open a file dialog and copy selected files to the destination directory.
 */
export async function uploadFiles(
  destDir: string,
  rootDir: string,
): Promise<Result<number>> {
  try {
    assertInside(destDir, rootDir);
    const result = await dialog.showOpenDialog({
      title: '选择要上传的文件',
      properties: ['openFile', 'multiSelections'],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return ok(0, '未选择文件');
    }
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    let count = 0;
    for (const src of result.filePaths) {
      const basename = path.basename(src);
      const dest = path.join(destDir, basename);
      fs.copyFileSync(src, dest);
      count++;
    }
    return ok(count, `已上传 ${count} 个文件`);
  } catch (e) {
    return err(String(e));
  }
}

/**
 * Copy files dropped from the renderer (given their paths) to a destination.
 */
export function copyDroppedFiles(
  rootDir: string,
  srcPaths: string[],
  destDir: string,
): Result<number> {
  try {
    assertInside(destDir, rootDir);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    let count = 0;
    for (const src of srcPaths) {
      const basename = path.basename(src);
      const dest = path.join(destDir, basename);
      fs.copyFileSync(src, dest);
      count++;
    }
    return ok(count, `已上传 ${count} 个文件`);
  } catch (e) {
    return err(String(e));
  }
}

/**
 * Read a CSV file and return as 2D string array (using papaparse).
 */
export function readCsv(filePath: string, rootDir: string): Result<string[][]> {
  try {
    assertInside(filePath, rootDir);
    if (!fs.existsSync(filePath)) {
      return err('文件不存在');
    }
    let raw = fs.readFileSync(filePath, 'utf-8');
    // Handle BOM
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);

    const parsed = Papa.parse<string[]>(raw, {
      header: false,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return err(`CSV 解析错误: ${parsed.errors[0].message}`);
    }

    return ok(parsed.data);
  } catch (e) {
    return err(String(e));
  }
}

/**
 * Save a 2D string array as CSV (using papaparse).
 */
export function saveCsv(
  filePath: string,
  data: string[][],
  rootDir: string,
): Result {
  try {
    assertInside(filePath, rootDir);
    const csvContent = Papa.unparse(data);
    fs.writeFileSync(filePath, '\ufeff' + csvContent, 'utf-8'); // BOM for Excel compat
    return ok(undefined, '保存成功');
  } catch (e) {
    return err(String(e));
  }
}
