/**
 * Environment configuration
 * Centralized environment variable management
 */

// Helper to get socket URL - works in both server and client
// In production on Render we run Next.js and Socket.io on the SAME origin
// and port, so we should never append :3001 there. In development, we
// continue to use port 3001 by default for the standalone backend.
function getSocketUrl(): string {
  const nodeEnv = process.env.NODE_ENV || "development";

  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  
  // In browser, construct URL from current location
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    const hostname = window.location.hostname;

    if (nodeEnv === "production") {
      // On Render: Socket.io is attached to the same server as Next.js
      return `${protocol}//${hostname}`;
    }

    // Local development: use port 3001 (or override via env)
    const socketPort = process.env.NEXT_PUBLIC_SOCKET_PORT || "3001";
    const isStdHttpsPort = socketPort === "443" && protocol === "https:";
    const isStdHttpPort = socketPort === "80" && protocol === "http:";

    if (isStdHttpsPort || isStdHttpPort) {
      return `${protocol}//${hostname}`;
    }

    return `${protocol}//${hostname}:${socketPort}`;
  }
  
  // Server-side fallback
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const url = new URL(appUrl);
    if (nodeEnv === "production") {
      // Same-origin in production
      return `${url.protocol}//${url.hostname}`;
    }

    const socketPort = process.env.NEXT_PUBLIC_SOCKET_PORT || "3001";
    return `${url.protocol}//${url.hostname}:${socketPort}`;
  } catch {
    if (nodeEnv === "production") {
      return "http://localhost:3000";
    }
    const socketPort = process.env.NEXT_PUBLIC_SOCKET_PORT || "3001";
    return `http://localhost:${socketPort}`;
  }
}

// Helper to get app URL
function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  return "http://localhost:3000";
}

export const env = {
  // Socket Server
  SOCKET_PORT: process.env.SOCKET_PORT 
    ? parseInt(process.env.SOCKET_PORT) 
    : process.env.PORT 
    ? parseInt(process.env.PORT) + 1  // Use PORT+1 for socket server when PORT is set
    : 3001,
  SOCKET_URL: getSocketUrl(),

  // Next.js
  NODE_ENV: process.env.NODE_ENV || "development",
  NEXT_PUBLIC_APP_URL: getAppUrl(),

  // Feature Flags
  ENABLE_LOGGING: process.env.ENABLE_LOGGING !== "false",
} as const;

/**
 * Validate required environment variables
 */
export function validateEnv(): void {
  const required: string[] = [
    // Add any required env vars here
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

