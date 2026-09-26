import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentAcademicYear } from "@/lib/site";
import { SectionTitle } from "@/components/ui";
import { OfficerForm } from "@/components/admin/officer-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit officer" };

export default async function EditOfficerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const officer = await db.officer.findUnique({ where: { id } });
  if (!officer) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/team" className="text-sm text-muted hover:underline">
        ← Team
      </Link>
      <div className="mt-2">
        <SectionTitle as="h1" title={`Edit ${officer.name}`} />
      </div>
      <OfficerForm officer={officer} defaultYear={currentAcademicYear()} />
    </div>
  );
}
