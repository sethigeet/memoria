import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at midnight to clean up expired trash items
crons.daily("cleanup expired trash", { hourUTC: 0, minuteUTC: 0 }, internal.trash.cleanupExpired);

export default crons;
