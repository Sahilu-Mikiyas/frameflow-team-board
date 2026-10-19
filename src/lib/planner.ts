export const STAGES = {
  awareness: { label: "Get Attention", short: "Awareness", desc: "Awareness and curiosity", icon: "📣", tone: "bg-stage-awareness" },
  preparation: { label: "Educate", short: "Preparation", desc: "Practical preparation", icon: "🎓", tone: "bg-stage-preparation" },
  trust: { label: "Build Trust", short: "Trust", desc: "Transparency and credibility", icon: "🛡️", tone: "bg-stage-trust" },
  community: { label: "Community & Demand", short: "Community", desc: "Engagement and service intro", icon: "👥", tone: "bg-stage-community" },
  service: { label: "Service Introduction", short: "Service", desc: "Explain the offer clearly", icon: "↗", tone: "bg-stage-service" },
} as const;

export type StageKey = keyof typeof STAGES;

export const TASKS = [
  ["idea", "Idea & message", "Clarify the single key message"],
  ["research", "Accuracy check", "Verify all DV rules and current announcements"],
  ["script", "Script", "Finalize the opening hook, main points, and CTA"],
  ["shoot", "Filming", "Record presenter, demonstrations, and B-roll"],
  ["edit", "Editing", "Edit pacing, subtitles, sound, and graphics"],
  ["review", "Final review", "Check facts, spelling, privacy, and claims"],
  ["publish", "Publish", "Write caption, choose cover, and publish"],
  ["repurpose", "Repurpose", "Adapt for TikTok, Instagram Reels, and Facebook"],
] as const;

export function taskProgress(tasks: Record<string, boolean> | null | undefined) {
  const t = tasks ?? {};
  return TASKS.filter(([k]) => t[k]).length;
}
