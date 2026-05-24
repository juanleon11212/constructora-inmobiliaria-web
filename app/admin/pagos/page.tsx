import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";
import { canDo } from "../../../lib/auth/permissions";
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

async function validarProyectoPago(
  tipo_pago: string,
  id_cliente: number | null,
  id_proyecto: number | null
) {
  if (tipo_pago !== "cliente" || !id_cliente || !id_proyecto) {
    return;
  }

  const proyecto = await prisma.proyecto.findUnique({
    where: {
      id_proyecto,
    },
  });

  if (!proyecto || proyecto.id_cliente !== id_cliente) {
    redirect("/admin/pagos?error=proyecto-no-pertenece");
  }
}

async function crearPago(formData: FormData) {
  "use server";

  const user = await requireModule("pagos");
  const roleName = getRoleName(user);

  if (!canDo(roleName, "pagos", "create")) {
    redirect("/admin/pagos");
  }

  const tipo_pago = getText(formData, "tipo_pago");
  const fecha_pago = getText(formData, "fecha_pago");
  const monto = Number(formData.get("monto"));
  const metodo_pago = getText(formData, "metodo_pago");
  const descripcion = getText(formData, "descripcion");

  const id_cliente = Number(formData.get("id_cliente")) || null;
  const id_empleado = Number(formData.get("id_empleado")) || null;
  const id_proveedor = Number(formData.get("id_proveedor")) || null;
  const id_proyecto = Number(formData.get("id_proyecto")) || null;

  if (!tipo_pago || !fecha_pago || !monto || !metodo_pago) {
    redirect("/admin/pagos?error=datos-obligatorios");
  }

  if (monto <= 0) {
    redirect("/admin/pagos?error=monto-invalido");
  }

  if (tipo_pago === "cliente" && !id_cliente) {
    redirect("/admin/pagos?error=cliente-requerido");
  }

  if (tipo_pago === "empleado" && !id_empleado) {
    redirect("/admin/pagos?error=empleado-requerido");
  }

  if (tipo_pago === "proveedor" && !id_proveedor) {
    redirect("/admin/pagos?error=proveedor-requerido");
  }

  await validarProyectoPago(tipo_pago, id_cliente, id_proyecto);

  const pagoCreado = await prisma.pago.create({
    data: {
      tipo_pago,
      fecha_pago: new Date(fecha_pago),
      monto,
      metodo_pago,
      descripcion: descripcion || null,
      id_cliente: tipo_pago === "cliente" ? id_cliente : null,
      id_empleado: tipo_pago === "empleado" ? id_empleado : null,
      id_proveedor: tipo_pago === "proveedor" ? id_proveedor : null,
      id_proyecto,
      id_usuario_registro: user.id_usuario ?? null,
    },
  });

  await createAuditLog({
    id_usuario: user.id_usuario ?? null,
    usuario: user.nombre_usuario ?? null,
    rol: roleName,
    accion: "CREAR",
    modulo: "Pagos",
    sector: "Registrar pago",
    descripcion: `Se registró un pago de Bs. ${monto}.`,
    registro_id: pagoCreado.id_pago,
  });

  revalidatePath("/admin/pagos");
  redirect("/admin/pagos");
}

async function editarPago(formData: FormData) {
  "use server";

  const user = await requireModule("pagos");
  const roleName = getRoleName(user);

  if (!canDo(roleName, "pagos", "edit")) {
    redirect("/admin/pagos");
  }

  const id_pago = Number(formData.get("id_pago"));

  if (!id_pago) {
    redirect("/admin/pagos?error=id-invalido");
  }

  const tipo_pago = getText(formData, "tipo_pago");
  const fecha_pago = getText(formData, "fecha_pago");
  const monto = Number(formData.get("monto"));
  const metodo_pago = getText(formData, "metodo_pago");
  const descripcion = getText(formData, "descripcion");

  const id_cliente = Number(formData.get("id_cliente")) || null;
  const id_empleado = Number(formData.get("id_empleado")) || null;
  const id_proveedor = Number(formData.get("id_proveedor")) || null;
  const id_proyecto = Number(formData.get("id_proyecto")) || null;

  if (!tipo_pago || !fecha_pago || !monto || !metodo_pago) {
    redirect(`/admin/pagos?editar=${id_pago}&error=datos-obligatorios`);
  }

  if (monto <= 0) {
    redirect(`/admin/pagos?editar=${id_pago}&error=monto-invalido`);
  }

  if (tipo_pago === "cliente" && !id_cliente) {
    redirect(`/admin/pagos?editar=${id_pago}&error=cliente-requerido`);
  }

  if (tipo_pago === "empleado" && !id_empleado) {
    redirect(`/admin/pagos?editar=${id_pago}&error=empleado-requerido`);
  }

  if (tipo_pago === "proveedor" && !id_proveedor) {
    redirect(`/admin/pagos?editar=${id_pago}&error=proveedor-requerido`);
  }

  await validarProyectoPago(tipo_pago, id_cliente, id_proyecto);

  await prisma.pago.update({
    where: {
      id_pago,
    },
    data: {
      tipo_pago,
      fecha_pago: new Date(fecha_pago),
      monto,
      metodo_pago,
      descripcion: descripcion || null,
      id_cliente: tipo_pago === "cliente" ? id_cliente : null,
      id_empleado: tipo_pago === "empleado" ? id_empleado : null,
      id_proveedor: tipo_pago === "proveedor" ? id_proveedor : null,
      id_proyecto,
    },
  });

  await createAuditLog({
    id_usuario: user.id_usuario ?? null,
    usuario: user.nombre_usuario ?? null,
    rol: roleName,
    accion: "EDITAR",
    modulo: "Pagos",
    sector: "Editar pago",
    descripcion: `Se editó el pago con ID ${id_pago}.`,
    registro_id: id_pago,
  });

  revalidatePath("/admin/pagos");
  redirect("/admin/pagos");
}

export default async function PagosPage({ searchParams }: PageProps) {
  const user = await requireModule("pagos");
  const params = await searchParams;

  const roleName = getRoleName(user);

  const canCreatePayment = canDo(roleName, "pagos", "create");
  const canEditPayment = canDo(roleName, "pagos", "edit");

  const idEditar = Number(params?.editar);

  const filtroActivo = params?.filtro === "1";
  const campoFiltro = String(params?.campo ?? "").trim();
  const valorFiltro = String(params?.valor ?? "").trim();
  const hayFiltro = Boolean(campoFiltro && valorFiltro);

  const opcionesFiltroPagos: FilterOption[] = [
    { value: "id_pago", label: "ID pago", placeholder: "Ejemplo: 1" },
    { value: "tipo_pago", label: "Tipo de pago", placeholder: "cliente" },
    { value: "fecha_pago", label: "Fecha", placeholder: "2026-05-20" },
    { value: "monto", label: "Monto", placeholder: "1500" },
    { value: "metodo_pago", label: "Método", placeholder: "efectivo" },
    { value: "relacionado", label: "Relacionado", placeholder: "Juan" },
    { value: "proyecto", label: "Proyecto", placeholder: "edificio" },
  ];

  const [pagos, clientes, empleados, proveedores, proyectos] = await Promise.all([
    prisma.pago.findMany({
      orderBy: {
        id_pago: "desc",
      },
    }),

    prisma.cliente.findMany({
      orderBy: {
        id_cliente: "asc",
      },
    }),

    prisma.empleado.findMany({
      orderBy: {
        id_empleado: "asc",
      },
    }),

    prisma.proveedor.findMany({
      orderBy: {
        id_proveedor: "asc",
      },
    }),

    prisma.proyecto.findMany({
      where: {
        estado: {
          not: "eliminado",
        },
      },
      orderBy: {
        id_proyecto: "asc",
      },
    }),
  ]);

  const pagoEditar =
    idEditar && canEditPayment
      ? await prisma.pago.findUnique({
          where: {
            id_pago: idEditar,
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

  const empleadoMap = new Map(
    empleados.map((empleado) => [
      empleado.id_empleado,
      `${empleado.nombres} ${empleado.apellidos}`.trim(),
    ])
  );

  const proveedorMap = new Map(
    proveedores.map((proveedor) => [
      proveedor.id_proveedor,
      proveedor.nombre_proveedor,
    ])
  );

  const proyectoMap = new Map(
    proyectos.map((proyecto) => [proyecto.id_proyecto, proyecto.nombre_proyecto])
  );

  const pagosFiltrados = pagos.filter((pago) => {
    if (!hayFiltro) return true;

    const relacionado = pago.id_cliente
      ? clienteMap.get(pago.id_cliente)
      : pago.id_empleado
      ? empleadoMap.get(pago.id_empleado)
      : pago.id_proveedor
      ? proveedorMap.get(pago.id_proveedor)
      : "-";

    if (campoFiltro === "id_pago") return equalsText(pago.id_pago, valorFiltro);
    if (campoFiltro === "tipo_pago") return containsText(pago.tipo_pago, valorFiltro);
    if (campoFiltro === "fecha_pago") return containsText(formatDate(pago.fecha_pago), valorFiltro);
    if (campoFiltro === "monto") return containsText(pago.monto, valorFiltro);
    if (campoFiltro === "metodo_pago") return containsText(pago.metodo_pago, valorFiltro);
    if (campoFiltro === "relacionado") return containsText(relacionado, valorFiltro);
    if (campoFiltro === "proyecto") {
      return containsText(
        pago.id_proyecto ? proyectoMap.get(pago.id_proyecto) : "-",
        valorFiltro
      );
    }

    return true;
  });

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-fixed p-6"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.62) 36%, rgba(255,255,255,0.12) 100%), url('/images/pagos.jpg')",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-white drop-shadow">
              <p className="text-sm font-bold text-blue-100">Módulo Pagos</p>

              <h1 className="text-4xl font-extrabold tracking-tight">Pagos</h1>

              <p className="mt-1 text-sm font-medium text-blue-100">
                Registro y control de pagos de clientes, empleados y proveedores.
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
              "Tipo, fecha, monto y método de pago son obligatorios."}

            {params.error === "monto-invalido" && "El monto debe ser mayor a cero."}

            {params.error === "cliente-requerido" &&
              "Debes seleccionar un cliente para este tipo de pago."}

            {params.error === "empleado-requerido" &&
              "Debes seleccionar un empleado para este tipo de pago."}

            {params.error === "proveedor-requerido" &&
              "Debes seleccionar un proveedor para este tipo de pago."}

            {params.error === "proyecto-no-pertenece" &&
              "El proyecto seleccionado no pertenece al cliente indicado."}

            {params.error === "id-invalido" && "El ID del pago no es válido."}
          </div>
        )}

        {canCreatePayment && !pagoEditar && (
          <section className="mt-6 rounded-[28px] border border-white/40 bg-white/30 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
            <h2 className="text-2xl font-extrabold text-white drop-shadow">
              Registrar pago
            </h2>

            <form action={crearPago} className="mt-5 grid gap-4 md:grid-cols-2">
              <select name="tipo_pago" className={inputClass}>
                <option value="">Tipo de pago *</option>
                <option value="cliente">Cliente</option>
                <option value="empleado">Empleado</option>
                <option value="proveedor">Proveedor</option>
              </select>

              <input type="date" name="fecha_pago" className={inputClass} />

              <input
                type="number"
                step="0.01"
                name="monto"
                placeholder="Monto *"
                className={inputClass}
              />

              <input
                name="metodo_pago"
                placeholder="Método de pago *"
                className={inputClass}
              />

              <select name="id_cliente" className={inputClass}>
                <option value="">Cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id_cliente} value={cliente.id_cliente}>
                    {clienteMap.get(cliente.id_cliente)}
                  </option>
                ))}
              </select>

              <select name="id_empleado" className={inputClass}>
                <option value="">Empleado</option>
                {empleados.map((empleado) => (
                  <option key={empleado.id_empleado} value={empleado.id_empleado}>
                    {empleadoMap.get(empleado.id_empleado)}
                  </option>
                ))}
              </select>

              <select name="id_proveedor" className={inputClass}>
                <option value="">Proveedor</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor.id_proveedor} value={proveedor.id_proveedor}>
                    {proveedor.nombre_proveedor}
                  </option>
                ))}
              </select>

              <select name="id_proyecto" className={inputClass}>
                <option value="">Proyecto relacionado</option>
                {proyectos.map((proyecto) => (
                  <option key={proyecto.id_proyecto} value={proyecto.id_proyecto}>
                    {proyecto.nombre_proyecto}
                  </option>
                ))}
              </select>

              <textarea
                name="descripcion"
                placeholder="Descripción"
                rows={4}
                className={`${inputClass} md:col-span-2`}
              />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-blue-800 to-sky-600 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/30 transition hover:from-blue-950 hover:to-sky-700"
                >
                  Registrar pago
                </button>
              </div>
            </form>
          </section>
        )}

        {pagoEditar && (
          <section className="mt-6 rounded-[28px] border border-white/40 bg-white/30 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-white drop-shadow">
                Editar pago
              </h2>

              <Link
                href="/admin/pagos"
                scroll={false}
                className="rounded-xl border border-white/40 bg-white/70 px-4 py-2 text-sm font-extrabold text-blue-900 transition hover:bg-white"
              >
                Cancelar
              </Link>
            </div>

            <form action={editarPago} className="mt-5 grid gap-4 md:grid-cols-2">
              <input type="hidden" name="id_pago" defaultValue={pagoEditar.id_pago} />

              <select
                name="tipo_pago"
                defaultValue={pagoEditar.tipo_pago}
                className={inputClass}
              >
                <option value="cliente">Cliente</option>
                <option value="empleado">Empleado</option>
                <option value="proveedor">Proveedor</option>
              </select>

              <input
                type="date"
                name="fecha_pago"
                defaultValue={formatDate(pagoEditar.fecha_pago)}
                className={inputClass}
              />

              <input
                type="number"
                step="0.01"
                name="monto"
                defaultValue={pagoEditar.monto.toString()}
                className={inputClass}
              />

              <input
                name="metodo_pago"
                defaultValue={pagoEditar.metodo_pago}
                className={inputClass}
              />

              <select
                name="id_cliente"
                defaultValue={pagoEditar.id_cliente ?? ""}
                className={inputClass}
              >
                <option value="">Cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id_cliente} value={cliente.id_cliente}>
                    {clienteMap.get(cliente.id_cliente)}
                  </option>
                ))}
              </select>

              <select
                name="id_empleado"
                defaultValue={pagoEditar.id_empleado ?? ""}
                className={inputClass}
              >
                <option value="">Empleado</option>
                {empleados.map((empleado) => (
                  <option key={empleado.id_empleado} value={empleado.id_empleado}>
                    {empleadoMap.get(empleado.id_empleado)}
                  </option>
                ))}
              </select>

              <select
                name="id_proveedor"
                defaultValue={pagoEditar.id_proveedor ?? ""}
                className={inputClass}
              >
                <option value="">Proveedor</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor.id_proveedor} value={proveedor.id_proveedor}>
                    {proveedor.nombre_proveedor}
                  </option>
                ))}
              </select>

              <select
                name="id_proyecto"
                defaultValue={pagoEditar.id_proyecto ?? ""}
                className={inputClass}
              >
                <option value="">Proyecto relacionado</option>
                {proyectos.map((proyecto) => (
                  <option key={proyecto.id_proyecto} value={proyecto.id_proyecto}>
                    {proyecto.nombre_proyecto}
                  </option>
                ))}
              </select>

              <textarea
                name="descripcion"
                defaultValue={pagoEditar.descripcion ?? ""}
                placeholder="Descripción"
                rows={4}
                className={`${inputClass} md:col-span-2`}
              />

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
            basePath="/admin/pagos"
            title="Filtro de pagos"
            currentLabel="Pagos"
            options={opcionesFiltroPagos}
            filtroActivo={filtroActivo}
            campoFiltro={campoFiltro}
            valorFiltro={valorFiltro}
            resultados={pagosFiltrados.length}
          />
        </div>

        <section className="mt-6 overflow-x-auto rounded-[28px] border border-white/40 bg-white/35 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <div className="px-5 py-4">
            <h2 className="text-2xl font-extrabold text-white drop-shadow">
              Lista de pagos registrados
            </h2>

            <p className="mt-1 text-sm font-bold text-blue-100">
              Registros visibles: {pagosFiltrados.length}
            </p>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead className="bg-white/70 backdrop-blur">
              <tr>
                <th className={tableHeaderClass}>ID</th>
                <th className={tableHeaderClass}>Tipo</th>
                <th className={tableHeaderClass}>Fecha</th>
                <th className={tableHeaderClass}>Monto</th>
                <th className={tableHeaderClass}>Método</th>
                <th className={tableHeaderClass}>Relacionado</th>
                <th className={tableHeaderClass}>Proyecto</th>
                <th className={tableHeaderClass}>Acciones</th>
              </tr>
            </thead>

            <tbody className="bg-white/40 backdrop-blur">
              {pagosFiltrados.map((pago) => {
                const relacionado = pago.id_cliente
                  ? clienteMap.get(pago.id_cliente)
                  : pago.id_empleado
                  ? empleadoMap.get(pago.id_empleado)
                  : pago.id_proveedor
                  ? proveedorMap.get(pago.id_proveedor)
                  : "-";

                return (
                  <tr key={pago.id_pago} className="transition hover:bg-white/70">
                    <td className={tableCellClass}>{pago.id_pago}</td>
                    <td className={tableCellClass}>{pago.tipo_pago}</td>
                    <td className={tableCellClass}>{formatDate(pago.fecha_pago)}</td>
                    <td className="border border-white/30 px-4 py-3 text-sm font-extrabold text-slate-950">
                      Bs. {pago.monto.toString()}
                    </td>
                    <td className={tableCellClass}>{pago.metodo_pago}</td>
                    <td className={tableCellClass}>{relacionado}</td>
                    <td className={tableCellClass}>
                      {pago.id_proyecto
                        ? proyectoMap.get(pago.id_proyecto) ?? "-"
                        : "-"}
                    </td>
                    <td className="border border-white/30 px-4 py-3">
                      {canEditPayment && (
                        <Link
                          href={`/admin/pagos?editar=${pago.id_pago}`}
                          scroll={false}
                          className="rounded-lg bg-white/75 px-3 py-2 text-xs font-extrabold text-blue-900 shadow transition hover:bg-white"
                        >
                          Editar
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}

              {pagosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="border border-white/30 p-6 text-center font-semibold text-slate-700"
                  >
                    No hay pagos registrados.
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