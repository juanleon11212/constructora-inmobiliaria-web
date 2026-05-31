"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type ModuleCard = {
  key: string;
  href: string;
  title: string;
  description: string;
  visual: {
    area: string;
    image: string;
    alt: string;
  };
  actions: string[];
  canCount: number;
  cannotCount: number;
};

type AreaGroup = {
  name: string;
  modules: ModuleCard[];
  image: string;
  accent: string;
  summary: string;
};

type ModuleCommandCenterProps = {
  modules: ModuleCard[];
  visibleModules: number;
  roleName: string;
};

const areaCopy: Record<
  string,
  { summary: string; accent: string; fallbackImage: string }
> = {
  Relaciones: {
    summary: "Clientes, seguimiento y comunicacion directa con personas clave.",
    accent: "from-cyan-400 to-blue-500",
    fallbackImage: "/images/clientes-fondo.jpg",
  },
  Obras: {
    summary: "Proyectos, avances, entregas y control operativo de obra.",
    accent: "from-amber-300 to-orange-500",
    fallbackImage: "/images/proyectos-fondo.jpg",
  },
  Abastecimiento: {
    summary: "Materiales, inventario, proveedores, compras y recepciones.",
    accent: "from-emerald-300 to-teal-500",
    fallbackImage: "/images/materiales-fondo.jpg",
  },
  Finanzas: {
    summary: "Pagos, cobros, estados y movimientos financieros.",
    accent: "from-sky-300 to-indigo-500",
    fallbackImage: "/images/dashboard-pagos-card.webp",
  },
  Equipo: {
    summary: "Empleados, cargos, asignaciones y gestion del personal.",
    accent: "from-violet-300 to-fuchsia-500",
    fallbackImage: "/images/empleados-fondo.jpg",
  },
  Indicadores: {
    summary: "Reportes, metricas y lectura ejecutiva del sistema.",
    accent: "from-lime-300 to-emerald-500",
    fallbackImage: "/images/reportes-fondo.jpg",
  },
  Accesos: {
    summary: "Usuarios, roles, permisos y seguridad interna.",
    accent: "from-blue-300 to-slate-500",
    fallbackImage: "/images/dashboard-usuarios-card.webp",
  },
  Auditoria: {
    summary: "Eventos, ingresos y trazabilidad de acciones importantes.",
    accent: "from-rose-300 to-red-500",
    fallbackImage: "/images/dashboard-auditoria-card.webp",
  },
};

export function ModuleCommandCenter({
  modules,
  visibleModules,
  roleName,
}: ModuleCommandCenterProps) {
  const areaGroups = useMemo(() => buildAreaGroups(modules), [modules]);
  const [activeArea, setActiveArea] = useState(areaGroups[0]?.name ?? "");
  const [activeModuleKey, setActiveModuleKey] = useState(modules[0]?.key ?? "");
  const [query, setQuery] = useState("");

  const selectedArea = areaGroups.find((area) => area.name === activeArea) ?? areaGroups[0];
  const selectedModule =
    modules.find((module) => module.key === activeModuleKey) ??
    selectedArea?.modules[0] ??
    modules[0];

  const visibleAreaModules = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const source = selectedArea?.modules ?? modules;

    if (!cleanQuery) {
      return source;
    }

    return source.filter((module) => {
      return [
        module.title,
        module.description,
        module.visual.area,
        ...module.actions,
      ]
        .join(" ")
        .toLowerCase()
        .includes(cleanQuery);
    });
  }, [modules, query, selectedArea]);
  const previewModule =
    visibleAreaModules.find((module) => module.key === selectedModule?.key) ??
    visibleAreaModules[0] ??
    selectedModule;

  function selectArea(area: AreaGroup) {
    setActiveArea(area.name);
    setActiveModuleKey(area.modules[0]?.key ?? "");
    setQuery("");
  }

  function selectNextArea() {
    const currentIndex = areaGroups.findIndex((area) => area.name === selectedArea?.name);
    const nextArea = areaGroups[(currentIndex + 1) % areaGroups.length];

    if (nextArea) {
      selectArea(nextArea);
    }
  }

  return (
    <section className="relative mt-10 overflow-hidden rounded-[2rem] border border-white/50 bg-slate-950 text-white shadow-2xl shadow-blue-200/70">
      <Image
        src="/images/login-construccion.jpg.png"
        alt=""
        fill
        sizes="100vw"
        className="animate-slow-zoom object-cover opacity-45"
        priority={false}
      />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(3,12,35,0.97)_0%,rgba(5,35,82,0.88)_46%,rgba(3,12,35,0.74)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/40" />

      <div className="relative p-4 sm:p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
          <aside className="space-y-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
              <p className="text-xs font-extrabold uppercase tracking-[0.26em] text-sky-100">
                Mapa de areas
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                Escoge una ruta de trabajo
              </h2>
              <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-extrabold text-blue-50">
                <ShieldIcon />
                <span className="truncate">{roleName}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {areaGroups.map((area) => (
                <button
                  key={area.name}
                  type="button"
                  onClick={() => selectArea(area)}
                  className={`group relative min-h-28 overflow-hidden rounded-2xl border text-left shadow-lg transition duration-300 hover:-translate-y-1 ${
                    area.name === selectedArea?.name
                      ? "border-white/70 ring-4 ring-white/15"
                      : "border-white/15 hover:border-white/45"
                  }`}
                >
                  <Image
                    src={area.image}
                    alt=""
                    fill
                    sizes="300px"
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
                  <div className="relative flex h-full min-h-28 items-end justify-between gap-4 p-4">
                    <div>
                      <span className={`mb-2 block h-1.5 w-12 rounded-full bg-gradient-to-r ${area.accent}`} />
                      <p className="text-lg font-extrabold">{area.name}</p>
                      <p className="text-xs font-bold text-blue-100">
                        {area.modules.length} modulo{area.modules.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition group-hover:bg-white group-hover:text-blue-950">
                      {getModuleIcon(area.modules[0]?.key ?? "")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-6">
            {selectedArea && selectedModule && (
              <div className="grid overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/10 backdrop-blur-md lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative min-h-[360px] overflow-hidden">
                  <Image
                    key={selectedModule.visual.image}
                    src={selectedModule.visual.image}
                    alt={selectedModule.visual.alt}
                    fill
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-cover transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <span className={`mb-4 block h-2 w-20 rounded-full bg-gradient-to-r ${selectedArea.accent}`} />
                    <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-100">
                      {selectedArea.name}
                    </p>
                    <h3 className="mt-2 text-4xl font-extrabold tracking-tight">
                      {selectedModule.title}
                    </h3>
                    <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-blue-50">
                      {selectedArea.summary}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col p-5 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-100">
                        Area seleccionada
                      </p>
                      <h3 className="mt-2 text-2xl font-extrabold">
                        {selectedArea.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={selectNextArea}
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-bold transition hover:bg-white hover:text-blue-950"
                    >
                      Siguiente area
                      <ArrowIcon />
                    </button>
                  </div>

                  <p className="mt-5 text-sm font-medium leading-7 text-blue-50/85">
                    {selectedModule.description}
                  </p>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <GlassStat value={visibleModules} label="Accesos" />
                    <GlassStat value={selectedModule.canCount} label="Permisos" />
                    <GlassStat value={selectedModule.actions.length} label="Atajos" />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {selectedModule.actions.map((action) => (
                      <Link
                        key={action}
                        href={selectedModule.href}
                        className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white hover:text-blue-950"
                      >
                        {action}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="min-h-[520px] rounded-[1.75rem] border border-white/15 bg-white/95 p-4 text-blue-950 shadow-2xl shadow-slate-950/25 sm:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-700">
                    Vista de lectura
                  </p>
                  <h3 className="mt-1 text-2xl font-extrabold">
                    {selectedArea?.name ?? "Area"}
                  </h3>
                </div>
                <label className="relative block md:w-80">
                  <span className="sr-only">Buscar modulo</span>
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-700">
                    <SearchIcon />
                  </span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar modulo o accion..."
                    className="h-12 w-full rounded-2xl border border-blue-100 bg-blue-50 px-12 text-sm font-bold text-blue-950 outline-none transition placeholder:text-blue-900/45 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>

              {visibleAreaModules.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-blue-50 p-5">
                  <h4 className="font-extrabold text-blue-950">Sin coincidencias</h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Prueba con otra palabra o cambia de area.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {visibleAreaModules.map((module, index) => (
                      <button
                        key={module.key}
                        type="button"
                        onClick={() => setActiveModuleKey(module.key)}
                        className={`animate-module-rise flex min-w-[210px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 ${
                          module.key === previewModule?.key
                            ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
                            : "border-blue-100 bg-white hover:bg-blue-50"
                        }`}
                        style={{ animationDelay: `${index * 60}ms` }}
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white">
                          {getModuleIcon(module.key)}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-extrabold text-blue-950">
                            {module.title}
                          </span>
                          <span className="block truncate text-xs font-bold text-blue-600">
                            {module.actions.slice(0, 2).join(" · ")}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>

                  {previewModule && (
                    <ReadOnlyModulePreview
                      module={previewModule}
                      areaName={selectedArea?.name ?? previewModule.visual.area}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReadOnlyModulePreview({
  module,
  areaName,
}: {
  module: ModuleCard;
  areaName: string;
}) {
  const preview = getPreviewData(module);

  return (
    <article className="animate-module-rise overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white shadow-lg shadow-blue-100/60">
      <div className="grid gap-0 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="relative min-h-[340px] overflow-hidden bg-blue-950">
          <Image
            src={module.visual.image}
            alt={module.visual.alt}
            fill
            sizes="(min-width: 1280px) 420px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-blue-100">
              Solo lectura
            </p>
            <h4 className="mt-2 text-3xl font-extrabold">{module.title}</h4>
            <p className="mt-3 text-sm font-medium leading-6 text-blue-50">
              Esta informacion es una muestra. Para modificar registros debes
              entrar al modulo completo.
            </p>
          </div>
        </div>

        <div className="flex flex-col p-5 sm:p-6">
          <div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
                {areaName}
              </p>
              <h4 className="mt-1 text-2xl font-extrabold text-blue-950">
                Resumen parcial de {module.title}
              </h4>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {preview.stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-blue-50 px-4 py-3">
                <p className="text-2xl font-extrabold text-blue-950">
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-blue-100">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead className="bg-blue-50 text-xs uppercase tracking-[0.16em] text-blue-700">
                <tr>
                  {preview.headers.map((header) => (
                    <th key={header} className="px-4 py-3 font-extrabold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {preview.rows.map((row) => (
                  <tr key={row.join("-")} className="bg-white">
                    {row.map((cell) => (
                      <td key={cell} className="px-4 py-3 font-semibold text-slate-600">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {preview.gallery.map((item) => (
              <div
                key={item.label}
                className="relative min-h-28 overflow-hidden rounded-2xl bg-blue-950"
              >
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="220px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 to-transparent" />
                <p className="absolute bottom-3 left-3 right-3 text-xs font-extrabold uppercase tracking-wide text-white">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end border-t border-blue-100 pt-5">
            <Link
              href={module.href}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-950"
            >
              Entrar al modulo
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function getPreviewData(module: ModuleCard) {
  const previews: Record<
    string,
    {
      headers: string[];
      rows: string[][];
      stats: { label: string; value: string }[];
      gallery: { image: string; label: string }[];
    }
  > = {
    clientes: {
      headers: ["Cliente", "Proyecto", "Estado"],
      rows: [
        ["Familia Rojas", "Residencial Norte", "Activo"],
        ["Inversiones Alba", "Torre Comercial", "Seguimiento"],
        ["Cliente reservado", "Vivienda privada", "Pendiente"],
      ],
      stats: [
        { label: "Contactos", value: "24" },
        { label: "Activos", value: "18" },
        { label: "Alertas", value: "3" },
      ],
      gallery: [
        { image: "/images/clientes.jpg", label: "Atencion" },
        { image: "/images/clientes-fondo.jpg", label: "Relaciones" },
        { image: "/images/dashboard-clientes-card.webp", label: "Seguimiento" },
      ],
    },
    empleados: {
      headers: ["Empleado", "Cargo", "Estado"],
      rows: [
        ["Carlos M.", "Encargado", "Activo"],
        ["Andrea V.", "Arquitecta", "Asignada"],
        ["Equipo obra", "Cuadrilla", "Disponible"],
      ],
      stats: [
        { label: "Personal", value: "36" },
        { label: "Asignados", value: "21" },
        { label: "Cargos", value: "8" },
      ],
      gallery: [
        { image: "/images/empleados.jpg", label: "Equipo" },
        { image: "/images/empleados-fondo.jpg", label: "Obra" },
        { image: "/images/dashboard-equipo-card.webp", label: "Gestion" },
      ],
    },
    proyectos: {
      headers: ["Proyecto", "Avance", "Entrega"],
      rows: [
        ["Torre Horizonte", "62%", "Dic 2026"],
        ["Residencial Alborada", "18%", "Jun 2027"],
        ["Centro Empresarial", "47%", "Mar 2027"],
      ],
      stats: [
        { label: "Obras", value: "8" },
        { label: "Promedio", value: "54%" },
        { label: "Hitos", value: "12" },
      ],
      gallery: [
        { image: "/images/proyectos.jpg", label: "Planos" },
        { image: "/images/proyectos-fondo.jpg", label: "Avance" },
        { image: "/images/proyecto-edificio.jpg", label: "Edificio" },
      ],
    },
    materiales: {
      headers: ["Material", "Stock", "Estado"],
      rows: [
        ["Cemento IP-30", "420 bolsas", "Suficiente"],
        ["Acero corrugado", "86 barras", "Reposicion"],
        ["Ceramica gris", "1,240 m2", "Disponible"],
      ],
      stats: [
        { label: "Items", value: "128" },
        { label: "Bajo stock", value: "7" },
        { label: "Ordenes", value: "14" },
      ],
      gallery: [
        { image: "/images/materiales.jpg", label: "Materiales" },
        { image: "/images/materiales-fondo.jpg", label: "Almacen" },
        { image: "/images/dashboard-materiales-card.webp", label: "Recepcion" },
      ],
    },
    pagos: {
      headers: ["Concepto", "Monto", "Estado"],
      rows: [
        ["Cuota avance", "$ 18,400", "Pendiente"],
        ["Pago proveedor", "$ 7,920", "Programado"],
        ["Mano de obra", "$ 5,600", "Revisado"],
      ],
      stats: [
        { label: "Mes", value: "$24K" },
        { label: "Pend.", value: "5" },
        { label: "Pagados", value: "18" },
      ],
      gallery: [
        { image: "/images/pagos.jpg", label: "Pagos" },
        { image: "/images/dashboard-pagos-card.webp", label: "Finanzas" },
        { image: "/images/reporte-pagos.jpg", label: "Resumen" },
      ],
    },
    reportes: {
      headers: ["Reporte", "Periodo", "Estado"],
      rows: [
        ["Avance de obras", "Mayo", "Listo"],
        ["Materiales usados", "Semana 4", "Parcial"],
        ["Pagos generales", "Mayo", "Revision"],
      ],
      stats: [
        { label: "Reportes", value: "16" },
        { label: "Nuevos", value: "4" },
        { label: "Areas", value: "6" },
      ],
      gallery: [
        { image: "/images/reportes.jpg", label: "Reportes" },
        { image: "/images/reportes-fondo.jpg", label: "Graficas" },
        { image: "/images/dashboard-reportes-card.webp", label: "Analisis" },
      ],
    },
    usuarios: {
      headers: ["Usuario", "Rol", "Acceso"],
      rows: [
        ["admin", "Administrador", "Completo"],
        ["compras01", "Compras", "Limitado"],
        ["cliente.demo", "Cliente", "Consulta"],
      ],
      stats: [
        { label: "Usuarios", value: "10" },
        { label: "Roles", value: "7" },
        { label: "Activos", value: "9" },
      ],
      gallery: [
        { image: "/images/usuarios.jpg", label: "Usuarios" },
        { image: "/images/dashboard-usuarios-card.webp", label: "Accesos" },
        { image: "/images/dashboard-auditoria-card.webp", label: "Seguridad" },
      ],
    },
    logs: {
      headers: ["Evento", "Usuario", "Fecha"],
      rows: [
        ["Inicio de sesion", "admin", "Hoy"],
        ["Actualizacion", "compras01", "Ayer"],
        ["Consulta", "cliente.demo", "Semana"],
      ],
      stats: [
        { label: "Eventos", value: "48" },
        { label: "Hoy", value: "6" },
        { label: "Alertas", value: "1" },
      ],
      gallery: [
        { image: "/images/dashboard-auditoria-card.webp", label: "Auditoria" },
        { image: "/images/dashboard-usuarios-card.webp", label: "Accesos" },
        { image: "/images/dashboard-reportes-card.webp", label: "Revision" },
      ],
    },
  };

  return previews[module.key] ?? previews.proyectos;
}

function buildAreaGroups(modules: ModuleCard[]) {
  const groups = modules.reduce<Record<string, ModuleCard[]>>((acc, module) => {
    const area = normalizeArea(module.visual.area);
    acc[area] = [...(acc[area] ?? []), module];
    return acc;
  }, {});

  return Object.entries(groups).map(([name, areaModules]) => {
    const copy = areaCopy[name] ?? areaCopy.Obras;

    return {
      name,
      modules: areaModules,
      image: areaModules[0]?.visual.image ?? copy.fallbackImage,
      accent: copy.accent,
      summary: copy.summary,
    };
  });
}

function normalizeArea(area: string) {
  return area === "Auditoría" ? "Auditoria" : area;
}

function GlassStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
      <p className="truncate text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100">
        {label}
      </p>
    </div>
  );
}

function getModuleIcon(key: string) {
  const icons: Record<string, ReactNode> = {
    clientes: <UsersIcon />,
    empleados: <HardHatIcon />,
    proyectos: <BuildingIcon />,
    materiales: <PackageIcon />,
    pagos: <MoneyIcon />,
    reportes: <ChartIcon />,
    usuarios: <ShieldIcon />,
    logs: <PulseIcon />,
  };

  return icons[key] ?? <GridIcon />;
}

function ArrowIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" /></svg>;
}

function SearchIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m20 20-3.5-3.5" /></svg>;
}

function GridIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>;
}

function UsersIcon() {
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3" /><path d="M3 20v-1.5C3 15.5 5.4 13 9 13s6 2.5 6 5.5V20" /><path strokeLinecap="round" d="M16 6.5a3 3 0 0 1 0 5.5m2 2c1.8.7 3 2.1 3 4v2" /></svg>;
}

function HardHatIcon() {
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M4 14h16M6 14a6 6 0 0 1 12 0" /><path d="M9 14V9m6 5V9M5 14l1 5h12l1-5" /></svg>;
}

function BuildingIcon() {
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16M6 21V8l6-3 6 3v13M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01" /></svg>;
}

function PackageIcon() {
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinejoin="round" d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 8 7.5 4 7.5-4M12 12v8" /></svg>;
}

function MoneyIcon() {
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M12 3v18m4-14.5c-.8-.8-2-1.3-4-1.3-2.2 0-3.7 1.2-3.7 3 0 4.2 7.4 2.1 7.4 6.2 0 1.8-1.5 3-3.9 3-2 0-3.4-.6-4.3-1.6" /></svg>;
}

function ChartIcon() {
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 20V4m0 16h17M8 16l4-5 3 3 5-8" /></svg>;
}

function ShieldIcon() {
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinejoin="round" d="M12 3 20 7v6c0 4.5-3.5 7.4-8 8-4.5-.6-8-3.5-8-8V7l8-4Z" /><path strokeLinecap="round" d="M9 12.5 11 15l4-5" /></svg>;
}

function PulseIcon() {
  return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 13h4l2-6 4 12 2-6h4" /></svg>;
}
