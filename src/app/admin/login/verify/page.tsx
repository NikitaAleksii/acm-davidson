import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPendingChallenge } from "@/lib/auth";
import { VerifyForm } from "@/components/admin/verify-form";
import { Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Enter sign-in code",
  robots: { index: false, follow: false },
};

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(next?.startsWith("/admin") ? next : "/admin");
  if (!(await hasPendingChallenge())) redirect("/admin/login");

  const recipient = process.env.OTP_EMAIL;

  return (
    <main id="main" className="flex flex-1 items-center justify-center bg-surface-muted px-4 py-16">
      <Card className="w-full max-w-sm p-8">
        <Link href="/" className="mx-auto block w-fit">
          <Image src="/images/acm-davidson-diamond.png" alt="ACM Davidson" width={80} height={80} className="h-20 w-20" />
        </Link>
        <h1 className="mt-4 text-center font-display text-xl font-bold">Check your email</h1>
        <p className="mt-1 text-center text-sm text-muted">
          We sent a 6-digit sign-in code{recipient ? ` to ${recipient}` : " to your email"}. It expires in
          10 minutes.
        </p>
        <div className="mt-6">
          <VerifyForm next={next} />
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          Didn&apos;t get it?{" "}
          <Link href="/admin/login" className="underline">
            Sign in again
          </Link>{" "}
          to request a new code.
        </p>
      </Card>
    </main>
  );
}
