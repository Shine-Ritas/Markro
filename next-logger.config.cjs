/* eslint-disable @typescript-eslint/no-require-imports */
const pino = require("pino");

/** @param {import('pino').LoggerOptions} defaultConfig */
const logger = (defaultConfig) => {
  const isProduction = process.env.NODE_ENV === "production";
  const level = process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug");

  if (isProduction) {
    return pino({ ...defaultConfig, level, name: "luckdraw" });
  }

  return pino({
    ...defaultConfig,
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
};

module.exports = { logger };
