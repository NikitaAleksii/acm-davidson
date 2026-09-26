import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { deleteAdmin } from "@/actions/admin";
import { Card, SectionTitle } from "@/components/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { AddAdminForm, ChangePasswordForm } from "@/components/admin/admin-forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admins" };

export default async function AdminsPage() {
  const me = await requireAdmin();
  const admins = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, createdAt: true, lastLoginAt: true },
  });

  return (
    <div className="space-y-10">
      <div>
        <SectionTitle as="h1" title="Admins" />
        <p className="mb-6 text-sm text-muted">
          Everyone here can sign in to this dashboard. Each admin signs in with their own email and
          password and receives a one-time code at their email. Their name is recorded in the
          activity log for everything they change.
        </p>
        <div className="overflow-x-auto rounded-xl border border-default bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Added</th>
                <th className="px-4 py-3">Last sign-in</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {admins.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-semibold">
                    {a.name}
                    {a.id === me.id && <span className="ml-2 text-xs font-normal text-muted">(you)</span>}
                  </td>
                  <td className="px-4 py-3">{a.email}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(a.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {a.id !== me.id && admins.length > 1 && (
                      <form action={deleteAdmin}>
                        <input type="hidden" name="id" value={a.id} />
                        <ConfirmButton
                          message={`Remove ${a.name}'s admin access? They will be signed out everywhere.`}
                          className="text-red-600 hover:underline"
                        >
                          Remove
                        </ConfirmButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold">Add an admin</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            Use their Davidson email so sign-in codes reach them. Share the starting password with
            them privately and ask them to change it after their first sign-in.
          </p>
          <AddAdminForm />
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold">Change your password</h2>
          <p className="mb-4 mt-1 text-sm text-muted">Signs you out of all other devices.</p>
          <ChangePasswordForm />
        </Card>
      </div>
    </div>
  );
}
