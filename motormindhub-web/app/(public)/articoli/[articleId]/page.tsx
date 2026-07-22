import { ArticleDetailContent } from "./ArticleDetailContent";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  return <ArticleDetailContent articleId={articleId} />;
}
