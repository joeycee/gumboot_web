export type IdentityStatusUser = {
  idproof?: string | null;
  selfie?: string | null;
};

export function hasCompletedIdentityVerification(user: IdentityStatusUser | null | undefined) {
  if (!user) return false;
  return Boolean(user.idproof) && Boolean(user.selfie);
}
