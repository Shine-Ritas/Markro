import pino, { type Logger } from "pino";

let rootLogger: Logger | null = null;

function getRootLogger(): Logger {
  if (rootLogger) return rootLogger;

  const isProduction = process.env.NODE_ENV === "production";
  const level = process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug");

  rootLogger = isProduction
    ? pino({ level, name: "luckdraw" })
    : pino({
        level,
        name: "luckdraw",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      });

  return rootLogger;
}

/** Create a child logger scoped to a module (e.g. `api.events`, `auth`, `services.pos`). */
export function createModuleLogger(module: string): Logger {
  return getRootLogger().child({ module });
}

export const logger = getRootLogger();
