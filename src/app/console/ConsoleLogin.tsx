"use client";

import { useState } from "react";
import { loginConsole } from "@/server/actions/console";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ConsoleLogin() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    const result = await loginConsole(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] p-4 text-emerald-50">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">System Console</h1>
          <p className="mt-2 text-sm text-slate-400">
            Restricted access. Authorized personnel only.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-900/50 p-3 text-sm text-red-200 border border-red-800">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Console Password
            </label>
            <Input
              type="password"
              name="password"
              required
              autoFocus
              className="w-full bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20"
              placeholder="Enter master password"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            loading={loading}
          >
            Authenticate
          </Button>
        </form>
      </div>
    </div>
  );
}