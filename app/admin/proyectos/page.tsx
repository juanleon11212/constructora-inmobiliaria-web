import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";
import { canDo } from "../../../lib/auth/permissions";
import {
  getProjectMedia,
  type ProjectMedia,
  saveProjectCover,
  validateProjectImage,
} from "../../../lib/project-media";

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
    return "/images/portfolio-vivienda-cover.webp";
  }

  return "/images/portfolio-comercial-cover.webp";
}

function getProgressPercentage(
  media: ProjectMedia,
  estado: string | null | undefined
) {
  if (estado === "terminado" || estado === "finalizado") {
    return 100;
  }

  return media.progress[0]?.percentage ?? 0;
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
  let coverImage: File | null = null;

  try {
    coverImage = validateProjectImage(formData.get("imagen_principal"));
  } catch {
    redirect("/admin/proyectos?modo=crear&error=imagen");
  }

  if (
    !nombre_proyecto ||
    !ubicacion ||
    !fecha_inicio ||
    !fecha_fin_estimada ||
    !id_cliente
  ) {
    redirect("/admin/proyectos?modo=crear&error=datos-obligatorios");
  }

  const createdProject = await prisma.proyecto.create({
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

  if (coverImage) {
    await saveProjectCover(createdProject.id_proyecto, coverImage);
  }

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
  const projectMedia = new Map(
    await Promise.all(
      proyectos.map(async (proyecto) => [
        proyecto.id_proyecto,
        await getProjectMedia(proyecto.id_proyecto),
      ] as const)
    )
  );
  const proyectosEnEjecucion = proyectos.filter(
    (proyecto) => proyecto.estado === "en_ejecucion"
  ).length;
  const proyectosTerminados = proyectos.filter(
    (proyecto) =>
      proyecto.estado === "terminado" || proyecto.estado === "finalizado"
  ).length;
  const avancesRegistrados = Array.from(projectMedia.values()).reduce(
    (total, media) => total + media.progress.length,
    0
  );

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-fixed p-3 sm:p-6"
      style={{
        backgroundImage:
          "linear-gradient(110deg, rgba(2,12,32,0.92) 0%, rgba(8,36,79,0.84) 38%, rgba(15,23,42,0.6) 100%), url('/images/portfolio-proyectos-background.webp')",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] border border-white/20 bg-blue-950/40 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-md sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="text-white drop-shadow">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-200">
                Gestión de obras
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
                {isCliente ? "Mis proyectos" : "Proyectos"}
              </h1>

              <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-blue-100 sm:text-base">
                Consulta la información completa de cada obra, su ubicación,
                fechas, estado y registro fotográfico de avance.
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
                Crear nuevo proyecto
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

           <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Obras visibles", value: proyectos.length },
              { label: "En ejecución", value: proyectosEnEjecucion },
              { label: "Finalizadas", value: proyectosTerminados },
              { label: "Avances con foto", value: avancesRegistrados },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur"
              >
                <p className="text-3xl font-extrabold text-white">
                  {item.value}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {params?.error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-bold text-red-700 shadow-lg backdrop-blur">
            {params.error === "datos-obligatorios" &&
              "Nombre, cliente, ubicación, fecha de inicio y fecha estimada son obligatorios."}
            {params.error === "imagen" &&
              "La imagen debe ser JPG, PNG o WEBP y no superar los 5 MB."}
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

              <label className="rounded-2xl border border-dashed border-white/70 bg-white/20 p-5 text-white md:col-span-2">
                <span className="block text-sm font-extrabold">
                  Imagen inicial del proyecto
                </span>
                <span className="mb-3 mt-1 block text-xs font-medium text-blue-100">
                  Muestra cómo se encuentra la obra al registrarla. JPG, PNG o WEBP, máximo 5 MB.
                </span>
                <input
                  type="file"
                  name="imagen_principal"
                  accept="image/jpeg,image/png,image/webp"
                  className="block w-full rounded-xl bg-white/90 p-3 text-sm font-bold text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2 file:font-bold file:text-white"
                />
              </label>

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

        <section className="mt-6 rounded-[2rem] border border-white/20 bg-white/90 p-6 shadow-2xl shadow-slate-950/25 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700">
                Proyectos registrados
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                {search
                  ? "Resultados de búsqueda"
                  : "Obras registradas"}
              </h2>

              <p className="mt-2 text-sm font-medium text-slate-600">
                {search
                  ? `Buscando: "${search}"`
                  : "Selecciona un proyecto para consultar imágenes, avances e información completa."}
              </p>
            </div>

            <span className="rounded-full bg-blue-950 px-5 py-2.5 text-sm font-extrabold text-white shadow">
              {proyectos.length} proyectos
            </span>
          </div>
        </section>

        {proyectos.length > 0 ? (
          <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {proyectos.map((proyecto) => {
              const clienteNombre =
                clienteMap.get(proyecto.id_cliente) ??
                `Cliente ${proyecto.id_cliente}`;
              const media = projectMedia.get(proyecto.id_proyecto) ?? {
                progress: [],
              };
              const progressPercentage = getProgressPercentage(
                media,
                proyecto.estado
              );
              const imagenProyecto =
                media.coverImage ?? getProyectoImagen(proyecto);

              return (
                <article
                  key={proyecto.id_proyecto}
                  className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/40 bg-white shadow-2xl shadow-slate-950/20 transition duration-300 hover:-translate-y-1.5 hover:shadow-blue-950/30"
                >
                  <div className="relative h-64 overflow-hidden bg-blue-950">
                    <Image
                      src={imagenProyecto}
                      alt={proyecto.nombre_proyecto}
                      fill
                      sizes="(min-width: 1280px) 31vw, (min-width: 768px) 46vw, 100vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/20 to-transparent" />

                    <span
                      className={`absolute right-5 top-5 rounded-full px-3 py-1.5 text-xs font-extrabold shadow ${getEstadoClass(
                        proyecto.estado
                      )}`}
                    >
                      {getEstadoLabel(proyecto.estado)}
                    </span>

                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-blue-100">
                        Imagen del proyecto
                      </p>
                      <h3 className="mt-2 text-2xl font-extrabold leading-tight text-white">
                        {proyecto.nombre_proyecto}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <p className="mt-3 text-sm font-medium leading-6 text-slate-700">
                      {proyecto.descripcion ||
                        "Proyecto de construcción orientado a crear espacios seguros, cómodos y funcionales."}
                    </p>

                    <div className="mt-5 grid gap-3 text-sm">
                      <div className="rounded-xl bg-slate-50 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Cliente
                        </p>
                        <p className="mt-1 font-bold text-slate-900">
                          {clienteNombre}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Ubicación
                        </p>
                        <p className="mt-1 font-bold text-slate-900">
                          {proyecto.ubicacion ?? "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm font-bold text-slate-800">
                      <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-blue-700">
                          Inicio
                        </p>
                        <p className="mt-1">{formatDate(proyecto.fecha_inicio)}</p>
                      </div>

                      <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-blue-700">
                          Entrega estimada
                        </p>
                        <p className="mt-1">
                          {formatDate(proyecto.fecha_fin_estimada)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-blue-950 p-4 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                          Avance registrado
                        </p>
                        <p className="text-lg font-extrabold">
                          {progressPercentage}%
                        </p>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <p className="mt-3 text-xs font-semibold text-blue-100">
                        {media.progress.length} avances fotográficos registrados
                      </p>
                    </div>

                    <div className="mt-auto flex flex-wrap gap-3 pt-6">
                      <Link
                        href={`/admin/proyectos/${proyecto.id_proyecto}`}
                        className="flex-1 rounded-xl bg-blue-700 px-4 py-3 text-center text-sm font-extrabold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-950"
                      >
                        Ver detalles
                      </Link>

                      {canEditProject && (
                        <Link
                          href={`/admin/proyectos/${proyecto.id_proyecto}?modo=editar`}
                          className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm font-extrabold text-blue-900 transition hover:bg-blue-100"
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
