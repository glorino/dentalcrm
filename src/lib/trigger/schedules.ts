import { schedules } from "@trigger.dev/sdk";

export const slaSchedule = schedules.create({
  deduplicationKey: "sla-monitor-schedule",
  task: "sla-monitor",
  cron: "*/5 * * * *",
});
