import { WebhookDetailView } from "@/views/admin/WebhookDetailView";

type Props = { params: Promise<{ id: string }> };

export default async function WebhookDetailPage({ params }: Props) {
  const { id } = await params;
  return <WebhookDetailView id={id} />;
}
