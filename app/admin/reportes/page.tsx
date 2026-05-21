import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";

type ReportCard = {
  title: string;
  value: number | string;
  description: string;
};

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

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toISOString().slice(0, 10);
}

function getReportImage(title: string) {
  const text = title.toLowerCase();

  if (text.includes("cliente")) return "/images/reporte-clientes.jpg";
  if (text.includes("empleado") || text.includes("activo") || text.includes("inactivo")) {
    return "/images/reporte-empleados.jpg";
  }
  if (text.includes("proyecto")) return "/images/reporte-proyectos.jpg";
  if (text.includes("material") || text.includes("inventario")) {
    return "/images/reporte-materiales.jpg";
  }
  if (text.includes("total")) return "/images/reporte-total-pagado.jpg";
  if (text.includes("pago") || text.includes("proveedor")) {
    return "/images/reporte-pagos.jpg";
  }

  return "/images/reporte-total-pagado.jpg";
}

function getReportIcon(title: string) {
  const text = title.toLowerCase();

  if (text.includes("cliente")) return "👥";
  if (text.includes("empleado") || text.includes("activo") || text.includes("inactivo")) return "👷";
  if (text.includes("proyecto")) return "🏗️";
  if (text.includes("material")) return "📦";
  if (text.includes("inventario")) return "🏬";
  if (text.includes("proveedor")) return "🤝";
  if (text.includes("total")) return "📈";
  if (text.includes("pago")) return "💵";

  return "📊";
}

const glassPanel =
  "rounded-[2rem] border border-white/40 bg-white/20 shadow-2xl shadow-slate-950/30 backdrop-blur-md";

const tableHeadClass =
  "border border-white/30 bg-slate-900/65 px-3 py-2 text-left text-xs font-extrabold uppercase tracking-wide text-white";

const tableCellClass =
  "border border-white/30 px-3 py-2 text-sm font-semibold text-slate-950";

const tableSectionClass =
  "overflow-hidden rounded-[1.5rem] border border-white/40 bg-white/45 shadow-2xl shadow-slate-950/25 backdrop-blur-md";

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
    materiales.map((material) => [
      material.id_material,
      material.nombre_material,
    ])
  );

  const almacenMap = new Map(
    almacenes.map((almacen) => [
      almacen.id_almacen,
      almacen.nombre_almacen,
    ])
  );

  const cards: ReportCard[] = [];

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
    <main
      className="min-h-screen bg-cover bg-center bg-fixed p-6"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(15,23,42,0.76) 0%, rgba(15,23,42,0.50) 45%, rgba(255,255,255,0.10) 100%), url('/images/reportes-fondo.jpg')",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <section className={`${glassPanel} px-6 py-5`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-white drop-shadow">
              <p className="text-sm font-bold text-blue-200">
                Módulo Reportes
              </p>

              <h1 className="text-4xl font-extrabold tracking-tight">
                Reportes
              </h1>

              <p className="mt-1 text-base font-semibold text-white/90">
                Reportes visibles para el rol: {roleName}
              </p>
            </div>

            <Link
              href="/admin"
              className="rounded-xl border border-white/40 bg-gradient-to-r from-blue-800 to-sky-600 px-5 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/40 backdrop-blur transition hover:from-blue-950 hover:to-sky-700"
            >
              Volver al panel
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="overflow-hidden rounded-[1.5rem] border border-white/40 bg-white/25 p-5 shadow-2xl shadow-slate-950/25 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/35"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-white drop-shadow">
                  <p className="text-sm font-extrabold">
                    {card.title}{" "}
                    <span className="text-lg">{getReportIcon(card.title)}</span>
                  </p>

                  <h2 className="mt-2 text-4xl font-extrabold">
                    {card.value}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-white/90">
                    {card.description}
                  </p>
                </div>

                <img
                  src={getReportImage(card.title)}
                  alt={card.title}
                  className="h-24 w-28 rounded-xl object-cover shadow-xl"
                />
              </div>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-3">
          {(isAdmin || isContabilidad || isObra) && (
            <div className={tableSectionClass}>
              <h2 className="p-4 text-xl font-extrabold text-white drop-shadow">
                Proyectos recientes
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={tableHeadClass}>ID</th>
                      <th className={tableHeadClass}>Proyecto</th>
                      <th className={tableHeadClass}>Estado</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white/35">
                    {proyectosRecientes.map((proyecto) => (
                      <tr
                        key={proyecto.id_proyecto}
                        className="hover:bg-blue-50/80"
                      >
                        <td className={tableCellClass}>
                          {proyecto.id_proyecto}
                        </td>

                        <td className="border border-white/30 px-3 py-2 text-sm font-extrabold text-blue-950">
                          {proyecto.nombre_proyecto}
                        </td>

                        <td className={tableCellClass}>{proyecto.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(isAdmin || isContabilidad) && (
            <div className={tableSectionClass}>
              <h2 className="p-4 text-xl font-extrabold text-white drop-shadow">
                Pagos recientes
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={tableHeadClass}>ID</th>
                      <th className={tableHeadClass}>Tipo</th>
                      <th className={tableHeadClass}>Monto</th>
                      <th className={tableHeadClass}>Fecha</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white/35">
                    {pagosRecientes.map((pago) => (
                      <tr key={pago.id_pago} className="hover:bg-blue-50/80">
                        <td className={tableCellClass}>{pago.id_pago}</td>

                        <td className={tableCellClass}>{pago.tipo_pago}</td>

                        <td className={tableCellClass}>
                          Bs. {pago.monto.toString()}
                        </td>

                        <td className={tableCellClass}>
                          {formatDate(pago.fecha_pago)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(isAdmin || isAlmacen || isCompras || isObra) && (
            <div className={tableSectionClass}>
              <h2 className="p-4 text-xl font-extrabold text-white drop-shadow">
                Materiales recientes
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={tableHeadClass}>ID</th>
                      <th className={tableHeadClass}>Material</th>
                      <th className={tableHeadClass}>Unidad</th>
                      <th className={tableHeadClass}>Precio</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white/35">
                    {materialesRecientes.map((material) => (
                      <tr
                        key={material.id_material}
                        className="hover:bg-blue-50/80"
                      >
                        <td className={tableCellClass}>
                          {material.id_material}
                        </td>

                        <td className="border border-white/30 px-3 py-2 text-sm font-extrabold text-blue-950">
                          {material.nombre_material}
                        </td>

                        <td className={tableCellClass}>
                          {material.unidad_medida}
                        </td>

                        <td className={tableCellClass}>
                          Bs. {material.precio_unitario.toString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(isAdmin || isCompras) && (
            <div className={tableSectionClass}>
              <h2 className="p-4 text-xl font-extrabold text-white drop-shadow">
                Pagos recientes a proveedores
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={tableHeadClass}>ID</th>
                      <th className={tableHeadClass}>Monto</th>
                      <th className={tableHeadClass}>Fecha</th>
                      <th className={tableHeadClass}>Método</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white/35">
                    {pagosProveedorRecientes.map((pago) => (
                      <tr key={pago.id_pago} className="hover:bg-blue-50/80">
                        <td className={tableCellClass}>{pago.id_pago}</td>

                        <td className={tableCellClass}>
                          Bs. {pago.monto.toString()}
                        </td>

                        <td className={tableCellClass}>
                          {formatDate(pago.fecha_pago)}
                        </td>

                        <td className={tableCellClass}>{pago.metodo_pago}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(isAdmin || isRRHH) && (
            <div className={tableSectionClass}>
              <h2 className="p-4 text-xl font-extrabold text-white drop-shadow">
                Empleados recientes
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={tableHeadClass}>ID</th>
                      <th className={tableHeadClass}>Empleado</th>
                      <th className={tableHeadClass}>CI</th>
                      <th className={tableHeadClass}>Estado</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white/35">
                    {empleadosRecientes.map((empleado) => (
                      <tr
                        key={empleado.id_empleado}
                        className="hover:bg-blue-50/80"
                      >
                        <td className={tableCellClass}>
                          {empleado.id_empleado}
                        </td>

                        <td className="border border-white/30 px-3 py-2 text-sm font-extrabold text-blue-950">
                          {empleado.nombres} {empleado.apellidos}
                        </td>

                        <td className={tableCellClass}>{empleado.ci}</td>

                        <td className={tableCellClass}>{empleado.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(isAdmin || isAlmacen) && (
            <div className={tableSectionClass}>
              <h2 className="p-4 text-xl font-extrabold text-white drop-shadow">
                Inventario reciente
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={tableHeadClass}>Material</th>
                      <th className={tableHeadClass}>Almacén</th>
                      <th className={tableHeadClass}>Cantidad</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white/35">
                    {inventarioReciente.map((item) => (
                      <tr
                        key={item.id_inventario}
                        className="hover:bg-blue-50/80"
                      >
                        <td className="border border-white/30 px-3 py-2 text-sm font-extrabold text-blue-950">
                          {materialMap.get(item.id_material) ?? "-"}
                        </td>

                        <td className={tableCellClass}>
                          {almacenMap.get(item.id_almacen) ?? "-"}
                        </td>

                        <td className={tableCellClass}>
                          {item.cantidad_disponible.toString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}