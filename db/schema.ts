import {
    pgTable, pgEnum, uuid, text, integer, smallint, boolean, jsonb,
    timestamp, date, primaryKey, uniqueIndex, index, bigint,
  } from "drizzle-orm/pg-core";
  import { sql } from "drizzle-orm";
  
  export const userRole     = pgEnum("user_role",     ["admin", "supervisor", "surveyor"]);
  export const coverageType = pgEnum("coverage_type", ["comprehensive", "third_party"]);
  export const reportStatus = pgEnum("report_status", ["draft", "finalized", "void"]);
  export const itemAction   = pgEnum("item_action",   ["replace", "repair"]);
  export const partSource   = pgEnum("part_source",   ["excel_import", "admin", "promoted_custom"]);
export const itemCondition = pgEnum("item_condition", ["new", "used"]);
export const itemOrigin    = pgEnum("item_origin",    ["genuine", "local"]);
  /*
  // Generated column types (Drizzle has no first-class support yet)
  const nameNorm = customType<{ data: string; notNull: true; generated: true }>({
    dataType() { return "text"; },
  });
  const searchText = customType<{ data: string; notNull: true; generated: true }>({
    dataType() { return "text"; },
  }); */
  
  export const languages = pgTable("languages", {
    code:       text("code").primaryKey(),
    name:       text("name").notNull(),
    nativeName: text("native_name").notNull(),
    isActive:   boolean("is_active").notNull().default(true),
    sortOrder:  smallint("sort_order").notNull().default(0),
  });
  
  export const branches = pgTable("branches", {
    id:        integer("id").generatedAlwaysAsIdentity().primaryKey(),
    code:      text("code").notNull().unique(),
    names:     jsonb("names").$type<Record<string, string>>().notNull(),
    isActive:  boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  });
  
  export const users = pgTable("users", {
    id:            uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    email:         text("email").notNull().unique(),
    fullName:      text("full_name").notNull(),
    phone:         text("phone"),
    role:          userRole("role").notNull().default("surveyor"),
    branchId:      integer("branch_id").references(() => branches.id),
    passwordHash:  text("password_hash"),
    preferredLang: text("preferred_lang").notNull().default("en").references(() => languages.code),
    isActive:      boolean("is_active").notNull().default(true),
    lastLoginAt:   timestamp("last_login_at", { withTimezone: true }),
    createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:     timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }, (t) => ({ branchIdx: index("users_branch_idx").on(t.branchId) }));
  
  export const partTranslations = pgTable("part_translations", {
    id:       bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    partId:   uuid("part_id").notNull().references(() => parts.id, { onDelete: "cascade" }),
    lang:     text("lang").notNull().references(() => languages.code),
    name:     text("name").notNull(),
    nameNorm: text("name_norm").generatedAlwaysAs(sql`fold_text(name)`),
  }, (t) => ({
    partLangUq: uniqueIndex("part_translations_part_id_lang_key").on(t.partId, t.lang),
    langIdx:    index("part_translations_lang_idx").on(t.lang),
  }));
  
  export const parts = pgTable("parts", {
    id:         uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    code:       text("code").unique(),
    source:     partSource("source").notNull().default("admin"),
    isActive:   boolean("is_active").notNull().default(true),
    usageCount: integer("usage_count").notNull().default(0),
    searchText: text("search_text").notNull().default(""),
    createdBy:  uuid("created_by").references(() => users.id),
    createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  });
  
  export const reportCounters = pgTable("report_counters", {
    branchId: integer("branch_id").notNull().references(() => branches.id),
    year:     integer("year").notNull(),
    lastNo:   integer("last_no").notNull().default(0),
  }, (t) => ({ pk: primaryKey({ columns: [t.branchId, t.year] }) }));
  
  export const surveyReports = pgTable("survey_reports", {
    id:              uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    reportNo:        text("report_no").unique(),
    claimRef:        text("claim_ref"),
    status:          reportStatus("status").notNull().default("draft"),
    branchId:        integer("branch_id").notNull().references(() => branches.id),
    surveyorId:      uuid("surveyor_id").notNull().references(() => users.id),
    coverage:        coverageType("coverage"),
    reportDate:      date("report_date").notNull().default(sql`CURRENT_DATE`),
    vehicleType:     text("vehicle_type"),
    plateNo:         text("plate_no"),
    manufactureYear: smallint("manufacture_year"),
    engineNo:        text("engine_no"),
    chassisNo:       text("chassis_no"),
    model:           text("model"),
    printLang:       text("print_lang").notNull().default("am").references(() => languages.code),
    remarks:         text("remarks"),
    revisionOf:      uuid("revision_of"),
    revisionNo:      integer("revision_no").notNull().default(0),
    finalizedAt:     timestamp("finalized_at", { withTimezone: true }),
    finalizedBy:     uuid("finalized_by").references(() => users.id),
    voidReason:      text("void_reason"),
    createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }, (t) => ({
    branchDateIdx: index("reports_branch_date_idx").on(t.branchId, t.reportDate),
    surveyorIdx:   index("reports_surveyor_idx").on(t.surveyorId, t.status),
    plateIdx:      index("reports_plate_idx").on(sql`upper(${t.plateNo})`),
    chassisIdx:    index("reports_chassis_idx").on(sql`upper(${t.chassisNo})`),
  }));
  
  export const reportItems = pgTable("report_items", {
    id:         uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    reportId:   uuid("report_id").notNull().references(() => surveyReports.id, { onDelete: "cascade" }),
    action:     itemAction("action").notNull(),
    position:   integer("position").notNull(),
    partId:     uuid("part_id").references(() => parts.id),
    names:      jsonb("names").$type<Record<string, string>>().notNull(),
    isRecovery: boolean("is_recovery").notNull().default(false),
    condition: itemCondition("condition"),
  origin:    itemOrigin("origin"),
    quantity:   smallint("quantity").notNull().default(1),
    remark:     text("remark"),
    createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  }, (t) => ({
    positionUq: uniqueIndex("items_position_uq").on(t.reportId, t.action, t.position),
    partIdx:    index("report_items_part_idx").on(t.partId),
  }));
  
  export const auditLog = pgTable("audit_log", {
    id:         bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    at:         timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    actorId:    uuid("actor_id"),
    actorEmail: text("actor_email"),
    entity:     text("entity").notNull(),
    entityId:   text("entity_id").notNull(),
    action:     text("action").notNull(),
    changes:    jsonb("changes"),
    diff:       jsonb("diff").$type<Record<string, { from: unknown; to: unknown }> | null>(),
    rowPk:      jsonb("row_pk").$type<Record<string, string> | null>(),
    requestId:  text("request_id"),
  }, (t) => ({
    entityIdx: index("audit_entity_idx").on(t.entity, t.entityId, t.at),
    actorIdx:  index("audit_log_actor_idx").on(t.actorId, t.at),
  }));
  
  export type AuditEntry = typeof auditLog.$inferSelect;