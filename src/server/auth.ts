import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "~db/index";
import { users } from "~db/schema";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, credentials.username as string))
          .limit(1);

        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        // FIX: Wrap the update in a try/catch so it doesn't crash the login if the DB query fails
        try {
          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id));
        } catch (dbError) {
          console.error("Failed to update lastLoginAt:", dbError);
          // We log the error but allow the login to proceed
        }

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          username: user.username,
          role: user.role,
          branchId: user.branchId!,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
});