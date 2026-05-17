import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const encryptedMetadataSchema = z.object({
  version: z.literal(1),
  algorithm: z.literal("AES-GCM"),
  kdf: z.literal("SHA-256(wallet-signature)"),
  walletAddress: z.string().min(1),
  iv: z.string().min(1),
  ciphertext: z.string().min(1),
  createdAt: z.string().min(1),
});

const publicRecordSchema = z.object({
  id: z.string().min(1),
  mode: z.enum(["direct", "wallet-assist", "agent"]),
  status: z.string().min(1),
  chainId: z.number(),
  chainName: z.string().min(1),
  txHash: z.string().optional(),
  from: z.string().optional(),
  to: z.string().min(1),
  amount: z.string().min(1),
  token: z.string().min(1),
  source: z.string().optional(),
  createdAt: z.string().min(1),
});

const storedRecordSchema = z.object({
  id: z.string().min(1),
  walletAddress: z.string().min(1),
  publicRecord: publicRecordSchema,
  encryptedMetadata: encryptedMetadataSchema,
  syncStatus: z.enum(["local", "synced", "sync-failed"]).default("local"),
  updatedAt: z.string().min(1),
});

type StoredRecord = z.infer<typeof storedRecordSchema>;

const vaultStore = new Map<string, StoredRecord[]>();

export const Route = createFileRoute("/api/vault-records")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const walletAddress = url.searchParams.get("wallet")?.toLowerCase();

        if (!walletAddress) {
          return Response.json(
            {
              name: "PayMemo Encrypted Vault Store",
              description:
                "Demo server store for encrypted blobs. Sensitive metadata is never accepted in plaintext here.",
              query: "GET /api/vault-records?wallet=0x...",
            },
            { status: 400 },
          );
        }

        return Response.json({
          ok: true,
          records: vaultStore.get(walletAddress) ?? [],
        });
      },

      POST: async ({ request }: { request: Request }) => {
        const body = await request.json().catch(() => null);
        const parsed = storedRecordSchema.safeParse(body);

        if (!parsed.success) {
          return Response.json(
            { error: "Invalid encrypted vault record", issues: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const record = { ...parsed.data, syncStatus: "synced" as const };
        const walletKey = record.walletAddress.toLowerCase();
        const current = vaultStore.get(walletKey) ?? [];
        vaultStore.set(walletKey, [record, ...current.filter((item) => item.id !== record.id)]);

        return Response.json({ ok: true, record });
      },
    },
  },
});
