import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "../../components/auth/LogoutButton";
import { getCurrentUser } from "../../lib/auth/current-user";
import {
  AppAction,
  AppModule,
  canDo,
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

type ModuleVisual = {
  area: string;
  image: string;
  alt: string;
};

const moduleVisuals: Record<AppModule, ModuleVisual> = {
  clientes: {
    area: "Relaciones",
    image: "/images/dashboard-clientes-card.webp",
    alt: "Asesor de obra atendiendo a una cliente frente a planos.",
  },
  empleados: {
    area: "Equipo",
    image: "/images/dashboard-equipo-card.webp",
    alt: "Equipo de construcción coordinando actividades en una obra.",
  },
  proyectos: {
    area: "Obras",
    image: "/images/dashboard-proyectos-card.webp",
    alt: "Ingeniero supervisando la construcción de un edificio.",
  },
  materiales: {
    area: "Abastecimiento",
    image: "/images/dashboard-materiales-card.webp",
    alt: "Responsable de almacén recibiendo materiales de construcción.",
  },
  pagos: {
    area: "Finanzas",
    image: "/images/dashboard-pagos-card.webp",
    alt: "Profesional revisando pagos y documentos de construcción.",
  },
  reportes: {
    area: "Indicadores",
    image: "/images/dashboard-reportes-card.webp",
    alt: "Equipo analizando reportes de avance de construcción.",
  },
  usuarios: {
    area: "Accesos",
    image: "/images/dashboard-usuarios-card.webp",
    alt: "Administrador gestionando accesos del personal.",
  },
};

const actionOrder: AppAction[] = [
  "view",
  "purchase",
  "create",
  "edit",
  "assign",
  "report",
  "manage",
  "delete",
];

const actionLabels: Record<AppAction, string> = {
  view: "Consultar",
  create: "Registrar",
  edit: "Actualizar",
  delete: "Eliminar",
  manage: "Administrar",
  assign: "Asignar",
  purchase: "Orden y recepción",
  report: "Generar reporte",
};

function getFeaturedActions(roleName: string, key: AppModule) {
  const actions = actionOrder
    .filter((action) => canDo(roleName, key, action))
    .slice(0, 3)
    .map((action) => actionLabels[action]);

  return actions.length > 0 ? actions : ["Acceso disponible"];
}

type AccessCardProps = {
  href: string;
  title: string;
  description: string;
  visual: ModuleVisual;
  actions: string[];
};

function AccessCard({
  href,
  title,
  description,
  visual,
  actions,
}: AccessCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-lg shadow-blue-100/70 transition duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-200/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
    >
      <div className="relative h-56 shrink-0 overflow-hidden bg-blue-950">
        <Image
          src={visual.image}
          alt={visual.alt}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/35 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-6">
          <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-50 backdrop-blur-sm">
            {visual.area}
          </span>

          <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
            {title}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm font-medium leading-6 text-slate-600">
          {description}
        </p>

        <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-700">
          Acciones destacadas
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((action) => (
            <span
              key={action}
              className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800"
            >
              {action}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between pt-7">
          <span className="text-sm font-extrabold text-blue-800 transition group-hover:text-blue-950">
            Abrir módulo
          </span>

          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full bg-blue-700 text-xl font-bold text-white shadow-lg shadow-blue-700/25 transition group-hover:bg-blue-950"
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const roleName = getRoleName(user);
  const modules = getModulesByRole(roleName);
  const roleSummary = getRoleSummary(roleName);
  const showLogsModule = roleName === "Administrador";
  const visibleModules = modules.length + (showLogsModule ? 1 : 0);

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

        <div className="mt-10 overflow-hidden rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/60 md:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
                Centro de operaciones
              </p>

              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-blue-950 md:text-4xl">
                Elige una tarea para comenzar
              </h2>

              <p className="mt-3 text-base font-medium leading-7 text-slate-600">
                Explora las áreas disponibles para tu rol. Cada tarjeta
                muestra acciones destacadas que puedes realizar dentro del
                módulo.
              </p>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-3">
              <div className="min-w-32 rounded-2xl bg-blue-950 px-5 py-4 text-white">
                <p className="text-3xl font-extrabold">{visibleModules}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-blue-200">
                  Accesos activos
                </p>
              </div>

              <div className="min-w-32 rounded-2xl bg-sky-100 px-5 py-4 text-blue-950">
                <p className="truncate text-lg font-extrabold">{roleName}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-wide text-blue-700">
                  Perfil actual
                </p>
              </div>
            </div>
          </div>
        </div>

        {modules.length === 0 && !showLogsModule ? (
          <div className="mt-6 rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/70">
            <h3 className="text-xl font-extrabold text-blue-950">
              Sin módulos asignados
            </h3>

            <p className="mt-2 text-slate-600">
              Este rol todavía no tiene permisos configurados.
            </p>
          </div>
        ) : (
          <div className="mt-7 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <AccessCard
                key={module.key}
                href={module.href}
                title={getTituloModulo(roleName, module.key, module.title)}
                description={module.description}
                visual={moduleVisuals[module.key]}
                actions={getFeaturedActions(roleName, module.key)}
              />
            ))}

            {showLogsModule && (
              <AccessCard
                href="/admin/logs"
                title="Logs del sistema"
                description="Consulta ingresos, ediciones y acciones realizadas por usuarios dentro del sistema."
                visual={{
                  area: "Auditoría",
                  image: "/images/dashboard-auditoria-card.webp",
                  alt: "Especialista supervisando auditoría y seguridad del sistema.",
                }}
                actions={["Consultar eventos", "Revisar actividad", "Supervisar"]}
              />
            )}
          </div>
        )}
      </section>
    </main>
  );
}
