import { api, apiForm } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/apiTypes";

export type SkillOption = {
  _id?: string;
  name?: string;
  image?: string[];
};

export type ToolOption = {
  _id?: string;
  tool_name?: string;
};

export type ProfilePayload = {
  firstname?: string;
  lastname?: string;
  email?: string;
  bio?: string;
  image?: File | null;
};

export async function updateProfile(payload: ProfilePayload) {
  const form = new FormData();
  if (payload.firstname?.trim()) form.set("firstname", payload.firstname.trim());
  if (payload.lastname?.trim()) form.set("lastname", payload.lastname.trim());
  if (payload.email?.trim()) form.set("email", payload.email.trim());
  if (payload.bio?.trim()) form.set("bio", payload.bio.trim());
  if (payload.image) form.set("image", payload.image);
  return apiForm<ApiEnvelope<unknown>>("/edit_profile", form);
}

export async function submitIdVerification(payload: {
  bio: string;
  selfie?: File | null;
  idproof?: File | null;
  skillIds?: string[];
  toolIds?: string[];
}) {
  const form = new FormData();
  form.set("bio", payload.bio.trim());
  if (payload.selfie) form.set("selfie", payload.selfie);
  if (payload.idproof) form.set("idproof", payload.idproof);
  if (payload.skillIds?.length) form.set("skill", payload.skillIds.join(","));
  if (payload.toolIds?.length) form.set("tools", payload.toolIds.join(","));
  return apiForm<ApiEnvelope<unknown>>("/id_verification", form);
}

export async function changeRole(role: string | number) {
  return api<ApiEnvelope<unknown>>("/role_change", {
    method: "POST",
    body: { role },
  });
}

export async function deleteAccount() {
  return api<ApiEnvelope<unknown>>("/deletedAccount", {
    method: "DELETE",
    body: {},
  });
}

export async function getSkillList() {
  return api<ApiEnvelope<SkillOption[]>>("/skillList");
}

export async function getToolsList() {
  return api<ApiEnvelope<ToolOption[]>>("/tools_list");
}

export async function addTool(tool_name: string) {
  return api<ApiEnvelope<ToolOption>>("/add_tools", {
    method: "POST",
    body: { tool_name: tool_name.trim() },
  });
}
