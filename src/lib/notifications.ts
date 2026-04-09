import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/apiTypes";
import {
  fetchJobApplications,
  findApplicationByWorkerId,
  normalizeApplicationsResponse,
} from "@/lib/applications";

export const NOTIFICATIONS_REFRESH_EVENT = "gumboot-notifications-refresh";

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
  jobStatus?: string | number;
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

export function broadcastNotificationsRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
}

export async function updateNotificationStatus(enabled: boolean) {
  return api<ApiEnvelope<unknown>>("/UserNotificationStatus", {
    method: "POST",
    body: { notification_status: enabled ? 1 : 0 },
  });
}

export async function updateNotificationRadius(payload: {
  latitude: number;
  longitude: number;
  radius: number;
  address?: string;
}) {
  return api<ApiEnvelope<unknown>>("/updateLocation", {
    method: "POST",
    body: {
      latitude: payload.latitude,
      longitude: payload.longitude,
      radius: payload.radius,
      address: payload.address ?? "",
    },
  });
}

export function normalizeNotifications(response: ApiEnvelope<NotificationItem[]> | null | undefined) {
  const body = response?.body;
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const record = body as { notifications?: NotificationItem[]; data?: NotificationItem[]; items?: NotificationItem[] };
    if (Array.isArray(record.notifications)) return record.notifications;
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.items)) return record.items;
  }
  return [];
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

export function getNotificationType(item?: NotificationItem | null) {
  return String(item?.notification?.type ?? "");
}

export function getNotificationJobStatus(item?: NotificationItem | null) {
  const jobId = item?.notification?.jobId;
  if (jobId && typeof jobId !== "string" && jobId.job_status != null) {
    return String(jobId.job_status);
  }
  return String(item?.notification?.jobStatus ?? "");
}

export function getNotificationTypeLabel(item?: NotificationItem | null) {
  const jobStatus = getNotificationJobStatus(item);
  switch (getNotificationType(item)) {
    case "1":
      return jobStatus === "6" ? "Completion review" : "Job details";
    case "2":
      return "Chat";
    case "3":
      return "Offer review";
    case "7":
      return "Wallet";
    default:
      return "Notification";
  }
}

export function getNotificationJobStatusLabel(item?: NotificationItem | null) {
  switch (getNotificationJobStatus(item)) {
    case "1":
      return "Pending";
    case "2":
      return "Accepted";
    case "3":
      return "Started";
    case "4":
      return "Rejected";
    case "5":
      return "Cancelled";
    case "6":
      return "Completed by worker";
    case "7":
      return "Finished";
    case "8":
      return "Tracking";
    case "9":
      return "Arrived";
    default:
      return "";
  }
}

export function isOfferNotification(item?: NotificationItem | null) {
  return getNotificationType(item) === "3";
}

export function isCompletionReviewNotification(item?: NotificationItem | null) {
  return getNotificationType(item) === "1" && getNotificationJobStatus(item) === "6";
}

async function resolveNotificationRequest(jobId: string, senderId: string) {
  const response = await fetchJobApplications(jobId);
  const applications = normalizeApplicationsResponse(response);
  return findApplicationByWorkerId(applications, senderId);
}

export function getNotificationHref(item?: NotificationItem | null) {
  const notificationType = getNotificationType(item);
  const jobId = getNotificationJobId(item);
  const senderId = getNotificationSenderId(item);

  if (notificationType === "2" && senderId) {
    const senderName =
      [item?.notification?.sender?.firstname, item?.notification?.sender?.lastname]
        .filter(Boolean)
        .join(" ")
        .trim() || "Conversation";
    const params = new URLSearchParams({
      userId: senderId,
      name: senderName,
    });
    return `/messages?${params.toString()}`;
  }

  if (notificationType === "7") {
    return "/profile/payments";
  }

  if (jobId) return `/jobs/${jobId}`;
  return "/notifications";
}

export async function resolveNotificationHref(item?: NotificationItem | null) {
  if (!item) return "/notifications";

  const fallbackHref = getNotificationHref(item);
  const jobId = getNotificationJobId(item);
  const senderId = getNotificationSenderId(item);
  if (!jobId || !senderId) return fallbackHref;

  try {
    const request = await resolveNotificationRequest(jobId, senderId);
    if (request?._id && isOfferNotification(item)) {
      return `/jobs/${encodeURIComponent(jobId)}/offers/${encodeURIComponent(request._id)}`;
    }
    if (request?._id && isCompletionReviewNotification(item)) {
      return `/jobs/${encodeURIComponent(jobId)}/completion/${encodeURIComponent(request._id)}`;
    }
  } catch {
    return fallbackHref;
  }

  return fallbackHref;
}
