export type Backup = {
  repl: Record<string, unknown>[];
  interceptors: Record<string, unknown>[];
  settings: Record<string, unknown>[];
  appinfo: Record<string, unknown>[];
};
