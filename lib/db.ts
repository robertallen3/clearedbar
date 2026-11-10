import "server-only";
import { neon } from "@neondatabase/serverless";

// The Neon integration on Vercel sets DATABASE_URL (and POSTGRES_URL as an alias).
const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

let client: ReturnType<typeof neon> | null = null;

export function sql() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Connect a Neon database to the Vercel project.");
  }
  client ??= neon(connectionString);
  return client;
}

export type Plan = "free" | "pro";

export type User = {
  id: number;
  email: string;
  plan: Plan;
};
