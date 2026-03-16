import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/apiTypes";

export type AppNotificationSender = {
  _id?: string;
  firstname?: string;
  lastname?: string;
  image?: string;
  bio?: string;
};

export type AppNotificationJob = {
  _id?: string;
  userId?: string;
  workerId?: string;
  job_status?: string | number;
};

export type AppNotification = {
  _id?: string;
  sender?: AppNotificationSender;
  receiver?: string;
  message?: string;
  type?: string | number;
  status?: string | number;
  createdAt?: string;
  jobId?: AppNotificationJob | string;
  workerId?: string;
};

export type NotificationItem = {
  notification?: AppNotification;
  senderRatingData?: {
    count?: number;
    averageRating?: string | number;
  };
};

export async function getNotifications() {
  return api<ApiEnvelope<NotificationItem[]>>("/notificationList");
}

export async function getUnreadNotificationCount() {
  return api<ApiEnvelope<{ count?: number }>>("/unread_notification_count");
}

export async function readNotifications() {
  return api<ApiEnvelope<unknown>>("/read_notification", {
    method: "POST",
    body: { status: 1 },
  });
}

export async function updateNotificationStatus(enabled: boolean) {
  return api<ApiEnvelope<unknown>>("/UserNotificationStatus", {
    method: "POST",
    body: { notification_status: enabled ? 1 : 0 },
  });
}

export function normalizeNotifications(response: ApiEnvelope<NotificationItem[]> | null | undefined) {
  return Array.isArray(response?.body) ? response.body : [];
}

export function getNotificationJobId(item?: NotificationItem | null) {
  const jobId = item?.notification?.jobId;
  if (!jobId) return "";
  if (typeof jobId === "string") return jobId;
  return jobId._id ?? "";
}

export function getNotificationSenderId(item?: NotificationItem | null) {
  return item?.notification?.sender?._id ?? "";
}

export function getNotificationReadState(item?: NotificationItem | null) {
  return String(item?.notification?.status ?? "0") === "1";
}
