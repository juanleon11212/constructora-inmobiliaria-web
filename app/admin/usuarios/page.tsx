import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";
import {
  TableFilter,
  type FilterOption,
} from "../../../components/admin/TableFilter";
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

  Visual:
  - Fondo con imagen.
  - Tarjetas estilo glass.
  - Tablas translúcidas.
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
    ? "border-blue-700 bg-white/85 text-blue-950 shadow-xl scale-[1.02]"
    : "border-white/40 bg-white/55 text-slate-900 hover:bg-white/75 hover:scale-[1.02]";
}

function ReportIcon({ type }: { type: string }) {
  const bg: Record<string, string> = {
    proyectos: "bg-blue-900 text-white",
    pagos: "bg-emerald-700 text-white",
    clientes: "bg-violet-700 text-white",
    empleados: "bg-amber-600 text-white",
    materiales: "bg-rose-700 text-white",
  };

  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${
        bg[type] ?? "bg-slate-900 text-white"
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

const tableHeaderClass =
  "border border-white/30 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-800";

const tableCellClass =
  "border border-white/30 px-4 py-3 text-sm font-semibold text-slate-800";

function StatCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-white/40 bg-white/55 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-900">
            {label}
          </p>

          <h2 className="mt-3 text-4xl font-black text-slate-950">
            {value}
          </h2>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-900/90 text-2xl text-white shadow-lg">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-sm font-bold text-slate-700">{helper}</p>
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

    if (campoFiltro === "id_proyecto") return equalsText(proyecto.id_proyecto, valorFiltro);
    if (campoFiltro === "nombre_proyecto") return containsText(proyecto.nombre_proyecto, valorFiltro);
    if (campoFiltro === "cliente") return containsText(clienteMap.get(proyecto.id_cliente), valorFiltro);
    if (campoFiltro === "estado") return containsText(proyecto.estado, valorFiltro);
    if (campoFiltro === "ubicacion") return containsText(proyecto.ubicacion, valorFiltro);
    if (campoFiltro === "fecha_inicio") return containsText(formatDate(proyecto.fecha_inicio), valorFiltro);

    return true;
  });

  const pagosFiltrados = pagos.filter((pago) => {
    if (!hayFiltro || tabla !== "pagos") return true;

    const relacionado = pago.id_cliente
      ? clienteMap.get(pago.id_cliente)
      : pago.id_empleado
      ? empleadoMap.get(pago.id_empleado)
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

  const clientesFiltrados = clientes.filter((cliente) => {
    if (!hayFiltro || tabla !== "clientes") return true;

    const nombre =
      cliente.razon_social ||
      `${cliente.nombres ?? ""} ${cliente.apellidos ?? ""}`.trim();

    if (campoFiltro === "id_cliente") return equalsText(cliente.id_cliente, valorFiltro);
    if (campoFiltro === "nombre") return containsText(nombre, valorFiltro);
    if (campoFiltro === "ci_nit") return containsText(cliente.ci_nit, valorFiltro);
    if (campoFiltro === "correo") return containsText(cliente.correo, valorFiltro);
    if (campoFiltro === "telefono") return containsText(cliente.telefono, valorFiltro);
    if (campoFiltro === "estado_cuenta") return containsText(cliente.estado_cuenta, valorFiltro);

    return true;
  });

  const empleadosFiltrados = empleados.filter((empleado) => {
    if (!hayFiltro || tabla !== "empleados") return true;

    const nombre = `${empleado.nombres} ${empleado.apellidos}`.trim();

    if (campoFiltro === "id_empleado") return equalsText(empleado.id_empleado, valorFiltro);
    if (campoFiltro === "nombre") return containsText(nombre, valorFiltro);
    if (campoFiltro === "ci") return containsText(empleado.ci, valorFiltro);
    if (campoFiltro === "telefono") return containsText(empleado.telefono, valorFiltro);
    if (campoFiltro === "cargo") return containsText(cargoMap.get(empleado.id_cargo), valorFiltro);
    if (campoFiltro === "estado") return containsText(empleado.estado, valorFiltro);

    return true;
  });

  const materialesFiltrados = materiales.filter((material) => {
    if (!hayFiltro || tabla !== "materiales") return true;

    if (campoFiltro === "id_material") return equalsText(material.id_material, valorFiltro);
    if (campoFiltro === "nombre_material") return containsText(material.nombre_material, valorFiltro);
    if (campoFiltro === "categoria") return containsText(categoriaMap.get(material.id_categoria_material), valorFiltro);
    if (campoFiltro === "unidad_medida") return containsText(material.unidad_medida, valorFiltro);
    if (campoFiltro === "precio_unitario") return containsText(material.precio_unitario, valorFiltro);

    return true;
  });

  const reportCards = [
    {
      key: "proyectos",
      title: "Proyectos recientes",
      description: "Consulta los últimos proyectos registrados.",
      count: proyectosFiltrados.length,
      icon: "🏗️",
    },
    {
      key: "pagos",
      title: "Pagos recientes",
      description: "Consulta movimientos y montos registrados.",
      count: pagosFiltrados.length,
      icon: "💳",
    },
    {
      key: "clientes",
      title: "Clientes registrados",
      description: "Consulta la lista general de clientes.",
      count: clientesFiltrados.length,
      icon: "👤",
    },
    {
      key: "empleados",
      title: "Personal registrado",
      description: "Consulta empleados y cargos.",
      count: empleadosFiltrados.length,
      icon: "👷",
    },
    {
      key: "materiales",
      title: "Materiales registrados",
      description: "Consulta materiales y precios.",
      count: materialesFiltrados.length,
      icon: "📦",
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
    <main
      className="min-h-screen bg-cover bg-center bg-fixed p-6"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.62) 36%, rgba(255,255,255,0.12) 100%), url('/images/reportes.jpg')",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-white drop-shadow">
              <p className="text-sm font-bold text-blue-100">
                Módulo Reportes
              </p>

              <h1 className="text-4xl font-extrabold tracking-tight">
                Reportes generales
              </h1>

              <p className="mt-1 text-sm font-medium text-blue-100">
                Resumen visual de clientes, empleados, proyectos, pagos y materiales.
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

        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Clientes"
            value={clientes.length}
            helper="Clientes registrados"
            icon="👤"
          />

          <StatCard
            label="Empleados"
            value={empleados.length}
            helper="Personal registrado"
            icon="👷"
          />

          <StatCard
            label="Proyectos"
            value={proyectos.length}
            helper="Proyectos visibles"
            icon="🏗️"
          />

          <StatCard
            label="Materiales"
            value={materiales.length}
            helper="Materiales registrados"
            icon="📦"
          />

          <StatCard
            label="Pagos"
            value={pagos.length}
            helper="Movimientos registrados"
            icon="💳"
          />

          <StatCard
            label="Total pagado"
            value={`Bs. ${totalPagado.toFixed(2)}`}
            helper="Suma total de pagos"
            icon="📊"
          />
        </section>

        <section className="mt-8 rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <h2 className="text-2xl font-extrabold text-white drop-shadow">
            Reportes disponibles
          </h2>

          <p className="mt-1 text-sm font-bold text-blue-100">
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
                <div className="flex items-center justify-between gap-3">
                  <ReportIcon type={card.key} />
                  <span className="text-3xl">{card.icon}</span>
                </div>

                <h3 className="mt-4 text-lg font-extrabold">{card.title}</h3>

                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {card.description}
                </p>

                <p className="mt-4 rounded-full bg-white/80 px-3 py-1 text-sm font-extrabold text-slate-800 shadow">
                  Total: {card.count}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-6 rounded-[28px] border border-white/40 bg-white/25 p-1 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
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
        </div>

        {tabla === "proyectos" && (
          <section className="mt-6 overflow-x-auto rounded-[28px] border border-white/40 bg-white/35 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
            <h2 className="p-5 text-2xl font-extrabold text-white drop-shadow">
              Proyectos recientes
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-white/70 backdrop-blur">
                <tr>
                  <th className={tableHeaderClass}>ID</th>
                  <th className={tableHeaderClass}>Proyecto</th>
                  <th className={tableHeaderClass}>Cliente</th>
                  <th className={tableHeaderClass}>Ubicación</th>
                  <th className={tableHeaderClass}>Estado</th>
                  <th className={tableHeaderClass}>Inicio</th>
                </tr>
              </thead>

              <tbody className="bg-white/40 backdrop-blur">
                {proyectosFiltrados.map((proyecto) => (
                  <tr key={proyecto.id_proyecto} className="transition hover:bg-white/70">
                    <td className={tableCellClass}>{proyecto.id_proyecto}</td>
                    <td className="border border-white/30 px-4 py-3 text-sm font-extrabold text-slate-950">{proyecto.nombre_proyecto}</td>
                    <td className={tableCellClass}>{clienteMap.get(proyecto.id_cliente) ?? "-"}</td>
                    <td className={tableCellClass}>{proyecto.ubicacion ?? "-"}</td>
                    <td className={tableCellClass}>{proyecto.estado ?? "-"}</td>
                    <td className={tableCellClass}>{formatDate(proyecto.fecha_inicio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {tabla === "pagos" && (
          <section className="mt-6 overflow-x-auto rounded-[28px] border border-white/40 bg-white/35 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
            <h2 className="p-5 text-2xl font-extrabold text-white drop-shadow">
              Pagos recientes
            </h2>

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
                </tr>
              </thead>

              <tbody className="bg-white/40 backdrop-blur">
                {pagosFiltrados.map((pago) => {
                  const relacionado = pago.id_cliente
                    ? clienteMap.get(pago.id_cliente)
                    : pago.id_empleado
                    ? empleadoMap.get(pago.id_empleado)
                    : "-";

                  return (
                    <tr key={pago.id_pago} className="transition hover:bg-white/70">
                      <td className={tableCellClass}>{pago.id_pago}</td>
                      <td className={tableCellClass}>{pago.tipo_pago}</td>
                      <td className={tableCellClass}>{formatDate(pago.fecha_pago)}</td>
                      <td className="border border-white/30 px-4 py-3 text-sm font-extrabold text-slate-950">Bs. {pago.monto.toString()}</td>
                      <td className={tableCellClass}>{pago.metodo_pago}</td>
                      <td className={tableCellClass}>{relacionado}</td>
                      <td className={tableCellClass}>{pago.id_proyecto ? proyectoMap.get(pago.id_proyecto) ?? "-" : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {tabla === "clientes" && (
          <section className="mt-6 overflow-x-auto rounded-[28px] border border-white/40 bg-white/35 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
            <h2 className="p-5 text-2xl font-extrabold text-white drop-shadow">
              Clientes registrados
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-white/70 backdrop-blur">
                <tr>
                  <th className={tableHeaderClass}>ID</th>
                  <th className={tableHeaderClass}>Cliente</th>
                  <th className={tableHeaderClass}>CI/NIT</th>
                  <th className={tableHeaderClass}>Teléfono</th>
                  <th className={tableHeaderClass}>Correo</th>
                  <th className={tableHeaderClass}>Estado</th>
                </tr>
              </thead>

              <tbody className="bg-white/40 backdrop-blur">
                {clientesFiltrados.map((cliente) => {
                  const nombre =
                    cliente.razon_social ||
                    `${cliente.nombres ?? ""} ${cliente.apellidos ?? ""}`.trim() ||
                    "Sin nombre";

                  return (
                    <tr key={cliente.id_cliente} className="transition hover:bg-white/70">
                      <td className={tableCellClass}>{cliente.id_cliente}</td>
                      <td className="border border-white/30 px-4 py-3 text-sm font-extrabold text-slate-950">{nombre}</td>
                      <td className={tableCellClass}>{cliente.ci_nit}</td>
                      <td className={tableCellClass}>{cliente.telefono ?? "-"}</td>
                      <td className={tableCellClass}>{cliente.correo ?? "-"}</td>
                      <td className={tableCellClass}>{cliente.estado_cuenta ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {tabla === "empleados" && (
          <section className="mt-6 overflow-x-auto rounded-[28px] border border-white/40 bg-white/35 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
            <h2 className="p-5 text-2xl font-extrabold text-white drop-shadow">
              Personal registrado
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-white/70 backdrop-blur">
                <tr>
                  <th className={tableHeaderClass}>ID</th>
                  <th className={tableHeaderClass}>Empleado</th>
                  <th className={tableHeaderClass}>CI</th>
                  <th className={tableHeaderClass}>Teléfono</th>
                  <th className={tableHeaderClass}>Cargo</th>
                  <th className={tableHeaderClass}>Estado</th>
                </tr>
              </thead>

              <tbody className="bg-white/40 backdrop-blur">
                {empleadosFiltrados.map((empleado) => (
                  <tr key={empleado.id_empleado} className="transition hover:bg-white/70">
                    <td className={tableCellClass}>{empleado.id_empleado}</td>
                    <td className="border border-white/30 px-4 py-3 text-sm font-extrabold text-slate-950">{empleado.nombres} {empleado.apellidos}</td>
                    <td className={tableCellClass}>{empleado.ci}</td>
                    <td className={tableCellClass}>{empleado.telefono ?? "-"}</td>
                    <td className={tableCellClass}>{cargoMap.get(empleado.id_cargo) ?? "-"}</td>
                    <td className={tableCellClass}>{empleado.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {tabla === "materiales" && (
          <section className="mt-6 overflow-x-auto rounded-[28px] border border-white/40 bg-white/35 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
            <h2 className="p-5 text-2xl font-extrabold text-white drop-shadow">
              Materiales registrados
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-white/70 backdrop-blur">
                <tr>
                  <th className={tableHeaderClass}>ID</th>
                  <th className={tableHeaderClass}>Material</th>
                  <th className={tableHeaderClass}>Categoría</th>
                  <th className={tableHeaderClass}>Unidad</th>
                  <th className={tableHeaderClass}>Precio</th>
                  <th className={tableHeaderClass}>Stock mínimo</th>
                </tr>
              </thead>

              <tbody className="bg-white/40 backdrop-blur">
                {materialesFiltrados.map((material) => (
                  <tr key={material.id_material} className="transition hover:bg-white/70">
                    <td className={tableCellClass}>{material.id_material}</td>
                    <td className="border border-white/30 px-4 py-3 text-sm font-extrabold text-slate-950">{material.nombre_material}</td>
                    <td className={tableCellClass}>{categoriaMap.get(material.id_categoria_material) ?? "-"}</td>
                    <td className={tableCellClass}>{material.unidad_medida}</td>
                    <td className={tableCellClass}>Bs. {material.precio_unitario.toString()}</td>
                    <td className={tableCellClass}>{material.stock_minimo.toString()}</td>
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