import { requireModule } from "../../../lib/auth/require-permission";

export default async function PagosPage() {
  const user = await requireModule("pagos");

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">
        {user.rol.nombre_rol === "Cliente" ? "Mis pagos" : "Pagos"}
      </h1>
    </main>
  );
}