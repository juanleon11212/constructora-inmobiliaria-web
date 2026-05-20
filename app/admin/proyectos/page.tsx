import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";
import { canDo } from "../../../lib/auth/permissions";

/*
  MÓDULO PROYECTOS

  Ruta:
  /admin/proyectos

  Funcionalidades:
  - Muestra proyectos en tarjetas.
  - Cada proyecto tiene una imagen.
  - Permite buscar proyectos.
  - Permite crear proyectos.
  - Permite entrar al detalle de cada proyecto.
  - El cliente solo ve sus propios proyectos.
*/

type PageProps = {
  searchParams?: Promise<{
    modo?: string;
    q?: string;
    error?: string;
  }>;
};

function getText(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function getRoleName(user: { rol: unknown }) {
  if (typeof user.rol === "string") return user.rol;

  if (
    user.rol &&
    typeof user.rol === "object" &&
    "nombre_rol" in user.rol
  ) {
    return String(
      (user.rol as { nombre_rol?: string | null }).nombre_rol ?? ""
    );
  }

  return "";
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toISOString().slice(0, 10);
}

function getEstadoLabel(estado: string | null | undefined) {
  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    en_ejecucion: "En ejecución",
    terminado: "Terminado",
    cancelado: "Cancelado",
    eliminado: "Eliminado",
  };

  return labels[estado ?? ""] ?? "Sin estado";
}

function getEstadoClass(estado: string | null | undefined) {
  if (estado === "terminado") return "bg-emerald-100 text-emerald-800";
  if (estado === "en_ejecucion") return "bg-blue-100 text-blue-800";
  if (estado === "cancelado") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

/*
  Imagen ilustrativa.
  No necesita descargar archivos.
*/
function ProjectImage({ index }: { index: number }) {
  const fondos = [
    "from-blue-500 to-cyan-300",
    "from-emerald-500 to-lime-300",
    "from-amber-500 to-orange-300",
    "from-violet-500 to-fuchsia-300",
  ];

  const fondo = fondos[index % fondos.length];

  return (
    <div
      className={`relative h-48 overflow-hidden rounded-3xl bg-gradient-to-br ${fondo}`}
    >
      <svg viewBox="0 0 420 260" className="absolute inset-0 h-full w-full">
        <circle cx="330" cy="55" r="32" fill="rgba(255,255,255,0.75)" />

        <rect
          x="70"
          y="125"
          width="250"
          height="90"
          rx="14"
          fill="rgba(255,255,255,0.92)"
        />

        <path d="M45 130 L195 45 L345 130 Z" fill="rgba(30,41,59,0.92)" />

        <rect
          x="112"
          y="155"
          width="52"
          height="60"
          rx="6"
          fill="rgba(37,99,235,0.85)"
        />

        <rect
          x="205"
          y="155"
          width="72"
          height="42"
          rx="8"
          fill="rgba(14,165,233,0.75)"
        />

        <line
          x1="241"
          y1="155"
          x2="241"
          y2="197"
          stroke="white"
          strokeWidth="4"
        />

        <line
          x1="205"
          y1="176"
          x2="277"
          y2="176"
          stroke="white"
          strokeWidth="4"
        />

        <rect
          x="285"
          y="82"
          width="32"
          height="55"
          rx="6"
          fill="rgba(51,65,85,0.9)"
        />

        <path
          d="M40 222 C85 205 125 236 175 218 C232 198 270 236 330 217 C360 208 384 214 405 223 L405 260 L40 260 Z"
          fill="rgba(15,23,42,0.16)"
        />
      </svg>
    </div>
  );
}

/*
  CREAR PROYECTO
*/
async function crearProyecto(formData: FormData) {
  "use server";

  const user = await requireModule("proyectos");
  const roleName = getRoleName(user);

  if (!canDo(roleName, "proyectos", "create")) {
    redirect("/admin/proyectos");
  }

  const nombre_proyecto = getText(formData, "nombre_proyecto");
  const descripcion = getText(formData, "descripcion");
  const ubicacion = getText(formData, "ubicacion");
  const fecha_inicio = getText(formData, "fecha_inicio");
  const fecha_fin_estimada = getText(formData, "fecha_fin_estimada");
  const estado = getText(formData, "estado") || "pendiente";
  const id_cliente = Number(formData.get("id_cliente"));

  if (
    !nombre_proyecto ||
    !ubicacion ||
    !fecha_inicio ||
    !fecha_fin_estimada ||
    !id_cliente
  ) {
    redirect("/admin/proyectos?modo=crear&error=datos-obligatorios");
  }

  await prisma.proyecto.create({
    data: {
      nombre_proyecto,
      descripcion: descripcion || null,
      ubicacion,
      fecha_inicio: new Date(fecha_inicio),
      fecha_fin_estimada: new Date(fecha_fin_estimada),
      fecha_fin_real: null,
      estado,
      id_cliente,
      id_usuario_registro: user.id_usuario ?? null,
    },
  });

  revalidatePath("/admin/proyectos");
  redirect("/admin/proyectos");
}

export default async function ProyectosPage({ searchParams }: PageProps) {
  const user = await requireModule("proyectos");
  const params = await searchParams;

  const roleName = getRoleName(user);
  const isCliente = roleName === "Cliente";
  const idClienteLogueado = user.id_cliente ?? 0;

  const modo = params?.modo ?? "";
  const search = String(params?.q ?? "").trim();

  const canCreateProject = canDo(roleName, "proyectos", "create");
  const canEditProject = canDo(roleName, "proyectos", "edit");

  const baseWhere = isCliente
    ? {
        id_cliente: idClienteLogueado,
        estado: {
          not: "eliminado",
        },
      }
    : {
        estado: {
          not: "eliminado",
        },
      };

  const proyectosWhere = search
    ? {
        AND: [
          baseWhere,
          {
            OR: [
              { nombre_proyecto: { contains: search } },
              { ubicacion: { contains: search } },
              { estado: { contains: search } },
              { descripcion: { contains: search } },
            ],
          },
        ],
      }
    : baseWhere;

  const [proyectos, clientes] = await Promise.all([
    prisma.proyecto.findMany({
      where: proyectosWhere,
      orderBy: {
        id_proyecto: "desc",
      },
    }),

    prisma.cliente.findMany({
      orderBy: {
        id_cliente: "asc",
      },
    }),
  ]);

  const clienteMap = new Map(
    clientes.map((cliente) => [
      cliente.id_cliente,
      cliente.razon_social ||
        `${cliente.nombres ?? ""} ${cliente.apellidos ?? ""}`.trim() ||
        `Cliente ${cliente.id_cliente}`,
    ])
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Módulo Proyectos
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              {isCliente ? "Mis proyectos" : "Proyectos"}
            </h1>

            <p className="mt-1 text-slate-600">
              Visualiza proyectos en tarjetas, revisa detalles e imágenes.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            Volver al panel
          </Link>
        </div>

        <section className="mt-6 flex flex-wrap gap-3">
          {canCreateProject && (
            <Link
              href="/admin/proyectos?modo=crear"
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
            >
              Crear proyecto
            </Link>
          )}

          <Link
            href="/admin/proyectos?modo=buscar"
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Buscar proyecto
          </Link>

          {(modo === "crear" || modo === "buscar" || search) && (
            <Link
              href="/admin/proyectos"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              Limpiar vista
            </Link>
          )}
        </section>

        {params?.error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error === "datos-obligatorios" &&
              "Nombre, cliente, ubicación, fecha de inicio y fecha estimada son obligatorios."}
          </div>
        )}

        {modo === "buscar" && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Buscar proyecto
            </h2>

            <form
              action="/admin/proyectos"
              method="get"
              className="mt-5 flex flex-col gap-4 md:flex-row"
            >
              <input type="hidden" name="modo" value="buscar" />

              <input
                name="q"
                defaultValue={search}
                placeholder="Buscar por nombre, ubicación, estado..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />

              <button
                type="submit"
                className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Buscar
              </button>
            </form>
          </section>
        )}

        {canCreateProject && modo === "crear" && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Crear nuevo proyecto
            </h2>

            <form
              action={crearProyecto}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input
                name="nombre_proyecto"
                placeholder="Nombre del proyecto *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <select
                name="id_cliente"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Selecciona cliente *</option>

                {clientes.map((cliente) => (
                  <option key={cliente.id_cliente} value={cliente.id_cliente}>
                    {clienteMap.get(cliente.id_cliente)}
                  </option>
                ))}
              </select>

              <input
                name="ubicacion"
                placeholder="Ubicación *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <select
                name="estado"
                defaultValue="pendiente"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_ejecucion">En ejecución</option>
                <option value="terminado">Terminado</option>
                <option value="cancelado">Cancelado</option>
              </select>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha de inicio *
                </label>

                <input
                  type="date"
                  name="fecha_inicio"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha fin estimada *
                </label>

                <input
                  type="date"
                  name="fecha_fin_estimada"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <textarea
                name="descripcion"
                placeholder="Descripción del proyecto"
                rows={4}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-2"
              />

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Guardar proyecto
                </button>

                <Link
                  href="/admin/proyectos"
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </section>
        )}

        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {search ? "Resultados de búsqueda" : "Proyectos registrados"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? `Buscando: "${search}"`
                  : "Haz clic en Ver proyecto para entrar al detalle."}
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              Total: {proyectos.length}
            </span>
          </div>
        </section>

        {proyectos.length > 0 ? (
          <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {proyectos.map((proyecto, index) => {
              const clienteNombre =
                clienteMap.get(proyecto.id_cliente) ??
                `Cliente ${proyecto.id_cliente}`;

              return (
                <article
                  key={proyecto.id_proyecto}
                  className="overflow-hidden rounded-[2rem] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="p-4">
                    <ProjectImage index={index} />
                  </div>

                  <div className="p-6 pt-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                          Proyecto #{proyecto.id_proyecto}
                        </p>

                        <h3 className="mt-2 text-xl font-bold text-slate-900">
                          {proyecto.nombre_proyecto}
                        </h3>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getEstadoClass(
                          proyecto.estado
                        )}`}
                      >
                        {getEstadoLabel(proyecto.estado)}
                      </span>
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {proyecto.descripcion ||
                        "Proyecto de construcción orientado a brindar espacios cómodos, seguros y funcionales para el cliente."}
                    </p>

                    <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Cliente
                        </p>
                        <p className="font-semibold text-slate-800">
                          {clienteNombre}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Ubicación
                        </p>
                        <p className="font-semibold text-slate-800">
                          {proyecto.ubicacion ?? "-"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Inicio
                          </p>
                          <p className="font-semibold text-slate-800">
                            {formatDate(proyecto.fecha_inicio)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Fin estimado
                          </p>
                          <p className="font-semibold text-slate-800">
                            {formatDate(proyecto.fecha_fin_estimada)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={`/admin/proyectos/${proyecto.id_proyecto}`}
                        className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                      >
                        Ver proyecto
                      </Link>

                      {canEditProject && (
                        <Link
                          href={`/admin/proyectos/${proyecto.id_proyecto}?modo=editar`}
                          className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Editar
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">
              No hay proyectos para mostrar
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "No se encontraron proyectos con ese criterio."
                : "Todavía no hay proyectos registrados."}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}