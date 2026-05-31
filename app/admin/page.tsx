import { redirect } from "next/navigation";
import { ModuleCommandCenter } from "../../components/admin/ModuleCommandCenter";
import { LogoutButton } from "../../components/auth/LogoutButton";
import { getCurrentUser } from "../../lib/auth/current-user";
import {
  AppAction,
  AppModule,
  canDo,
  getModuleDetails,
  getModulesByRole,
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
    .map((action) => {
      if (roleName === "Recursos Humanos" && key === "empleados") {
        if (action === "create") return "Contratar";
        if (action === "edit") return "Editar empleados";
      }

      return actionLabels[action];
    });

  return actions.length > 0 ? actions : ["Acceso disponible"];
}

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const roleName = getRoleName(user);
  const modules = getModulesByRole(roleName);
  const showLogsModule = roleName === "Administrador";
  const visibleModules = modules.length + (showLogsModule ? 1 : 0);
  const moduleCards = [
    ...modules.map((module) => {
      const details = getModuleDetails(roleName, module.key);

      return {
        key: module.key,
        href: module.href,
        title: getTituloModulo(roleName, module.key, module.title),
        description: module.description,
        visual: moduleVisuals[module.key],
        actions: getFeaturedActions(roleName, module.key),
        canCount: details.can.length,
        cannotCount: details.cannot.length,
      };
    }),
    ...(showLogsModule
      ? [
          {
            key: "logs",
            href: "/admin/logs",
            title: "Logs del sistema",
            description:
              "Consulta ingresos, ediciones y acciones realizadas por usuarios dentro del sistema.",
            visual: {
              area: "Auditoria",
              image: "/images/dashboard-auditoria-card.webp",
              alt: "Especialista supervisando auditoría y seguridad del sistema.",
            },
            actions: ["Consultar eventos", "Revisar actividad", "Supervisar"],
            canCount: 3,
            cannotCount: 0,
          },
        ]
      : []),
  ];

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
        </div>

        {moduleCards.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/70">
            <h3 className="text-xl font-extrabold text-blue-950">
              Sin módulos asignados
            </h3>

            <p className="mt-2 text-slate-600">
              Este rol todavía no tiene permisos configurados.
            </p>
          </div>
        ) : (
          <ModuleCommandCenter
            modules={moduleCards}
            visibleModules={visibleModules}
            roleName={roleName}
          />
        )}
      </section>
    </main>
  );
}
