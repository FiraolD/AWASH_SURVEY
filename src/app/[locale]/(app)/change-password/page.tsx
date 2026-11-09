"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "@/server/actions/auth";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";

export default function ChangePasswordPage({ params }: { params: { locale: string } }) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    setSaving(true);
    try {
      await changePassword(newPassword);
      toast.success("Password changed successfully!");
      // Force logout to refresh the JWT token with the new session state
      await signOut({ callbackUrl: `/${params.locale}/login` });
    } catch (err) {
      toast.error("Failed to change password");
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-[color:var(--line)] bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold mb-2 text-ink">Change Password</h1>
        <p className="text-sm text-mut mb-6">
          For security reasons, you must change your default password before continuing.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <Field label="New Password" required>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
          </Field>
          <Field label="Confirm Password" required>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Button type="submit" variant="primary" className="w-full" loading={saving}>
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}