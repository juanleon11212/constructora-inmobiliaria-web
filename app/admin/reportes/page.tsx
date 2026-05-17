import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";

/*
  MÓDULO REPORTES

  Ruta:
  /admin/reportes

  Qué hace:
  - Muestra resumen general del sistema.
  - Cuenta clientes, empleados, proyectos, materiales y pagos.
  - Muestra proyectos recientes.
  - Muestra pagos recientes.
*/

export default async function ReportesPage() {
  await requireModule("reportes");

  const [
    totalClientes,
    totalEmpleados,
    totalProyectos,
    totalMateriales,
    totalPagos,
    sumaPagos,
    proyectosRecientes,
    pagosRecientes,
  ] = await Promise.all([
    prisma.cliente.count(),
    prisma.empleado.count(),
    prisma.proyecto.count(),
    prisma.material.count(),
    prisma.pago.count(),
    prisma.pago.aggregate({
      _sum: {
        monto: true,
      },
    }),
    prisma.proyecto.findMany({
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
  ]);

  const cards = [
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
      description: "Obras y proyectos",
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
      description: "Suma general de pagos",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Módulo Reportes
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Reportes</h1>
            <p className="mt-1 text-slate-600">
              Resumen general de la empresa constructora.
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
              <p className="text-sm font-medium text-blue-700">{card.title}</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {card.value}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {card.description}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
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
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
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
                    <td className="border p-3">{pago.monto.toString()}</td>
                    <td className="border p-3">
                      {new Date(pago.fecha_pago).toISOString().slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}