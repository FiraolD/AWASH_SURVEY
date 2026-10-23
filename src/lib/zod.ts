import { z } from "zod";

export const LOCALES = ["en", "am", "om"] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(v: string): v is Locale {
  return (LOCALES as readonly string[]).includes(v);
}

export const reportHeaderSchema = z.object({
  coverage: z.enum(["comprehensive", "third_party"], {
    errorMap: () => ({ message: "Required" }),
  }),
  reportDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Required"),
  branchId: z.coerce.number().int().positive("Required"),
  vehicleType: z.string().trim().min(1, "Required").max(120),
  plateNo:     z.string().trim().min(1, "Required").max(32),
  manufactureYear: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .int("Must be a whole number")
    .min(1950, "Must be 1950 or later")
    .max(2100, "Must be 2100 or earlier"),
  engineNo:  z.string().trim().max(64).optional().or(z.literal("")),   // optional
  chassisNo: z.string().trim().min(1, "Required").max(64),
  model:     z.string().trim().min(1, "Required").max(120),
  printLang: z.enum(LOCALES).default("am"),
  remarks:   z.string().trim().max(2000).optional().or(z.literal("")),
  claimRef:  z.string().trim().max(64).optional().or(z.literal("")),
});
export type ReportHeader = z.infer<typeof reportHeaderSchema>;

export const itemConditionSchema = z.enum(["new", "used"]);
export const itemOriginSchema    = z.enum(["genuine", "local"]);

export const newItemSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(["replace", "repair"]),
  partId: z.string().uuid().nullable(),
  names: z.record(z.string()),
  isRecovery: z.boolean().default(false),   // ← already there
  quantity: z.number().int().min(1).max(99).default(1),
  remark: z.string().max(500).optional(),
  condition: itemConditionSchema.nullable().optional(),
  origin: itemOriginSchema.nullable().optional(),
})
  .refine(
    (d) => d.action !== "replace" || d.condition != null,
    { message: "Condition is required for replacement parts", path: ["condition"] },
  )
  .refine(
    (d) => d.action !== "repair" || (!d.condition && !d.origin),
    { message: "Repair items cannot carry condition or origin", path: ["condition"] },
  );
export type NewItem = z.infer<typeof newItemSchema>;