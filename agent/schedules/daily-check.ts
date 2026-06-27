import { defineSchedule } from "eve/schedules";

export default defineSchedule({
  cron: "0 9 * * *",
  markdown:
    "Run a daily check-in for the user. Review saved memories and the knowledge base if available. " +
    "Identify anything that looks stale, inconsistent, or missing. If updates are needed, use the " +
    "save_memory or read_uploaded_file/search_knowledge_base tools to refresh context. Keep the log " +
    "brief and actionable.",
});
