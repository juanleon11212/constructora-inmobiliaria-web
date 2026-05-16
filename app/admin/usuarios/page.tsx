import { requireModule } from "../../../lib/auth/require-permission";

export default async function UsuariosPage() {
  await requireModule("usuarios");

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Usuarios</h1>
    </main>
  );
}