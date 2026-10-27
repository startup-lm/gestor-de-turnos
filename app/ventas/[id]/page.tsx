import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VentasRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/venta/${id}`);
}
