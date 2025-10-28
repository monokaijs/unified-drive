import NextAuth, { DefaultSession } from "next-auth";
import {UserRole} from '@/lib/types/models/user';

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      fullName: string;
      email: string;
      role: UserRole;
    } & DefaultSession["user"];
    issuer: "default" | "mobile";
  }
}
declare module "next-auth/jwt" {
  export interface JWT {
    id: string;
    role: UserRole;
    fullName: string;
    photo: string;
    phoneNumber: string;
  }
}
