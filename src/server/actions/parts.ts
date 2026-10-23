"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { partTranslations, parts } from "~db/schema";
import { requireRole } from "@/server/permissions";
import { withActor } from "@/server/audit";
import { z } from "zod";
import { requireCapability } from "@/server/permissions";

const partInput = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().max(64).optional().or(z.literal("")),
  en: z.string().trim().min(1, "English name is required").max(200),
  am: z.string().trim().min(1, "Amharic name is required").max(200),
  isActive: z.boolean().default(true),
});

export async function upsertPart(raw: unknown) {
  const user = await requireCapability("parts.edit");
  const data = partInput.parse(raw);

  const result = await withActor({ id: user.id, email: user.email }, async (tx) => {
    let partId = data.id;

    if (!partId) {
      const [row] = await tx
        .insert(parts)
        .values({
          code: data.code || null,
          isActive: data.isActive,
          source: "admin",
          createdBy: user.id,
        })
        .returning({ id: parts.id });
      partId = row.id;
    } else {
      await tx
        .update(parts)
        .set({ code: data.code || null, isActive: data.isActive })
        .where(eq(parts.id, partId));
    }

    for (const [lang, name] of [
      ["en", data.en],
      ["am", data.am],
    ] as const) {
      await tx
        .insert(partTranslations)
        .values({ partId, lang, name })
        .onConflictDoUpdate({
          target: [partTranslations.partId, partTranslations.lang],
          set: { name },
        });
    }

    return { id: partId };
  });

  revalidatePath("/admin/parts");
  return result;
}

export async function setPartActive(id: string, active: boolean) {
  const user = await requireCapability("parts.edit");

  await withActor({ id: user.id, email: user.email }, async (tx) => {
    await tx.update(parts).set({ isActive: active }).where(eq(parts.id, id));
  });

  revalidatePath("/admin/parts");
  return { ok: true as const };
}

export async function deletePart(id: string) {
  const user = await requireCapability("parts.edit");

  await withActor({ id: user.id, email: user.email }, async (tx) => {
    await tx.update(parts).set({ isActive: false }).where(eq(parts.id, id));
  });

  revalidatePath("/admin/parts");
  return { ok: true as const };
}

export async function promoteCustomPart(en: string, am: string) {
  const user = await requireCapability("parts.edit");

  const result = await withActor({ id: user.id, email: user.email }, async (tx) => {
    const [p] = await tx
      .insert(parts)
      .values({ source: "promoted_custom", createdBy: user.id })
      .returning({ id: parts.id });

    if (en) {
      await tx
        .insert(partTranslations)
        .values({ partId: p.id, lang: "en", name: en });
    }
    if (am) {
      await tx
        .insert(partTranslations)
        .values({ partId: p.id, lang: "am", name: am });
    }

    return { id: p.id };
  });

  revalidatePath("/admin/custom-parts");
  return result;
}