import type { EncryptedMetadata } from "./crypto-vault";
import type { PayMemoRecord, PayMemoRecordInput } from "./paymemo-schema";
import { normalizeRecord } from "./paymemo-schema";

const VAULT_KEY = "paymemo:vault:v1";
const ENCRYPTED_VAULT_KEY = "paymemo:encrypted-vault:v1";

const PRIVATE_FIELDS = [
  "category",
  "counterparty",
  "note",
  "project",
  "invoiceRef",
  "taskId",
  "tool",
  "agentId",
  "agentReason",
] as const;

type PrivateField = (typeof PRIVATE_FIELDS)[number];

export type PublicPayMemoRecord = Omit<PayMemoRecord, PrivateField>;

export type StoredVaultRecord = {
  id: string;
  walletAddress: string;
  publicRecord: PublicPayMemoRecord;
  encryptedMetadata: EncryptedMetadata;
  syncStatus: "local" | "synced" | "sync-failed";
  updatedAt: string;
};

export function readVaultRecords(): PayMemoRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(VAULT_KEY);
  if (!raw) return [];

  try {
    const records = JSON.parse(raw);
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

export function writeVaultRecords(records: PayMemoRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VAULT_KEY, JSON.stringify(records));
}

export function saveVaultRecord(record: PayMemoRecord) {
  const normalized = normalizeRecord(record);
  const next = [normalized, ...readVaultRecords().filter((item) => item.id !== normalized.id)];
  writeVaultRecords(next);
  return normalized;
}

export function exportVaultJson() {
  return JSON.stringify(readVaultRecords(), null, 2);
}

export function toPrivateMetadata(record: PayMemoRecordInput) {
  return {
    category: record.category,
    counterparty: record.counterparty ?? "",
    note: record.note ?? "",
    project: record.project ?? "",
    invoiceRef: record.invoiceRef ?? "",
    taskId: record.taskId ?? "",
    tool: record.tool ?? "",
    agentId: record.agentId ?? "",
    agentReason: record.agentReason ?? "",
  };
}

export function toPublicRecord(record: PayMemoRecord): PublicPayMemoRecord {
  const {
    category,
    counterparty,
    note,
    project,
    invoiceRef,
    taskId,
    tool,
    agentId,
    agentReason,
    ...publicRecord
  } = record;
  void category;
  void counterparty;
  void note;
  void project;
  void invoiceRef;
  void taskId;
  void tool;
  void agentId;
  void agentReason;
  return publicRecord;
}

export function readEncryptedVaultRecords(): StoredVaultRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ENCRYPTED_VAULT_KEY);
  if (!raw) return [];

  try {
    const records = JSON.parse(raw);
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

export function writeEncryptedVaultRecords(records: StoredVaultRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ENCRYPTED_VAULT_KEY, JSON.stringify(records));
}

export function saveEncryptedVaultRecord(record: StoredVaultRecord) {
  const next = [record, ...readEncryptedVaultRecords().filter((item) => item.id !== record.id)];
  writeEncryptedVaultRecords(next);
  return record;
}

export async function syncEncryptedVaultRecord(record: StoredVaultRecord) {
  const response = await fetch("/api/vault-records", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    throw new Error("Unable to sync encrypted PayMemo record.");
  }

  return (await response.json()) as { ok: true; record: StoredVaultRecord };
}

export function exportEncryptedVaultJson() {
  return JSON.stringify(readEncryptedVaultRecords(), null, 2);
}
