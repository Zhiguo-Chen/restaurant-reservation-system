export interface LogEntry {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  data?: any;
  timestamp: Date;
  url: string;
  userAgent: string;
  sessionId: string;
}

export interface LoggerConfig {
  maxEntries: number;
  enableConsole: boolean;
  enableStorage: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  logLevels: ("debug" | "info" | "warn" | "error")[];
}

class ClientLogger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private sessionId: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      maxEntries: 1000,
      enableConsole: import.meta.env.DEV,
      enableStorage: true,
      enableRemote: !import.meta.env.DEV,
      logLevels: import.meta.env.DEV
        ? ["debug", "info", "warn", "error"]
        : ["warn", "error"],
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.loadStoredLogs();
    this.setupErrorHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogEntry["level"]): boolean {
    return this.config.logLevels.includes(level);
  }

  private createLogEntry(
    level: LogEntry["level"],
    message: string,
    data?: any
  ): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
    };
  }

  private log(level: LogEntry["level"], message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, data);
    this.logs.push(entry);

    // Maintain max entries limit
    if (this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(-this.config.maxEntries);
    }

    // Console logging
    if (this.config.enableConsole) {
      const consoleMethod = level === "debug" ? "log" : level;
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data || "");
    }

    // Storage logging
    if (this.config.enableStorage) {
      this.saveToStorage();
    }

    // Remote logging for errors and warnings
    if (this.config.enableRemote && (level === "error" || level === "warn")) {
      this.sendToRemote(entry);
    }
  }

  debug(message: string, data?: any): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: any): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: any): void {
    this.log("warn", message, data);
  }

  error(message: string, data?: any): void {
    this.log("error", message, data);
  }

  /**
   * Log user interactions for debugging
   */
  logUserAction(action: string, details?: any): void {
    this.info(`User Action: ${action}`, {
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log API requests and responses
   */
  logApiCall(
    method: string,
    url: string,
    status?: number,
    duration?: number,
    error?: any
  ): void {
    const level = error || (status && status >= 400) ? "error" : "info";
    this.log(`API Call: ${method} ${url}`, level, {
      method,
      url,
      status,
      duration,
      error: error?.message || error,
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric: string, value: number, unit: string = "ms"): void {
    this.debug(`Performance: ${metric}`, {
      metric,
      value,
      unit,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogEntry["level"]): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get recent logs (last N entries)
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    if (this.config.enableStorage) {
      localStorage.removeItem("client_logs");
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(
      {
        sessionId: this.sessionId,
        exportTime: new Date().toISOString(),
        logs: this.logs,
      },
      null,
      2
    );
  }

  /**
   * Get error summary for debugging
   */
  getErrorSummary(): {
    totalErrors: number;
    recentErrors: LogEntry[];
    errorsByType: Record<string, number>;
  } {
    const errors = this.getLogsByLevel("error");
    const recentErrors = errors.slice(-10);

    const errorsByType: Record<string, number> = {};
    errors.forEach((error) => {
      const errorType = error.data?.errorType || "Unknown";
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });

    return {
      totalErrors: errors.length,
      recentErrors,
      errorsByType,
    };
  }

  private loadStoredLogs(): void {
    if (!this.config.enableStorage) return;

    try {
      const stored = localStorage.getItem("client_logs");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.logs)) {
          this.logs = parsed.logs.map((log) => ({
            ...log,
            timestamp: new Date(log.timestamp),
          }));
        }
      }
    } catch (error) {
      console.warn("Failed to load stored logs:", error);
    }
  }

  private saveToStorage(): void {
    if (!this.config.enableStorage) return;

    try {
      const toStore = {
        sessionId: this.sessionId,
        logs: this.logs.slice(-500), // Store only recent logs
      };
      localStorage.setItem("client_logs", JSON.stringify(toStore));
    } catch (error) {
      console.warn("Failed to save logs to storage:", error);
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...entry,
          source: "frontend",
          environment: import.meta.env.MODE,
        }),
      });
    } catch (error) {
      // Silently fail remote logging to avoid infinite loops
      console.warn("Failed to send log to remote endpoint:", error);
    }
  }

  private setupErrorHandlers(): void {
    // Global error handler
    window.addEventListener("error", (event) => {
      this.error("Global Error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
        errorType: "GlobalError",
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener("unhandledrejection", (event) => {
      this.error("Unhandled Promise Rejection", {
        reason: event.reason,
        promise: event.promise,
        errorType: "UnhandledPromiseRejection",
      });
    });

    // Resource loading errors
    window.addEventListener(
      "error",
      (event) => {
        if (event.target !== window) {
          this.error("Resource Loading Error", {
            element: event.target?.tagName,
            source: (event.target as any)?.src || (event.target as any)?.href,
            errorType: "ResourceError",
          });
        }
      },
      true
    );
  }
}

// Create singleton instance
export const clientLogger = new ClientLogger({
  remoteEndpoint: import.meta.env.VITE_LOGGING_ENDPOINT,
});

// Development helper
if (import.meta.env.DEV) {
  (window as any).clientLogger = clientLogger;
}
