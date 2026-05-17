import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";

/*
  MÓDULO PROYECTOS

  Ruta:
  /admin/proyectos

  Qué hace:
  - Lista proyectos activos.
  - Crea proyectos.
  - Edita proyectos.
  - Cambia el estado del proyecto.
  - Elimina proyectos de forma lógica cambiando estado a "eliminado".

  Importante:
  No se borra físicamente para no romper contratos, pagos,
  presupuestos o controles relacionados.
*/

type PageProps = {
  searchParams?: Promise<{
    editar?: string;
    error?: string;
  }>;
};

function getText(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

/*
  CREAR PROYECTO

  Guarda un nuevo proyecto relacionado con un cliente.
*/
async function crearProyecto(formData: FormData) {
  "use server";

  const user = await requireModule("proyectos");

  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

  if (roleName !== "Administrador") {
    redirect("/admin/proyectos");
  }

  const nombre_proyecto = getText(formData, "nombre_proyecto");
  const descripcion = getText(formData, "descripcion");
  const ubicacion = getText(formData, "ubicacion");
  const fecha_inicio = getText(formData, "fecha_inicio");
  const fecha_fin_estimada = getText(formData, "fecha_fin_estimada");
  const estado = getText(formData, "estado") || "pendiente";
  const id_cliente = Number(formData.get("id_cliente"));

  if (!nombre_proyecto || !ubicacion || !fecha_inicio || !id_cliente) {
    redirect("/admin/proyectos?error=datos-obligatorios");
  }

  await prisma.proyecto.create({
    data: {
      nombre_proyecto,
      descripcion: descripcion || null,
      ubicacion,
      fecha_inicio: new Date(fecha_inicio),
      fecha_fin_estimada: fecha_fin_estimada
        ? new Date(fecha_fin_estimada)
        : null,
      fecha_fin_real: null,
      estado,
      id_cliente,
      id_usuario_registro: user.id_usuario ?? null,
    },
  });

  revalidatePath("/admin/proyectos");
  redirect("/admin/proyectos");
}

/*
  EDITAR PROYECTO

  Actualiza los datos principales del proyecto:
  nombre, descripción, ubicación, fechas, cliente y estado.
*/
async function editarProyecto(formData: FormData) {
  "use server";

  const user = await requireModule("proyectos");

  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

  if (roleName !== "Administrador") {
    redirect("/admin/proyectos");
  }

  const id_proyecto = Number(formData.get("id_proyecto"));

  if (!id_proyecto) {
    redirect("/admin/proyectos?error=id-invalido");
  }

  const nombre_proyecto = getText(formData, "nombre_proyecto");
  const descripcion = getText(formData, "descripcion");
  const ubicacion = getText(formData, "ubicacion");
  const fecha_inicio = getText(formData, "fecha_inicio");
  const fecha_fin_estimada = getText(formData, "fecha_fin_estimada");
  const fecha_fin_real = getText(formData, "fecha_fin_real");
  const estado = getText(formData, "estado") || "pendiente";
  const id_cliente = Number(formData.get("id_cliente"));

  if (!nombre_proyecto || !ubicacion || !fecha_inicio || !id_cliente) {
    redirect(`/admin/proyectos?editar=${id_proyecto}&error=datos-obligatorios`);
  }

  await prisma.proyecto.update({
    where: {
      id_proyecto,
    },
    data: {
      nombre_proyecto,
      descripcion: descripcion || null,
      ubicacion,
      fecha_inicio: new Date(fecha_inicio),
      fecha_fin_estimada: fecha_fin_estimada
        ? new Date(fecha_fin_estimada)
        : null,
      fecha_fin_real: fecha_fin_real ? new Date(fecha_fin_real) : null,
      estado,
      id_cliente,
    },
  });

  revalidatePath("/admin/proyectos");
  redirect("/admin/proyectos");
}

/*
  ELIMINAR PROYECTO

  No elimina físicamente.
  Cambia el estado a "eliminado" para ocultarlo de la lista principal.
*/
async function eliminarProyecto(formData: FormData) {
  "use server";

  const user = await requireModule("proyectos");

  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

  if (roleName !== "Administrador") {
    redirect("/admin/proyectos");
  }

  const id_proyecto = Number(formData.get("id_proyecto"));

  if (!id_proyecto) {
    redirect("/admin/proyectos?error=id-invalido");
  }

  await prisma.proyecto.update({
    where: {
      id_proyecto,
    },
    data: {
      estado: "eliminado",
    },
  });

  revalidatePath("/admin/proyectos");
  redirect("/admin/proyectos");
}

export default async function ProyectosPage({ searchParams }: PageProps) {
  const user = await requireModule("proyectos");
  const params = await searchParams;

  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

  const isAdmin = roleName === "Administrador";

  const idEditar = Number(params?.editar);

  const clientes = await prisma.cliente.findMany({
    orderBy: {
      id_cliente: "asc",
    },
  });

  /*
    Lista proyectos menos los eliminados.
  */
  const proyectos = await prisma.proyecto.findMany({
    where: {
      estado: {
        not: "eliminado",
      },
    },
    orderBy: {
      id_proyecto: "desc",
    },
  });

  const proyectoEditar = idEditar
    ? await prisma.proyecto.findUnique({
        where: {
          id_proyecto: idEditar,
        },
      })
    : null;

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
              Proyectos
            </h1>

            <p className="mt-1 text-slate-600">
              Administración de obras y proyectos.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            Volver al panel
          </Link>
        </div>

        {params?.error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error === "datos-obligatorios" &&
              "Nombre, ubicación, fecha de inicio y cliente son obligatorios."}

            {params.error === "id-invalido" &&
              "El ID del proyecto no es válido."}
          </div>
        )}

        {isAdmin && !proyectoEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Crear proyecto
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Este formulario registra un proyecto asociado a un cliente.
            </p>

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
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-2"
              />

              <textarea
                name="descripcion"
                placeholder="Descripción"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-2"
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha inicio *
                </label>
                <input
                  type="date"
                  name="fecha_inicio"
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <select
                name="estado"
                defaultValue="pendiente"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_ejecucion">En ejecución</option>
                <option value="finalizado">Finalizado</option>
                <option value="suspendido">Suspendido</option>
              </select>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Crear proyecto
                </button>
              </div>
            </form>
          </section>
        )}

        {isAdmin && proyectoEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Editar proyecto
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Actualiza datos y estado del proyecto.
                </p>
              </div>

              <Link
                href="/admin/proyectos"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </Link>
            </div>

            <form
              action={editarProyecto}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input
                type="hidden"
                name="id_proyecto"
                defaultValue={proyectoEditar.id_proyecto}
              />

              <input
                name="nombre_proyecto"
                placeholder="Nombre del proyecto *"
                defaultValue={proyectoEditar.nombre_proyecto}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <select
                name="id_cliente"
                defaultValue={proyectoEditar.id_cliente}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                {clientes.map((cliente) => (
                  <option key={cliente.id_cliente} value={cliente.id_cliente}>
                    {clienteMap.get(cliente.id_cliente)}
                  </option>
                ))}
              </select>

              <input
                name="ubicacion"
                placeholder="Ubicación *"
                defaultValue={proyectoEditar.ubicacion}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-2"
              />

              <textarea
                name="descripcion"
                placeholder="Descripción"
                defaultValue={proyectoEditar.descripcion ?? ""}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-2"
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha inicio *
                </label>
                <input
                  type="date"
                  name="fecha_inicio"
                  defaultValue={new Date(proyectoEditar.fecha_inicio)
                    .toISOString()
                    .slice(0, 10)}
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
                  defaultValue={
                    proyectoEditar.fecha_fin_estimada
                      ? new Date(proyectoEditar.fecha_fin_estimada)
                          .toISOString()
                          .slice(0, 10)
                      : ""
                  }
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
                  defaultValue={
                    proyectoEditar.fecha_fin_real
                      ? new Date(proyectoEditar.fecha_fin_real)
                          .toISOString()
                          .slice(0, 10)
                      : ""
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <select
                name="estado"
                defaultValue={proyectoEditar.estado}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_ejecucion">En ejecución</option>
                <option value="finalizado">Finalizado</option>
                <option value="suspendido">Suspendido</option>
              </select>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-200">
              <tr>
                <th className="border p-3 text-left">ID</th>
                <th className="border p-3 text-left">Proyecto</th>
                <th className="border p-3 text-left">Cliente</th>
                <th className="border p-3 text-left">Ubicación</th>
                <th className="border p-3 text-left">Inicio</th>
                <th className="border p-3 text-left">Estado</th>
                <th className="border p-3 text-left">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {proyectos.map((proyecto) => (
                <tr key={proyecto.id_proyecto} className="hover:bg-slate-50">
                  <td className="border p-3">{proyecto.id_proyecto}</td>

                  <td className="border p-3 font-medium">
                    {proyecto.nombre_proyecto}
                  </td>

                  <td className="border p-3">
                    {clienteMap.get(proyecto.id_cliente) ?? "-"}
                  </td>

                  <td className="border p-3">{proyecto.ubicacion}</td>

                  <td className="border p-3">
                    {new Date(proyecto.fecha_inicio)
                      .toISOString()
                      .slice(0, 10)}
                  </td>

                  <td className="border p-3">{proyecto.estado}</td>

                  <td className="border p-3">
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/proyectos?editar=${proyecto.id_proyecto}`}
                          className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Editar
                        </Link>

                        <form action={eliminarProyecto}>
                          <input
                            type="hidden"
                            name="id_proyecto"
                            value={proyecto.id_proyecto}
                          />

                          <button
                            type="submit"
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                          >
                            Eliminar
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {proyectos.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="border p-6 text-center text-slate-500"
                  >
                    No hay proyectos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}