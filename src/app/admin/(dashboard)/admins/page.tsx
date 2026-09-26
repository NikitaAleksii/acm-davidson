import { db } from "@/lib/db";
import { isOwner, requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { deleteAdmin, requestPasswordReset } from "@/actions/admin";
import { Alert, Card, SectionTitle } from "@/components/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { AddAdminForm, ChangePasswordForm } from "@/components/admin/admin-forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admins" };

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; to?: string }>;
}) {
  const [me, { reset, to }] = await Promise.all([requireAdmin(), searchParams]);
  const owner = isOwner(me);
  const admins = await db.user.findMany({
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true },
  });
  const ownerCount = admins.filter((a) => a.role === "owner").length;

  return (
    <div className="space-y-10">
      <div>
        <SectionTitle as="h1" title="Admins" />
        <p className="mb-6 text-sm text-muted">
          Everyone here can sign in to this dashboard with their own email and password, and gets a
          one-time code at their email. Their name is recorded in the activity log for everything they
          change.{" "}
          {owner
            ? "As an owner you can add and remove admins and send password-reset links."
            : "Only owners can add or remove admins. Ask an owner if you need your password reset."}
        </p>
        {reset === "sent" && (
          <div className="mb-4">
            <Alert kind="success">Password reset link sent to {to}. It works for one hour.</Alert>
          </div>
        )}
        {reset === "failed" && (
          <div className="mb-4">
            <Alert kind="error">Couldn&apos;t email {to}. Check the SMTP settings in .env and try again.</Alert>
          </div>
        )}
        <div className="overflow-x-auto rounded-xl border border-default bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Last sign-in</th>
                {owner && (
                  <th className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {admins.map((a) => {
                const canRemove = owner && a.id !== me.id && (a.role !== "owner" || ownerCount > 1);
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-semibold">
                      {a.name}
                      {a.id === me.id && <span className="ml-2 text-xs font-normal text-muted">(you)</span>}
                    </td>
                    <td className="px-4 py-3">{a.email}</td>
                    <td className="px-4 py-3">
                      {a.role === "owner" ? (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                          Owner
                        </span>
                      ) : (
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold">Admin</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted" title={`Added ${formatDateTime(a.createdAt)}`}>
                      {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "Never"}
                    </td>
                    {owner && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-4">
                          <form action={requestPasswordReset}>
                            <input type="hidden" name="id" value={a.id} />
                            <ConfirmButton
                              message={`Email ${a.name} a link to set a new password? Their current password keeps working until they use it.`}
                              className="text-brand-600 hover:underline"
                            >
                              Send password reset
                            </ConfirmButton>
                          </form>
                          {canRemove && (
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
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {owner && (
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold">Add an admin</h2>
            <p className="mb-4 mt-1 text-sm text-muted">
              Use their Davidson email so sign-in codes reach them. Share the starting password with
              them privately, or send them a password reset link right after adding them.
            </p>
            <AddAdminForm />
          </Card>
        )}
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold">Change your password</h2>
          <p className="mb-4 mt-1 text-sm text-muted">Signs you out of all other devices.</p>
          <ChangePasswordForm />
        </Card>
      </div>
    </div>
  );
}
