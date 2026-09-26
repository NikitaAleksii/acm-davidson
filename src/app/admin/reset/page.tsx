import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { lookupPasswordReset, maskEmail } from "@/lib/auth";
import { ResetPasswordForm } from "@/components/admin/reset-form";
import { Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const reset = await lookupPasswordReset(token);

  return (
    <main id="main" className="flex flex-1 items-center justify-center bg-surface-muted px-4 py-16">
      <Card className="w-full max-w-sm p-8">
        <Link href="/" className="mx-auto block w-fit">
          <Image src="/images/acm-davidson-diamond.png" alt="ACM Davidson" width={80} height={80} className="h-20 w-20" />
        </Link>
        {reset ? (
          <>
            <h1 className="mt-4 text-center font-display text-xl font-bold">Set a new password</h1>
            <p className="mt-1 text-center text-sm text-muted">
              For the admin account <span className="font-medium text-fg">{maskEmail(reset.user.email)}</span>.
            </p>
            <div className="mt-6">
              <ResetPasswordForm token={token} />
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-center font-display text-xl font-bold">Link expired</h1>
            <p className="mt-2 text-center text-sm text-muted">
              This password reset link is invalid or has expired. Ask an owner to send a new one.
            </p>
            <Link
              href="/admin/login"
              className="mt-6 block w-full rounded-md bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
            >
              Back to sign in
            </Link>
          </>
        )}
      </Card>
    </main>
  );
}
