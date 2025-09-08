import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      isApproved?: boolean;
      provider?: string;
      roleId?: string | null;
      isSuperAdmin?: boolean;
      active?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    isApproved?: boolean;
    provider?: string;
    roleId?: string | null;
    isSuperAdmin?: boolean;
    active?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    isApproved?: boolean;
    provider?: string;
    roleId?: string | null;
    isSuperAdmin?: boolean;
    active?: boolean;
    firstName?: string | null;
    lastName?: string | null;
  }
}
