import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/app/Topbar";
import { reviewQueue } from "@/lib/mock-data";
import { Bot, Check, FileSearch, Lock, RefreshCcw, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/review")({
  head: () => ({ meta: [{ title: "Review Queue | PayMemo" }] }),
  component: ReviewQueue,
});

function ReviewQueue() {
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [active, setActive] = useState(reviewQueue[0]);

  return (
    <>
      <Topbar
        title="Review Queue"
        subtitle="Confirm unclear transaction meaning before it enters the vault."
      />
      <div className="grid gap-6 p-6 pb-28 lg:grid-cols-[1fr_380px] lg:p-10">
        <section className="space-y-4">
          {reviewQueue.map((item) => {
            const isConfirmed = confirmed.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => setActive(item)}
                className={`w-full rounded-3xl border p-5 text-left shadow-soft transition-all ${
                  active.id === item.id
                    ? "border-pink/60 bg-white shadow-glow-pink"
                    : "border-ink/35 bg-white hover:border-ink/50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-pink">
                      <FileSearch className="h-4 w-4" /> {item.source}
                    </div>
                    <div className="mt-3 text-lg font-semibold">{item.publicFact}</div>
                    <div className="mt-1 font-mono text-xs text-ink/50">{item.hash}</div>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      isConfirmed
                        ? "border-mint/30 bg-mint/10 text-ink"
                        : "border-papaya/40 bg-papaya/15 text-ink"
                    }`}
                  >
                    {isConfirmed ? "Confirmed" : "Needs review"}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Mini label="Suggested" value={item.suggestedCategory} />
                  <Mini label="Confidence" value={`${item.confidence}%`} />
                  <Mini label="Storage" value="Private vault" />
                </div>
              </button>
            );
          })}
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-ink/35 bg-white p-6 shadow-card">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-pink">
              <Sparkles className="h-4 w-4" /> Suggested record
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <ReviewRow label="Category" value={active.suggestedCategory} />
              <ReviewRow label="Reason" value={active.reason} />
              <ReviewRow label="Public proof" value={active.hash} mono />
            </div>
            <label className="mt-5 block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/50">
                Private note
              </span>
              <textarea
                defaultValue={active.draftNote}
                className="mt-2 min-h-28 w-full rounded-2xl border border-ink/25 bg-cream/60 p-3 text-sm outline-none focus:border-pink"
              />
            </label>
            <button
              onClick={() =>
                setConfirmed((prev) => (prev.includes(active.id) ? prev : [...prev, active.id]))
              }
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3 text-sm font-semibold text-cream"
            >
              <Check className="h-4 w-4" /> Confirm private record
            </button>
          </div>

          <div className="rounded-3xl border border-mint/30 bg-mint/10 p-5 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4 text-mint" /> Rules first
            </div>
            <p className="mt-2 leading-6 text-ink/60">
              PayMemo classifies bridges, swaps, invoices, and recurring payments with deterministic
              rules. AI is only used when context is missing or messy.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Badge icon={<Lock className="h-4 w-4" />} label="Encrypted notes" />
            <Badge icon={<Bot className="h-4 w-4" />} label="Agent explainability" />
            <Badge icon={<RefreshCcw className="h-4 w-4" />} label="Undo before vault" />
            <Badge icon={<FileSearch className="h-4 w-4" />} label="Audit-ready export" />
          </div>
        </aside>
      </div>
    </>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink/25 bg-cream/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-ink/45">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

function ReviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border-b border-ink/20 pb-2">
      <div className="text-[10px] uppercase tracking-widest text-ink/45">{label}</div>
      <div className={`mt-1 leading-6 ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-ink/25 bg-white p-4 text-xs font-semibold shadow-soft">
      <span className="mb-3 grid h-8 w-8 place-items-center rounded-xl bg-pink text-ink">
        {icon}
      </span>
      {label}
    </div>
  );
}
