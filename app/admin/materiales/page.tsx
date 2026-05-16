import { requireModule } from "../../../lib/auth/require-permission";

export default async function MaterialesPage() {
  await requireModule("materiales");

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Materiales</h1>
    </main>
  );
}