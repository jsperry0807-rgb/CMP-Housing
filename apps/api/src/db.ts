import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  // Fail fast instead of hanging for 30s when MongoDB is unreachable.
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
