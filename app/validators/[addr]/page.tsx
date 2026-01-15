import ValidatorPageClient from "./ValidatorPageClient";

export default async function ValidatorPage({
  params,
}: {
  params: Promise<{ addr: string }>;
}) {
  const { addr } = await params;
  return <ValidatorPageClient addr={addr} />;
}
