import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "../../components/auth/LogoutButton";
import { getCurrentUser } from "../../lib/auth/current-user";

/*
  PANEL PRINCIPAL DEL SISTEMA

  Este archivo representa la página:
  /admin

  Aquí entra cualquier usuario autenticado.
  Pero si el rol es Administrador, verá todos los módulos.

  El administrador puede:
  - Gestionar clientes.
  - Gestionar empleados.
  - Gestionar proyectos.
  - Gestionar materiales.
  - Gestionar pagos.
  - Ver reportes.
  - Gestionar usuarios.
*/

/*
  Lista de módulos que puede ver el administrador.

  Cada objeto representa una tarjeta del panel:
  title       -> nombre del módulo
  description -> qué hace ese módulo
  href        -> a dónde te manda al hacer clic
  actions     -> resumen de lo que puede hacer el admin en ese módulo
*/
const adminModules = [
  {
    title: "Clientes",
    description: "Administrar clientes de la constructora.",
    href: "/admin/clientes",
    actions: [
      "Ver todos los clientes",
      "Crear clientes",
      "Editar clientes",
      "Ver proyectos del cliente",
    ],
  },
  {
    title: "Empleados",
    description: "Administrar empleados, cargos y personal interno.",
    href: "/admin/empleados",
    actions: [
      "Ver empleados",
      "Crear empleados",
      "Editar empleados",
      "Ver cargos",
    ],
  },
  {
    title: "Proyectos",
    description: "Gestionar obras y proyectos de construcción.",
    href: "/admin/proyectos",
    actions: [
      "Ver proyectos",
      "Crear proyectos",
      "Editar proyectos",
      "Asignar cliente",
    ],
  },
  {
    title: "Materiales",
    description: "Controlar materiales, inventario, almacenes y proveedores.",
    href: "/admin/materiales",
    actions: [
      "Ver materiales",
      "Registrar materiales",
      "Controlar inventario",
      "Ver proveedores",
    ],
  },
  {
    title: "Pagos",
    description: "Registrar y consultar pagos del sistema.",
    href: "/admin/pagos",
    actions: [
      "Ver pagos",
      "Registrar pagos",
      "Ver pagos de clientes",
      "Ver pagos de empleados",
    ],
  },
  {
    title: "Reportes",
    description: "Consultar reportes generales del sistema.",
    href: "/admin/reportes",
    actions: [
      "Reporte de clientes",
      "Reporte de proyectos",
      "Reporte de pagos",
      "Reporte de materiales",
    ],
  },
  {
    title: "Usuarios",
    description: "Administrar usuarios, roles y accesos.",
    href: "/admin/usuarios",
    actions: [
      "Ver usuarios",
      "Crear usuarios empresa",
      "Asignar roles",
      "Activar o desactivar cuentas",
    ],
  },
];

export default async function AdminPage() {
  /*
    Obtiene el usuario que inició sesión.

    Puede ser:
    - usuario empresa
    - cliente

    Si no hay sesión, lo manda al login.
  */
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  /*
    Nombre del rol actual.
    Ejemplo:
    Administrador, Encargado de Obra, Almacen, Contabilidad, Cliente, etc.
  */
  const roleName = user.rol?.nombre_rol ?? "Sin rol";

  /*
    Aquí verificamos si es administrador.
    El administrador verá todos los módulos.
  */
  const isAdmin = roleName === "Administrador";

  /*
    Si NO es administrador, por ahora mostramos mensaje.
    Luego cada rol tendrá su propio menú filtrado.
  */
  const modulesToShow = isAdmin ? adminModules : [];

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Barra superior */}
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
        {/* Tarjeta de bienvenida */}
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
        </div>

        {/* Si es administrador, muestra todos los módulos */}
        {isAdmin && (
          <>
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-slate-900">
                Módulos del administrador
              </h2>

              <p className="mt-1 text-slate-600">
                Desde aquí puedes administrar todas las áreas del sistema.
              </p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {modulesToShow.map((module) => (
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

                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    {module.actions.map((action) => (
                      <li key={action}>• {action}</li>
                    ))}
                  </ul>

                  <p className="mt-5 text-sm font-semibold text-blue-700">
                    Entrar →
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Si no es administrador, todavía no mostramos todos aquí */}
        {!isAdmin && (
          <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Acceso limitado
            </h2>

            <p className="mt-2 text-slate-600">
              Tu rol no es Administrador. El sistema debe mostrarte solo los
              módulos correspondientes a tu rol.
            </p>

            <p className="mt-4 text-sm text-slate-500">
              Rol actual: {roleName}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}