import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../../lib/prisma";
import { requireModule } from "../../../../lib/auth/require-permission";
import { canDo } from "../../../../lib/auth/permissions";

/*
  DETALLE DE PROYECTO

  Ruta:
  /admin/proyectos/[id]

  Correcciones:
  - El administrador puede editar.
  - El administrador puede marcar como terminado.
  - Al guardar cambios NO manda fecha_fin_real null.
  - Si el estado es terminado, asigna fecha_fin_real automáticamente.
  - Cliente solo puede ver sus propios proyectos.
*/

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    modo?: string;
    error?: string;
  }>;
};

function getText(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

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
      (user.rol as { nombre_rol?: string | null }).nombre_rol ?? ""
    );
  }

  return "";
}

function isAdminRole(roleName: string) {
  const normalized = roleName.toLowerCase();

  return (
    normalized === "administrador" ||
    normalized === "admin" ||
    normalized.includes("admin")
  );
}

function canEditProjects(roleName: string) {
  return isAdminRole(roleName) || canDo(roleName, "proyectos", "edit");
}

function formatDateText(value: Date | string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toISOString().slice(0, 10);
}

function formatDateInput(value: Date | string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function parseDateOrNull(value: string) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getEstadoLabel(estado: string | null | undefined) {
  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    en_ejecucion: "En ejecución",
    terminado: "Terminado",
    cancelado: "Cancelado",
    eliminado: "Eliminado",
  };

  return labels[estado ?? ""] ?? estado ?? "Sin estado";
}

function getEstadoClass(estado: string | null | undefined) {
  if (estado === "terminado") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (estado === "en_ejecucion") {
    return "bg-blue-100 text-blue-800";
  }

  if (estado === "cancelado") {
    return "bg-red-100 text-red-800";
  }

  return "bg-amber-100 text-amber-800";
}

function ProjectGalleryImage({
  title,
  index,
}: {
  title: string;
  index: number;
}) {
  const fondos = [
    "from-blue-600 to-cyan-300",
    "from-emerald-600 to-lime-300",
    "from-amber-600 to-orange-300",
  ];

  const fondo = fondos[index % fondos.length];

  return (
    <div
      className={`relative h-64 overflow-hidden rounded-[2rem] bg-gradient-to-br ${fondo}`}
    >
      <svg viewBox="0 0 480 300" className="absolute inset-0 h-full w-full">
        <circle cx="390" cy="58" r="34" fill="rgba(255,255,255,0.75)" />

        <rect
          x="82"
          y="140"
          width="300"
          height="105"
          rx="16"
          fill="rgba(255,255,255,0.92)"
        />

        <path d="M55 148 L232 50 L410 148 Z" fill="rgba(15,23,42,0.9)" />

        <rect
          x="125"
          y="175"
          width="60"
          height="70"
          rx="7"
          fill="rgba(37,99,235,0.85)"
        />

        <rect
          x="235"
          y="175"
          width="85"
          height="50"
          rx="8"
          fill="rgba(14,165,233,0.75)"
        />

        <line
          x1="277"
          y1="175"
          x2="277"
          y2="225"
          stroke="white"
          strokeWidth="4"
        />

        <line
          x1="235"
          y1="200"
          x2="320"
          y2="200"
          stroke="white"
          strokeWidth="4"
        />

        <path
          d="M40 255 C100 230 145 268 205 248 C270 225 315 266 380 245 C420 233 445 245 470 256 L470 300 L40 300 Z"
          fill="rgba(15,23,42,0.18)"
        />
      </svg>

      <div className="absolute bottom-4 left-4 rounded-2xl bg-white/90 px-4 py-2 text-sm font-bold text-slate-900">
        {title}
      </div>
    </div>
  );
}

/*
  GUARDAR CAMBIOS DEL PROYECTO
*/
async function actualizarProyecto(formData: FormData) {
  "use server";

  const user = await requireModule("proyectos");
  const roleName = getRoleName(user);

  if (!canEditProjects(roleName)) {
    redirect("/admin/proyectos");
  }

  const id_proyecto = Number(formData.get("id_proyecto"));

  if (!id_proyecto || Number.isNaN(id_proyecto)) {
    redirect("/admin/proyectos");
  }

  const nombre_proyecto = getText(formData, "nombre_proyecto");
  const descripcion = getText(formData, "descripcion");
  const ubicacion = getText(formData, "ubicacion");
  const estado = getText(formData, "estado");
  const fecha_inicio_text = getText(formData, "fecha_inicio");
  const fecha_fin_estimada_text = getText(formData, "fecha_fin_estimada");
  const fecha_fin_real_text = getText(formData, "fecha_fin_real");

  if (!nombre_proyecto || !ubicacion || !estado) {
    redirect(`/admin/proyectos/${id_proyecto}?modo=editar&error=datos`);
  }

  const fecha_inicio = parseDateOrNull(fecha_inicio_text);
  const fecha_fin_estimada = parseDateOrNull(fecha_fin_estimada_text);
  const fecha_fin_real = parseDateOrNull(fecha_fin_real_text);

  if (!fecha_inicio || !fecha_fin_estimada) {
    redirect(`/admin/proyectos/${id_proyecto}?modo=editar&error=fechas`);
  }

  /*
    IMPORTANTE:
    No mandamos fecha_fin_real: null.
    Eso era lo que podía romper Prisma si la columna no acepta null.
  */
  const dataUpdate = {
    nombre_proyecto,
    descripcion: descripcion || null,
    ubicacion,
    estado,
    fecha_inicio,
    fecha_fin_estimada,
    ...(fecha_fin_real
      ? {
          fecha_fin_real,
        }
      : {}),
    ...(estado === "terminado" && !fecha_fin_real
      ? {
          fecha_fin_real: new Date(),
        }
      : {}),
  };

  try {
    await prisma.proyecto.update({
      where: {
        id_proyecto,
      },
      data: dataUpdate,
    });
  } catch (error) {
    console.error("Error al actualizar proyecto:", error);
    redirect(`/admin/proyectos/${id_proyecto}?modo=editar&error=guardar`);
  }

  revalidatePath("/admin/proyectos");
  revalidatePath(`/admin/proyectos/${id_proyecto}`);

  redirect(`/admin/proyectos/${id_proyecto}`);
}

/*
  MARCAR COMO TERMINADO
*/
async function marcarTerminado(formData: FormData) {
  "use server";

  const user = await requireModule("proyectos");
  const roleName = getRoleName(user);

  if (!canEditProjects(roleName)) {
    redirect("/admin/proyectos");
  }

  const id_proyecto = Number(formData.get("id_proyecto"));

  if (!id_proyecto || Number.isNaN(id_proyecto)) {
    redirect("/admin/proyectos");
  }

  try {
    await prisma.proyecto.update({
      where: {
        id_proyecto,
      },
      data: {
        estado: "terminado",
        fecha_fin_real: new Date(),
      },
    });
  } catch (error) {
    console.error("Error al marcar proyecto como terminado:", error);
    redirect(`/admin/proyectos/${id_proyecto}?error=guardar`);
  }

  revalidatePath("/admin/proyectos");
  revalidatePath(`/admin/proyectos/${id_proyecto}`);

  redirect(`/admin/proyectos/${id_proyecto}`);
}

export default async function ProyectoDetallePage({
  params,
  searchParams,
}: PageProps) {
  const user = await requireModule("proyectos");
  const routeParams = await params;
  const query = await searchParams;

  const roleName = getRoleName(user);
  const isCliente = roleName === "Cliente";
  const canEditProject = canEditProjects(roleName);

  const idProyecto = Number(routeParams.id);

  if (!idProyecto || Number.isNaN(idProyecto)) {
    notFound();
  }

  const proyecto = await prisma.proyecto.findUnique({
    where: {
      id_proyecto: idProyecto,
    },
  });

  if (!proyecto || proyecto.estado === "eliminado") {
    notFound();
  }

  if (isCliente && proyecto.id_cliente !== user.id_cliente) {
    redirect("/admin/proyectos");
  }

  const cliente = await prisma.cliente.findUnique({
    where: {
      id_cliente: proyecto.id_cliente,
    },
  });

  const clienteNombre =
    cliente?.razon_social ||
    `${cliente?.nombres ?? ""} ${cliente?.apellidos ?? ""}`.trim() ||
    `Cliente ${proyecto.id_cliente}`;

  const modoEditar = query?.modo === "editar" && canEditProject;

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Detalle de proyecto
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              {proyecto.nombre_proyecto}
            </h1>

            <p className="mt-1 text-slate-600">Cliente: {clienteNombre}</p>

            <p className="mt-2 text-sm text-slate-500">
              Rol actual: {roleName}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/proyectos"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              Volver
            </Link>

            {canEditProject && !modoEditar && (
              <Link
                href={`/admin/proyectos/${proyecto.id_proyecto}?modo=editar`}
                className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Editar proyecto
              </Link>
            )}
          </div>
        </div>

        {query?.error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {query.error === "datos" &&
              "Nombre, ubicación y estado son obligatorios."}

            {query.error === "fechas" &&
              "Fecha de inicio y fecha fin estimada son obligatorias y deben ser válidas."}

            {query.error === "guardar" &&
              "No se pudo guardar el proyecto. Revisa que el estado y las fechas sean correctas."}
          </div>
        )}

        {!modoEditar && (
          <>
            <section className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ProjectGalleryImage
                  title={proyecto.nombre_proyecto}
                  index={0}
                />
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${getEstadoClass(
                    proyecto.estado
                  )}`}
                >
                  {getEstadoLabel(proyecto.estado)}
                </span>

                <h2 className="mt-4 text-xl font-bold text-slate-900">
                  Información principal
                </h2>

                <div className="mt-5 space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Ubicación
                    </p>
                    <p className="font-semibold text-slate-800">
                      {proyecto.ubicacion ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Fecha inicio
                    </p>
                    <p className="font-semibold text-slate-800">
                      {formatDateText(proyecto.fecha_inicio)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Fin estimado
                    </p>
                    <p className="font-semibold text-slate-800">
                      {formatDateText(proyecto.fecha_fin_estimada)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Fin real
                    </p>
                    <p className="font-semibold text-slate-800">
                      {formatDateText(proyecto.fecha_fin_real)}
                    </p>
                  </div>
                </div>

                {canEditProject && proyecto.estado !== "terminado" && (
                  <form action={marcarTerminado} className="mt-6">
                    <input
                      type="hidden"
                      name="id_proyecto"
                      value={proyecto.id_proyecto}
                    />

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                      Marcar como terminado
                    </button>
                  </form>
                )}
              </div>
            </section>

            <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Descripción del proyecto
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                {proyecto.descripcion ||
                  "Este proyecto está enfocado en la construcción de espacios funcionales, seguros y cómodos, cuidando la calidad de materiales, tiempos de ejecución y necesidades del cliente."}
              </p>
            </section>

            <section className="mt-6">
              <h2 className="text-xl font-bold text-slate-900">
                Galería del proyecto
              </h2>

              <div className="mt-4 grid gap-5 md:grid-cols-3">
                <ProjectGalleryImage title="Fachada referencial" index={0} />
                <ProjectGalleryImage title="Área interior" index={1} />
                <ProjectGalleryImage title="Avance de obra" index={2} />
              </div>
            </section>
          </>
        )}

        {modoEditar && (
          <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Editar proyecto
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Modifica los datos del proyecto y presiona Guardar cambios.
            </p>

            <form
              action={actualizarProyecto}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input
                type="hidden"
                name="id_proyecto"
                value={proyecto.id_proyecto}
              />

              <input
                name="nombre_proyecto"
                defaultValue={proyecto.nombre_proyecto}
                placeholder="Nombre del proyecto"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="ubicacion"
                defaultValue={proyecto.ubicacion ?? ""}
                placeholder="Ubicación"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <select
                name="estado"
                defaultValue={proyecto.estado ?? "pendiente"}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_ejecucion">En ejecución</option>
                <option value="terminado">Terminado</option>
                <option value="cancelado">Cancelado</option>
              </select>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha inicio
                </label>

                <input
                  type="date"
                  name="fecha_inicio"
                  defaultValue={formatDateInput(proyecto.fecha_inicio)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha fin estimada
                </label>

                <input
                  type="date"
                  name="fecha_fin_estimada"
                  defaultValue={formatDateInput(proyecto.fecha_fin_estimada)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha fin real
                </label>

                <input
                  type="date"
                  name="fecha_fin_real"
                  defaultValue={formatDateInput(proyecto.fecha_fin_real)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <textarea
                name="descripcion"
                defaultValue={proyecto.descripcion ?? ""}
                placeholder="Descripción"
                rows={5}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-2"
              />

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Guardar cambios
                </button>

                <Link
                  href={`/admin/proyectos/${proyecto.id_proyecto}`}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}