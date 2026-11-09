import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      branchId: number;
      username: string;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    branchId: number;
    username: string;
    mustChangePassword: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    branchId: number;
    username: string;
    mustChangePassword: boolean;
  }
}