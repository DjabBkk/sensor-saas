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
  { minutes: 5 },
  internal.providersActions.pollAllReadings,
  {},
);

export default crons;
