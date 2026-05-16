import { requireModule } from "../../../lib/auth/require-permission";

export default async function EmpleadosPage() {
  await requireModule("empleados");

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Empleados</h1>
    </main>
  );
}
