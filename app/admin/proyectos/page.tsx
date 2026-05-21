import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";
import { canDo } from "../../../lib/auth/permissions";

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
  if (estado === "en_ejecucion") return "bg-sky-100 text-sky-800";
  if (estado === "cancelado") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

function getProyectoImagen(proyecto: {
  nombre_proyecto?: string | null;
  descripcion?: string | null;
  ubicacion?: string | null;
}) {
  const texto = `${proyecto.nombre_proyecto ?? ""} ${
    proyecto.descripcion ?? ""
  } ${proyecto.ubicacion ?? ""}`.toLowerCase();

  if (
    texto.includes("vivienda") ||
    texto.includes("casa") ||
    texto.includes("familiar") ||
    texto.includes("hogar")
  ) {
    return "/images/proyecto-vivienda.jpg";
  }

  return "/images/proyecto-edificio.jpg";
}

const inputClass =
  "w-full rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none backdrop-blur placeholder:text-slate-500 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-200";

const selectClass =
  "w-full rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none backdrop-blur focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-200";

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
    <main
      className="min-h-screen bg-cover bg-center bg-fixed p-6"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(15,23,42,0.76) 0%, rgba(15,23,42,0.48) 38%, rgba(255,255,255,0.08) 100%), url('/images/proyectos-fondo.jpg')",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="text-white drop-shadow">
              <p className="text-sm font-bold text-blue-100">
                Módulo Proyectos
              </p>

              <h1 className="text-4xl font-extrabold tracking-tight">
                {isCliente ? "Mis proyectos" : "Proyectos"}
              </h1>

              <p className="mt-1 text-sm font-medium text-blue-100">
                Visualiza proyectos en tarjetas, revisa detalles e imágenes.
              </p>
            </div>

            <Link
              href="/admin"
              className="rounded-xl border border-white/40 bg-white/75 px-5 py-3 text-sm font-extrabold text-blue-900 shadow-xl shadow-slate-900/20 backdrop-blur transition hover:bg-white"
            >
              Volver al panel
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-3 lg:flex-row">
            {canCreateProject && (
              <Link
                href="/admin/proyectos?modo=crear"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-800 to-sky-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-950/30 transition hover:from-blue-950 hover:to-sky-700"
              >
                🏗️ Crear Nuevo Proyecto
              </Link>
            )}

            <form
              action="/admin/proyectos"
              method="get"
              className="flex flex-1 gap-2"
            >
              <input type="hidden" name="modo" value="buscar" />

              <input
                name="q"
                defaultValue={search}
                placeholder="Buscar Proyectos Registrados"
                className="flex-1 rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none backdrop-blur placeholder:text-slate-500 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-200"
              />

              <button
                type="submit"
                className="rounded-xl bg-white/80 px-5 py-3 text-sm font-extrabold text-slate-800 shadow-lg transition hover:bg-white"
              >
                Buscar
              </button>
            </form>

            {(modo === "crear" || modo === "buscar" || search) && (
              <Link
                href="/admin/proyectos"
                className="rounded-xl border border-white/40 bg-white/60 px-5 py-3 text-sm font-extrabold text-blue-900 shadow-lg backdrop-blur transition hover:bg-white"
              >
                Limpiar vista
              </Link>
            )}
          </div>
        </section>

        {params?.error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-bold text-red-700 shadow-lg backdrop-blur">
            {params.error === "datos-obligatorios" &&
              "Nombre, cliente, ubicación, fecha de inicio y fecha estimada son obligatorios."}
          </div>
        )}

        {canCreateProject && modo === "crear" && (
          <section className="mt-6 rounded-[28px] border border-white/40 bg-white/30 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
            <div className="mb-5">
              <h2 className="text-2xl font-extrabold text-white drop-shadow">
                Crear nuevo proyecto
              </h2>

              <p className="mt-1 text-sm font-bold text-blue-100">
                Registra un nuevo proyecto para la constructora.
              </p>
            </div>

            <form
              action={crearProyecto}
              className="grid gap-4 md:grid-cols-2"
            >
              <input
                name="nombre_proyecto"
                placeholder="Nombre del proyecto *"
                className={inputClass}
              />

              <select name="id_cliente" className={selectClass}>
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
                className={inputClass}
              />

              <select
                name="estado"
                defaultValue="pendiente"
                className={selectClass}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_ejecucion">En ejecución</option>
                <option value="terminado">Terminado</option>
                <option value="cancelado">Cancelado</option>
              </select>

              <div>
                <label className="mb-1 block text-sm font-extrabold text-white drop-shadow">
                  Fecha de inicio *
                </label>

                <input
                  type="date"
                  name="fecha_inicio"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-extrabold text-white drop-shadow">
                  Fecha fin estimada *
                </label>

                <input
                  type="date"
                  name="fecha_fin_estimada"
                  className={inputClass}
                />
              </div>

              <textarea
                name="descripcion"
                placeholder="Descripción del proyecto"
                rows={4}
                className={`${inputClass} md:col-span-2`}
              />

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-blue-800 to-sky-600 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/30 transition hover:from-blue-950 hover:to-sky-700"
                >
                  Guardar proyecto
                </button>

                <Link
                  href="/admin/proyectos"
                  className="rounded-xl border border-white/40 bg-white/70 px-5 py-3 text-sm font-extrabold text-blue-900 shadow-lg transition hover:bg-white"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </section>
        )}

        <section className="mt-6 rounded-[28px] border border-white/40 bg-white/30 p-5 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-950">
                {search
                  ? "Resultados de búsqueda"
                  : "Portafolio de Proyectos Registrados"}
              </h2>

              <p className="mt-1 text-sm font-bold text-slate-700">
                {search
                  ? `Buscando: "${search}"`
                  : "Haz clic en Ver Detalles para entrar al proyecto."}
              </p>
            </div>

            <span className="rounded-full bg-slate-200/80 px-4 py-2 text-sm font-extrabold text-slate-700 shadow">
              Total: {proyectos.length}
            </span>
          </div>
        </section>

        {proyectos.length > 0 ? (
          <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {proyectos.map((proyecto) => {
              const clienteNombre =
                clienteMap.get(proyecto.id_cliente) ??
                `Cliente ${proyecto.id_cliente}`;

              const imagenProyecto = getProyectoImagen(proyecto);

              return (
                <article
                  key={proyecto.id_proyecto}
                  className="overflow-hidden rounded-[28px] border border-white/50 bg-white/65 shadow-2xl shadow-slate-950/25 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/75"
                >
                  <div className="relative h-52 overflow-hidden p-3">
                    <img
                      src={imagenProyecto}
                      alt={proyecto.nombre_proyecto}
                      className="h-full w-full rounded-2xl object-cover shadow-lg"
                    />

                    <div className="absolute inset-3 rounded-2xl bg-gradient-to-t from-slate-950/45 via-slate-900/10 to-transparent" />

                    <span
                      className={`absolute right-6 top-6 rounded-full px-3 py-1 text-xs font-extrabold shadow ${getEstadoClass(
                        proyecto.estado
                      )}`}
                    >
                      {getEstadoLabel(proyecto.estado)}
                    </span>
                  </div>

                  <div className="p-5 pt-2">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-800">
                      Proyecto
                    </p>

                    <h3 className="mt-1 text-2xl font-extrabold leading-tight text-slate-950">
                      {proyecto.nombre_proyecto}
                    </h3>

                    <p className="mt-3 text-sm font-medium leading-6 text-slate-700">
                      {proyecto.descripcion ||
                        "Proyecto de construcción orientado a brindar espacios cómodos, seguros y funcionales para el cliente."}
                    </p>

                    <div className="mt-4 space-y-3 text-sm font-bold text-slate-800">
                      <p>🏢 {clienteNombre}</p>
                      <p>📍 {proyecto.ubicacion ?? "-"}</p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold text-slate-800">
                      <div className="rounded-xl bg-white/70 px-3 py-2 shadow">
                        📅 {formatDate(proyecto.fecha_inicio)}
                      </div>

                      <div className="rounded-xl bg-white/70 px-3 py-2 shadow">
                        🗓️ {formatDate(proyecto.fecha_fin_estimada)}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={`/admin/proyectos/${proyecto.id_proyecto}`}
                        className="flex-1 rounded-xl bg-white/80 px-4 py-3 text-center text-sm font-extrabold text-slate-800 shadow transition hover:bg-white"
                      >
                        👁 Ver Detalles
                      </Link>

                      {canEditProject && (
                        <Link
                          href={`/admin/proyectos/${proyecto.id_proyecto}?modo=editar`}
                          className="flex-1 rounded-xl bg-white/80 px-4 py-3 text-center text-sm font-extrabold text-blue-900 shadow transition hover:bg-white"
                        >
                          ✏ Editar Proyecto
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="mt-6 rounded-[28px] border border-white/40 bg-white/65 p-8 text-center shadow-2xl shadow-slate-950/25 backdrop-blur-md">
            <h3 className="text-xl font-extrabold text-slate-950">
              No hay proyectos para mostrar
            </h3>

            <p className="mt-2 text-sm font-semibold text-slate-600">
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