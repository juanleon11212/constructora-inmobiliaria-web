import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";
import RoleCargoSelect from "../../../components/froms/RoleCargoSelect";
/*
  MÓDULO EMPLEADOS

  Ruta:
  /admin/empleados

  Funciones:
  - Ver empleados.
  - Crear empleados.
  - Editar empleados.
  - Eliminar empleados de forma lógica.
  - Relacionar empleados con cargos.

  Importante:
  - No se borra físicamente al empleado.
  - Al eliminarlo, se cambia su estado a "inactivo".
  - Si el empleado tiene usuario, también se desactiva su usuario.
*/

type PageProps = {
  searchParams?: Promise<{
    editar?: string;
    error?: string;
  }>;
};

/*
  Función auxiliar para leer datos del formulario.
*/
function getText(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

/*
  CREAR EMPLEADO

  Guarda un nuevo empleado en la tabla empleado.
*/
async function crearEmpleado(formData: FormData) {
  "use server";

  const user = await requireModule("empleados");

  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

  if (roleName !== "Administrador") {
    redirect("/admin/empleados");
  }

  const nombres = getText(formData, "nombres");
  const apellidos = getText(formData, "apellidos");
  const ci = getText(formData, "ci");
  const telefono = getText(formData, "telefono");
  const direccion = getText(formData, "direccion");
  const fecha_nacimiento = getText(formData, "fecha_nacimiento");
  const fecha_ingreso = getText(formData, "fecha_ingreso");
  const estado = getText(formData, "estado") || "activo";
  const id_cargo = Number(formData.get("id_cargo"));

  if (!nombres || !apellidos || !ci || !fecha_ingreso || !id_cargo) {
    redirect("/admin/empleados?error=datos-obligatorios");
  }

  const empleadoExistente = await prisma.empleado.findFirst({
    where: {
      ci,
    },
  });

  if (empleadoExistente) {
    redirect("/admin/empleados?error=ci-existente");
  }

  await prisma.empleado.create({
    data: {
      nombres,
      apellidos,
      ci,
      telefono: telefono || null,
      direccion: direccion || null,
      fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
      fecha_ingreso: new Date(fecha_ingreso),
      estado,
      id_cargo,
    },
  });

  revalidatePath("/admin/empleados");
  redirect("/admin/empleados");
}

/*
  EDITAR EMPLEADO

  Actualiza los datos de un empleado existente.
*/
async function editarEmpleado(formData: FormData) {
  "use server";

  const user = await requireModule("empleados");

  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

  if (roleName !== "Administrador") {
    redirect("/admin/empleados");
  }

  const id_empleado = Number(formData.get("id_empleado"));

  if (!id_empleado) {
    redirect("/admin/empleados?error=id-invalido");
  }

  const nombres = getText(formData, "nombres");
  const apellidos = getText(formData, "apellidos");
  const ci = getText(formData, "ci");
  const telefono = getText(formData, "telefono");
  const direccion = getText(formData, "direccion");
  const fecha_nacimiento = getText(formData, "fecha_nacimiento");
  const fecha_ingreso = getText(formData, "fecha_ingreso");
  const estado = getText(formData, "estado") || "activo";
  const id_cargo = Number(formData.get("id_cargo"));

  if (!nombres || !apellidos || !ci || !fecha_ingreso || !id_cargo) {
    redirect(`/admin/empleados?editar=${id_empleado}&error=datos-obligatorios`);
  }

  const empleadoDuplicado = await prisma.empleado.findFirst({
    where: {
      id_empleado: {
        not: id_empleado,
      },
      ci,
    },
  });

  if (empleadoDuplicado) {
    redirect(`/admin/empleados?editar=${id_empleado}&error=ci-existente`);
  }

  await prisma.empleado.update({
    where: {
      id_empleado,
    },
    data: {
      nombres,
      apellidos,
      ci,
      telefono: telefono || null,
      direccion: direccion || null,
      fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
      fecha_ingreso: new Date(fecha_ingreso),
      estado,
      id_cargo,
    },
  });

  revalidatePath("/admin/empleados");
  redirect("/admin/empleados");
}

/*
  ELIMINAR EMPLEADO

  No se borra físicamente.
  Solo cambia su estado a "inactivo".

  También desactiva su usuario relacionado, si tiene uno.
*/
async function eliminarEmpleado(formData: FormData) {
  "use server";

  const user = await requireModule("empleados");

  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

  if (roleName !== "Administrador") {
    redirect("/admin/empleados");
  }

  const id_empleado = Number(formData.get("id_empleado"));

  if (!id_empleado) {
    redirect("/admin/empleados?error=id-invalido");
  }

  await prisma.usuario.updateMany({
    where: {
      id_empleado,
    },
    data: {
      estado: "inactivo",
    },
  });

  await prisma.empleado.update({
    where: {
      id_empleado,
    },
    data: {
      estado: "inactivo",
    },
  });

  revalidatePath("/admin/empleados");
  redirect("/admin/empleados");
}

export default async function EmpleadosPage({ searchParams }: PageProps) {
  /*
    Protege la página.
    Solo entran roles con permiso al módulo empleados.
  */
  const user = await requireModule("empleados");

  const params = await searchParams;

  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

  /*
    Solo el administrador puede crear, editar y eliminar.
  */
  const isAdmin = roleName === "Administrador";

  /*
    Si la URL tiene ?editar=ID, se activa el modo edición.
  */
  const idEditar = Number(params?.editar);

  /*
    Lista de cargos disponibles.
  */
  const cargos = await prisma.cargo.findMany({
    orderBy: {
      nombre_cargo: "asc",
    },
  });
  const rolesLaborales = await prisma.rol.findMany({
  where: {
    nombre_rol: {
      notIn: ["Administrador", "Cliente"],
    },
  },
  orderBy: {
    id_rol: "asc",
  },
});

  /*
    Lista de empleados registrados.
  */
  const empleados = await prisma.empleado.findMany({
    orderBy: {
      id_empleado: "desc",
    },
  });

  /*
    Si se está editando, trae los datos del empleado seleccionado.
  */
  const empleadoEditar = idEditar
    ? await prisma.empleado.findUnique({
        where: {
          id_empleado: idEditar,
        },
      })
    : null;

  /*
    Mapa para mostrar el nombre del cargo en la tabla.
  */
  const cargoMap = new Map(
    cargos.map((cargo) => [cargo.id_cargo, cargo.nombre_cargo])
  );
  const rolesParaCargo = rolesLaborales.map((rol) => ({
  id_rol: rol.id_rol,
  nombre_rol: rol.nombre_rol,
}));

const cargosParaSelector = cargos.map((cargo) => ({
  id_cargo: cargo.id_cargo,
  nombre_cargo: cargo.nombre_cargo,
}));

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Módulo Empleados
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Empleados
            </h1>

            <p className="mt-1 text-slate-600">
              Administración del personal de la empresa.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            Volver al panel
          </Link>
        </div>

        {/* Mensajes de error */}
        {params?.error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error === "datos-obligatorios" &&
              "Nombres, apellidos, CI, fecha de ingreso y cargo son obligatorios."}

            {params.error === "ci-existente" &&
              "Ya existe un empleado con ese CI."}

            {params.error === "id-invalido" &&
              "El ID del empleado no es válido."}
          </div>
        )}

        {/* Formulario crear empleado */}
        {isAdmin && !empleadoEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Crear empleado
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Este formulario guarda un trabajador en la tabla empleado.
            </p>

            <form
              action={crearEmpleado}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input
                name="nombres"
                placeholder="Nombres *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="apellidos"
                placeholder="Apellidos *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="ci"
                placeholder="CI *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="telefono"
                placeholder="Teléfono"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="direccion"
                placeholder="Dirección"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-2"
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha nacimiento
                </label>

                <input
                  type="date"
                  name="fecha_nacimiento"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha ingreso *
                </label>

                <input
                  type="date"
                  name="fecha_ingreso"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <RoleCargoSelect
                roles={rolesParaCargo}
                cargos={cargosParaSelector}
              />

              <select
                name="estado"
                defaultValue="activo"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Crear empleado
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Formulario editar empleado */}
        {isAdmin && empleadoEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Editar empleado
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Modifica los datos del empleado seleccionado.
                </p>
              </div>

              <Link
                href="/admin/empleados"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </Link>
            </div>

            <form
              action={editarEmpleado}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input
                type="hidden"
                name="id_empleado"
                defaultValue={empleadoEditar.id_empleado}
              />

              <input
                name="nombres"
                placeholder="Nombres *"
                defaultValue={empleadoEditar.nombres}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="apellidos"
                placeholder="Apellidos *"
                defaultValue={empleadoEditar.apellidos}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="ci"
                placeholder="CI *"
                defaultValue={empleadoEditar.ci}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="telefono"
                placeholder="Teléfono"
                defaultValue={empleadoEditar.telefono ?? ""}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="direccion"
                placeholder="Dirección"
                defaultValue={empleadoEditar.direccion ?? ""}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-2"
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha nacimiento
                </label>

                <input
                  type="date"
                  name="fecha_nacimiento"
                  defaultValue={
                    empleadoEditar.fecha_nacimiento
                      ? new Date(empleadoEditar.fecha_nacimiento)
                          .toISOString()
                          .slice(0, 10)
                      : ""
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha ingreso *
                </label>

                <input
                  type="date"
                  name="fecha_ingreso"
                  defaultValue={
                    empleadoEditar.fecha_ingreso
                      ? new Date(empleadoEditar.fecha_ingreso)
                          .toISOString()
                          .slice(0, 10)
                      : ""
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

                <RoleCargoSelect
                roles={rolesParaCargo}
                cargos={cargosParaSelector}
                defaultCargoId={empleadoEditar.id_cargo}
              />

              <select
                name="estado"
                defaultValue={empleadoEditar.estado ?? "activo"}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
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

        {/* Tabla de empleados */}
        <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-200">
              <tr>
                <th className="border p-3 text-left">ID</th>
                <th className="border p-3 text-left">Empleado</th>
                <th className="border p-3 text-left">CI</th>
                <th className="border p-3 text-left">Cargo</th>
                <th className="border p-3 text-left">Teléfono</th>
                <th className="border p-3 text-left">Ingreso</th>
                <th className="border p-3 text-left">Estado</th>
                <th className="border p-3 text-left">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {empleados.map((empleado) => (
                <tr key={empleado.id_empleado} className="hover:bg-slate-50">
                  <td className="border p-3">{empleado.id_empleado}</td>

                  <td className="border p-3 font-medium">
                    {empleado.nombres} {empleado.apellidos}
                  </td>

                  <td className="border p-3">{empleado.ci}</td>

                  <td className="border p-3">
                    {cargoMap.get(empleado.id_cargo) ?? "-"}
                  </td>

                  <td className="border p-3">
                    {empleado.telefono ?? "-"}
                  </td>

                  <td className="border p-3">
                    {empleado.fecha_ingreso
                      ? new Date(empleado.fecha_ingreso)
                          .toISOString()
                          .slice(0, 10)
                      : "-"}
                  </td>

                  <td className="border p-3">{empleado.estado}</td>

                  <td className="border p-3">
                    {isAdmin ? (
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/empleados?editar=${empleado.id_empleado}`}
                          className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Editar
                        </Link>

                        {empleado.estado !== "inactivo" && (
                          <form action={eliminarEmpleado}>
                            <input
                              type="hidden"
                              name="id_empleado"
                              value={empleado.id_empleado}
                            />

                            <button
                              type="submit"
                              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                            >
                              Eliminar
                            </button>
                          </form>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">Sin acciones</span>
                    )}
                  </td>
                </tr>
              ))}

              {empleados.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="border p-6 text-center text-slate-500"
                  >
                    No hay empleados registrados.
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