/// <reference types="vite/client" />

import type { NexusAPI } from './shared/ipc';

declare global {
  interface Window {
    nexus: NexusAPI;
  }
}
