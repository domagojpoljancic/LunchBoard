import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn(() => {
  throw new Error("NEXT_REDIRECT:/login");
});
const signOut = vi.fn(async () => undefined);
const auth = vi.fn();

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/auth", () => ({ auth, signOut }));

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

describe("requireUser", () => {
  beforeEach(() => {
    redirect.mockClear();
    signOut.mockClear();
    auth.mockReset();
  });

  it("redirects to /login when there is no session", async () => {
    auth.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects when session has no user id", async () => {
    auth.mockResolvedValue({ user: { email: "x@test.local" } });
    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("signs out and returns null for a stale JWT after DB wipe", async () => {
    auth.mockResolvedValue({
      user: { id: "missing-user-id", email: "gone@test.local" },
    });
    const user = await requireUser();
    expect(user).toBeNull();
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });

  it("returns the user row when session matches", async () => {
    const created = await prisma.user.create({
      data: {
        email: `session-${Date.now()}@test.local`,
        passwordHash: "x",
      },
    });
    auth.mockResolvedValue({
      user: { id: created.id, email: created.email },
    });
    const user = await requireUser();
    expect(user?.id).toBe(created.id);
    expect(redirect).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
    await prisma.user.delete({ where: { id: created.id } });
  });
});
