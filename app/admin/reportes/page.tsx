import { requireModule } from "../../../lib/auth/require-permission";

export default async function ReportesPage() {
  await requireModule("reportes");

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Reportes</h1>
    </main>
  );
}