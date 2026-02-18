import drizzle from "~/core/db/drizzle-client.server";

import { notifications } from "../schema";

interface CreateNotificationParams {
  user_id: string;
  type: "checkin" | "like" | "comment" | "follow";
  title: string;
  body: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    await drizzle.insert(notifications).values({
      user_id: params.user_id,
      type: params.type,
      title: params.title,
      body: params.body,
      subtitle: params.subtitle ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}
