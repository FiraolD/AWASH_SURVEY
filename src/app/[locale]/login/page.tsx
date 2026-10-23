import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/server/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { LoginForm } from "@/components/LoginForm";
import { BrandPanel } from "@/components/BrandPanel";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { next, error } = await searchParams;
  const messages = getMessages(await getLocale());

  async function doLogin(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        redirectTo: next || `/${locale}/reports`,
      });
    } catch (e) {
      if (e instanceof AuthError) redirect(`/${locale}/login?error=1`);
      throw e;
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel locale={locale} messages={messages} />
      <div className="flex items-center justify-center bg-[color:var(--bg)] p-6 sm:p-10">
        <LoginForm
          action={doLogin}
          locale={locale}
          messages={messages}
          error={error === "1"}
        />
      </div>
    </main>
  );
}