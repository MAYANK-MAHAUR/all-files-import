import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/app/Topbar";
import { StatusBadge } from "@/components/app/StatusBadge";
import { transactions } from "@/lib/mock-data";
import { decryptPrivateMetadata, getRememberedVaultKey } from "@/lib/crypto-vault";
import { readEncryptedVaultRecords } from "@/lib/paymemo-vault";
import { Search, Calendar, Filter, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/app/ledger")({
  head: () => ({ meta: [{ title: "Ledger | PayMemo" }] }),
  component: Ledger,
});

type LedgerRow = {
  id: string;
  date: string;
  hash: string;
  amount: string;
  token: string;
  category: string;
  counterparty: string;
  note: string;
  status: string;
  source: "mock" | "vault";
};

const cats = [
  "All",
  "Payroll",
  "Vendor Payment",
  "Invoice",
  "Invoice Payment",
  "Bridge",
  "Swap",
  "Business Expense",
  "Refund",
  "Personal",
  "Transfer to Self",
  "Income",
  "Subscription",
  "API Payment",
  "Agent Task Payment",
];
const statuses = ["All", "Confirmed", "Pending", "Failed", "Needs Review", "confirmed"];

function downloadCsv(rows: LedgerRow[]) {
  const csvRows = [
    [
      "date",
      "txHash",
      "amount",
      "token",
      "category",
      "counterparty",
      "privateNote",
      "status",
      "source",
    ],
    ...rows.map((row) => [
      row.date,
      row.hash,
      row.amount,
      row.token,
      row.category,
      row.counterparty,
      row.note,
      row.status,
      row.source,
    ]),
  ];
  const csv = csvRows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `paymemo-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Ledger() {
  const [cat, setCat] = useState("All");
  const [status, setStatus] = useState("All");
  const [q, setQ] = useState("");
  const [vaultRows, setVaultRows] = useState<LedgerRow[]>([]);

  useEffect(() => {
    let alive = true;

    async function loadVaultRows() {
      const key = await getRememberedVaultKey();
      const records = readEncryptedVaultRecords();

      if (!key) {
        const lockedRows = records.map((record) => ({
          id: record.id,
          date: new Date(record.publicRecord.createdAt ?? record.updatedAt).toLocaleDateString(),
          hash: record.publicRecord.txHash ?? "pending",
          amount: record.publicRecord.amount,
          token: record.publicRecord.token,
          category: "Encrypted",
          counterparty: "Unlock vault",
          note: "Private metadata is encrypted on this device.",
          status: record.publicRecord.status,
          source: "vault" as const,
        }));
        if (alive) setVaultRows(lockedRows);
        return;
      }

      const decryptedRows = await Promise.all(
        records.map(async (record) => {
          const metadata = await decryptPrivateMetadata<Record<string, string>>(
            record.encryptedMetadata,
            key,
          );
          return {
            id: record.id,
            date: new Date(record.publicRecord.createdAt ?? record.updatedAt).toLocaleDateString(),
            hash: record.publicRecord.txHash ?? "pending",
            amount: record.publicRecord.amount,
            token: record.publicRecord.token,
            category: metadata.category || "Other",
            counterparty: metadata.counterparty || "Unknown",
            note: metadata.note || "",
            status: record.publicRecord.status,
            source: "vault" as const,
          };
        }),
      );

      if (alive) setVaultRows(decryptedRows);
    }

    void loadVaultRows();

    return () => {
      alive = false;
    };
  }, []);

  const allRows = useMemo<LedgerRow[]>(
    () => [
      ...vaultRows,
      ...transactions.map((t) => ({
        id: t.id,
        date: t.date,
        hash: t.hash,
        amount: String(t.amount),
        token: t.token,
        category: t.category,
        counterparty: t.counterparty,
        note: t.note,
        status: t.status,
        source: "mock" as const,
      })),
    ],
    [vaultRows],
  );

  const rows = useMemo(
    () =>
      allRows.filter(
        (t) =>
          (cat === "All" || t.category === cat) &&
          (status === "All" || t.status === status) &&
          (!q ||
            t.counterparty.toLowerCase().includes(q.toLowerCase()) ||
            t.note.toLowerCase().includes(q.toLowerCase()) ||
            t.hash.includes(q)),
      ),
    [allRows, cat, status, q],
  );

  return (
    <>
      <Topbar title="Ledger" subtitle="Your private, encrypted record of every payment." />
      <div className="p-6 lg:p-10 space-y-5">
        <div className="rounded-2xl border border-ink/35 bg-white p-4 shadow-soft flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-ink/35 bg-cream/60 px-3 py-2 flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-ink/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search note, counterparty, hash"
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
          <Select
            label="Category"
            value={cat}
            onChange={setCat}
            options={cats}
            icon={<Filter className="h-3.5 w-3.5" />}
          />
          <Select
            label="Status"
            value={status}
            onChange={setStatus}
            options={statuses}
            icon={<Filter className="h-3.5 w-3.5" />}
          />
          <button className="inline-flex items-center gap-2 rounded-xl border border-ink/35 bg-cream/60 px-3 py-2 text-sm">
            <Calendar className="h-3.5 w-3.5" /> Last 30 days
          </button>
          <button
            onClick={() => downloadCsv(rows)}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-ink text-cream px-3 py-2 text-sm font-semibold"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        <div className="rounded-3xl border border-ink/35 bg-white shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-ink/50 bg-cream/60">
                {[
                  "Date",
                  "Tx hash",
                  "Amount",
                  "Category",
                  "Counterparty",
                  "Private note",
                  "Status",
                ].map((h) => (
                  <th key={h} className="text-left font-medium px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={`${t.source}-${t.id}`}
                  className="border-t border-ink/30 hover:bg-cream/40"
                >
                  <td className="px-5 py-3.5 text-ink/60">{t.date}</td>
                  <td className="px-5 py-3.5 font-mono text-xs">{t.hash}</td>
                  <td className="px-5 py-3.5 font-mono">
                    {t.amount} <span className="text-ink/50">{t.token}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full border border-ink/35 bg-cream px-2 py-0.5 text-[10px] font-medium">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">{t.counterparty}</td>
                  <td className="px-5 py-3.5 text-ink/70">{t.note}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-ink/50">
                    No records match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  icon: React.ReactNode;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-xl border border-ink/35 bg-cream/60 px-3 py-2 text-sm">
      {icon}
      <span className="text-ink/55">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
