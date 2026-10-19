import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/planner" });
  },
  head: () => ({
    meta: [
      { title: "DV-2027 Content Planner" },
      { name: "description", content: "Plan, script and track the DV-2027 20-video campaign with your team." },
      { property: "og:title", content: "DV-2027 Content Planner" },
      { property: "og:description", content: "Plan, script and track the DV-2027 20-video campaign with your team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
