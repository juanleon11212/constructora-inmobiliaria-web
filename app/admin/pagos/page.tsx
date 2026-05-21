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

/*
  MÓDULO PAGOS

  Ruta:
  /admin/pagos

  Permisos:
  - Administrador: ve, crea y edita pagos.
  - Contabilidad: ve, crea y edita pagos.
  - Compras: solo ve pagos de proveedores.
  - Cliente: solo ve sus propios pagos.

  Incluye:
  - Filtro por ID, tipo, fecha, monto, método, relacionado, proyecto y descripción.
  - El filtro no vuelve al inicio porque TableFilter usa scroll false.
  - Editar y cancelar también usan scroll false.
*/

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

async function validarProyectoPago(
  tipo_pago: string,
  id_cliente: number | null,
  id_proyecto: number | null
) {
  if (!id_proyecto) return;

  const proyecto = await prisma.proyecto.findUnique({
    where: {
      id_proyecto,
    },
    select: {
      id_cliente: true,
    },
  });

  if (!proyecto) {
    redirect("/admin/pagos?error=proyecto-invalido");
  }

  if (tipo_pago === "cliente" && id_cliente) {
    if (proyecto.id_cliente !== id_cliente) {
      redirect("/admin/pagos?error=proyecto-no-corresponde");
    }
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

  if (Number.isNaN(monto) || monto <= 0) {
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

  await prisma.pago.create({
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

  if (Number.isNaN(monto) || monto <= 0) {
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

  revalidatePath("/admin/pagos");
  redirect("/admin/pagos");
}

export default async function PagosPage({ searchParams }: PageProps) {
  const user = await requireModule("pagos");
  const params = await searchParams;

  const roleName = getRoleName(user);

  const isCliente = roleName === "Cliente";
  const isCompras = roleName === "Compras";
  const idClienteLogueado = user.id_cliente ?? 0;

  const canCreatePago = canDo(roleName, "pagos", "create");
  const canEditPago = canDo(roleName, "pagos", "edit");

  const idEditar = Number(params?.editar);

  const filtroActivo = params?.filtro === "1";
  const campoFiltro = String(params?.campo ?? "").trim();
  const valorFiltro = String(params?.valor ?? "").trim();
  const hayFiltro = Boolean(campoFiltro && valorFiltro);

  const opcionesFiltroPagos: FilterOption[] = [
    {
      value: "id_pago",
      label: "ID pago",
      placeholder: "Ejemplo: 1",
    },
    {
      value: "tipo_pago",
      label: "Tipo de pago",
      placeholder: "Ejemplo: cliente",
    },
    {
      value: "fecha_pago",
      label: "Fecha pago",
      placeholder: "Ejemplo: 2026-05-20",
    },
    {
      value: "monto",
      label: "Monto",
      placeholder: "Ejemplo: 1500",
    },
    {
      value: "metodo_pago",
      label: "Método de pago",
      placeholder: "Ejemplo: efectivo",
    },
    {
      value: "relacionado",
      label: "Cliente / Empleado / Proveedor",
      placeholder: "Ejemplo: Juan",
    },
    {
      value: "proyecto",
      label: "Proyecto",
      placeholder: "Ejemplo: Edificio",
    },
    {
      value: "descripcion",
      label: "Descripción",
      placeholder: "Ejemplo: anticipo",
    },
  ];

  const pagosWhere = isCliente
    ? {
        id_cliente: idClienteLogueado,
      }
    : isCompras
    ? {
        tipo_pago: "proveedor",
      }
    : undefined;

  const [pagos, clientes, empleados, proveedores, proyectos] =
    await Promise.all([
      prisma.pago.findMany({
        where: pagosWhere,
        orderBy: {
          id_pago: "desc",
        },
      }),

      prisma.cliente.findMany({
        where: isCliente
          ? {
              id_cliente: idClienteLogueado,
            }
          : undefined,
      }),

      prisma.empleado.findMany(),

      prisma.proveedor.findMany(),

      prisma.proyecto.findMany({
        where: isCliente
          ? {
              id_cliente: idClienteLogueado,
            }
          : undefined,
      }),
    ]);

  const pagoEditar =
    idEditar && canEditPago
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
      `${empleado.nombres} ${empleado.apellidos}`,
    ])
  );

  const proveedorMap = new Map(
    proveedores.map((proveedor) => [
      proveedor.id_proveedor,
      proveedor.nombre_proveedor,
    ])
  );

  const proyectoMap = new Map(
    proyectos.map((proyecto) => [
      proyecto.id_proyecto,
      proyecto.nombre_proyecto,
    ])
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

    if (campoFiltro === "id_pago") {
      return equalsText(pago.id_pago, valorFiltro);
    }

    if (campoFiltro === "tipo_pago") {
      return containsText(pago.tipo_pago, valorFiltro);
    }

    if (campoFiltro === "fecha_pago") {
      return containsText(formatDate(pago.fecha_pago), valorFiltro);
    }

    if (campoFiltro === "monto") {
      return containsText(pago.monto, valorFiltro);
    }

    if (campoFiltro === "metodo_pago") {
      return containsText(pago.metodo_pago, valorFiltro);
    }

    if (campoFiltro === "relacionado") {
      return containsText(relacionado, valorFiltro);
    }

    if (campoFiltro === "proyecto") {
      return containsText(
        pago.id_proyecto ? proyectoMap.get(pago.id_proyecto) : "-",
        valorFiltro
      );
    }

    if (campoFiltro === "descripcion") {
      return containsText(pago.descripcion, valorFiltro);
    }

    return true;
  });

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">Módulo Pagos</p>

            <h1 className="text-3xl font-bold text-slate-900">
              {isCliente ? "Mis pagos" : "Pagos"}
            </h1>

            <p className="mt-1 text-slate-600">
              {isCliente
                ? "Consulta los pagos relacionados con tu cuenta."
                : isCompras
                ? "Consulta pagos relacionados a proveedores."
                : "Registro y control de pagos del sistema."}
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
              "Tipo de pago, fecha, monto y método son obligatorios."}

            {params.error === "monto-invalido" &&
              "El monto debe ser mayor a cero."}

            {params.error === "cliente-requerido" &&
              "Para tipo de pago Cliente, debes seleccionar un cliente."}

            {params.error === "empleado-requerido" &&
              "Para tipo de pago Empleado, debes seleccionar un empleado."}

            {params.error === "proveedor-requerido" &&
              "Para tipo de pago Proveedor, debes seleccionar un proveedor."}

            {params.error === "proyecto-invalido" &&
              "El proyecto seleccionado no existe."}

            {params.error === "proyecto-no-corresponde" &&
              "El proyecto seleccionado no pertenece al cliente elegido."}

            {params.error === "id-invalido" &&
              "El ID del pago no es válido."}
          </div>
        )}

        {canCreatePago && !pagoEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Registrar pago
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Este formulario puede usarlo Administración o Contabilidad.
            </p>

            <form action={crearPago} className="mt-5 grid gap-4 md:grid-cols-2">
              <select
                name="tipo_pago"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Tipo de pago *</option>
                <option value="cliente">Cliente</option>
                <option value="empleado">Empleado</option>
                <option value="proveedor">Proveedor</option>
              </select>

              <select
                name="metodo_pago"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Método *</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="deposito">Depósito</option>
                <option value="cheque">Cheque</option>
              </select>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha de pago *
                </label>

                <input
                  type="date"
                  name="fecha_pago"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <input
                type="number"
                step="0.01"
                name="monto"
                placeholder="Monto *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <select
                name="id_cliente"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Cliente relacionado</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id_cliente} value={cliente.id_cliente}>
                    {clienteMap.get(cliente.id_cliente)}
                  </option>
                ))}
              </select>

              <select
                name="id_empleado"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Empleado relacionado</option>
                {empleados.map((empleado) => (
                  <option
                    key={empleado.id_empleado}
                    value={empleado.id_empleado}
                  >
                    {empleado.nombres} {empleado.apellidos}
                  </option>
                ))}
              </select>

              <select
                name="id_proveedor"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Proveedor relacionado</option>
                {proveedores.map((proveedor) => (
                  <option
                    key={proveedor.id_proveedor}
                    value={proveedor.id_proveedor}
                  >
                    {proveedor.nombre_proveedor}
                  </option>
                ))}
              </select>

              <select
                name="id_proyecto"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Proyecto relacionado opcional</option>
                {proyectos.map((proyecto) => (
                  <option
                    key={proyecto.id_proyecto}
                    value={proyecto.id_proyecto}
                  >
                    {proyecto.nombre_proyecto}
                  </option>
                ))}
              </select>

              <input
                name="descripcion"
                placeholder="Descripción"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-2"
              />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Registrar pago
                </button>
              </div>
            </form>
          </section>
        )}

        {canEditPago && pagoEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Editar pago
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Actualiza los datos del pago seleccionado.
                </p>
              </div>

              <Link
                href="/admin/pagos"
                scroll={false}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </Link>
            </div>

            <form action={editarPago} className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                type="hidden"
                name="id_pago"
                defaultValue={pagoEditar.id_pago}
              />

              <select
                name="tipo_pago"
                defaultValue={pagoEditar.tipo_pago}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="cliente">Cliente</option>
                <option value="empleado">Empleado</option>
                <option value="proveedor">Proveedor</option>
              </select>

              <select
                name="metodo_pago"
                defaultValue={pagoEditar.metodo_pago}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="deposito">Depósito</option>
                <option value="cheque">Cheque</option>
              </select>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha de pago *
                </label>

                <input
                  type="date"
                  name="fecha_pago"
                  defaultValue={new Date(pagoEditar.fecha_pago)
                    .toISOString()
                    .slice(0, 10)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <input
                type="number"
                step="0.01"
                name="monto"
                placeholder="Monto *"
                defaultValue={pagoEditar.monto.toString()}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <select
                name="id_cliente"
                defaultValue={pagoEditar.id_cliente ?? ""}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Cliente relacionado</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id_cliente} value={cliente.id_cliente}>
                    {clienteMap.get(cliente.id_cliente)}
                  </option>
                ))}
              </select>

              <select
                name="id_empleado"
                defaultValue={pagoEditar.id_empleado ?? ""}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Empleado relacionado</option>
                {empleados.map((empleado) => (
                  <option
                    key={empleado.id_empleado}
                    value={empleado.id_empleado}
                  >
                    {empleado.nombres} {empleado.apellidos}
                  </option>
                ))}
              </select>

              <select
                name="id_proveedor"
                defaultValue={pagoEditar.id_proveedor ?? ""}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Proveedor relacionado</option>
                {proveedores.map((proveedor) => (
                  <option
                    key={proveedor.id_proveedor}
                    value={proveedor.id_proveedor}
                  >
                    {proveedor.nombre_proveedor}
                  </option>
                ))}
              </select>

              <select
                name="id_proyecto"
                defaultValue={pagoEditar.id_proyecto ?? ""}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Proyecto relacionado opcional</option>
                {proyectos.map((proyecto) => (
                  <option
                    key={proyecto.id_proyecto}
                    value={proyecto.id_proyecto}
                  >
                    {proyecto.nombre_proyecto}
                  </option>
                ))}
              </select>

              <input
                name="descripcion"
                placeholder="Descripción"
                defaultValue={pagoEditar.descripcion ?? ""}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-2"
              />

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

        <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-200">
              <tr>
                <th className="border p-3 text-left">ID</th>
                <th className="border p-3 text-left">Tipo</th>
                <th className="border p-3 text-left">Fecha</th>
                <th className="border p-3 text-left">Monto</th>
                <th className="border p-3 text-left">Método</th>
                <th className="border p-3 text-left">Relacionado</th>
                <th className="border p-3 text-left">Proyecto</th>
                <th className="border p-3 text-left">Descripción</th>
                {canEditPago && (
                  <th className="border p-3 text-left">Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {pagosFiltrados.map((pago) => {
                const relacionado = pago.id_cliente
                  ? clienteMap.get(pago.id_cliente)
                  : pago.id_empleado
                  ? empleadoMap.get(pago.id_empleado)
                  : pago.id_proveedor
                  ? proveedorMap.get(pago.id_proveedor)
                  : "-";

                return (
                  <tr key={pago.id_pago} className="hover:bg-slate-50">
                    <td className="border p-3">{pago.id_pago}</td>

                    <td className="border p-3">{pago.tipo_pago}</td>

                    <td className="border p-3">
                      {formatDate(pago.fecha_pago)}
                    </td>

                    <td className="border p-3">
                      Bs. {pago.monto.toString()}
                    </td>

                    <td className="border p-3">{pago.metodo_pago}</td>

                    <td className="border p-3">{relacionado}</td>

                    <td className="border p-3">
                      {pago.id_proyecto
                        ? proyectoMap.get(pago.id_proyecto) ?? "-"
                        : "-"}
                    </td>

                    <td className="border p-3">
                      {pago.descripcion ?? "-"}
                    </td>

                    {canEditPago && (
                      <td className="border p-3">
                        <Link
                          href={`/admin/pagos?editar=${pago.id_pago}`}
                          scroll={false}
                          className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Editar
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              })}

              {pagosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={canEditPago ? 9 : 8}
                    className="border p-6 text-center text-slate-500"
                  >
                    {isCliente
                      ? "No tienes pagos registrados."
                      : "No hay pagos registrados."}
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