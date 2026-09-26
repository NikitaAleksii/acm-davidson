import Link from "next/link";
import { currentAcademicYear } from "@/lib/site";
import { SectionTitle } from "@/components/ui";
import { OfficerForm } from "@/components/admin/officer-form";

export const metadata = { title: "Add officer" };

export default function NewOfficerPage() {
  return (
    <div className="max-w-3xl">
      <Link href="/admin/team" className="text-sm text-muted hover:underline">
        ← Team
      </Link>
      <div className="mt-2">
        <SectionTitle as="h1" title="Add officer" />
      </div>
      <OfficerForm defaultYear={currentAcademicYear()} />
    </div>
  );
}
