"use client";

import { api } from "./api";
import type { ApiEnvelope } from "./apiTypes";

export type ChatParticipant = {
  _id: string;
  firstname?: string;
  lastname?: string;
  image?: string;
};

export type ChatMessage = {
  _id: string;
  sender_id: string;
  receiver_id: string;
  constant_id?: number;
  message: string;
  file?: string;
  thumbnail?: string;
  type?: string;
  readStatus?: string | number;
  createdAt?: string;
  updatedAt?: string;
  fileName?: string;
};

export type ChatConversation = {
  id: string;
  constantId?: number;
  otherUserId: string;
  otherUserName: string;
  otherUserImage?: string;
  latestMessage: string;
  latestMessageAt?: string;
  unreadCount: number;
  raw: Record<string, unknown>;
};

const IMAGE_PATH_RE = /(?:^\/|^https?:\/\/|^data:image\/).+\.(png|jpg|jpeg|webp|gif)(?:\?.*)?$/i;
const RELATIVE_IMAGE_DIR_RE = /^\/(?:uploads|images)\//i;

export type SupportPayload = {
  userId?: string;
  name: string;
  mobile_number: string;
  email: string;
  message: string;
};

type RawUser = {
  _id?: string;
  firstname?: string;
  lastname?: string;
  image?: string;
};

type RawMessage = Record<string, unknown> & {
  _id?: string;
  sender_id?: string;
  receiver_id?: string;
  constant_id?: number;
  message?: string;
  file?: string;
  thumbnail?: string;
  type?: string;
  readStatus?: string | number;
  createdAt?: string;
  updatedAt?: string;
  fileName?: string;
  sender?: RawUser[];
  receiver?: RawUser[];
  unread_count?: number;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getParticipantName(user?: RawUser) {
  const first = user?.firstname?.trim() ?? "";
  const last = user?.lastname?.trim() ?? "";
  return `${first} ${last}`.trim() || "Conversation";
}

export function normalizeMessage(raw: RawMessage): ChatMessage {
  return {
    _id: asString(raw._id),
    sender_id: asString(raw.sender_id),
    receiver_id: asString(raw.receiver_id),
    constant_id: typeof raw.constant_id === "number" ? raw.constant_id : undefined,
    message: asString(raw.message),
    file: asString(raw.file) || undefined,
    thumbnail: asString(raw.thumbnail) || undefined,
    type: asString(raw.type),
    readStatus: typeof raw.readStatus === "number" || typeof raw.readStatus === "string" ? raw.readStatus : undefined,
    createdAt: asString(raw.createdAt) || undefined,
    updatedAt: asString(raw.updatedAt) || undefined,
    fileName: asString(raw.fileName) || undefined,
  };
}

export function normalizeConversation(raw: RawMessage, loggedInUserId: string): ChatConversation {
  const sender = Array.isArray(raw.sender) ? raw.sender[0] : undefined;
  const receiver = Array.isArray(raw.receiver) ? raw.receiver[0] : undefined;
  const senderId = asString(raw.sender_id);
  const receiverId = asString(raw.receiver_id);
  const otherUser = senderId === loggedInUserId ? receiver : sender;
  const otherUserId = senderId === loggedInUserId ? receiverId : senderId;

  return {
    id: asString(raw._id) || `${raw.constant_id ?? otherUserId}`,
    constantId: typeof raw.constant_id === "number" ? raw.constant_id : undefined,
    otherUserId,
    otherUserName: getParticipantName(otherUser),
    otherUserImage: otherUser?.image,
    latestMessage: getImageMessageSource({
      type: asString(raw.type),
      file: asString(raw.file) || undefined,
      message: asString(raw.message),
    })
      ? "Image"
      : asString(raw.message) || "No messages yet",
    latestMessageAt: asString(raw.createdAt) || undefined,
    unreadCount: typeof raw.unread_count === "number" ? raw.unread_count : 0,
    raw,
  };
}

function looksLikeImagePath(value?: string) {
  if (!value) return false;
  if (value.startsWith("data:image/")) return true;
  if (RELATIVE_IMAGE_DIR_RE.test(value)) return true;
  if (IMAGE_PATH_RE.test(value)) return true;
  return false;
}

export function isImageMessage(message: Pick<ChatMessage, "type" | "file" | "message">) {
  const normalizedType = String(message.type ?? "").toLowerCase();
  if (normalizedType === "2" || normalizedType === "image") return true;
  if (looksLikeImagePath(message.message)) return true;
  if (message.file) return true;
  if ("thumbnail" in message && message.thumbnail) return true;
  return false;
}

export function resolveChatMediaUrl(path?: string) {
  if (!path) return "";
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/" || trimmed === "#" || trimmed === "undefined" || trimmed === "null") return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) return trimmed;

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const root = apiBase.replace(/\/api\/?$/, "");
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${root}${normalizedPath}`;
}

export function resolveUserImageUrl(path?: string) {
  return resolveChatMediaUrl(path);
}

export function getImageMessageSource(message: Pick<ChatMessage, "type" | "file" | "message" | "thumbnail">) {
  if (looksLikeImagePath(message.message)) {
    return resolveChatMediaUrl(message.message);
  }

  const normalizedType = String(message.type ?? "").toLowerCase();
  if ((normalizedType === "2" || normalizedType === "image") && message.message) {
    return resolveChatMediaUrl(message.message);
  }

  if (message.file) {
    return resolveChatMediaUrl(message.file);
  }

  if (message.thumbnail) {
    return resolveChatMediaUrl(message.thumbnail);
  }

  if (looksLikeImagePath(message.message)) {
    return resolveChatMediaUrl(message.message);
  }

  return "";
}

export async function sendSupportMessage(payload: SupportPayload) {
  return api<ApiEnvelope<Record<string, unknown>>>("/support", {
    method: "POST",
    body: payload,
  });
}
