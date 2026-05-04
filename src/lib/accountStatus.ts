export type IdentityStatusUser = {
  verified_user?: string | number | null;
  idproof?: string | null;
  selfie?: string | null;
};

export function hasCompletedIdentityVerification(user: IdentityStatusUser | null | undefined) {
  if (!user) return false;
  return Number(user.verified_user ?? 0) === 1 && Boolean(user.idproof) && Boolean(user.selfie);
}
