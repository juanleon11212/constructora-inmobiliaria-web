import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "../../components/auth/LogoutButton";
import { getCurrentUser } from "../../lib/auth/current-user";

const modules = [
  {
    title: "Clientes",
    description: "Administrar clientes registrados.",
    href: "/admin/clientes",
  },
  {
    title: "Proyectos",
    description: "Gestionar obras y proyectos.",
    href: "/admin/proyectos",
  },
  {
    title: "Empleados",
    description: "Controlar empleados y cargos.",
    href: "/admin/empleados",
  },
  {
    title: "Materiales",
    description: "Ver materiales e inventario.",
    href: "/admin/materiales",
  },
  {
    title: "Pagos",
    description: "Registrar y consultar pagos.",
    href: "/admin/pagos",
  },
  {
    title: "Reportes",
    description: "Resumen general del sistema.",
    href: "/admin/reportes",
  },
];

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Panel administrativo
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
            {user.empleado
              ? `${user.empleado.nombres} ${user.empleado.apellidos}`
              : user.nombre_usuario}
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800">
              Rol: {user.rol.nombre_rol}
            </span>

            <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
              Estado: {user.estado}
            </span>

            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              Usuario: {user.nombre_usuario}
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="text-xl font-bold text-slate-900">
                {module.title}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {module.description}
              </p>

              <p className="mt-5 text-sm font-semibold text-blue-700">
                Entrar →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}