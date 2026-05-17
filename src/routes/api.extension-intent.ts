import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { normalizeRecord, payMemoRecordSchema } from "@/lib/paymemo-schema";

const extensionIntentSchema = payMemoRecordSchema.extend({
  method: z.string().optional(),
  origin: z.string().optional(),
});

const extensionStore: ReturnType<typeof normalizeRecord>[] = [];

export const Route = createFileRoute("/api/extension-intent")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          ok: true,
          records: extensionStore,
        }),

      POST: async ({ request }: { request: Request }) => {
        const body = await request.json().catch(() => null);
        const parsed = extensionIntentSchema.safeParse(body);

        if (!parsed.success) {
          return Response.json(
            { error: "Invalid extension intent", issues: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const record = normalizeRecord({
          ...parsed.data,
          mode: "wallet-assist",
          source: parsed.data.origin ?? parsed.data.source ?? "browser-extension",
        });

        extensionStore.unshift(record);
        extensionStore.splice(50);

        return Response.json({
          ok: true,
          record,
        });
      },
    },
  },
});
