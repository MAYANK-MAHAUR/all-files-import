import { createFileRoute } from "@tanstack/react-router";
import { normalizeRecord, payMemoRecordSchema } from "@/lib/paymemo-schema";

export const Route = createFileRoute("/api/records")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          name: "PayMemo Records API",
          description:
            "Create normalized private payment memory records from dApp, extension, or agent flows.",
          methods: ["POST"],
          required: ["mode", "to", "amount", "category"],
        }),

      POST: async ({ request }: { request: Request }) => {
        const body = await request.json().catch(() => null);
        const parsed = payMemoRecordSchema.safeParse(body);

        if (!parsed.success) {
          return Response.json(
            { error: "Invalid PayMemo record", issues: parsed.error.flatten() },
            { status: 400 },
          );
        }

        return Response.json({
          ok: true,
          record: normalizeRecord(parsed.data),
          storage: "client-encrypted-vault-ready",
        });
      },
    },
  },
});
