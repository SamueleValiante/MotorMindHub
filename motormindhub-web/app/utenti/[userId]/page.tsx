import { PublicProfileContent } from "./PublicProfileContent";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <PublicProfileContent userId={userId} />;
}
