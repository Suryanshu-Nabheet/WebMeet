const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const socketPort = parseNumber(
  process.env.SOCKET_PORT ?? process.env.PORT,
  3001
);

const baseOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const extraOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  SOCKET_PORT: socketPort,
  ALLOWED_ORIGINS: Array.from(new Set([baseOrigin, ...extraOrigins])),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  ENABLE_LOGGING: process.env.ENABLE_LOGGING !== "false",
} as const;

