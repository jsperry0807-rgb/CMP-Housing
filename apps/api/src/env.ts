import "dotenv/config";

function optional(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Copy apps/api/.env.example to apps/api/.env and fill it in.`,
    );
  }
  return value;
}

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),
  port: Number(optional("PORT", "4000")),
  mongoUri: optional("MONGODB_URI", "mongodb://127.0.0.1:27017/ects_housing"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: optional("JWT_EXPIRES_IN", "7d"),
  cookieMaxAgeMs: Number(
    optional("COOKIE_MAX_AGE_MS", String(7 * 24 * 60 * 60 * 1000)),
  ),
  webOrigin: optional("WEB_ORIGIN", "http://localhost:5173"),
} as const;

export const isProduction = env.nodeEnv === "production";
