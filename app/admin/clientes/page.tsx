import { requireModule } from "../../../lib/auth/require-permission";

export default async function ClientesPage() {
  await requireModule("clientes");

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Clientes</h1>
    </main>
  );
}
