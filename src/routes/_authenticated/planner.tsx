import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, LogOut, Star, Trash2, Pencil, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { STAGES, TASKS, taskProgress, type StageKey } from "@/lib/planner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Video = Database["public"]["Tables"]["videos"]["Row"];
type VideoInput = Database["public"]["Tables"]["videos"]["Insert"];

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Campaign board · DV-2027 Content Planner" },
      { name: "description", content: "Track all DV-2027 campaign videos, checklists and scripts." },
      { property: "og:title", content: "Campaign board · DV-2027 Content Planner" },
      { property: "og:description", content: "Track all DV-2027 campaign videos, checklists and scripts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Planner,
});

const videosQuery = {
  queryKey: ["videos"],
  queryFn: async () => {
    const { data, error } = await supabase.from("videos").select("*").order("num");
    if (error) throw error;
    return data as Video[];
  },
};

function tasksOf(v: Video) {
  return (v.tasks ?? {}) as Record<string, boolean>;
}

function Planner() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: videos = [], isLoading } = useQuery(videosQuery);
  const [filter, setFilter] = useState<"all" | StageKey | "priority" | "done" | "open">("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Video | "new" | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Video | null>(null);

  useEffect(() => {
    const ch = supabase
      .channel("videos-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, () =>
        qc.invalidateQueries({ queryKey: ["videos"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const update = async (id: string, patch: Partial<Video>) => {
    qc.setQueryData<Video[]>(["videos"], (old) => old?.map((v) => (v.id === id ? { ...v, ...patch } : v)));
    const { error } = await supabase.from("videos").update(patch as never).eq("id", id);
    if (error) {
      toast.error("Could not save: " + error.message);
      qc.invalidateQueries({ queryKey: ["videos"] });
    }
  };

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return videos.filter((v) => {
      if (filter === "priority" && !v.priority) return false;
      if (filter === "done" && !v.done) return false;
      if (filter === "open" && v.done) return false;
      if (filter in STAGES && v.stage !== filter) return false;
      if (!s) return true;
      return [v.title, v.format, v.goal, v.hook, v.cta, v.notes].some((x) => x.toLowerCase().includes(s));
    });
  }, [videos, filter, q]);

  const doneCount = videos.filter((v) => v.done).length;
  const openVideo = videos.find((v) => v.id === openId) ?? null;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const filters: [typeof filter, string][] = [
    ["all", "All"],
    ["awareness", "Awareness"],
    ["preparation", "Preparation"],
    ["trust", "Trust"],
    ["community", "Community"],
    ["service", "Service"],
    ["priority", "★ Priority"],
    ["open", "In progress"],
    ["done", "Done"],
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="bg-hero grid size-10 place-items-center rounded-xl font-bold text-primary-foreground">DV</div>
            <div>
              <div className="font-display text-lg font-bold leading-none">DV-2027</div>
              <div className="text-xs text-muted-foreground">Content Planner</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setEditing("new")}><Plus /> Add video</Button>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out"><LogOut /></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="bg-hero relative overflow-hidden rounded-3xl p-8 text-primary-foreground shadow-card">
          <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-75">Your {videos.length}-video campaign</p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">Build trust before the rush.</h1>
          <p className="mt-3 max-w-xl opacity-85">
            {doneCount} of {videos.length} videos done · changes sync live with your team.
          </p>
          <Progress value={videos.length ? (doneCount / videos.length) * 100 : 0} className="mt-5 h-2 max-w-md bg-primary-foreground/20" />
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {(["awareness", "preparation", "trust", "community"] as const).map((s, i) => {
            const all = videos.filter((v) => v.stage === s);
            const d = all.filter((v) => v.done).length;
            return (
              <button key={s} onClick={() => setFilter(s)} className={`${STAGES[s].tone} rounded-2xl p-4 text-left transition hover:-translate-y-0.5`}>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span className="text-xl">{STAGES[s].icon}</span> Stage {i + 1} — {STAGES[s].label}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{STAGES[s].desc}</p>
                <Progress value={all.length ? (d / all.length) * 100 : 0} className="mt-3 h-1.5 bg-card/70" />
                <div className="mt-1 text-xs text-muted-foreground">{d} of {all.length} completed</div>
              </button>
            );
          })}
        </section>

        <section className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {filters.map(([k, l]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${filter === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search videos…" className="bg-card pl-9" />
          </div>
        </section>

        {isLoading ? (
          <p className="mt-10 text-center text-muted-foreground">Loading your campaign…</p>
        ) : (
          <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((v) => {
              const p = taskProgress(tasksOf(v));
              return (
                <article
                  key={v.id}
                  onClick={() => setOpenId(v.id)}
                  className="group cursor-pointer rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid size-10 place-items-center rounded-xl bg-secondary font-bold text-secondary-foreground">{v.num}</div>
                    <div className="flex items-center gap-1.5">
                      {v.priority && <Star className="size-4 fill-accent text-accent" />}
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${v.done ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>
                        {v.done ? "Done" : p ? "In progress" : "Not started"}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-3 text-lg font-bold leading-snug">{v.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                    <span className={`${STAGES[v.stage as StageKey]?.tone ?? "bg-muted"} rounded-full px-2 py-0.5`}>
                      {STAGES[v.stage as StageKey]?.short ?? v.stage}
                    </span>
                    {v.format && <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{v.format}</span>}
                  </div>
                  {v.hook && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">“{v.hook}”</p>}
                  <div className="mt-4">
                    <Progress value={(p / TASKS.length) * 100} className="h-1.5" />
                    <div className="mt-1 text-[11px] text-muted-foreground">{p}/{TASKS.length} steps</div>
                  </div>
                </article>
              );
            })}
            {!shown.length && <p className="col-span-full py-10 text-center text-muted-foreground">No videos match.</p>}
          </section>
        )}
      </main>

      <VideoSheet
        video={openVideo}
        onClose={() => setOpenId(null)}
        onUpdate={update}
        onEdit={(v) => setEditing(v)}
        onDelete={(v) => setDeleting(v)}
      />

      <VideoForm
        value={editing}
        nextNum={(videos.at(-1)?.num ?? 0) + 1}
        onClose={() => setEditing(null)}
        onSaved={() => qc.invalidateQueries({ queryKey: ["videos"] })}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>This removes it for the whole team.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleting) return;
                const { error } = await supabase.from("videos").delete().eq("id", deleting.id);
                if (error) toast.error(error.message);
                else toast.success("Video deleted");
                setOpenId(null);
                setDeleting(null);
                qc.invalidateQueries({ queryKey: ["videos"] });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function VideoSheet({
  video, onClose, onUpdate, onEdit, onDelete,
}: {
  video: Video | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Video>) => void;
  onEdit: (v: Video) => void;
  onDelete: (v: Video) => void;
}) {
  const [script, setScript] = useState("");
  const [extra, setExtra] = useState("");
  useEffect(() => {
    setScript(video?.script ?? "");
    setExtra(video?.extra_notes ?? "");
  }, [video?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!video) return <Sheet open={false} />;
  const t = tasksOf(video);
  const p = taskProgress(t);

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Video {video.num} · {STAGES[video.stage as StageKey]?.short ?? video.stage}
          </div>
          <SheetTitle className="font-display text-2xl">{video.title}</SheetTitle>
        </SheetHeader>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(video)}><Pencil /> Edit</Button>
          <Button size="sm" variant="outline" onClick={() => onUpdate(video.id, { priority: !video.priority })}>
            <Star className={video.priority ? "fill-accent text-accent" : ""} /> {video.priority ? "Priority" : "Mark priority"}
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(video)}><Trash2 /> Delete</Button>
        </div>

        <Tabs defaultValue="brief" className="mt-5">
          <TabsList className="w-full">
            <TabsTrigger value="brief" className="flex-1">Brief</TabsTrigger>
            <TabsTrigger value="checklist" className="flex-1">Checklist</TabsTrigger>
            <TabsTrigger value="script" className="flex-1">Script & notes</TabsTrigger>
          </TabsList>
          <TabsContent value="brief" className="space-y-4 pt-3">
            {([["Format", video.format], ["Goal", video.goal], ["Opening hook", video.hook], ["Call to action", video.cta], ["Accuracy notes", video.notes]] as const).map(([l, val]) => (
              <div key={l}>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{l}</div>
                <p className="mt-1 text-sm">{val || "—"}</p>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="checklist" className="pt-3">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>{p} of {TASKS.length} tasks complete</span>
              <span>{Math.round((p / TASKS.length) * 100)}%</span>
            </div>
            <Progress value={(p / TASKS.length) * 100} className="h-2" />
            <div className="mt-4 space-y-2">
              {TASKS.map(([k, label, desc]) => (
                <label key={k} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${t[k] ? "border-success/40 bg-success-soft" : "border-border hover:bg-muted"}`}>
                  <Checkbox
                    checked={!!t[k]}
                    onCheckedChange={(c) => onUpdate(video.id, { tasks: { ...t, [k]: !!c } })}
                    className="mt-0.5"
                  />
                  <span className="text-sm"><b>{label}</b><br /><span className="text-muted-foreground">{desc}</span></span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant={video.done ? "outline" : "default"}
                onClick={() => onUpdate(video.id, { done: !video.done })}
              >
                <CheckCircle2 /> {video.done ? "Completed — undo" : "Mark video complete"}
              </Button>
              <Button variant="ghost" onClick={() => onUpdate(video.id, { tasks: {}, done: false })}>Reset</Button>
            </div>
          </TabsContent>
          <TabsContent value="script" className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label>Script</Label>
              <Textarea rows={10} value={script} onChange={(e) => setScript(e.target.value)} placeholder="Write the voiceover / script here…" />
            </div>
            <div className="space-y-2">
              <Label>Production notes</Label>
              <Textarea rows={5} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Locations, props, shot list…" />
            </div>
            <Button
              onClick={() => {
                onUpdate(video.id, { script, extra_notes: extra });
                toast.success("Saved");
              }}
            >
              Save script & notes
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

const EMPTY: Omit<VideoInput, "num"> = { title: "", stage: "awareness", format: "", goal: "", hook: "", cta: "", notes: "", priority: false };

function VideoForm({
  value, nextNum, onClose, onSaved,
}: {
  value: Video | "new" | null;
  nextNum: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<VideoInput>({ ...EMPTY, num: nextNum });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (value === "new") setF({ ...EMPTY, num: nextNum });
    else if (value) setF({ num: value.num, title: value.title, stage: value.stage, format: value.format, goal: value.goal, hook: value.hook, cta: value.cta, notes: value.notes, priority: value.priority });
  }, [value, nextNum]);

  const set = (k: keyof VideoInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: k === "num" ? Number(e.target.value) : e.target.value }));

  async function save() {
    if (!f.title?.trim()) return toast.error("Give the video a title");
    setBusy(true);
    const res = value === "new" || !value
      ? await supabase.from("videos").insert(f)
      : await supabase.from("videos").update(f).eq("id", value.id);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(value === "new" ? "Video added" : "Video updated");
    onSaved();
    onClose();
  }

  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{value === "new" ? "Add a video" : "Edit video"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <div className="space-y-1.5"><Label>#</Label><Input type="number" value={f.num} onChange={set("num")} /></div>
            <div className="space-y-1.5"><Label>Title</Label><Input value={f.title} onChange={set("title")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={f.stage} onValueChange={(v) => setF((p) => ({ ...p, stage: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STAGES).map(([k, s]) => <SelectItem key={k} value={k}>{s.short}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Format</Label><Input value={f.format} onChange={set("format")} /></div>
          </div>
          <div className="space-y-1.5"><Label>Goal</Label><Textarea rows={2} value={f.goal} onChange={set("goal")} /></div>
          <div className="space-y-1.5"><Label>Opening hook</Label><Textarea rows={2} value={f.hook} onChange={set("hook")} /></div>
          <div className="space-y-1.5"><Label>Call to action</Label><Input value={f.cta} onChange={set("cta")} /></div>
          <div className="space-y-1.5"><Label>Accuracy notes</Label><Textarea rows={2} value={f.notes} onChange={set("notes")} /></div>
          <label className="flex items-center gap-3 text-sm font-medium">
            <Switch checked={!!f.priority} onCheckedChange={(c) => setF((p) => ({ ...p, priority: c }))} /> Priority video
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
