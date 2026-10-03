import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      timezone: string;
    };
  }

  interface User {
    timezone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    timezone?: string;
  }
}
