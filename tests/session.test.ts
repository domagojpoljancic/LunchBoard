import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT:/login");
  }),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  signOut: vi.fn(async () => {
    throw new Error("NEXT_REDIRECT:/login");
  }),
}));

import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

const mockedAuth = vi.mocked(auth);
const mockedSignOut = vi.mocked(signOut);
const mockedRedirect = vi.mocked(redirect);

describe("requireUser", () => {
  beforeEach(() => {
    mockedRedirect.mockClear();
    mockedSignOut.mockClear();
    mockedAuth.mockReset();
  });

  it("redirects to /login when there is no session", async () => {
    mockedAuth.mockResolvedValue(null as never);
    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mockedRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects when session has no user id", async () => {
    mockedAuth.mockResolvedValue({ user: { email: "x@test.local" } } as never);
    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mockedRedirect).toHaveBeenCalledWith("/login");
  });

  it("signs out for a stale JWT after DB wipe", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "missing-user-id", email: "gone@test.local" },
    } as never);
    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mockedSignOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });

  it("returns the user row when session matches", async () => {
    const created = await prisma.user.create({
      data: {
        email: `session-${Date.now()}@test.local`,
        passwordHash: "x",
      },
    });
    mockedAuth.mockResolvedValue({
      user: { id: created.id, email: created.email },
    } as never);
    const user = await requireUser();
    expect(user.id).toBe(created.id);
    expect(mockedRedirect).not.toHaveBeenCalled();
    expect(mockedSignOut).not.toHaveBeenCalled();
    await prisma.user.delete({ where: { id: created.id } });
  });
});
