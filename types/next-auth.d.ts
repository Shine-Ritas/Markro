import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      isSuperAdmin: boolean;
      tenantId?: string;
      tenantSlug?: string;
      tenantName?: string;
      roleSlug?: string;
      permissions: string[];
    };
  }

  interface User {
    isSuperAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    isSuperAdmin?: boolean;
    tenantId?: string;
    tenantSlug?: string;
    tenantName?: string;
    roleSlug?: string;
    permissions?: string[];
  }
}
