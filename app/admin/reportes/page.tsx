import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";

/*
  MÓDULO REPORTES

  Ruta:
  /admin/reportes

  Los reportes no necesitan una tabla llamada "reportes".
  Se calculan con datos de las tablas existentes:

  - cliente
  - empleado
  - proyecto
  - material
  - inventario
  - pago
  - proveedor

  Cada rol ve reportes distintos según su responsabilidad.
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

export default async function ReportesPage() {
  const user = await requireModule("reportes");
  const roleName = getRoleName(user);

  const isAdmin = roleName === "Administrador";
  const isContabilidad = roleName === "Contabilidad";
  const isObra = roleName === "Encargado de Obra";
  const isAlmacen = roleName === "Almacen" || roleName === "Almacén";
  const isRRHH = roleName === "Recursos Humanos";
  const isCompras = roleName === "Compras";

  const [
    totalClientes,
    totalEmpleados,
    totalEmpleadosActivos,
    totalEmpleadosInactivos,
    totalProyectos,
    totalMateriales,
    totalProveedores,
    totalPagos,
    totalPagosProveedor,
    sumaPagos,
    sumaPagosProveedor,
    proyectosRecientes,
    pagosRecientes,
    pagosProveedorRecientes,
    empleadosRecientes,
    materialesRecientes,
    inventarioReciente,
    materiales,
    almacenes,
  ] = await Promise.all([
    prisma.cliente.count(),

    prisma.empleado.count(),

    prisma.empleado.count({
      where: {
        estado: "activo",
      },
    }),

    prisma.empleado.count({
      where: {
        estado: "inactivo",
      },
    }),

    prisma.proyecto.count({
      where: {
        estado: {
          not: "eliminado",
        },
      },
    }),

    prisma.material.count(),

    prisma.proveedor.count(),

    prisma.pago.count(),

    prisma.pago.count({
      where: {
        tipo_pago: "proveedor",
      },
    }),

    prisma.pago.aggregate({
      _sum: {
        monto: true,
      },
    }),

    prisma.pago.aggregate({
      where: {
        tipo_pago: "proveedor",
      },
      _sum: {
        monto: true,
      },
    }),

    prisma.proyecto.findMany({
      where: {
        estado: {
          not: "eliminado",
        },
      },
      orderBy: {
        id_proyecto: "desc",
      },
      take: 5,
    }),

    prisma.pago.findMany({
      orderBy: {
        id_pago: "desc",
      },
      take: 5,
    }),

    prisma.pago.findMany({
      where: {
        tipo_pago: "proveedor",
      },
      orderBy: {
        id_pago: "desc",
      },
      take: 5,
    }),

    prisma.empleado.findMany({
      orderBy: {
        id_empleado: "desc",
      },
      take: 5,
    }),

    prisma.material.findMany({
      orderBy: {
        id_material: "desc",
      },
      take: 5,
    }),

    prisma.inventario.findMany({
      orderBy: {
        id_inventario: "desc",
      },
      take: 5,
    }),

    prisma.material.findMany(),

    prisma.almacen.findMany(),
  ]);

  const materialMap = new Map(
    materiales.map((material) => [material.id_material, material.nombre_material])
  );

  const almacenMap = new Map(
    almacenes.map((almacen) => [almacen.id_almacen, almacen.nombre_almacen])
  );

  const cards = [];

  if (isAdmin) {
    cards.push(
      {
        title: "Clientes",
        value: totalClientes,
        description: "Clientes registrados",
      },
      {
        title: "Empleados",
        value: totalEmpleados,
        description: "Personal registrado",
      },
      {
        title: "Proyectos",
        value: totalProyectos,
        description: "Proyectos activos o visibles",
      },
      {
        title: "Materiales",
        value: totalMateriales,
        description: "Materiales registrados",
      },
      {
        title: "Pagos",
        value: totalPagos,
        description: "Movimientos registrados",
      },
      {
        title: "Total pagado",
        value: `Bs. ${sumaPagos._sum.monto?.toString() ?? "0"}`,
        description: "Suma total de pagos",
      }
    );
  }

  if (isContabilidad) {
    cards.push(
      {
        title: "Pagos",
        value: totalPagos,
        description: "Pagos registrados para consulta",
      },
      {
        title: "Total pagado",
        value: `Bs. ${sumaPagos._sum.monto?.toString() ?? "0"}`,
        description: "Suma total de pagos",
      },
      {
        title: "Clientes",
        value: totalClientes,
        description: "Clientes para consulta contable",
      },
      {
        title: "Proyectos",
        value: totalProyectos,
        description: "Proyectos con relación financiera",
      }
    );
  }

  if (isObra) {
    cards.push(
      {
        title: "Proyectos",
        value: totalProyectos,
        description: "Proyectos visibles para obra",
      },
      {
        title: "Materiales",
        value: totalMateriales,
        description: "Materiales disponibles para consulta",
      }
    );
  }

  if (isAlmacen) {
    cards.push(
      {
        title: "Materiales",
        value: totalMateriales,
        description: "Materiales registrados",
      },
      {
        title: "Inventario",
        value: inventarioReciente.length,
        description: "Movimientos o registros recientes de inventario",
      }
    );
  }

  if (isRRHH) {
    cards.push(
      {
        title: "Empleados",
        value: totalEmpleados,
        description: "Total de personal registrado",
      },
      {
        title: "Activos",
        value: totalEmpleadosActivos,
        description: "Empleados activos",
      },
      {
        title: "Inactivos",
        value: totalEmpleadosInactivos,
        description: "Empleados inactivos",
      }
    );
  }

  if (isCompras) {
    cards.push(
      {
        title: "Materiales",
        value: totalMateriales,
        description: "Materiales relacionados a compras",
      },
      {
        title: "Proveedores",
        value: totalProveedores,
        description: "Proveedores registrados",
      },
      {
        title: "Pagos a proveedores",
        value: totalPagosProveedor,
        description: "Pagos relacionados a proveedores",
      },
      {
        title: "Total proveedores",
        value: `Bs. ${sumaPagosProveedor._sum.monto?.toString() ?? "0"}`,
        description: "Suma de pagos a proveedores",
      }
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Módulo Reportes
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Reportes
            </h1>

            <p className="mt-1 text-slate-600">
              Reportes visibles para el rol: {roleName}
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            Volver al panel
          </Link>
        </div>

        <section className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-blue-700">
                {card.title}
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {card.value}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {card.description}
              </p>
            </div>
          ))}
        </section>

        {(isAdmin || isContabilidad || isObra) && (
          <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <h2 className="p-5 text-xl font-bold text-slate-900">
              Proyectos recientes
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border p-3 text-left">ID</th>
                  <th className="border p-3 text-left">Proyecto</th>
                  <th className="border p-3 text-left">Estado</th>
                </tr>
              </thead>

              <tbody>
                {proyectosRecientes.map((proyecto) => (
                  <tr key={proyecto.id_proyecto}>
                    <td className="border p-3">{proyecto.id_proyecto}</td>
                    <td className="border p-3">{proyecto.nombre_proyecto}</td>
                    <td className="border p-3">{proyecto.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {(isAdmin || isContabilidad) && (
          <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <h2 className="p-5 text-xl font-bold text-slate-900">
              Pagos recientes
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border p-3 text-left">ID</th>
                  <th className="border p-3 text-left">Tipo</th>
                  <th className="border p-3 text-left">Monto</th>
                  <th className="border p-3 text-left">Fecha</th>
                </tr>
              </thead>

              <tbody>
                {pagosRecientes.map((pago) => (
                  <tr key={pago.id_pago}>
                    <td className="border p-3">{pago.id_pago}</td>
                    <td className="border p-3">{pago.tipo_pago}</td>
                    <td className="border p-3">
                      Bs. {pago.monto.toString()}
                    </td>
                    <td className="border p-3">
                      {new Date(pago.fecha_pago).toISOString().slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {(isAdmin || isCompras) && (
          <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <h2 className="p-5 text-xl font-bold text-slate-900">
              Pagos recientes a proveedores
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border p-3 text-left">ID</th>
                  <th className="border p-3 text-left">Monto</th>
                  <th className="border p-3 text-left">Fecha</th>
                  <th className="border p-3 text-left">Método</th>
                </tr>
              </thead>

              <tbody>
                {pagosProveedorRecientes.map((pago) => (
                  <tr key={pago.id_pago}>
                    <td className="border p-3">{pago.id_pago}</td>
                    <td className="border p-3">
                      Bs. {pago.monto.toString()}
                    </td>
                    <td className="border p-3">
                      {new Date(pago.fecha_pago).toISOString().slice(0, 10)}
                    </td>
                    <td className="border p-3">{pago.metodo_pago}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {(isAdmin || isRRHH) && (
          <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <h2 className="p-5 text-xl font-bold text-slate-900">
              Empleados recientes
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border p-3 text-left">ID</th>
                  <th className="border p-3 text-left">Empleado</th>
                  <th className="border p-3 text-left">CI</th>
                  <th className="border p-3 text-left">Estado</th>
                </tr>
              </thead>

              <tbody>
                {empleadosRecientes.map((empleado) => (
                  <tr key={empleado.id_empleado}>
                    <td className="border p-3">{empleado.id_empleado}</td>
                    <td className="border p-3">
                      {empleado.nombres} {empleado.apellidos}
                    </td>
                    <td className="border p-3">{empleado.ci}</td>
                    <td className="border p-3">{empleado.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {(isAdmin || isAlmacen || isCompras || isObra) && (
          <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <h2 className="p-5 text-xl font-bold text-slate-900">
              Materiales recientes
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border p-3 text-left">ID</th>
                  <th className="border p-3 text-left">Material</th>
                  <th className="border p-3 text-left">Unidad</th>
                  <th className="border p-3 text-left">Precio</th>
                </tr>
              </thead>

              <tbody>
                {materialesRecientes.map((material) => (
                  <tr key={material.id_material}>
                    <td className="border p-3">{material.id_material}</td>
                    <td className="border p-3">{material.nombre_material}</td>
                    <td className="border p-3">{material.unidad_medida}</td>
                    <td className="border p-3">
                      Bs. {material.precio_unitario.toString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {(isAdmin || isAlmacen) && (
          <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <h2 className="p-5 text-xl font-bold text-slate-900">
              Inventario reciente
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border p-3 text-left">Material</th>
                  <th className="border p-3 text-left">Almacén</th>
                  <th className="border p-3 text-left">Cantidad</th>
                </tr>
              </thead>

              <tbody>
                {inventarioReciente.map((item) => (
                  <tr key={item.id_inventario}>
                    <td className="border p-3">
                      {materialMap.get(item.id_material) ?? "-"}
                    </td>
                    <td className="border p-3">
                      {almacenMap.get(item.id_almacen) ?? "-"}
                    </td>
                    <td className="border p-3">
                      {item.cantidad_disponible.toString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  );
}