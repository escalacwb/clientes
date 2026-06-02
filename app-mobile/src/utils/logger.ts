type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
};

export function logEvent(payload: LogPayload) {
  const meta = payload.meta ? JSON.stringify(payload.meta) : "";
  if (payload.level === "error") {
    console.error(`[${payload.level}] ${payload.message} ${meta}`);
    return;
  }
  if (payload.level === "warn") {
    console.warn(`[${payload.level}] ${payload.message} ${meta}`);
    return;
  }
  console.log(`[${payload.level}] ${payload.message} ${meta}`);
}
