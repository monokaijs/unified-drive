import NextAuth, { DefaultSession } from "next-auth";
import {UserRole} from '@app/lib/types/models/user';

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: UserRole;
    } & DefaultSession["user"];
    issuer: "default" | "mobile";
  }
}
declare module "next-auth/jwt" {
  export interface JWT {
    id: string;
    username: string;
    role: UserRole;
  }
}
