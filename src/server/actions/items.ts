"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { reportItems, surveyReports } from "~db/schema";
import { requireUser } from "@/server/permissions";
import { withActor, type Tx } from "@/server/audit";
import { newItemSchema } from "@/lib/zod";

async function ensureEditable(tx: Tx, reportId: string) {
  const [r] = await tx
    .select({
      status: surveyReports.status,
      surveyorId: surveyReports.surveyorId,
    })
    .from(surveyReports)
    .where(eq(surveyReports.id, reportId))
    .limit(1);
  if (!r) throw new Error("Report not found");
  if (r.status !== "draft") throw new Error("Report is not editable");
  return r;
}

async function renumber(
  tx: Tx,
  reportId: string,
  action: "replace" | "repair",
) {
  const rows = await tx
    .select({ id: reportItems.id })
    .from(reportItems)
    .where(
      and(eq(reportItems.reportId, reportId), eq(reportItems.action, action)),
    )
    .orderBy(reportItems.position);

  for (let i = 0; i < rows.length; i++) {
    await tx
      .update(reportItems)
      .set({ position: i + 1 })
      .where(eq(reportItems.id, rows[i].id));
  }
}

export async function addItem(input: unknown) {
  const user = await requireUser();
  const data = newItemSchema.parse(input);

  const row = await withActor(
    { id: user.id, email: user.email },
    async (tx) => {
      const r = await ensureEditable(tx, data.reportId);
      if (r.surveyorId !== user.id && user.role === "surveyor") {
        throw new Error("Forbidden");
      }

      const [{ nextPos }] = await tx
        .select({
          nextPos: sql<number>`coalesce(max(${reportItems.position}), 0) + 1`,
        })
        .from(reportItems)
        .where(
          and(
            eq(reportItems.reportId, data.reportId),
            eq(reportItems.action, data.action),
          ),
        );

      const [inserted] = await tx
        .insert(reportItems)
        .values({
          reportId: data.reportId,
          action: data.action,
          position: nextPos,
          partId: data.partId,
          names: data.names,
          isRecovery: data.action === "replace" ? data.isRecovery : false,
          quantity: data.quantity,
          remark: data.remark ?? null,
          condition: data.action === "replace" ? data.condition ?? null : null,
          origin: data.action === "replace" ? data.origin ?? null : null,
        })
        .returning();

      return inserted;
    },
  );

  revalidatePath(`/reports/${data.reportId}`);
  return row;
}

export async function removeItem(itemId: string) {
  const user = await requireUser();

  const result = await withActor(
    { id: user.id, email: user.email },
    async (tx) => {
      const [row] = await tx
        .select()
        .from(reportItems)
        .where(eq(reportItems.id, itemId))
        .limit(1);
      if (!row) return { ok: true as const, reportId: null as string | null };

      await ensureEditable(tx, row.reportId);
      await tx.delete(reportItems).where(eq(reportItems.id, itemId));
      await renumber(tx, row.reportId, row.action);
      return { ok: true as const, reportId: row.reportId };
    },
  );

  if (result.reportId) revalidatePath(`/reports/${result.reportId}`);
  return result;
}

export async function toggleRecovery(itemId: string, value: boolean) {
  const user = await requireUser();

  const result = await withActor(
    { id: user.id, email: user.email },
    async (tx) => {
      const [row] = await tx
        .select()
        .from(reportItems)
        .where(eq(reportItems.id, itemId))
        .limit(1);
      if (!row) throw new Error("Not found");
      await ensureEditable(tx, row.reportId);
      if (row.action !== "replace") {
        throw new Error("Recovery only applies to replaced items");
      }
      await tx
        .update(reportItems)
        .set({ isRecovery: value })
        .where(eq(reportItems.id, itemId));
      return { ok: true as const, reportId: row.reportId };
    },
  );

  revalidatePath(`/reports/${result.reportId}`);
  return result;
}

export async function updateItemDetails(
  itemId: string,
  values: {
    condition?: "new" | "used" | null;
    origin?: "genuine" | "local" | null;
    isRecovery?: boolean;
    remark?: string | null;
  },
) {
  const user = await requireUser();

  const result = await withActor(
    { id: user.id, email: user.email },
    async (tx) => {
      const [row] = await tx
        .select()
        .from(reportItems)
        .where(eq(reportItems.id, itemId))
        .limit(1);
      if (!row) throw new Error("Item not found");
      await ensureEditable(tx, row.reportId);

      if (row.action === "replace" && !values.condition) {
        throw new Error("Condition is required for replacement items");
      }

      await tx
        .update(reportItems)
        .set({
          condition: row.action === "replace" ? values.condition : null,
          origin: row.action === "replace" ? values.origin : null,
          isRecovery: row.action === "replace" ? values.isRecovery : false,
          remark: values.remark !== undefined ? values.remark || null : row.remark,
        })
        .where(eq(reportItems.id, itemId));
        
      return { ok: true as const, reportId: row.reportId };
    },
  );

  revalidatePath(`/reports/${result.reportId}`);
  return result;
}

export async function moveItem(
  itemId: string,
  to: "replace" | "repair",
  options?: {
    condition?: "new" | "used";
    origin?: "genuine" | "local" | null;
    isRecovery?: boolean;
  },
) {
  const user = await requireUser();

  const result = await withActor(
    { id: user.id, email: user.email },
    async (tx) => {
      const [row] = await tx
        .select()
        .from(reportItems)
        .where(eq(reportItems.id, itemId))
        .limit(1);
      if (!row) throw new Error("Not found");
      if (row.action === to)
        return { ok: true as const, reportId: row.reportId };
      await ensureEditable(tx, row.reportId);

      const [{ nextPos }] = await tx
        .select({
          nextPos: sql<number>`coalesce(max(${reportItems.position}), 0) + 1`,
        })
        .from(reportItems)
        .where(
          and(
            eq(reportItems.reportId, row.reportId),
            eq(reportItems.action, to),
          ),
        );

      await tx
        .update(reportItems)
        .set({
          action: to,
          position: nextPos,
          isRecovery:
            to === "replace" ? options?.isRecovery ?? row.isRecovery : false,
          condition:
            to === "replace"
              ? row.condition ?? options?.condition ?? "new"
              : null,
          origin:
            to === "replace" ? row.origin ?? options?.origin ?? null : null,
        })
        .where(eq(reportItems.id, itemId));

      await renumber(tx, row.reportId, "replace");
      await renumber(tx, row.reportId, "repair");
      return { ok: true as const, reportId: row.reportId };
    },
  );

  revalidatePath(`/reports/${result.reportId}`);
  return result;
}

export async function bulkDeleteItems(ids: string[]) {
  const user = await requireUser();
  if (ids.length === 0) return { ok: true as const };

  const result = await withActor(
    { id: user.id, email: user.email },
    async (tx) => {
      const [first] = await tx
        .select()
        .from(reportItems)
        .where(eq(reportItems.id, ids[0]))
        .limit(1);
      if (first) await ensureEditable(tx, first.reportId);

      await tx.delete(reportItems).where(inArray(reportItems.id, ids));

      if (first) {
        await renumber(tx, first.reportId, "replace");
        await renumber(tx, first.reportId, "repair");
      }
      return { ok: true as const, reportId: first?.reportId ?? null };
    },
  );

  if (result.reportId) revalidatePath(`/reports/${result.reportId}`);
  return result;
}

export async function bulkMoveItems(
  ids: string[],
  to: "replace" | "repair",
  options?: {
    condition?: "new" | "used";
    origin?: "genuine" | "local" | null;
    isRecovery?: boolean;
  },
) {
  const user = await requireUser();
  if (ids.length === 0) return { ok: true as const };

  const result = await withActor(
    { id: user.id, email: user.email },
    async (tx) => {
      const [first] = await tx
        .select()
        .from(reportItems)
        .where(eq(reportItems.id, ids[0]))
        .limit(1);
      if (!first) return { ok: true as const, reportId: null as string | null };
      await ensureEditable(tx, first.reportId);

      const [{ nextPos }] = await tx
        .select({
          nextPos: sql<number>`coalesce(max(${reportItems.position}), 0)`,
        })
        .from(reportItems)
        .where(
          and(
            eq(reportItems.reportId, first.reportId),
            eq(reportItems.action, to),
          ),
        );

      const rows = await tx
        .select()
        .from(reportItems)
        .where(inArray(reportItems.id, ids));

      let pos = nextPos;
      for (const r of rows) {
        pos += 1;
        await tx
          .update(reportItems)
          .set({
            action: to,
            position: pos,
            isRecovery:
              to === "replace" ? options?.isRecovery ?? r.isRecovery : false,
            condition:
              to === "replace"
                ? r.condition ?? options?.condition ?? "new"
                : null,
            origin:
              to === "replace" ? r.origin ?? options?.origin ?? null : null,
          })
          .where(eq(reportItems.id, r.id));
      }

      await renumber(tx, first.reportId, "replace");
      await renumber(tx, first.reportId, "repair");
      return { ok: true as const, reportId: first.reportId };
    },
  );

  if (result.reportId) revalidatePath(`/reports/${result.reportId}`);
  return result;
}

export async function bulkSetRecovery(ids: string[], value: boolean) {
  const user = await requireUser();
  if (ids.length === 0) return { ok: true as const };

  const result = await withActor(
    { id: user.id, email: user.email },
    async (tx) => {
      const [first] = await tx
        .select()
        .from(reportItems)
        .where(eq(reportItems.id, ids[0]))
        .limit(1);
      if (!first) return { ok: true as const, reportId: null as string | null };
      await ensureEditable(tx, first.reportId);

      await tx
        .update(reportItems)
        .set({ isRecovery: value })
        .where(
          and(
            inArray(reportItems.id, ids),
            eq(reportItems.action, "replace"),
          ),
        );

      return { ok: true as const, reportId: first.reportId };
    },
  );

  if (result.reportId) revalidatePath(`/reports/${result.reportId}`);
  return result;
}

export async function reorderItems(
  reportId: string,
  action: "replace" | "repair",
  orderedIds: string[],
) {
  const user = await requireUser();

  const result = await withActor(
    { id: user.id, email: user.email },
    async (tx) => {
      await ensureEditable(tx, reportId);
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(reportItems)
          .set({ position: 10000 + i })
          .where(eq(reportItems.id, orderedIds[i]));
      }
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(reportItems)
          .set({ position: i + 1 })
          .where(eq(reportItems.id, orderedIds[i]));
      }
      return { ok: true as const };
    },
  );

  revalidatePath(`/reports/${reportId}`);
  return result;
}

export async function restoreItems(
  reportId: string,
  snapshot: Array<{
    id: string;
    action: "replace" | "repair";
    position: number;
    partId: string | null;
    names: Record<string, string>;
    isRecovery: boolean;
    quantity: number;
    remark: string | null;
    condition: "new" | "used" | null;
    origin: "genuine" | "local" | null;
  }>,
) {
  const user = await requireUser();

  const result = await withActor(
    { id: user.id, email: user.email },
    async (tx) => {
      await ensureEditable(tx, reportId);
      await tx.delete(reportItems).where(eq(reportItems.reportId, reportId));

      if (snapshot.length > 0) {
        await tx.insert(reportItems).values(
          snapshot.map((s) => ({
            reportId,
            action: s.action,
            position: s.position,
            partId: s.partId,
            names: s.names,
            isRecovery: s.isRecovery,
            quantity: s.quantity,
            remark: s.remark,
            condition: s.action === "replace" ? s.condition : null,
            origin: s.action === "replace" ? s.origin : null,
          })),
        );
      }
      return { ok: true as const };
    },
  );

  revalidatePath(`/reports/${reportId}`);
  return result;
}