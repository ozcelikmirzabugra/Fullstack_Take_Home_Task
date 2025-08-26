type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    meta?: {
      userId?: string;
      requestId?: string;
      ip?: string;
      userAgent?: string;
    }
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      ...meta,
    };
  }

  private addLog(logEntry: LogEntry) {
    this.logs.push(logEntry);

    // Keep only recent logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with colors
    const colorMap: Record<LogLevel, string> = {
      DEBUG: "\x1b[36m", // Cyan
      INFO: "\x1b[32m", // Green
      WARN: "\x1b[33m", // Yellow
      ERROR: "\x1b[31m", // Red
    };
    const colorCode = colorMap[logEntry.level];

    const resetColor = "\x1b[0m";

    console.log(
      `${colorCode}[${logEntry.timestamp}] ${logEntry.level}: ${logEntry.message}${resetColor}`,
      logEntry.context ? JSON.stringify(logEntry.context, null, 2) : ""
    );

    // In production, you might want to send logs to external service
    if (process.env.NODE_ENV === "production") {
      this.sendToExternalService(logEntry);
    }
  }

  private async sendToExternalService(_logEntry: LogEntry) {
    // Disabled for now - this might be causing URL issues
    // TODO: Implement proper external logging service
    return;
  }

  debug(
    message: string,
    context?: Record<string, unknown>,
    meta?: Record<string, unknown>
  ) {
    this.addLog(this.createLogEntry("DEBUG", message, context, meta));
  }

  info(
    message: string,
    context?: Record<string, unknown>,
    meta?: Record<string, unknown>
  ) {
    this.addLog(this.createLogEntry("INFO", message, context, meta));
  }

  warn(
    message: string,
    context?: Record<string, unknown>,
    meta?: Record<string, unknown>
  ) {
    this.addLog(this.createLogEntry("WARN", message, context, meta));
  }

  error(
    message: string,
    context?: Record<string, unknown>,
    meta?: Record<string, unknown>
  ) {
    this.addLog(this.createLogEntry("ERROR", message, context, meta));
  }

  // Auth specific logging
  authSuccess(userId: string, method: string, ip?: string, userAgent?: string) {
    this.info(
      "Authentication successful",
      {
        method,
        userId,
      },
      { userId, ip, userAgent }
    );
  }

  authFailure(reason: string, email?: string, ip?: string, userAgent?: string) {
    this.warn(
      "Authentication failed",
      {
        reason,
        email,
      },
      { ip, userAgent }
    );
  }

  authSignup(userId: string, email: string, ip?: string, userAgent?: string) {
    this.info(
      "New user signed up",
      {
        userId,
        email,
      },
      { userId, ip, userAgent }
    );
  }

  authLogout(userId: string, ip?: string, userAgent?: string) {
    this.info(
      "User logged out",
      {
        userId,
      },
      { userId, ip, userAgent }
    );
  }

  // API request logging
  apiRequest(
    method: string,
    path: string,
    userId?: string,
    ip?: string,
    userAgent?: string,
    requestId?: string
  ) {
    this.info(
      "API request",
      {
        method,
        path,
      },
      { userId, ip, userAgent, requestId }
    );
  }

  apiResponse(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string,
    requestId?: string
  ) {
    const level =
      statusCode >= 400 ? "ERROR" : statusCode >= 300 ? "WARN" : "INFO";
    this.addLog(
      this.createLogEntry(
        level,
        "API response",
        {
          method,
          path,
          statusCode,
          duration: `${duration}ms`,
        },
        { userId, requestId }
      )
    );
  }

  // Database operation logging
  dbQuery(
    operation: string,
    table: string,
    userId?: string,
    duration?: number
  ) {
    this.debug(
      "Database operation",
      {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
      },
      { userId }
    );
  }

  dbError(operation: string, table: string, error: string, userId?: string) {
    this.error(
      "Database error",
      {
        operation,
        table,
        error,
      },
      { userId }
    );
  }

  // Rate limiting logs
  rateLimitHit(identifier: string, limit: number, window: string, ip?: string) {
    this.warn(
      "Rate limit exceeded",
      {
        identifier,
        limit,
        window,
      },
      { ip }
    );
  }

  // Cache operations
  cacheHit(key: string, userId?: string) {
    this.debug("Cache hit", { key }, { userId });
  }

  cacheMiss(key: string, userId?: string) {
    this.debug("Cache miss", { key }, { userId });
  }

  cacheSet(key: string, ttl?: number, userId?: string) {
    this.debug("Cache set", { key, ttl }, { userId });
  }

  cacheInvalidation(key: string, reason: string, userId?: string) {
    this.info("Cache invalidated", { key, reason }, { userId });
  }

  // Get all logs (for admin dashboard or debugging)
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Filter logs by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  // Filter logs by user
  getLogsByUser(userId: string): LogEntry[] {
    return this.logs.filter((log) => log.userId === userId);
  }

  // Filter logs by time range
  getLogsByTimeRange(startTime: Date, endTime: Date): LogEntry[] {
    return this.logs.filter((log) => {
      const logTime = new Date(log.timestamp);
      return logTime >= startTime && logTime <= endTime;
    });
  }

  // Clear all logs (for testing or memory management)
  clearLogs() {
    this.logs = [];
    this.info("Logs cleared");
  }
}

export const logger = Logger.getInstance();
export type { LogEntry, LogLevel };
