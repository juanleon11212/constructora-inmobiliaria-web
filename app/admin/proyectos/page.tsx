import { requireModule } from "../../../lib/auth/require-permission";

export default async function ProyectosPage() {
  const user = await requireModule("proyectos");

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">
        {user.rol.nombre_rol === "Cliente" ? "Mis proyectos" : "Proyectos"}
      </h1>
    </main>
  );
}
