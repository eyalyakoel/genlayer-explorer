// app/address/[addr]/page.tsx
import AddressClient from "./AddressClient";

export default async function AddressPage({
  params,
}: {
  params: Promise<{ addr: string }>;
}) {
  const { addr } = await params; 
  const safeAddr = (addr ?? "").trim();

  return <AddressClient addr={safeAddr} />;
}
