type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
}

function log(level: LogLevel, message: string, context?: string, data?: unknown) {
  const entry: LogEntry = {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'production') {
    // Structured JSON log for Cloud Run / Cloud Logging
    const severity = level === 'error' ? 'ERROR' : level === 'warn' ? 'WARNING' : level === 'debug' ? 'DEBUG' : 'INFO';
    process.stdout.write(JSON.stringify({ severity, ...entry }) + '\n');
  } else {
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]${context ? ` [${context}]` : ''}`;
    if (level === 'error') console.error(prefix, message, data ?? '');
    else if (level === 'warn') console.warn(prefix, message, data ?? '');
    else console.log(prefix, message, data ?? '');
  }
}

export const logger = {
  info: (message: string, context?: string, data?: unknown) => log('info', message, context, data),
  warn: (message: string, context?: string, data?: unknown) => log('warn', message, context, data),
  error: (message: string, context?: string, data?: unknown) => log('error', message, context, data),
  debug: (message: string, context?: string, data?: unknown) => {
    if (process.env.NODE_ENV !== 'production') log('debug', message, context, data);
  },
};
