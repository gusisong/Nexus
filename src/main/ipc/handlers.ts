/**
 * IPC Handlers — register all IPC handlers for the main process.
 */
import { ipcMain, dialog, BrowserWindow } from 'electron';
import { IPC } from '../../shared/ipc';
import * as configService from '../services/config.service';
import * as projectService from '../services/project.service';
import * as emailService from '../services/email.service';
import * as fileService from '../services/file.service';

export function registerIpcHandlers(): void {
  // ---- Config ----
  ipcMain.handle(IPC.CONFIG_LOAD_SMTP, () => {
    const cfg = configService.loadSmtpConfig(configService.getWorkDir());
    return cfg
      ? { username: cfg.username, password: cfg.password, host: cfg.host, port: cfg.port }
      : { username: '', password: '', host: 'smtp.csvw.com', port: 587 };
  });

  ipcMain.handle(IPC.CONFIG_SAVE_SMTP, (_event, data: { username: string; password: string }) => {
    return configService.saveSmtpCredentials(configService.getWorkDir(), data.username, data.password);
  });

  ipcMain.handle(IPC.CONFIG_TEST_SMTP, async () => {
    return emailService.testSmtpConnection(configService.getWorkDir());
  });

  // ---- Signature ----
  ipcMain.handle(IPC.CONFIG_LOAD_SIGNATURE, () => {
    return configService.loadSignature(configService.getWorkDir());
  });

  ipcMain.handle(IPC.CONFIG_SAVE_SIGNATURE, (_event, content: string) => {
    return configService.saveSignature(configService.getWorkDir(), content);
  });

  // ---- Projects ----
  ipcMain.handle(IPC.PROJECT_LIST, () => {
    return projectService.listProjects(configService.getWorkDir());
  });

  ipcMain.handle(IPC.PROJECT_CREATE, (_event, name: string) => {
    return projectService.createProject(configService.getWorkDir(), name);
  });

  ipcMain.handle(IPC.PROJECT_DELETE, (_event, name: string) => {
    return projectService.deleteProject(configService.getWorkDir(), name);
  });

  // ---- Files ----
  ipcMain.handle(IPC.FILE_LIST, (_event, dirPath: string) => {
    return fileService.listFiles(dirPath);
  });

  ipcMain.handle(IPC.FILE_DELETE, (_event, paths: string[]) => {
    return fileService.deleteFiles(configService.getWorkDir(), paths);
  });

  ipcMain.handle(IPC.FILE_MOVE, (_event, paths: string[], destDir: string) => {
    return fileService.moveFiles(configService.getWorkDir(), paths, destDir);
  });

  ipcMain.handle(IPC.FILE_RENAME, (_event, oldPath: string, newName: string) => {
    return fileService.renameFile(configService.getWorkDir(), oldPath, newName);
  });

  ipcMain.handle(IPC.FILE_UPLOAD, async (_event, destDir: string) => {
    return fileService.uploadFiles(destDir, configService.getWorkDir());
  });

  ipcMain.handle(IPC.FILE_DROP, (_event, srcPaths: string[], destDir: string) => {
    return fileService.copyDroppedFiles(configService.getWorkDir(), srcPaths, destDir);
  });

  ipcMain.handle(IPC.FILE_READ_CSV, (_event, filePath: string) => {
    return fileService.readCsv(filePath, configService.getWorkDir());
  });

  ipcMain.handle(IPC.FILE_SAVE_CSV, (_event, filePath: string, data: string[][]) => {
    return fileService.saveCsv(filePath, data, configService.getWorkDir());
  });

  // ---- Email ----
  ipcMain.handle(IPC.EMAIL_COUNT_PENDING, (_event, projectNames: string[]) => {
    return emailService.countPendingTasks(configService.getWorkDir(), projectNames);
  });

  ipcMain.handle(IPC.EMAIL_SEND_BATCH, async (event, projectNames: string[]) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await emailService.sendBatch(
      configService.getWorkDir(),
      projectNames,
      (progress) => {
        if (win && !win.isDestroyed()) {
          win.webContents.send(IPC.EMAIL_PROGRESS, progress);
        }
      },
    );
    return result;
  });

  ipcMain.handle(IPC.EMAIL_CANCEL_SEND, () => {
    emailService.cancelSend();
    return true;
  });

  // ---- Log ----
  ipcMain.handle(IPC.LOG_LOAD, () => {
    return configService.loadLogContent(configService.getWorkDir());
  });

  // ---- App ----
  ipcMain.handle(IPC.APP_SELECT_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog({
      title: '选择工作根目录',
      properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(IPC.APP_GET_WORK_DIR, () => {
    return configService.getWorkDir();
  });

  ipcMain.handle(IPC.APP_SET_WORK_DIR, (_event, dir: string) => {
    configService.setWorkDir(dir);
    return true;
  });
}
