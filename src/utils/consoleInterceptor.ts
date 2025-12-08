import { addConsoleLogEntry } from '../store/puzzleStore';

// Store original console methods
const originalConsole = {
  log: console.log.bind(console),
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

/**
 * Format console arguments into a string representation
 */
function formatConsoleArgs(args: unknown[]): string {
  return args.map(arg => {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
}

/**
 * Intercept console methods and store logs
 */
export function setupConsoleInterceptor() {
  console.log = (...args: unknown[]) => {
    originalConsole.log(...args);
    addConsoleLogEntry({
      timestamp: Date.now(),
      level: 'log',
      args,
      formatted: formatConsoleArgs(args),
    });
  };

  console.debug = (...args: unknown[]) => {
    originalConsole.debug(...args);
    addConsoleLogEntry({
      timestamp: Date.now(),
      level: 'debug',
      args,
      formatted: formatConsoleArgs(args),
    });
  };

  console.info = (...args: unknown[]) => {
    originalConsole.info(...args);
    addConsoleLogEntry({
      timestamp: Date.now(),
      level: 'info',
      args,
      formatted: formatConsoleArgs(args),
    });
  };

  console.warn = (...args: unknown[]) => {
    originalConsole.warn(...args);
    addConsoleLogEntry({
      timestamp: Date.now(),
      level: 'warn',
      args,
      formatted: formatConsoleArgs(args),
    });
  };

  console.error = (...args: unknown[]) => {
    originalConsole.error(...args);
    addConsoleLogEntry({
      timestamp: Date.now(),
      level: 'error',
      args,
      formatted: formatConsoleArgs(args),
    });
  };
}

/**
 * Restore original console methods (useful for cleanup)
 */
export function restoreConsole() {
  console.log = originalConsole.log;
  console.debug = originalConsole.debug;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
}

