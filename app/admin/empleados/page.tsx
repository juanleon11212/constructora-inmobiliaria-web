import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";
import {
  TableFilter,
  type FilterOption,
} from "../../../components/admin/TableFilter";
import { containsText, equalsText, formatDate } from "../../../lib/table-filter";
import { createAuditLog } from "../../../lib/audit-log";

type PageProps = {
  searchParams?: Promise<{
    editar?: string;
    filtro?: string;
    campo?: string;
    valor?: string;
    error?: string;
  }>;
};

function getText(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function getRoleName(user: { rol: unknown }) {
  if (typeof user.rol === "string") return user.rol;

  if (user.rol && typeof user.rol === "object" && "nombre_rol" in user.rol) {
    return String((user.rol as { nombre_rol?: string | null }).nombre_rol ?? "");
  }

  return "";
}

const inputClass =
  "w-full rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none backdrop-blur placeholder:text-slate-500 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-200";

const tableHeaderClass =
  "border border-white/30 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-800";

const tableCellClass =
  "border border-white/30 px-4 py-3 text-sm font-semibold text-slate-800";

async function crearEmpleado(formData: FormData) {
  "use server";

  const user = await requireModule("empleados");
  const roleName = getRoleName(user);

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

  const empleadoCreado = await prisma.empleado.create({
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

  await createAuditLog({
    id_usuario: user.id_usuario ?? null,
    usuario: user.nombre_usuario ?? null,
    rol: roleName,
    accion: "CREAR",
    modulo: "Empleados",
    sector: "Crear empleado",
    descripcion: `Se creó el empleado ${nombres} ${apellidos}.`,
    registro_id: empleadoCreado.id_empleado,
  });

  revalidatePath("/admin/empleados");
  redirect("/admin/empleados");
}

async function editarEmpleado(formData: FormData) {
  "use server";

  const user = await requireModule("empleados");
  const roleName = getRoleName(user);

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

  await createAuditLog({
    id_usuario: user.id_usuario ?? null,
    usuario: user.nombre_usuario ?? null,
    rol: roleName,
    accion: "EDITAR",
    modulo: "Empleados",
    sector: "Editar empleado",
    descripcion: `Se editó el empleado con ID ${id_empleado}.`,
    registro_id: id_empleado,
  });

  revalidatePath("/admin/empleados");
  redirect("/admin/empleados");
}

async function eliminarEmpleado(formData: FormData) {
  "use server";

  const user = await requireModule("empleados");
  const roleName = getRoleName(user);

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

  await createAuditLog({
    id_usuario: user.id_usuario ?? null,
    usuario: user.nombre_usuario ?? null,
    rol: roleName,
    accion: "DESACTIVAR",
    modulo: "Empleados",
    sector: "Desactivar empleado",
    descripcion: `Se desactivó el empleado con ID ${id_empleado}.`,
    registro_id: id_empleado,
  });

  revalidatePath("/admin/empleados");
  redirect("/admin/empleados");
}

export default async function EmpleadosPage({ searchParams }: PageProps) {
  const user = await requireModule("empleados");
  const params = await searchParams;

  const roleName = getRoleName(user);
  const isAdmin = roleName === "Administrador";

  const idEditar = Number(params?.editar);

  const filtroActivo = params?.filtro === "1";
  const campoFiltro = String(params?.campo ?? "").trim();
  const valorFiltro = String(params?.valor ?? "").trim();
  const hayFiltro = Boolean(campoFiltro && valorFiltro);

  const opcionesFiltroEmpleados: FilterOption[] = [
    {
      value: "id_empleado",
      label: "ID empleado",
      placeholder: "Ejemplo: 1",
    },
    {
      value: "nombre",
      label: "Nombre completo",
      placeholder: "Ejemplo: Juan",
    },
    {
      value: "ci",
      label: "CI",
      placeholder: "Ejemplo: 123456",
    },
    {
      value: "telefono",
      label: "Teléfono",
      placeholder: "Ejemplo: 70000000",
    },
    {
      value: "cargo",
      label: "Cargo",
      placeholder: "Ejemplo: Arquitecto",
    },
    {
      value: "estado",
      label: "Estado",
      placeholder: "Ejemplo: activo",
    },
  ];

  const [empleados, cargos] = await Promise.all([
    prisma.empleado.findMany({
      orderBy: {
        id_empleado: "desc",
      },
    }),

    prisma.cargo.findMany({
      orderBy: {
        nombre_cargo: "asc",
      },
    }),
  ]);

  const cargoMap = new Map(
    cargos.map((cargo) => [cargo.id_cargo, cargo.nombre_cargo])
  );

  const empleadosFiltrados = empleados.filter((empleado) => {
    if (!hayFiltro) return true;

    const nombreCompleto = `${empleado.nombres} ${empleado.apellidos}`;

    if (campoFiltro === "id_empleado") {
      return equalsText(empleado.id_empleado, valorFiltro);
    }

    if (campoFiltro === "nombre") {
      return containsText(nombreCompleto, valorFiltro);
    }

    if (campoFiltro === "ci") {
      return containsText(empleado.ci, valorFiltro);
    }

    if (campoFiltro === "telefono") {
      return containsText(empleado.telefono, valorFiltro);
    }

    if (campoFiltro === "cargo") {
      return containsText(cargoMap.get(empleado.id_cargo), valorFiltro);
    }

    if (campoFiltro === "estado") {
      return containsText(empleado.estado, valorFiltro);
    }

    return true;
  });

  const empleadoEditar =
    idEditar && isAdmin
      ? await prisma.empleado.findUnique({
          where: {
            id_empleado: idEditar,
          },
        })
      : null;

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-fixed p-6"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.62) 36%, rgba(255,255,255,0.12) 100%), url('/images/empleados.jpg')",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-white drop-shadow">
              <p className="text-sm font-bold text-blue-100">
                Módulo Empleados
              </p>

              <h1 className="text-4xl font-extrabold tracking-tight">
                Empleados
              </h1>

              <p className="mt-1 text-sm font-medium text-blue-100">
                Administración del personal interno de la constructora.
              </p>
            </div>

            <Link
              href="/admin"
              className="rounded-xl border border-white/40 bg-white/75 px-5 py-3 text-sm font-extrabold text-blue-900 shadow-xl shadow-slate-900/20 backdrop-blur transition hover:bg-white"
            >
              Volver al panel
            </Link>
          </div>
        </section>

        {params?.error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-bold text-red-700 shadow-lg backdrop-blur">
            {params.error === "datos-obligatorios" &&
              "Nombres, apellidos, CI, cargo y fecha de ingreso son obligatorios."}

            {params.error === "ci-existente" &&
              "Ya existe un empleado con ese CI."}

            {params.error === "id-invalido" &&
              "El ID del empleado no es válido."}
          </div>
        )}

        {isAdmin && !empleadoEditar && (
          <section className="mt-6 rounded-[28px] border border-white/40 bg-white/30 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
            <h2 className="text-2xl font-extrabold text-white drop-shadow">
              Crear empleado
            </h2>

            <p className="mt-1 text-sm font-bold text-blue-100">
              Registra un nuevo trabajador de la empresa.
            </p>

            <form
              action={crearEmpleado}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input name="nombres" placeholder="Nombres *" className={inputClass} />

              <input
                name="apellidos"
                placeholder="Apellidos *"
                className={inputClass}
              />

              <input name="ci" placeholder="CI *" className={inputClass} />

              <input
                name="telefono"
                placeholder="Teléfono"
                className={inputClass}
              />

              <input
                name="direccion"
                placeholder="Dirección"
                className={inputClass}
              />

              <select name="id_cargo" className={inputClass}>
                <option value="">Seleccionar cargo *</option>

                {cargos.map((cargo) => (
                  <option key={cargo.id_cargo} value={cargo.id_cargo}>
                    {cargo.nombre_cargo}
                  </option>
                ))}
              </select>

              <div>
                <label className="mb-1 block text-sm font-extrabold text-white drop-shadow">
                  Fecha de nacimiento
                </label>

                <input
                  type="date"
                  name="fecha_nacimiento"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-extrabold text-white drop-shadow">
                  Fecha de ingreso *
                </label>

                <input type="date" name="fecha_ingreso" className={inputClass} />
              </div>

              <select name="estado" defaultValue="activo" className={inputClass}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-blue-800 to-sky-600 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/30 transition hover:from-blue-950 hover:to-sky-700"
                >
                  Crear empleado
                </button>
              </div>
            </form>
          </section>
        )}

        {isAdmin && empleadoEditar && (
          <section className="mt-6 rounded-[28px] border border-white/40 bg-white/30 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white drop-shadow">
                  Editar empleado
                </h2>

                <p className="mt-1 text-sm font-bold text-blue-100">
                  Modifica los datos del empleado seleccionado.
                </p>
              </div>

              <Link
                href="/admin/empleados"
                scroll={false}
                className="rounded-xl border border-white/40 bg-white/70 px-4 py-2 text-sm font-extrabold text-blue-900 transition hover:bg-white"
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
                className={inputClass}
              />

              <input
                name="apellidos"
                placeholder="Apellidos *"
                defaultValue={empleadoEditar.apellidos}
                className={inputClass}
              />

              <input
                name="ci"
                placeholder="CI *"
                defaultValue={empleadoEditar.ci}
                className={inputClass}
              />

              <input
                name="telefono"
                placeholder="Teléfono"
                defaultValue={empleadoEditar.telefono ?? ""}
                className={inputClass}
              />

              <input
                name="direccion"
                placeholder="Dirección"
                defaultValue={empleadoEditar.direccion ?? ""}
                className={inputClass}
              />

              <select
                name="id_cargo"
                defaultValue={empleadoEditar.id_cargo}
                className={inputClass}
              >
                {cargos.map((cargo) => (
                  <option key={cargo.id_cargo} value={cargo.id_cargo}>
                    {cargo.nombre_cargo}
                  </option>
                ))}
              </select>

              <div>
                <label className="mb-1 block text-sm font-extrabold text-white drop-shadow">
                  Fecha de nacimiento
                </label>

                <input
                  type="date"
                  name="fecha_nacimiento"
                  defaultValue={formatDate(empleadoEditar.fecha_nacimiento)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-extrabold text-white drop-shadow">
                  Fecha de ingreso *
                </label>

                <input
                  type="date"
                  name="fecha_ingreso"
                  defaultValue={formatDate(empleadoEditar.fecha_ingreso)}
                  className={inputClass}
                />
              </div>

              <select
                name="estado"
                defaultValue={empleadoEditar.estado}
                className={inputClass}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-blue-800 to-sky-600 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/30 transition hover:from-blue-950 hover:to-sky-700"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="mt-6 rounded-[28px] border border-white/40 bg-white/25 p-1 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <TableFilter
            basePath="/admin/empleados"
            title="Filtro de empleados"
            currentLabel="Empleados"
            options={opcionesFiltroEmpleados}
            filtroActivo={filtroActivo}
            campoFiltro={campoFiltro}
            valorFiltro={valorFiltro}
            resultados={empleadosFiltrados.length}
          />
        </div>

        <section className="mt-6 overflow-x-auto rounded-[28px] border border-white/40 bg-white/35 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <div className="px-5 py-4">
            <h2 className="text-2xl font-extrabold text-white drop-shadow">
              Lista de empleados registrados
            </h2>

            <p className="mt-1 text-sm font-bold text-blue-100">
              Registros visibles: {empleadosFiltrados.length}
            </p>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead className="bg-white/70 backdrop-blur">
              <tr>
                <th className={tableHeaderClass}>ID</th>
                <th className={tableHeaderClass}>Empleado</th>
                <th className={tableHeaderClass}>CI</th>
                <th className={tableHeaderClass}>Teléfono</th>
                <th className={tableHeaderClass}>Cargo</th>
                <th className={tableHeaderClass}>Ingreso</th>
                <th className={tableHeaderClass}>Estado</th>
                <th className={tableHeaderClass}>Acciones</th>
              </tr>
            </thead>

            <tbody className="bg-white/40 backdrop-blur">
              {empleadosFiltrados.map((empleado) => (
                <tr
                  key={empleado.id_empleado}
                  className="transition hover:bg-white/70"
                >
                  <td className={tableCellClass}>{empleado.id_empleado}</td>

                  <td className="border border-white/30 px-4 py-3 text-sm font-extrabold text-slate-950">
                    {empleado.nombres} {empleado.apellidos}
                  </td>

                  <td className={tableCellClass}>{empleado.ci}</td>

                  <td className={tableCellClass}>
                    {empleado.telefono ?? "-"}
                  </td>

                  <td className={tableCellClass}>
                    {cargoMap.get(empleado.id_cargo) ?? "-"}
                  </td>

                  <td className={tableCellClass}>
                    {formatDate(empleado.fecha_ingreso)}
                  </td>

                  <td className={tableCellClass}>{empleado.estado}</td>

                  <td className="border border-white/30 px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {isAdmin && (
                        <Link
                          href={`/admin/empleados?editar=${empleado.id_empleado}`}
                          scroll={false}
                          className="rounded-lg bg-white/75 px-3 py-2 text-xs font-extrabold text-blue-900 shadow transition hover:bg-white"
                        >
                          Editar
                        </Link>
                      )}

                      {isAdmin && empleado.estado !== "inactivo" && (
                        <form action={eliminarEmpleado}>
                          <input
                            type="hidden"
                            name="id_empleado"
                            value={empleado.id_empleado}
                          />

                          <button
                            type="submit"
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-extrabold text-white shadow transition hover:bg-red-700"
                          >
                            Desactivar
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {empleadosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="border border-white/30 p-6 text-center font-semibold text-slate-700"
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