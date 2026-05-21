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

const moduleImages: Partial<Record<AppModule, string>> = {
  clientes: "/images/clientes.jpg",
  empleados: "/images/empleados.jpg",
  proyectos: "/images/proyectos.jpg",
  materiales: "/images/materiales.jpg",
  pagos: "/images/pagos.jpg",
  reportes: "/images/reportes.jpg",
  usuarios: "/images/usuarios.jpg",
};

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const roleName = getRoleName(user);
  const modules = getModulesByRole(roleName);
  const roleSummary = getRoleSummary(roleName);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-100">
      <header className="border-b border-blue-900 bg-gradient-to-r from-blue-950 via-blue-900 to-sky-800 text-white shadow-lg shadow-blue-950/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-blue-100">
              Panel del sistema
            </p>

            <h1 className="text-2xl font-extrabold text-white">
              Constructora e Inmobiliaria
            </h1>
          </div>

          <LogoutButton />
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-blue-100/70">
          <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-sky-700 px-6 py-8 text-white">
            <p className="text-sm font-semibold text-blue-100">Bienvenido</p>

            <h2 className="mt-1 text-4xl font-extrabold tracking-tight text-white">
              {user.nombre_mostrar}
            </h2>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                Rol: {roleName}
              </span>

              <span className="rounded-full bg-sky-300/20 px-4 py-2 text-sm font-bold text-blue-50 backdrop-blur">
                Tipo: {user.tipo_cuenta === "cliente" ? "Cliente" : "Empresa"}
              </span>

              <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                Usuario: {user.nombre_usuario}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <h3 className="font-extrabold text-blue-950">
                ¿Qué puede hacer este rol?
              </h3>

              <p className="mt-1 text-sm font-medium leading-6 text-blue-800">
                {roleSummary}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
            Accesos del sistema
          </p>

          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-blue-950">
            Módulos disponibles
          </h2>

          <p className="mt-2 text-base font-medium text-slate-600">
            Todos los usuarios con rol {roleName} tienen estos mismos permisos.
          </p>
        </div>

        {modules.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/70">
            <h3 className="text-xl font-extrabold text-blue-950">
              Sin módulos asignados
            </h3>

            <p className="mt-2 text-slate-600">
              Este rol todavía no tiene permisos configurados.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => {
              const details = getModuleDetails(roleName, module.key);
              const imageUrl =
                moduleImages[module.key] ?? "/images/login-construccion.jpg.png";

              return (
                <Link
                  key={module.key}
                  href={module.href}
                  className="group overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-blue-100/70 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-200/80"
                >
                  <div
                    className="h-40 bg-cover bg-center"
                    style={{
                      backgroundImage: `url('${imageUrl}')`,
                    }}
                  >
                    <div className="flex h-full items-end bg-gradient-to-t from-blue-950/90 via-blue-900/45 to-transparent p-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-200">
                          Módulo
                        </p>

                        <h3 className="mt-1 text-2xl font-extrabold text-white">
                          {getTituloModulo(roleName, module.key, module.title)}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-sm font-medium leading-6 text-slate-600">
                      {module.description}
                    </p>
               

                    <p className="mt-5 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-700/25 transition group-hover:bg-blue-900">
                      Entrar →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}