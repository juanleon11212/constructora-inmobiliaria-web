import { redirect } from "next/navigation";
import { ModuleCommandCenter } from "../../components/admin/ModuleCommandCenter";
import { LogoutButton } from "../../components/auth/LogoutButton";
import { getCurrentUser } from "../../lib/auth/current-user";
import { prisma } from "../../lib/prisma";
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
  const isCliente = roleName === "Cliente";
  const idCliente = user.id_cliente ?? 0;

  const modules = getModulesByRole(roleName);
  const showLogsModule = roleName === "Administrador";
  // Fetch real data for client users
  let clienteProyectoStats: { label: string; value: string }[] | undefined;
  let clienteProyectoRows: { headers: string[]; rows: string[][] } | undefined;
  let clientePagoStats: { label: string; value: string }[] | undefined;
  let clientePagoRows: { headers: string[]; rows: string[][] } | undefined;

  if (isCliente && idCliente > 0) {
    const estadoLabel: Record<string, string> = {
      pendiente: "Pendiente",
      en_ejecucion: "En ejecución",
      terminado: "Terminado",
      cancelado: "Cancelado",
    };

    // Proyectos reales
    const proyectosCliente = await prisma.proyecto.findMany({
      where: { id_cliente: idCliente, estado: { not: "eliminado" } },
      select: { id_proyecto: true, nombre_proyecto: true, estado: true, fecha_fin_estimada: true },
      orderBy: { id_proyecto: "desc" },
      take: 5,
    });

    const enEjecucion = proyectosCliente.filter((p) => p.estado === "en_ejecucion").length;
    const terminados = proyectosCliente.filter((p) => p.estado === "terminado").length;

    clienteProyectoStats = [
      { label: "Mis obras", value: String(proyectosCliente.length) },
      { label: "En ejecución", value: String(enEjecucion) },
      { label: "Finalizadas", value: String(terminados) },
    ];
    clienteProyectoRows = {
      headers: ["Proyecto", "Estado", "Entrega estimada"],
      rows: proyectosCliente.map((p) => [
        p.nombre_proyecto,
        estadoLabel[p.estado ?? ""] ?? p.estado ?? "-",
        p.fecha_fin_estimada
          ? new Date(p.fecha_fin_estimada).toLocaleDateString("es-BO", { month: "short", year: "numeric" })
          : "-",
      ]),
    };

    // Pagos reales del cliente (directos o por sus proyectos)
    const idsProyectos = proyectosCliente.map((p) => p.id_proyecto);
    const pagosCliente = await prisma.pago.findMany({
      where: {
        OR: [
          { id_cliente: idCliente },
          { id_proyecto: { in: idsProyectos } },
        ],
      },
      orderBy: { id_pago: "desc" },
      take: 3,
    });

    const totalPagos = await prisma.pago.count({
      where: {
        OR: [{ id_cliente: idCliente }, { id_proyecto: { in: idsProyectos } }],
      },
    });

    const totalMonto = await prisma.pago.aggregate({
      where: {
        OR: [{ id_cliente: idCliente }, { id_proyecto: { in: idsProyectos } }],
      },
      _sum: { monto: true },
    });

    const montoTotal = Number(totalMonto._sum.monto ?? 0);
    const montoFormato =
      montoTotal >= 1000
        ? `Bs. ${Math.round(montoTotal / 1000)}K`
        : `Bs. ${montoTotal.toFixed(0)}`;

    clientePagoStats = [
      { label: "Total pagos", value: String(totalPagos) },
      { label: "Recientes", value: String(pagosCliente.length) },
      { label: "Monto total", value: montoFormato },
    ];
    clientePagoRows = {
      headers: ["Descripción", "Monto", "Método"],
      rows:
        pagosCliente.length > 0
          ? pagosCliente.map((p) => [
              p.descripcion ?? p.tipo_pago ?? "-",
              `Bs. ${Number(p.monto).toFixed(2)}`,
              p.metodo_pago ?? "-",
            ])
          : [["Sin pagos registrados", "-", "-"]],
    };
  }

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
        liveStats:
          isCliente && module.key === "proyectos"
            ? clienteProyectoStats
            : isCliente && module.key === "pagos"
            ? clientePagoStats
            : undefined,
        liveRows:
          isCliente && module.key === "proyectos"
            ? clienteProyectoRows
            : isCliente && module.key === "pagos"
            ? clientePagoRows
            : undefined,
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
            liveStats: undefined,
            liveRows: undefined,
          },
        ]
      : []),
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-100">
      <header className="border-b border-blue-900 bg-gradient-to-r from-blue-950 via-blue-900 to-sky-800 text-white shadow-lg shadow-blue-950/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <p className="text-xs font-semibold text-blue-200 sm:text-sm">
              Panel del sistema
            </p>

            <h1 className="text-lg font-extrabold text-white sm:text-2xl">
              Constructora e Inmobiliaria
            </h1>
          </div>

          <LogoutButton />
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl shadow-blue-100/70 sm:rounded-3xl">
          <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-sky-700 px-4 py-6 text-white sm:px-6 sm:py-8">
            <p className="text-xs font-semibold text-blue-200 sm:text-sm">Bienvenido</p>

            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              {user.nombre_mostrar}
            </h2>

            <div className="mt-4 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
              <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur sm:px-4 sm:py-2 sm:text-sm">
                Rol: {roleName}
              </span>

              <span className="rounded-full bg-sky-300/20 px-3 py-1.5 text-xs font-bold text-blue-50 backdrop-blur sm:px-4 sm:py-2 sm:text-sm">
                Tipo: {user.tipo_cuenta === "cliente" ? "Cliente" : "Empresa"}
              </span>

              <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur sm:px-4 sm:py-2 sm:text-sm">
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
            roleName={roleName}
          />
        )}
      </section>
    </main>
  );
}
