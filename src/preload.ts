// Preload script — securely expose IPC API to renderer
import { contextBridge, ipcRenderer } from 'electron';
import { IPC, type EmailProgress } from './shared/ipc';

export type NexusAPI = typeof nexusAPI;

const nexusAPI = {
  // -- Config --
  loadSmtpConfig: () => ipcRenderer.invoke(IPC.CONFIG_LOAD_SMTP),
  saveSmtpConfig: (config: { username: string; password: string }) =>
    ipcRenderer.invoke(IPC.CONFIG_SAVE_SMTP, config),
  testSmtpConnection: () => ipcRenderer.invoke(IPC.CONFIG_TEST_SMTP),

  // -- Signature --
  loadSignature: () => ipcRenderer.invoke(IPC.CONFIG_LOAD_SIGNATURE),
  saveSignature: (content: string) =>
    ipcRenderer.invoke(IPC.CONFIG_SAVE_SIGNATURE, content),

  // -- Projects --
  listProjects: () => ipcRenderer.invoke(IPC.PROJECT_LIST),
  createProject: (name: string) =>
    ipcRenderer.invoke(IPC.PROJECT_CREATE, name),
  deleteProject: (name: string) =>
    ipcRenderer.invoke(IPC.PROJECT_DELETE, name),

  // -- Files --
  listFiles: (dirPath: string) => ipcRenderer.invoke(IPC.FILE_LIST, dirPath),
  deleteFiles: (paths: string[]) => ipcRenderer.invoke(IPC.FILE_DELETE, paths),
  moveFiles: (paths: string[], destDir: string) =>
    ipcRenderer.invoke(IPC.FILE_MOVE, paths, destDir),
  renameFile: (oldPath: string, newName: string) =>
    ipcRenderer.invoke(IPC.FILE_RENAME, oldPath, newName),
  uploadFiles: (destDir: string) =>
    ipcRenderer.invoke(IPC.FILE_UPLOAD, destDir),
  dropFiles: (srcPaths: string[], destDir: string) =>
    ipcRenderer.invoke(IPC.FILE_DROP, srcPaths, destDir),
  readCsv: (filePath: string) => ipcRenderer.invoke(IPC.FILE_READ_CSV, filePath),
  saveCsv: (filePath: string, data: string[][]) =>
    ipcRenderer.invoke(IPC.FILE_SAVE_CSV, filePath, data),

  // -- Email --
  countPending: (projectNames: string[]) =>
    ipcRenderer.invoke(IPC.EMAIL_COUNT_PENDING, projectNames),
  sendBatch: (projectNames: string[]) =>
    ipcRenderer.invoke(IPC.EMAIL_SEND_BATCH, projectNames),
  cancelSend: () => ipcRenderer.invoke(IPC.EMAIL_CANCEL_SEND),
  onProgress: (callback: (progress: EmailProgress) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: EmailProgress) =>
      callback(data);
    ipcRenderer.on(IPC.EMAIL_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC.EMAIL_PROGRESS, handler);
  },

  // -- Log --
  loadLog: () => ipcRenderer.invoke(IPC.LOG_LOAD),

  // -- App --
  selectDirectory: () => ipcRenderer.invoke(IPC.APP_SELECT_DIRECTORY),
  getWorkDir: () => ipcRenderer.invoke(IPC.APP_GET_WORK_DIR),
  setWorkDir: (dir: string) => ipcRenderer.invoke(IPC.APP_SET_WORK_DIR, dir),
};

contextBridge.exposeInMainWorld('nexus', nexusAPI);
