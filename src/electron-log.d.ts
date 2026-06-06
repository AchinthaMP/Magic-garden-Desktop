declare module 'electron-log' {
  interface LogFunctions {
    info(...params: unknown[]): void;
    warn(...params: unknown[]): void;
    error(...params: unknown[]): void;
    debug(...params: unknown[]): void;
    verbose(...params: unknown[]): void;
    silly(...params: unknown[]): void;
  }

  interface Logger extends LogFunctions {
    transports: {
      file: {
        level: string | boolean;
      };
      console: {
        level: string | boolean;
      };
    };
  }

  const log: Logger;
  export = log;
}
