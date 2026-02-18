import { and, desc, eq } from "drizzle-orm";
import drizzle from "~/core/db/drizzle-client.server";

import { notifications } from "../schema";

export type NotificationType = "checkin" | "like" | "comment" | "follow";

export async function getNotifications(
  userId: string,
  type?: NotificationType,
  limit = 50,
  offset = 0
) {
  const conditions = [eq(notifications.user_id, userId)];
  if (type) {
    conditions.push(eq(notifications.type, type));
  }

  return drizzle
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.created_at))
    .limit(limit)
    .offset(offset);
}
