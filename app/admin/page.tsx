import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "../../components/auth/LogoutButton";
import { getCurrentUser } from "../../lib/auth/current-user";
import {
  AppModule,
  getModuleDetails,
  getModulesByRole,
  getRoleSummary,
} from "../../lib/auth/permissions";

/*
  PANEL PRINCIPAL DEL SISTEMA

  Ruta:
  /admin

  Esta pantalla muestra los módulos disponibles según el rol.

  Importante:
  No depende de la persona individual.
  Depende del rol.

  Ejemplo:
  Todos los usuarios con rol Contabilidad verán lo mismo.
  Todos los usuarios con rol Almacen verán lo mismo.
*/

function getRoleName(user: { rol: unknown }) {
  if (typeof user.rol === "string") {
    return user.rol;
  }

  if (
    user.rol &&
    typeof user.rol === "object" &&
    "nombre_rol" in user.rol
  ) {
    return String(
      (user.rol as { nombre_rol?: string | null }).nombre_rol ?? "Sin rol"
    );
  }

  return "Sin rol";
}

function getTituloModulo(roleName: string, key: AppModule, title: string) {
  if (roleName === "Cliente" && key === "proyectos") {
    return "Mis proyectos";
  }

  if (roleName === "Cliente" && key === "pagos") {
    return "Mis pagos";
  }

  return title;
}

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const roleName = getRoleName(user);
  const modules = getModulesByRole(roleName);
  const roleSummary = getRoleSummary(roleName);

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Panel del sistema
            </p>

            <h1 className="text-2xl font-bold text-slate-900">
              Constructora e Inmobiliaria
            </h1>
          </div>

          <LogoutButton />
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Bienvenido</p>

          <h2 className="mt-1 text-3xl font-bold text-slate-900">
            {user.nombre_mostrar}
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800">
              Rol: {roleName}
            </span>

            <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
              Tipo: {user.tipo_cuenta === "cliente" ? "Cliente" : "Empresa"}
            </span>

            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              Usuario: {user.nombre_usuario}
            </span>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <h3 className="font-bold text-slate-900">
              ¿Qué puede hacer este rol?
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              {roleSummary}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Módulos disponibles
          </h2>

          <p className="mt-1 text-slate-600">
            Todos los usuarios con rol {roleName} tienen estos mismos permisos.
          </p>
        </div>

        {modules.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">
              Sin módulos asignados
            </h3>

            <p className="mt-2 text-slate-600">
              Este rol todavía no tiene permisos configurados.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => {
              const details = getModuleDetails(roleName, module.key);

              return (
                <Link
                  key={module.key}
                  href={module.href}
                  className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <h3 className="text-xl font-bold text-slate-900">
                    {getTituloModulo(roleName, module.key, module.title)}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {module.description}
                  </p>

                  <div className="mt-4 rounded-2xl bg-green-50 p-4">
                    <p className="text-sm font-bold text-green-800">
                      Puede hacer:
                    </p>

                    <ul className="mt-2 space-y-2 text-sm text-green-700">
                      {details.can.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>

                  {details.cannot.length > 0 && (
                    <div className="mt-4 rounded-2xl bg-red-50 p-4">
                      <p className="text-sm font-bold text-red-800">
                        No puede hacer:
                      </p>

                      <ul className="mt-2 space-y-2 text-sm text-red-700">
                        {details.cannot.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="mt-5 text-sm font-semibold text-blue-700">
                    Entrar →
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}