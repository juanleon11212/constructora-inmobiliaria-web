import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";
import { canDo } from "../../../lib/auth/permissions";
/*
  MÓDULO PAGOS

  Ruta:
  /admin/pagos

  Qué hace:
  - Administrador puede ver todos los pagos.
  - Administrador puede registrar pagos.
  - Cliente solo ve pagos relacionados con su id_cliente.

  Regla importante:
  En un pago solo se debe llenar uno de estos:
  - id_cliente
  - id_empleado
  - id_proveedor

  id_proyecto es opcional y puede acompañar a cualquiera.
*/

type PageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

/*
  Lee texto limpio desde FormData.
*/
function getText(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

/*
  Obtiene el nombre del rol de forma segura.
*/
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

/*
  CREAR PAGO

  Solo el administrador puede registrar pagos.
*/
async function crearPago(formData: FormData) {
  "use server";

  const user = await requireModule("pagos");
  const roleName = getRoleName(user);

  if (roleName !== "Administrador") {
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

  /*
    Validación lógica:
    Si tipo_pago es cliente, debe seleccionar cliente.
    Si tipo_pago es empleado, debe seleccionar empleado.
    Si tipo_pago es proveedor, debe seleccionar proveedor.
  */
  if (tipo_pago === "cliente" && !id_cliente) {
    redirect("/admin/pagos?error=cliente-requerido");
  }

  if (tipo_pago === "empleado" && !id_empleado) {
    redirect("/admin/pagos?error=empleado-requerido");
  }

  if (tipo_pago === "proveedor" && !id_proveedor) {
    redirect("/admin/pagos?error=proveedor-requerido");
  }

  /*
    Solo se guarda una relación principal según el tipo de pago.
    Esto evita llenar cliente, empleado y proveedor al mismo tiempo.
  */
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

export default async function PagosPage({ searchParams }: PageProps) {
  /*
    Protege el módulo pagos.
  */
  const user = await requireModule("pagos");
  const params = await searchParams;

  const roleName = getRoleName(user);

  /*
    Administrador:
    - ve todos los pagos
    - registra pagos

    Cliente:
    - solo ve pagos donde id_cliente = user.id_cliente
  */
 const isAdmin = roleName === "Administrador";
const isCliente = roleName === "Cliente";
const idClienteLogueado = user.id_cliente ?? 0;

const canCreatePago = canDo(roleName, "pagos", "create");
  /*
    Carga pagos y datos relacionados.
    Si el usuario es cliente, se filtran pagos, clientes y proyectos.
  */
  const [pagos, clientes, empleados, proveedores, proyectos] =
    await Promise.all([
      prisma.pago.findMany({
        where: isCliente
          ? {
              id_cliente: idClienteLogueado,
            }
          : undefined,
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

  /*
    Mapas para mostrar nombres en lugar de IDs.
  */
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

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Módulo Pagos
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              {isCliente ? "Mis pagos" : "Pagos"}
            </h1>

            <p className="mt-1 text-slate-600">
              {isCliente
                ? "Consulta los pagos relacionados con tu cuenta."
                : "Registro de pagos y cobros del sistema."}
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            Volver al panel
          </Link>
        </div>

        {/* Errores */}
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
          </div>
        )}

        {/* Formulario crear pago */}
        {canCreatePago && (
           <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold text-slate-900">
              Registrar pago
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Selecciona el tipo de pago y relaciona solo una entidad principal:
              cliente, empleado o proveedor.
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

        {/* Tabla de pagos */}
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
              </tr>
            </thead>

            <tbody>
              {pagos.map((pago) => {
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
                      {new Date(pago.fecha_pago).toISOString().slice(0, 10)}
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
                  </tr>
                );
              })}

              {pagos.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
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