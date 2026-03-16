import PublicProfileClient from "./public-profile-client";

export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <PublicProfileClient userId={userId} />;
}
