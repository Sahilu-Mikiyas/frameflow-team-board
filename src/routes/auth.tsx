import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Team sign in · DV-2027 Content Planner" },
      { name: "description", content: "Sign in with the shared team account to edit the DV-2027 planner." },
      { property: "og:title", content: "Team sign in · DV-2027 Content Planner" },
      { property: "og:description", content: "Sign in with the shared team account to edit the DV-2027 planner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/planner" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-hero hidden flex-col justify-between p-12 text-primary-foreground lg:flex">
        <div className="text-sm font-bold uppercase tracking-[0.2em] opacity-80">DV-2027</div>
        <div>
          <h1 className="text-5xl font-bold leading-tight">Build trust<br />before the rush.</h1>
          <p className="mt-4 max-w-md opacity-80">
            Your team's shared 20-video campaign planner — scripts, checklists and progress, synced live.
          </p>
        </div>
        <div className="text-sm opacity-70">ዝግጁ ሁኑ · Be ready</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-3xl font-bold">Team sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Use the shared admin account.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
