export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum LogCategory {
  API = 'API',
  DATABASE = 'DATABASE',
  UI = 'UI',
  AUTH = 'AUTH',
  STORAGE = 'STORAGE',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  SYSTEM = 'SYSTEM',
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: string;
  stack?: string;
  data?: any;
  userId?: string;
  action?: string;
  component?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private listeners: Array<(log: LogEntry) => void> = [];

  private createLog(
    level: LogLevel,
    category: LogCategory,
    message: string,
    options?: {
      context?: string;
      stack?: string;
      data?: any;
      action?: string;
      component?: string;
    }
  ): LogEntry {
    const log: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      message,
      ...options,
    };

    this.logs.push(log);
    
    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(log));

    // Console output with colors
    this.consoleLog(log);

    // Store in localStorage for persistence
    this.persistLogs();

    return log;
  }

  private consoleLog(log: LogEntry) {
    const styles = {
      [LogLevel.DEBUG]: 'color: #6c757d',
      [LogLevel.INFO]: 'color: #0dcaf0',
      [LogLevel.WARN]: 'color: #ffc107',
      [LogLevel.ERROR]: 'color: #dc3545',
      [LogLevel.CRITICAL]: 'color: #fff; background: #dc3545; font-weight: bold',
    };

    const style = styles[log.level];
    const prefix = `[${log.timestamp.toISOString()}] [${log.level}] [${log.category}]`;
    
    console.log(
      `%c${prefix} ${log.message}`,
      style,
      log.data ? log.data : ''
    );

    if (log.stack) {
      console.log('%cStack:', 'color: #6c757d', log.stack);
    }
  }

  private persistLogs() {
    try {
      const logsToStore = this.logs.slice(-100); // Store only last 100
      localStorage.setItem('app_logs', JSON.stringify(logsToStore));
    } catch (error) {
      console.error('Failed to persist logs:', error);
    }
  }

  // Public methods
  debug(category: LogCategory, message: string, data?: any, component?: string) {
    return this.createLog(LogLevel.DEBUG, category, message, { data, component });
  }

  info(category: LogCategory, message: string, data?: any, component?: string) {
    return this.createLog(LogLevel.INFO, category, message, { data, component });
  }

  warn(category: LogCategory, message: string, data?: any, component?: string) {
    return this.createLog(LogLevel.WARN, category, message, { data, component });
  }

  error(
    category: LogCategory,
    message: string,
    error?: Error | any,
    options?: {
      component?: string;
      action?: string;
      context?: string;
    }
  ) {
    return this.createLog(LogLevel.ERROR, category, message, {
      stack: error?.stack || new Error().stack,
      data: error,
      ...options,
    });
  }

  critical(
    category: LogCategory,
    message: string,
    error?: Error | any,
    options?: {
      component?: string;
      action?: string;
      context?: string;
    }
  ) {
    return this.createLog(LogLevel.CRITICAL, category, message, {
      stack: error?.stack || new Error().stack,
      data: error,
      ...options,
    });
  }

  // API specific helpers
  apiRequest(method: string, url: string, data?: any) {
    return this.info(LogCategory.API, `${method} ${url}`, data, 'API');
  }

  apiSuccess(method: string, url: string, response?: any) {
    return this.info(LogCategory.API, `✓ ${method} ${url}`, response, 'API');
  }

  apiError(method: string, url: string, error: any) {
    return this.error(
      LogCategory.API,
      `✗ ${method} ${url}`,
      error,
      { component: 'API', action: `${method} ${url}` }
    );
  }

  // Get logs
  getLogs(filter?: {
    level?: LogLevel;
    category?: LogCategory;
    component?: string;
    startDate?: Date;
    endDate?: Date;
  }): LogEntry[] {
    let filtered = this.logs;

    if (filter) {
      if (filter.level) {
        filtered = filtered.filter(log => log.level === filter.level);
      }
      if (filter.category) {
        filtered = filtered.filter(log => log.category === filter.category);
      }
      if (filter.component) {
        filtered = filtered.filter(log => log.component === filter.component);
      }
      if (filter.startDate) {
        filtered = filtered.filter(log => log.timestamp >= filter.startDate!);
      }
      if (filter.endDate) {
        filtered = filtered.filter(log => log.timestamp <= filter.endDate!);
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Subscribe to logs
  subscribe(listener: (log: LogEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('app_logs');
  }

  // Load persisted logs
  loadPersistedLogs() {
    try {
      const stored = localStorage.getItem('app_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.logs = parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load persisted logs:', error);
    }
  }

  // Export logs
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      const headers = ['Timestamp', 'Level', 'Category', 'Component', 'Message', 'Data'];
      const rows = this.logs.map(log => [
        log.timestamp.toISOString(),
        log.level,
        log.category,
        log.component || '',
        log.message,
        JSON.stringify(log.data || {}),
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Load persisted logs on initialization
logger.loadPersistedLogs();
