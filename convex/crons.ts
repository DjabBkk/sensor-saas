import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "refresh-qingping-tokens",
  { minutes: 90 },
  internal.providers.refreshExpiringTokens,
  {},
);

crons.interval(
  "poll-qingping-readings",
  { minutes: 5 },
  internal.providers.pollAllReadings,
  {},
);

export default crons;
