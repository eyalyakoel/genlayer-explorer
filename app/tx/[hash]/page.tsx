import TxPageClient from "./TxPageClient";

export default async function Page({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  return <TxPageClient hash={hash} />;
}