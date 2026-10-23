"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { surveyReports, users } from "~db/schema";
import { requireUser } from "@/server/permissions";
import { withActor } from "@/server/audit";
import { reportHeaderSchema } from "@/lib/zod";

export async function createDraftReport(userId: string, branchId: number) {
  const user = await requireUser();

  const id = await withActor(
    { id: user.id, email: user.email },
    async (tx) => {
      const [u] = await tx
        .select({ id: users.id, branchId: users.branchId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!u) {
        throw new Error(
          "Your session is out of date. Please sign out and sign in again.",
        );
      }

      const [row] = await tx
        .insert(surveyReports)
        .values({
          surveyorId: u.id,
          branchId: u.branchId ?? branchId,
          status: "draft",
          reportDate: new Date().toISOString().slice(0, 10),
        })
        .returning({ id: surveyReports.id });

      return row.id;
    },
  );

  return id;
}

export async function saveReportHeader(reportId: string, input: unknown) {
  const user = await requireUser();
  const parsed = reportHeaderSchema.parse(input);

  const result = await withActor(
    { id: user.id, email: user.email },
    async (tx) => {
      const [existing] = await tx
        .select()
        .from(surveyReports)
        .where(eq(surveyReports.id, reportId))
        .limit(1);

      if (!existing) throw new Error("Not found");
      if (existing.status !== "draft") throw new Error("Report is not editable");
      if (existing.surveyorId !== user.id && user.role === "surveyor") {
        throw new Error("Forbidden");
      }

      await tx
        .update(surveyReports)
        .set({
          coverage:        parsed.coverage ?? null,
          reportDate:      parsed.reportDate,
          branchId:        parsed.branchId,
          vehicleType:     parsed.vehicleType || null,
          plateNo:         parsed.plateNo || null,
          manufactureYear: parsed.manufactureYear ?? null,
          engineNo:        parsed.engineNo || null,
          chassisNo:       parsed.chassisNo || null,
          model:           parsed.model || null,
          printLang:       parsed.printLang,
          remarks:         parsed.remarks || null,
          claimRef:        parsed.claimRef || null,
        })
        .where(eq(surveyReports.id, reportId));

      return { ok: true as const };
    },
  );

  revalidatePath(`/reports/${reportId}`);
  return result;
}

export async function finalizeReport(reportId: string) {
  const user = await requireUser();

  const result = await withActor(
    { id: user.id, email: user.email },
    async (tx) => {
      const [r] = await tx
        .select()
        .from(surveyReports)
        .where(eq(surveyReports.id, reportId))
        .limit(1);

      if (!r) throw new Error("Not found");
      if (r.status !== "draft") throw new Error("Report is not draft");

      // The PL/pgSQL function inherits app.user_id from this transaction,
      // so every write it performs (report status, parts.usage_count)
      // is attributed to the current user.
      await tx.execute(
        sql`SELECT finalize_report(${reportId}::uuid, ${user.id}::uuid)`,
      );
      return { ok: true as const };
    },
  );

  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
  return result;
}

export async function voidReport(reportId: string, reason: string) {
  const user = await requireUser();
  if (user.role === "surveyor") throw new Error("Forbidden");
  if (!reason.trim()) throw new Error("Reason required");

  const result = await withActor(
    { id: user.id, email: user.email },
    async (tx) => {
      await tx
        .update(surveyReports)
        .set({ status: "void", voidReason: reason })
        .where(eq(surveyReports.id, reportId));
      return { ok: true as const };
    },
  );

  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
  return result;
}

export async function reopenReport(reportId: string) {
  const user = await requireUser();

  const result = await withActor(
    { id: user.id, email: user.email },
    async (tx) => {
      const [r] = await tx
        .select()
        .from(surveyReports)
        .where(eq(surveyReports.id, reportId))
        .limit(1);

      if (!r) throw new Error("Report not found");
      if (r.status !== "finalized") {
        throw new Error("Only finalized reports can be reopened");
      }
      if (user.role === "surveyor" && r.surveyorId !== user.id) {
        throw new Error("You can only reopen your own reports");
      }

      await tx
        .update(surveyReports)
        .set({
          status: "draft",
          finalizedAt: null,
          finalizedBy: null,
        })
        .where(eq(surveyReports.id, reportId));

      return { ok: true as const };
    },
  );

  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
  return result;
}