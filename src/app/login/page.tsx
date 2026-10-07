import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { BowlMark } from "@/components/BowlMark";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="sheet w-full max-w-[420px] p-8">
        <div className="mb-6 flex items-center gap-2">
          <BowlMark size={20} />
          <span className="font-display text-2xl">LunchBoard</span>
        </div>
        <p className="mb-6 text-[var(--muted)]">
          Plan the lunches you will actually cook.
        </p>

        <form
          className="space-y-4"
          action={async (formData) => {
            "use server";
            try {
              await signIn("credentials", {
                email: String(formData.get("email") || "").toLowerCase(),
                password: String(formData.get("password") || ""),
                redirectTo: "/week",
              });
            } catch (error) {
              if (error instanceof AuthError) {
                redirect("/login?error=1");
              }
              throw error;
            }
          }}
        >
          <label className="block">
            <span className="section-label">Email</span>
            <input
              name="email"
              type="email"
              required
              defaultValue="cook@lunchboard.local"
              autoComplete="username"
              className="field"
            />
          </label>
          <label className="block">
            <span className="section-label">Password</span>
            <input
              name="password"
              type="password"
              required
              defaultValue="lunchboard"
              autoComplete="current-password"
              className="field"
            />
          </label>
          {params.error ? (
            <p className="text-sm text-[var(--warning)]">
              That email or password does not match.
            </p>
          ) : null}
          <button type="submit" className="btn-primary w-full">
            Sign in
          </button>
        </form>

        <p className="mt-4 text-[13px] text-[var(--muted)]">
          Local sign-in: cook@lunchboard.local / lunchboard
        </p>
      </div>
    </main>
  );
}
