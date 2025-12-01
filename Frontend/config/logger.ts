/**
 * Logger utility
 * Centralized logging with different log levels
 */

type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.ENABLE_LOGGING !== "false";
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return `${prefix} ${message}`;
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.enabled) return;

    const formattedMessage = this.formatMessage(level, message, ...args);

    switch (level) {
      case "error":
        console.error(formattedMessage, ...args);
        break;
      case "warn":
        console.warn(formattedMessage, ...args);
        break;
      case "debug":
        if (process.env.NODE_ENV === "development") {
          console.debug(formattedMessage, ...args);
        }
        break;
      default:
        console.log(formattedMessage, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    this.log("info", message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log("warn", message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log("error", message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.log("debug", message, ...args);
  }
}

export const logger = new Logger();

