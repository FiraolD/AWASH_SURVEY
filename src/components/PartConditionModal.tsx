"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import type { Messages } from "@/lib/i18n";

export type ItemCondition = "new" | "used";
export type ItemOrigin = "genuine" | "local";

export function PartConditionModal({
  open,
  onClose,
  onSubmit,
  initial,
  partName,
  action,
  messages,
  locale,
  title,
  submitLabel,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: {
    condition: ItemCondition | null;
    origin: ItemOrigin | null;
    isSalvage: boolean;
    remark: string;
  }) => void;
  initial?: {
    condition?: ItemCondition | null;
    origin?: ItemOrigin | null;
    isSalvage?: boolean;
    remark?: string | null;
  };
  partName: string;
  action: "replace" | "repair";
  messages: Messages;
  locale: string;
  title?: string;
  submitLabel?: string;
}) {
  const tr = (am: string, en: string) => (locale === "am" ? am : en);

  const [condition, setCondition] = useState<ItemCondition | null>(null);
  const [origin, setOrigin] = useState<ItemOrigin | null>(null);
  const [isSalvage, setIsSalvage] = useState(false);
  const [remark, setRemark] = useState("");

  useEffect(() => {
    if (open) {
      setCondition(initial?.condition ?? null);
      setOrigin(initial?.origin ?? null);
      setIsSalvage(initial?.isSalvage ?? false);
      setRemark(initial?.remark ?? "");
    }
  }, [
    open,
    initial?.condition,
    initial?.origin,
    initial?.isSalvage,
    initial?.remark,
  ]);

  const submit = () => {
    if (action === "replace" && !condition) {
      toast.error(tr("አዲስ ወይም ያገለገለ ይምረጡ", "Please choose New or Used"));
      return;
    }
    onSubmit({ 
      condition: action === "replace" ? condition : null, 
      origin: action === "replace" ? origin : null, 
      isSalvage: action === "replace" ? isSalvage : false, 
      remark: remark.trim() 
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title ?? (action === "replace" ? messages.form.partDetails : tr("የጥገና ዝርዝር", "Repair details"))}
      width="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {tr("ሰርዝ", "Cancel")}
          </Button>
          <Button variant="primary" onClick={submit} disabled={action === "replace" && !condition}>
            {submitLabel ?? tr("አክል", "Add part")}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm font-semibold text-[color:var(--ink)]">
        {partName}
      </p>

      {action === "replace" && (
        <>
          <div className="mb-4">
            <div className="mb-2 flex items-center gap-1 text-xs font-medium text-[color:var(--mut)]">
              {messages.form.condition}
              <span className="text-[color:var(--rep)]">*</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceButton
                selected={condition === "new"}
                onClick={() => setCondition("new")}
                title={messages.form.conditionNew}
                subtitle={tr("አዲስ እቃ", "Brand new part")}
                tone="acc"
              />
              <ChoiceButton
                selected={condition === "used"}
                onClick={() => setCondition("used")}
                title={messages.form.conditionUsed}
                subtitle={tr("ያገለገለ እቃ", "Salvaged / second-hand")}
                tone="warn"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center gap-1 text-xs font-medium text-[color:var(--mut)]">
              {messages.form.origin}
              <span className="text-[10px] font-normal">
                ({tr("አማራጭ", "optional")})
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <ChoiceButton
                selected={origin === null}
                onClick={() => setOrigin(null)}
                title="—"
                subtitle={messages.form.originNone}
                tone="mut"
                small
              />
              <ChoiceButton
                selected={origin === "genuine"}
                onClick={() => setOrigin("genuine")}
                title={messages.form.originGenuine}
                subtitle="OEM"
                tone="acc"
                small
              />
              <ChoiceButton
                selected={origin === "local"}
                onClick={() => setOrigin("local")}
                title={messages.form.originLocal}
                subtitle={tr("ከአገር ውስጥ", "Aftermarket")}
                tone="fix"
                small
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center gap-1 text-xs font-medium text-[color:var(--mut)]">
              {tr("ቅሪት ነው?", "Is it salvage?")}
              <span className="text-[color:var(--rep)]">*</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceButton
                selected={!isSalvage}
                onClick={() => setIsSalvage(false)}
                title={tr("አይደለም", "No")}
                subtitle={tr("ለኩባንያ አይመለስም", "Not returned")}
                tone="mut"
              />
              <ChoiceButton
                selected={isSalvage}
                onClick={() => setIsSalvage(true)}
                title={tr("ቅሪት", "Salvage")}
                subtitle={tr("ለኩባንያ ይመለሳል", "Returned to company")}
                tone="warn"
              />
            </div>
            {isSalvage && (
              <p className="mt-2 rounded-[var(--r)] bg-[color:var(--warn-2)] px-3 py-2 text-xs text-[color:var(--warn)]">
                {tr(
                  "የዚህ እቃ ተ.ቁ በሪፖርቱ ማሳሰቢያ ቁጥር 4 ላይ ይዘረዘራል።",
                  "This item's serial number will be listed in note 4 of the report.",
                )}
              </p>
            )}
          </div>
        </>
      )}

      <div>
        <div className="mb-2 flex items-center gap-1 text-xs font-medium text-[color:var(--mut)]">
          {tr("ተጨማሪ መግለጫ", "Additional description")}
          <span className="text-[10px] font-normal">
            ({tr("አማራጭ", "optional")})
          </span>
        </div>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder={tr("ለምሳሌ፡ በግራ በኩል የተሰበረ...", "e.g. Scratched on left side...")}
          className="w-full resize-none rounded-[var(--r)] border border-[color:var(--line-2)] bg-white p-2 text-sm placeholder:text-[color:var(--mut)] focus:border-[color:var(--acc)] focus:outline-none focus:ring-2 focus:ring-[color:var(--acc-ring)]"
        />
      </div>
    </Modal>
  );
}

function ChoiceButton({
  selected,
  onClick,
  title,
  subtitle,
  tone,
  small,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  tone: "acc" | "warn" | "fix" | "mut";
  small?: boolean;
}) {
  const ring: Record<typeof tone, string> = {
    acc: "border-[color:var(--acc)] bg-[color:var(--acc-2)] text-[color:var(--acc)]",
    warn: "border-[color:var(--warn)] bg-[color:var(--warn-2)] text-[color:var(--warn)]",
    fix: "border-[color:var(--fix)] bg-[color:var(--fix-2)] text-[color:var(--fix)]",
    mut: "border-[color:var(--mut)] bg-[color:var(--bg)] text-[color:var(--ink-2)]",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex flex-col items-start rounded-[var(--r)] border-2 text-left transition-all " +
        (small ? "px-2.5 py-2" : "px-3 py-2.5") +
        " " +
        (selected
          ? ring[tone]
          : "border-[color:var(--line)] bg-white hover:border-[color:var(--line-2)]")
      }
    >
      <span className={"font-semibold " + (small ? "text-sm" : "")}>{title}</span>
      <span className="text-[11px] opacity-70">{subtitle}</span>
    </button>
  );
}