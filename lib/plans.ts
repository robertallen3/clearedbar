import type { Plan } from "./db";

// Matches the pricing section on the homepage.
export const LIMITS: Record<Plan, { matchRuns: number; schoolsPerRun: number; emails: number }> = {
  free: { matchRuns: 1, schoolsPerRun: 3, emails: 1 },
  pro: { matchRuns: Infinity, schoolsPerRun: 10, emails: Infinity },
};
