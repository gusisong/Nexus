/**
 * IPC channel definitions — shared between main & renderer.
 * Naming convention: {module}:{action}
 */
import type { Result } from './result';

export const IPC = {
  // SMTP Config
  CONFIG_LOAD_SMTP: 'config:load-smtp',
  CONFIG_SAVE_SMTP: 'config:save-smtp',
  CONFIG_TEST_SMTP: 'config:test-smtp',

  // Signature
  CONFIG_LOAD_SIGNATURE: 'config:load-signature',
  CONFIG_SAVE_SIGNATURE: 'config:save-signature',

  // Project management
  PROJECT_LIST: 'project:list',
  PROJECT_CREATE: 'project:create',
  PROJECT_DELETE: 'project:delete',

  // File operations
  FILE_LIST: 'file:list',
  FILE_DELETE: 'file:delete',
  FILE_MOVE: 'file:move',
  FILE_RENAME: 'file:rename',
  FILE_UPLOAD: 'file:upload',
  FILE_DROP: 'file:drop',
  FILE_READ_CSV: 'file:read-csv',
  FILE_SAVE_CSV: 'file:save-csv',

  // Email sending
  EMAIL_COUNT_PENDING: 'email:count-pending',
  EMAIL_SEND_BATCH: 'email:send-batch',
  EMAIL_CANCEL_SEND: 'email:cancel-send',
  EMAIL_PROGRESS: 'email:progress', // main → renderer event

  // Log
  LOG_LOAD: 'log:load',

  // App
  APP_SELECT_DIRECTORY: 'app:select-directory',
  APP_GET_WORK_DIR: 'app:get-work-dir',
  APP_SET_WORK_DIR: 'app:set-work-dir',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

// ---- Data types ----

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface SmtpConfigPartial {
  username: string;
  password: string;
  host: string;
  port: number;
}

export interface ProjectInfo {
  name: string;
  hasPending: boolean;
  hasSent: boolean;
}

export interface FileEntry {
  name: string;
  size: number;
  modifiedAt: string;
  isDirectory: boolean;
}

export interface EmailProgress {
  percent: number;
  rate: number;
  etaSeconds: number | null;
  completed: number;
  total: number;
  currentSupplier: string;
  currentProject: string;
  success: number;
  failed: number;
}

export interface SendResult {
  success: number;
  failed: number;
  skipped: number;
  cancelled: boolean;
}

// ---- Typed IPC API contract ----
// Maps a friendly API name to its argument tuple and return type.

export interface NexusApiContract {
  // Config
  loadSmtpConfig: { args: []; ret: SmtpConfigPartial };
  saveSmtpConfig: { args: [{ username: string; password: string }]; ret: Result };
  testSmtpConnection: { args: []; ret: Result };

  // Signature
  loadSignature: { args: []; ret: string };
  saveSignature: { args: [string]; ret: Result };

  // Projects
  listProjects: { args: []; ret: ProjectInfo[] };
  createProject: { args: [string]; ret: Result };
  deleteProject: { args: [string]; ret: Result };

  // Files
  listFiles: { args: [string]; ret: FileEntry[] };
  deleteFiles: { args: [string[]]; ret: Result };
  moveFiles: { args: [string[], string]; ret: Result };
  renameFile: { args: [string, string]; ret: Result };
  uploadFiles: { args: [string]; ret: Result<number> };
  dropFiles: { args: [string[], string]; ret: Result<number> };
  readCsv: { args: [string]; ret: Result<string[][]> };
  saveCsv: { args: [string, string[][]]; ret: Result };

  // Email
  countPending: { args: [string[]]; ret: number };
  sendBatch: { args: [string[]]; ret: SendResult };
  cancelSend: { args: []; ret: boolean };
  onProgress: { args: [(progress: EmailProgress) => void]; ret: () => void };

  // Log
  loadLog: { args: []; ret: string };

  // App
  selectDirectory: { args: []; ret: string | null };
  getWorkDir: { args: []; ret: string };
  setWorkDir: { args: [string]; ret: boolean };
}

/**
 * Typed NexusAPI — derived from the contract.
 * This type is what `window.nexus` actually exposes.
 */
export type NexusAPI = {
  [K in keyof NexusApiContract]: (
    ...args: NexusApiContract[K]['args']
  ) => NexusApiContract[K]['ret'] extends Promise<any>
    ? NexusApiContract[K]['ret']
    : Promise<NexusApiContract[K]['ret']>;
};
