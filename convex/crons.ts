import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "refresh-qingping-tokens",
  { minutes: 90 },
  internal.providersActions.refreshExpiringTokens,
  {},
);

crons.interval(
  "poll-qingping-readings",
  { minutes: 30 },
  internal.providersActions.pollAllReadings,
  {},
);

crons.daily(
  "cleanup-expired-readings",
  { hourUTC: 3, minuteUTC: 0 },
  internal.cleanup.cleanupExpiredReadings,
  {},
);

export default crons;
