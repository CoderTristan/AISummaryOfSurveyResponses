export function shouldSendEmail(project: any) {
  const frequency = project.report_frequency; // "daily" | "weekly"
  const last = project.last_notified_at ? new Date(project.last_notified_at) : null;
  const now = new Date();

  if (!last) return true; // never sent → send now

  if (frequency === "daily") {
    return (
      last.getUTCFullYear() !== now.getUTCFullYear() ||
      last.getUTCMonth() !== now.getUTCMonth() ||
      last.getUTCDate() !== now.getUTCDate()
    );
  }

  if (frequency === "weekly") {
    const diffDays =
      (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 7;
  }

  return false;
}
