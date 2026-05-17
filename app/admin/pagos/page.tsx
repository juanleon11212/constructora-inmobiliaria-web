import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";

/*
  MÓDULO PAGOS

  Ruta:
  /admin/pagos

  Qué hace:
  - Lista pagos.
  - Crea pagos.
  - Los pagos pueden ser de cliente, empleado o proveedor.
*/

type PageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getText(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

async function crearPago(formData: FormData) {
  "use server";

  const user = await requireModule("pagos");

  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

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

  await prisma.pago.create({
    data: {
      tipo_pago,
      fecha_pago: new Date(fecha_pago),
      monto,
      metodo_pago,
      descripcion: descripcion || null,
      id_cliente,
      id_empleado,
      id_proveedor,
      id_proyecto,
      id_usuario_registro: user.id_usuario ?? null,
    },
  });

  revalidatePath("/admin/pagos");
  redirect("/admin/pagos");
}

export default async function PagosPage({ searchParams }: PageProps) {
  const user = await requireModule("pagos");
  const params = await searchParams;

  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

  const isAdmin = roleName === "Administrador";

  const [pagos, clientes, empleados, proveedores, proyectos] =
    await Promise.all([
      prisma.pago.findMany({
        orderBy: {
          id_pago: "desc",
        },
      }),
      prisma.cliente.findMany(),
      prisma.empleado.findMany(),
      prisma.proveedor.findMany(),
      prisma.proyecto.findMany(),
    ]);

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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">Módulo Pagos</p>
            <h1 className="text-3xl font-bold text-slate-900">Pagos</h1>
            <p className="mt-1 text-slate-600">
              Registro de pagos y cobros del sistema.
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
          </div>
        )}

        {isAdmin && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Crear pago</h2>

            <p className="mt-1 text-sm text-slate-500">
              Este formulario guarda un movimiento en la tabla pago.
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

              <input
                type="date"
                name="fecha_pago"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

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
                  <option key={empleado.id_empleado} value={empleado.id_empleado}>
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
                <option value="">Proyecto relacionado</option>
                {proyectos.map((proyecto) => (
                  <option key={proyecto.id_proyecto} value={proyecto.id_proyecto}>
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
              </tr>
            </thead>

            <tbody>
              {pagos.map((pago) => {
                const relacionado =
                  pago.id_cliente
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
                    <td className="border p-3">{pago.monto.toString()}</td>
                    <td className="border p-3">{pago.metodo_pago}</td>
                    <td className="border p-3">{relacionado}</td>
                    <td className="border p-3">
                      {pago.id_proyecto
                        ? proyectoMap.get(pago.id_proyecto) ?? "-"
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}