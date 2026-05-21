import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";
import { TableFilter, type FilterOption } from "../../../components/admin/TableFilter";
import { containsText, equalsText, formatDate } from "../../../lib/table-filter";

/*
  MÓDULO REPORTES

  Ruta:
  /admin/reportes

  Funcionalidades:
  - Resumen general en tarjetas.
  - Secciones visuales tipo cuadros.
  - Al tocar una sección se muestra su tabla.
  - Filtro con lupa por ID, nombre, estado, fecha, monto, etc.
*/

type PageProps = {
  searchParams?: Promise<{
    tabla?: string;
    filtro?: string;
    campo?: string;
    valor?: string;
  }>;
};

function getCardClass(active: boolean) {
  return active
    ? "border-blue-600 bg-blue-50 text-blue-900"
    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50";
}

function ReportIcon({ type }: { type: string }) {
  const bg: Record<string, string> = {
    proyectos: "bg-blue-100 text-blue-700",
    pagos: "bg-emerald-100 text-emerald-700",
    clientes: "bg-violet-100 text-violet-700",
    empleados: "bg-amber-100 text-amber-700",
    materiales: "bg-rose-100 text-rose-700",
  };

  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
        bg[type] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
        <path
          d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M8 17v-5M12 17V8M16 17v-7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M3 19h18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

const filterOptionsByTable: Record<string, FilterOption[]> = {
  proyectos: [
    { value: "id_proyecto", label: "ID proyecto", placeholder: "Ejemplo: 25" },
    { value: "nombre_proyecto", label: "Proyecto", placeholder: "Ejemplo: edificio" },
    { value: "cliente", label: "Cliente", placeholder: "Ejemplo: Juan" },
    { value: "estado", label: "Estado", placeholder: "Ejemplo: en_ejecucion" },
    { value: "ubicacion", label: "Ubicación", placeholder: "Ejemplo: zona norte" },
    { value: "fecha_inicio", label: "Fecha inicio", placeholder: "Ejemplo: 2026-05-20" },
  ],

  pagos: [
    { value: "id_pago", label: "ID pago", placeholder: "Ejemplo: 1" },
    { value: "tipo_pago", label: "Tipo de pago", placeholder: "Ejemplo: cliente" },
    { value: "fecha_pago", label: "Fecha pago", placeholder: "Ejemplo: 2026-05-20" },
    { value: "monto", label: "Monto", placeholder: "Ejemplo: 1500" },
    { value: "metodo_pago", label: "Método", placeholder: "Ejemplo: efectivo" },
    { value: "relacionado", label: "Relacionado", placeholder: "Ejemplo: proveedor" },
    { value: "proyecto", label: "Proyecto", placeholder: "Ejemplo: vivienda" },
  ],

  clientes: [
    { value: "id_cliente", label: "ID cliente", placeholder: "Ejemplo: 1" },
    { value: "nombre", label: "Nombre / Razón social", placeholder: "Ejemplo: Juan" },
    { value: "ci_nit", label: "CI/NIT", placeholder: "Ejemplo: 123456" },
    { value: "correo", label: "Correo", placeholder: "Ejemplo: cliente@email.com" },
    { value: "telefono", label: "Teléfono", placeholder: "Ejemplo: 70000000" },
    { value: "estado_cuenta", label: "Estado", placeholder: "Ejemplo: activo" },
  ],

  empleados: [
    { value: "id_empleado", label: "ID empleado", placeholder: "Ejemplo: 1" },
    { value: "nombre", label: "Nombre completo", placeholder: "Ejemplo: María" },
    { value: "ci", label: "CI", placeholder: "Ejemplo: 123456" },
    { value: "telefono", label: "Teléfono", placeholder: "Ejemplo: 70000000" },
    { value: "cargo", label: "Cargo", placeholder: "Ejemplo: contador" },
    { value: "estado", label: "Estado", placeholder: "Ejemplo: activo" },
  ],

  materiales: [
    { value: "id_material", label: "ID material", placeholder: "Ejemplo: 1" },
    { value: "nombre_material", label: "Material", placeholder: "Ejemplo: cemento" },
    { value: "categoria", label: "Categoría", placeholder: "Ejemplo: acero" },
    { value: "unidad_medida", label: "Unidad", placeholder: "Ejemplo: bolsa" },
    { value: "precio_unitario", label: "Precio", placeholder: "Ejemplo: 55" },
  ],
};

export default async function ReportesPage({ searchParams }: PageProps) {
  await requireModule("reportes");

  const params = await searchParams;

  const tabla = params?.tabla ?? "proyectos";
  const filtroActivo = params?.filtro === "1";
  const campoFiltro = String(params?.campo ?? "").trim();
  const valorFiltro = String(params?.valor ?? "").trim();
  const hayFiltro = Boolean(campoFiltro && valorFiltro);

  const opcionesFiltro =
    filterOptionsByTable[tabla] ?? filterOptionsByTable.proyectos;

  const [
    clientes,
    empleados,
    cargos,
    proyectos,
    pagos,
    materiales,
    categorias,
  ] = await Promise.all([
    prisma.cliente.findMany({
      orderBy: {
        id_cliente: "desc",
      },
    }),

    prisma.empleado.findMany({
      orderBy: {
        id_empleado: "desc",
      },
    }),

    prisma.cargo.findMany(),

    prisma.proyecto.findMany({
      where: {
        estado: {
          not: "eliminado",
        },
      },
      orderBy: {
        id_proyecto: "desc",
      },
    }),

    prisma.pago.findMany({
      orderBy: {
        id_pago: "desc",
      },
    }),

    prisma.material.findMany({
      orderBy: {
        id_material: "desc",
      },
    }),

    prisma.categoria_material.findMany(),
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
      `${empleado.nombres} ${empleado.apellidos}`.trim(),
    ])
  );

  const cargoMap = new Map(
    cargos.map((cargo) => [cargo.id_cargo, cargo.nombre_cargo])
  );

  const proyectoMap = new Map(
    proyectos.map((proyecto) => [
      proyecto.id_proyecto,
      proyecto.nombre_proyecto,
    ])
  );

  const categoriaMap = new Map(
    categorias.map((categoria) => [
      categoria.id_categoria_material,
      categoria.nombre_categoria,
    ])
  );

  const totalPagado = pagos.reduce((total, pago) => {
    return total + Number(pago.monto);
  }, 0);

  const proyectosFiltrados = proyectos.filter((proyecto) => {
    if (!hayFiltro || tabla !== "proyectos") return true;

    if (campoFiltro === "id_proyecto") {
      return equalsText(proyecto.id_proyecto, valorFiltro);
    }

    if (campoFiltro === "nombre_proyecto") {
      return containsText(proyecto.nombre_proyecto, valorFiltro);
    }

    if (campoFiltro === "cliente") {
      return containsText(clienteMap.get(proyecto.id_cliente), valorFiltro);
    }

    if (campoFiltro === "estado") {
      return containsText(proyecto.estado, valorFiltro);
    }

    if (campoFiltro === "ubicacion") {
      return containsText(proyecto.ubicacion, valorFiltro);
    }

    if (campoFiltro === "fecha_inicio") {
      return containsText(formatDate(proyecto.fecha_inicio), valorFiltro);
    }

    return true;
  });

  const pagosFiltrados = pagos.filter((pago) => {
    if (!hayFiltro || tabla !== "pagos") return true;

    const relacionado = pago.id_cliente
      ? clienteMap.get(pago.id_cliente)
      : pago.id_empleado
      ? empleadoMap.get(pago.id_empleado)
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

    return true;
  });

  const clientesFiltrados = clientes.filter((cliente) => {
    if (!hayFiltro || tabla !== "clientes") return true;

    const nombre =
      cliente.razon_social ||
      `${cliente.nombres ?? ""} ${cliente.apellidos ?? ""}`.trim();

    if (campoFiltro === "id_cliente") {
      return equalsText(cliente.id_cliente, valorFiltro);
    }

    if (campoFiltro === "nombre") {
      return containsText(nombre, valorFiltro);
    }

    if (campoFiltro === "ci_nit") {
      return containsText(cliente.ci_nit, valorFiltro);
    }

    if (campoFiltro === "correo") {
      return containsText(cliente.correo, valorFiltro);
    }

    if (campoFiltro === "telefono") {
      return containsText(cliente.telefono, valorFiltro);
    }

    if (campoFiltro === "estado_cuenta") {
      return containsText(cliente.estado_cuenta, valorFiltro);
    }

    return true;
  });

  const empleadosFiltrados = empleados.filter((empleado) => {
    if (!hayFiltro || tabla !== "empleados") return true;

    const nombre = `${empleado.nombres} ${empleado.apellidos}`.trim();

    if (campoFiltro === "id_empleado") {
      return equalsText(empleado.id_empleado, valorFiltro);
    }

    if (campoFiltro === "nombre") {
      return containsText(nombre, valorFiltro);
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

  const materialesFiltrados = materiales.filter((material) => {
    if (!hayFiltro || tabla !== "materiales") return true;

    if (campoFiltro === "id_material") {
      return equalsText(material.id_material, valorFiltro);
    }

    if (campoFiltro === "nombre_material") {
      return containsText(material.nombre_material, valorFiltro);
    }

    if (campoFiltro === "categoria") {
      return containsText(
        categoriaMap.get(material.id_categoria_material),
        valorFiltro
      );
    }

    if (campoFiltro === "unidad_medida") {
      return containsText(material.unidad_medida, valorFiltro);
    }

    if (campoFiltro === "precio_unitario") {
      return containsText(material.precio_unitario, valorFiltro);
    }

    return true;
  });

  const reportCards = [
    {
      key: "proyectos",
      title: "Proyectos recientes",
      description: "Consulta los últimos proyectos registrados.",
      count: proyectosFiltrados.length,
    },
    {
      key: "pagos",
      title: "Pagos recientes",
      description: "Consulta movimientos y montos registrados.",
      count: pagosFiltrados.length,
    },
    {
      key: "clientes",
      title: "Clientes registrados",
      description: "Consulta la lista general de clientes.",
      count: clientesFiltrados.length,
    },
    {
      key: "empleados",
      title: "Personal registrado",
      description: "Consulta empleados y cargos.",
      count: empleadosFiltrados.length,
    },
    {
      key: "materiales",
      title: "Materiales registrados",
      description: "Consulta materiales y precios.",
      count: materialesFiltrados.length,
    },
  ];

  const currentCard =
    reportCards.find((card) => card.key === tabla) ?? reportCards[0];

  const resultadosPorTabla: Record<string, number> = {
    proyectos: proyectosFiltrados.length,
    pagos: pagosFiltrados.length,
    clientes: clientesFiltrados.length,
    empleados: empleadosFiltrados.length,
    materiales: materialesFiltrados.length,
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Módulo Reportes
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Reportes generales
            </h1>

            <p className="mt-1 text-slate-600">
              Resumen visual de clientes, empleados, proyectos, pagos y materiales.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            Volver al panel
          </Link>
        </div>

        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-blue-700">Clientes</p>
            <h2 className="mt-3 text-4xl font-black text-slate-900">
              {clientes.length}
            </h2>
            <p className="mt-2 text-sm text-slate-500">Clientes registrados</p>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-blue-700">Empleados</p>
            <h2 className="mt-3 text-4xl font-black text-slate-900">
              {empleados.length}
            </h2>
            <p className="mt-2 text-sm text-slate-500">Personal registrado</p>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-blue-700">Proyectos</p>
            <h2 className="mt-3 text-4xl font-black text-slate-900">
              {proyectos.length}
            </h2>
            <p className="mt-2 text-sm text-slate-500">Proyectos visibles</p>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-blue-700">Materiales</p>
            <h2 className="mt-3 text-4xl font-black text-slate-900">
              {materiales.length}
            </h2>
            <p className="mt-2 text-sm text-slate-500">Materiales registrados</p>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-blue-700">Pagos</p>
            <h2 className="mt-3 text-4xl font-black text-slate-900">
              {pagos.length}
            </h2>
            <p className="mt-2 text-sm text-slate-500">Movimientos registrados</p>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-blue-700">Total pagado</p>
            <h2 className="mt-3 text-4xl font-black text-slate-900">
              Bs. {totalPagado.toFixed(2)}
            </h2>
            <p className="mt-2 text-sm text-slate-500">Suma total de pagos</p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Reportes disponibles
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Toca una tarjeta para ver la tabla correspondiente.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {reportCards.map((card) => (
              <Link
                key={card.key}
                href={`/admin/reportes?tabla=${card.key}`}
                scroll={false}
                className={`rounded-[2rem] border p-5 shadow-sm transition ${getCardClass(
                  tabla === card.key
                )}`}
              >
                <ReportIcon type={card.key} />

                <h3 className="mt-4 text-lg font-bold">{card.title}</h3>

                <p className="mt-2 text-sm text-slate-500">
                  {card.description}
                </p>

                <p className="mt-4 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  Total: {card.count}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <TableFilter
          basePath="/admin/reportes"
          title="Filtro de reportes"
          currentLabel={currentCard.title}
          options={opcionesFiltro}
          filtroActivo={filtroActivo}
          campoFiltro={campoFiltro}
          valorFiltro={valorFiltro}
          resultados={resultadosPorTabla[tabla] ?? 0}
          extraParams={{
            tabla,
          }}
        />

        {tabla === "proyectos" && (
          <section className="mt-6 overflow-x-auto rounded-[2rem] bg-white shadow-sm">
            <h2 className="p-5 text-xl font-bold text-slate-900">
              Proyectos recientes
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border p-3 text-left">ID</th>
                  <th className="border p-3 text-left">Proyecto</th>
                  <th className="border p-3 text-left">Cliente</th>
                  <th className="border p-3 text-left">Ubicación</th>
                  <th className="border p-3 text-left">Estado</th>
                  <th className="border p-3 text-left">Inicio</th>
                </tr>
              </thead>

              <tbody>
                {proyectosFiltrados.map((proyecto) => (
                  <tr key={proyecto.id_proyecto} className="hover:bg-slate-50">
                    <td className="border p-3">{proyecto.id_proyecto}</td>
                    <td className="border p-3 font-medium">{proyecto.nombre_proyecto}</td>
                    <td className="border p-3">{clienteMap.get(proyecto.id_cliente) ?? "-"}</td>
                    <td className="border p-3">{proyecto.ubicacion ?? "-"}</td>
                    <td className="border p-3">{proyecto.estado ?? "-"}</td>
                    <td className="border p-3">{formatDate(proyecto.fecha_inicio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {tabla === "pagos" && (
          <section className="mt-6 overflow-x-auto rounded-[2rem] bg-white shadow-sm">
            <h2 className="p-5 text-xl font-bold text-slate-900">
              Pagos recientes
            </h2>

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
                {pagosFiltrados.map((pago) => {
                  const relacionado = pago.id_cliente
                    ? clienteMap.get(pago.id_cliente)
                    : pago.id_empleado
                    ? empleadoMap.get(pago.id_empleado)
                    : "-";

                  return (
                    <tr key={pago.id_pago} className="hover:bg-slate-50">
                      <td className="border p-3">{pago.id_pago}</td>
                      <td className="border p-3">{pago.tipo_pago}</td>
                      <td className="border p-3">{formatDate(pago.fecha_pago)}</td>
                      <td className="border p-3">Bs. {pago.monto.toString()}</td>
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
        )}

        {tabla === "clientes" && (
          <section className="mt-6 overflow-x-auto rounded-[2rem] bg-white shadow-sm">
            <h2 className="p-5 text-xl font-bold text-slate-900">
              Clientes registrados
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border p-3 text-left">ID</th>
                  <th className="border p-3 text-left">Cliente</th>
                  <th className="border p-3 text-left">CI/NIT</th>
                  <th className="border p-3 text-left">Teléfono</th>
                  <th className="border p-3 text-left">Correo</th>
                  <th className="border p-3 text-left">Estado</th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.map((cliente) => {
                  const nombre =
                    cliente.razon_social ||
                    `${cliente.nombres ?? ""} ${cliente.apellidos ?? ""}`.trim() ||
                    "Sin nombre";

                  return (
                    <tr key={cliente.id_cliente} className="hover:bg-slate-50">
                      <td className="border p-3">{cliente.id_cliente}</td>
                      <td className="border p-3 font-medium">{nombre}</td>
                      <td className="border p-3">{cliente.ci_nit}</td>
                      <td className="border p-3">{cliente.telefono ?? "-"}</td>
                      <td className="border p-3">{cliente.correo ?? "-"}</td>
                      <td className="border p-3">{cliente.estado_cuenta ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {tabla === "empleados" && (
          <section className="mt-6 overflow-x-auto rounded-[2rem] bg-white shadow-sm">
            <h2 className="p-5 text-xl font-bold text-slate-900">
              Personal registrado
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border p-3 text-left">ID</th>
                  <th className="border p-3 text-left">Empleado</th>
                  <th className="border p-3 text-left">CI</th>
                  <th className="border p-3 text-left">Teléfono</th>
                  <th className="border p-3 text-left">Cargo</th>
                  <th className="border p-3 text-left">Estado</th>
                </tr>
              </thead>

              <tbody>
                {empleadosFiltrados.map((empleado) => (
                  <tr key={empleado.id_empleado} className="hover:bg-slate-50">
                    <td className="border p-3">{empleado.id_empleado}</td>
                    <td className="border p-3 font-medium">
                      {empleado.nombres} {empleado.apellidos}
                    </td>
                    <td className="border p-3">{empleado.ci}</td>
                    <td className="border p-3">{empleado.telefono ?? "-"}</td>
                    <td className="border p-3">
                      {cargoMap.get(empleado.id_cargo) ?? "-"}
                    </td>
                    <td className="border p-3">{empleado.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {tabla === "materiales" && (
          <section className="mt-6 overflow-x-auto rounded-[2rem] bg-white shadow-sm">
            <h2 className="p-5 text-xl font-bold text-slate-900">
              Materiales registrados
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border p-3 text-left">ID</th>
                  <th className="border p-3 text-left">Material</th>
                  <th className="border p-3 text-left">Categoría</th>
                  <th className="border p-3 text-left">Unidad</th>
                  <th className="border p-3 text-left">Precio</th>
                  <th className="border p-3 text-left">Stock mínimo</th>
                </tr>
              </thead>

              <tbody>
                {materialesFiltrados.map((material) => (
                  <tr key={material.id_material} className="hover:bg-slate-50">
                    <td className="border p-3">{material.id_material}</td>
                    <td className="border p-3 font-medium">{material.nombre_material}</td>
                    <td className="border p-3">
                      {categoriaMap.get(material.id_categoria_material) ?? "-"}
                    </td>
                    <td className="border p-3">{material.unidad_medida}</td>
                    <td className="border p-3">Bs. {material.precio_unitario.toString()}</td>
                    <td className="border p-3">{material.stock_minimo.toString()}</td>
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