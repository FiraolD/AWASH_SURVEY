import { redirect } from "next/navigation";
import { signIn } from "@/server/auth";
import { AuthError } from "next-auth";
import { getMessages, isLocale, type Locale } from "@/lib/i18n";
import { LoginForm } from "@/components/LoginForm";
import { BrandPanel } from "@/components/BrandPanel";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;

  if (!isLocale(locale)) {
    redirect("/am/login");
  }

  const messages = getMessages(locale as Locale);

  async function doLogin(formData: FormData) {
    "use server";
    
    // Extract username instead of email
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      await signIn("credentials", {
        username,
        password,
        redirectTo: `/${locale}/reports`,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        // If credentials fail, redirect back to login with an error flag
        return redirect(`/${locale}/login?error=1`);
      }
      // Must re-throw NEXT_REDIRECT errors
      throw err;
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel locale={locale} messages={messages} />
      <main className="flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <LoginForm
          action={doLogin}
          locale={locale}
          messages={messages}
          error={!!error}
        />
      </main>
    </div>
  );
}