import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/app/Topbar";
import { ShieldCheck, Wallet, Download, Trash2, KeyRound } from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings · PayMemo" }] }),
  component: Settings,
});

function Settings() {
  return (
    <>
      <Topbar title="Settings" subtitle="Manage your wallet, vault, and encrypted records." />
      <div className="p-6 lg:p-10 grid lg:grid-cols-2 gap-5">
        <Card
          icon={<Wallet className="h-5 w-5" />}
          title="Connected wallet"
          hue="bg-pink/10 text-pink"
        >
          <Row k="Address" v="0xVault…3e2" mono />
          <Row k="Network" v="Morph Hoodi · 2910" />
          <Row k="Balance" v="$48,210 USDC" mono />
          <Btn>Disconnect</Btn>
        </Card>

        <Card
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Vault status"
          hue="bg-mint/10 text-mint"
        >
          <Row k="Status" v="Unlocked" />
          <Row k="Records" v="412 entries" />
          <Row k="Last sync" v="2 minutes ago" />
          <Btn>Lock vault</Btn>
        </Card>

        <Card
          icon={<KeyRound className="h-5 w-5" />}
          title="Encryption"
          hue="bg-papaya/15 text-papaya"
        >
          <Row k="Algorithm" v="AES-256-GCM" />
          <Row k="Key derivation" v="Wallet signature" />
          <Row k="Key rotation" v="Every 90 days" />
          <Btn>Rotate keys now</Btn>
        </Card>

        <Card
          icon={<Download className="h-5 w-5" />}
          title="Export backup"
          hue="bg-ink/10 text-ink"
        >
          <Row k="Format" v="JSON · encrypted" />
          <Row k="Includes" v="All ledger + invoices" />
          <p className="text-xs text-ink/55">
            Backup is encrypted with your wallet - only you can restore it.
          </p>
          <Btn>Download backup</Btn>
        </Card>

        <div className="lg:col-span-2 rounded-3xl border border-destructive/30 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2 text-destructive font-semibold">
            <Trash2 className="h-4 w-4" /> Delete encrypted records
          </div>
          <p className="mt-2 text-sm text-ink/60">
            This permanently removes your vault from PayMemo servers. Onchain transactions remain.
            This action cannot be undone.
          </p>
          <button className="mt-4 inline-flex items-center gap-2 rounded-xl border border-destructive/40 text-destructive px-4 py-2 text-sm font-semibold hover:bg-destructive hover:text-cream transition-colors">
            Permanently delete vault
          </button>
        </div>
      </div>
    </>
  );
}

function Card({
  icon,
  title,
  hue,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hue: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-ink/35 bg-white p-6 shadow-soft space-y-3">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${hue}`}>{icon}</span>
        <div className="text-base font-semibold">{title}</div>
      </div>
      {children}
    </div>
  );
}
function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm border-b border-ink/30 pb-2">
      <span className="text-ink/55">{k}</span>
      <span className={mono ? "font-mono" : ""}>{v}</span>
    </div>
  );
}
function Btn({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex rounded-xl bg-ink text-cream px-3 py-2 text-sm font-semibold hover:bg-ink/85">
      {children}
    </button>
  );
}
