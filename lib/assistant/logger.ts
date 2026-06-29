type LogLevel = "info" | "warn" | "error";

export interface LogMeta {
  intent?: string;
  source?: string;
  userId?: string | null;
  ip?: string;
  latencyMs?: number;
  error?: string;
  [key: string]: unknown;
}

export function log(level: LogLevel, message: string, meta?: LogMeta): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    ns: "assistant",
    message,
    ...meta,
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}
