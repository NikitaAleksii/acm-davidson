import "server-only";
import { db } from "./db";
import type { SessionUser } from "./auth";

export type ActivityAction =
  | "created"
  | "updated"
  | "deleted"
  | "published"
  | "unpublished"
  | "archived"
  | "restored"
  | "reordered"
  | "login"
  | "logout"
  | "logout_all"
  | "exported";

export type EntityType = "post" | "event" | "officer" | "message" | "subscriber" | "session";

export async function logActivity(
  user: SessionUser | null,
  action: ActivityAction,
  entityType: EntityType,
  summary: string,
  entityId?: string | null,
) {
  await db.activityLog.create({
    data: {
      userId: user?.id ?? null,
      actorName: user?.name ?? "system",
      action,
      entityType,
      entityId: entityId ?? null,
      summary,
    },
  });
}
