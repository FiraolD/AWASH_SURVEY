import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "~db/index";
import { users } from "~db/schema";
import { env } from "@/lib/env";
import type { Locale } from "@/lib/zod";

declare module "next-auth" {
  interface User { role: "admin" | "supervisor" | "surveyor"; branchId: number | null; lang: Locale; }
  interface Session { user: { id: string; email: string; name: string; role: "admin" | "supervisor" | "surveyor"; branchId: number | null; lang: Locale; } }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8, updateAge: 60 *60 },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!u || !u.isActive || !u.passwordHash) return null;
        const ok = await bcrypt.compare(password, u.passwordHash);
        if (!ok) return null;
        return {
          id: u.id,
          email: u.email,
          name: u.fullName,
          role: u.role,
          branchId: u.branchId,
          lang: (u.preferredLang as Locale) ?? "am",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as any).role;
        token.branchId = (user as any).branchId;
        token.lang = (user as any).lang;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = String(token.uid ?? "");
      session.user.role = (token.role as any) ?? "surveyor";
      session.user.branchId = (token.branchId as any) ?? null;
      session.user.lang = (token.lang as any) ?? "am";
      return session;
    },
  },
  pages: { signIn: "/en/login" },
});