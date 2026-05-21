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

  Cambios visuales:
  - Fondo y tarjetas glass estilo módulo Proyectos.
  - Detalle con portada, métricas, descripción y galería.
  - Formulario de edición con diseño consistente.
  - Se mantiene la lógica de permisos, guardar y finalizar.
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
    finalizado: "Finalizado",
    suspendido: "Suspendido",
    terminado: "Terminado",
    cancelado: "Cancelado",
  };

  return labels[estado ?? ""] ?? estado ?? "Sin estado";
}

function getEstadoClass(estado: string | null | undefined) {
  if (estado === "finalizado" || estado === "terminado") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (estado === "en_ejecucion") {
    return "bg-blue-100 text-blue-800";
  }

  if (estado === "suspendido" || estado === "cancelado") {
    return "bg-red-100 text-red-800";
  }

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

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/40 bg-white/60 p-4 shadow-lg shadow-slate-950/10 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-lg text-white shadow">
          {icon}
        </div>

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-blue-900">
            {label}
          </p>

          <p className="mt-1 text-sm font-extrabold text-slate-950">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function GalleryCard({
  title,
  src,
  description,
}: {
  title: string;
  src: string;
  description: string;
}) {
  return (
    <article className="overflow-hidden rounded-[1.7rem] border border-white/45 bg-white/60 shadow-xl shadow-slate-950/20 backdrop-blur-md">
      <div className="relative h-52 overflow-hidden p-3">
        <img
          src={src}
          alt={title}
          className="h-full w-full rounded-2xl object-cover shadow-lg"
        />

        <div className="absolute inset-3 rounded-2xl bg-gradient-to-t from-slate-950/45 via-slate-900/10 to-transparent" />
      </div>

      <div className="p-5 pt-2">
        <h3 className="text-lg font-extrabold text-slate-950">{title}</h3>

        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          {description}
        </p>
      </div>
    </article>
  );
}

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

  const proyectoActual = await prisma.proyecto.findUnique({
    where: {
      id_proyecto,
    },
  });

  if (!proyectoActual) {
    redirect("/admin/proyectos");
  }

  if (
    estado === "finalizado" &&
    proyectoActual.estado !== "en_ejecucion" &&
    proyectoActual.estado !== "finalizado"
  ) {
    redirect(`/admin/proyectos/${id_proyecto}?modo=editar&error=solo-ejecucion`);
  }

  if (!fecha_inicio || !fecha_fin_estimada) {
    redirect(`/admin/proyectos/${id_proyecto}?modo=editar&error=fechas`);
  }

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
    ...(estado === "finalizado" && !fecha_fin_real
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

  const proyectoActual = await prisma.proyecto.findUnique({
    where: {
      id_proyecto,
    },
  });

  if (!proyectoActual) {
    redirect("/admin/proyectos");
  }

  if (proyectoActual.estado !== "en_ejecucion") {
    redirect(`/admin/proyectos/${id_proyecto}?error=solo-ejecucion`);
  }

  try {
    await prisma.proyecto.update({
      where: {
        id_proyecto,
      },
      data: {
        estado: "finalizado",
        fecha_fin_real: new Date(),
      },
    });
  } catch (error) {
    console.error("Error al marcar proyecto como finalizado:", error);
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
  const imagenPrincipal = getProyectoImagen(proyecto);

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-fixed p-6"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.58) 36%, rgba(255,255,255,0.12) 100%), url('/images/proyectos-fondo.jpg')",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="text-white drop-shadow">
              <p className="text-sm font-bold text-blue-100">
                Detalle de proyecto
              </p>

              <h1 className="text-4xl font-extrabold tracking-tight">
                {proyecto.nombre_proyecto}
              </h1>

              <p className="mt-1 text-sm font-medium text-blue-100">
                Cliente: {clienteNombre} · Rol actual: {roleName}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/proyectos"
                className="rounded-xl border border-white/40 bg-white/75 px-5 py-3 text-sm font-extrabold text-blue-900 shadow-xl shadow-slate-900/20 backdrop-blur transition hover:bg-white"
              >
                Volver
              </Link>

              {canEditProject && !modoEditar && (
                <Link
                  href={`/admin/proyectos/${proyecto.id_proyecto}?modo=editar`}
                  className="rounded-xl bg-gradient-to-r from-blue-800 to-sky-600 px-5 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/30 transition hover:from-blue-950 hover:to-sky-700"
                >
                  Editar proyecto
                </Link>
              )}
            </div>
          </div>
        </section>

        {query?.error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-bold text-red-700 shadow-lg backdrop-blur">
            {query.error === "datos" &&
              "Nombre, ubicación y estado son obligatorios."}

            {query.error === "fechas" &&
              "Fecha de inicio y fecha fin estimada son obligatorias y deben ser válidas."}

            {query.error === "guardar" &&
              "No se pudo guardar el proyecto. Revisa que el estado y las fechas sean correctas."}

            {query.error === "solo-ejecucion" &&
              "Solo los proyectos que están en ejecución pueden marcarse como finalizados."}
          </div>
        )}

        {!modoEditar && (
          <>
            <section className="mt-6 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
              <article className="overflow-hidden rounded-[28px] border border-white/50 bg-white/55 shadow-2xl shadow-slate-950/25 backdrop-blur-md">
                <div className="relative h-[440px] overflow-hidden p-4">
                  <img
                    src={imagenPrincipal}
                    alt={proyecto.nombre_proyecto}
                    className="h-full w-full rounded-[1.5rem] object-cover shadow-xl"
                  />

                  <div className="absolute inset-4 rounded-[1.5rem] bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />

                  <div className="absolute bottom-8 left-8 right-8">
                    <span
                      className={`rounded-full px-4 py-2 text-xs font-extrabold shadow ${getEstadoClass(
                        proyecto.estado
                      )}`}
                    >
                      {getEstadoLabel(proyecto.estado)}
                    </span>

                    <h2 className="mt-4 text-3xl font-black text-white drop-shadow">
                      {proyecto.nombre_proyecto}
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-blue-50 drop-shadow">
                      {proyecto.descripcion ||
                        "Proyecto de construcción enfocado en seguridad, calidad de materiales y cumplimiento de tiempos de entrega."}
                    </p>
                  </div>
                </div>
              </article>

              <aside className="rounded-[28px] border border-white/40 bg-white/35 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
                <h2 className="text-2xl font-extrabold text-white drop-shadow">
                  Información principal
                </h2>

                <p className="mt-1 text-sm font-bold text-blue-100">
                  Datos generales del proyecto seleccionado.
                </p>

                <div className="mt-5 grid gap-4">
                  <InfoCard label="Cliente" value={clienteNombre} icon="👤" />

                  <InfoCard
                    label="Ubicación"
                    value={proyecto.ubicacion ?? "-"}
                    icon="📍"
                  />

                  <InfoCard
                    label="Fecha inicio"
                    value={formatDateText(proyecto.fecha_inicio)}
                    icon="📅"
                  />

                  <InfoCard
                    label="Fin estimado"
                    value={formatDateText(proyecto.fecha_fin_estimada)}
                    icon="🗓️"
                  />

                  <InfoCard
                    label="Fin real"
                    value={formatDateText(proyecto.fecha_fin_real)}
                    icon="✅"
                  />
                </div>

                {canEditProject && proyecto.estado === "en_ejecucion" && (
                  <form action={marcarTerminado} className="mt-6">
                    <input
                      type="hidden"
                      name="id_proyecto"
                      value={proyecto.id_proyecto}
                    />

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 px-4 py-3 text-sm font-extrabold text-white shadow-xl shadow-emerald-950/30 transition hover:from-emerald-900 hover:to-green-700"
                    >
                      Marcar como finalizado
                    </button>
                  </form>
                )}
              </aside>
            </section>

            <section className="mt-6 rounded-[28px] border border-white/40 bg-white/35 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
              <h2 className="text-2xl font-extrabold text-white drop-shadow">
                Descripción del proyecto
              </h2>

              <p className="mt-3 rounded-2xl bg-white/65 p-5 text-sm font-semibold leading-7 text-slate-800 shadow backdrop-blur">
                {proyecto.descripcion ||
                  "Este proyecto está enfocado en la construcción de espacios funcionales, seguros y cómodos, cuidando la calidad de materiales, tiempos de ejecución y necesidades del cliente."}
              </p>
            </section>

            <section className="mt-6">
              <div className="mb-4 rounded-[28px] border border-white/40 bg-white/25 p-5 shadow-2xl shadow-slate-950/25 backdrop-blur-md">
                <h2 className="text-2xl font-extrabold text-white drop-shadow">
                  Galería del proyecto
                </h2>

                <p className="mt-1 text-sm font-bold text-blue-100">
                  Imágenes referenciales para presentar mejor el avance y tipo de obra.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <GalleryCard
                  title="Vista principal"
                  src={imagenPrincipal}
                  description="Imagen principal del tipo de proyecto registrado."
                />

                <GalleryCard
                  title="Fachada referencial"
                  src="/images/proyecto-edificio.jpg"
                  description="Representación de fachada y presentación exterior."
                />

                <GalleryCard
                  title="Vivienda referencial"
                  src="/images/proyecto-vivienda.jpg"
                  description="Referencia visual para proyectos habitacionales."
                />
              </div>
            </section>
          </>
        )}

        {modoEditar && (
          <section className="mt-6 rounded-[28px] border border-white/40 bg-white/30 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
            <div className="mb-5">
              <h2 className="text-2xl font-extrabold text-white drop-shadow">
                Editar proyecto
              </h2>

              <p className="mt-1 text-sm font-bold text-blue-100">
                Modifica los datos del proyecto y guarda los cambios.
              </p>
            </div>

            <form
              action={actualizarProyecto}
              className="grid gap-4 md:grid-cols-2"
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
                className={inputClass}
              />

              <input
                name="ubicacion"
                defaultValue={proyecto.ubicacion ?? ""}
                placeholder="Ubicación"
                className={inputClass}
              />

              <select
                name="estado"
                defaultValue={proyecto.estado ?? "pendiente"}
                className={selectClass}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_ejecucion">En ejecución</option>
                <option value="finalizado">Finalizado</option>
                <option value="suspendido">Suspendido</option>
              </select>

              <div>
                <label className="mb-1 block text-sm font-extrabold text-white drop-shadow">
                  Fecha inicio
                </label>

                <input
                  type="date"
                  name="fecha_inicio"
                  defaultValue={formatDateInput(proyecto.fecha_inicio)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-extrabold text-white drop-shadow">
                  Fecha fin estimada
                </label>

                <input
                  type="date"
                  name="fecha_fin_estimada"
                  defaultValue={formatDateInput(proyecto.fecha_fin_estimada)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-extrabold text-white drop-shadow">
                  Fecha fin real
                </label>

                <input
                  type="date"
                  name="fecha_fin_real"
                  defaultValue={formatDateInput(proyecto.fecha_fin_real)}
                  className={inputClass}
                />
              </div>

              <textarea
                name="descripcion"
                defaultValue={proyecto.descripcion ?? ""}
                placeholder="Descripción"
                rows={5}
                className={`${inputClass} md:col-span-2`}
              />

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-blue-800 to-sky-600 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/30 transition hover:from-blue-950 hover:to-sky-700"
                >
                  Guardar cambios
                </button>

                <Link
                  href={`/admin/proyectos/${proyecto.id_proyecto}`}
                  className="rounded-xl border border-white/40 bg-white/70 px-5 py-3 text-sm font-extrabold text-blue-900 shadow-lg transition hover:bg-white"
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