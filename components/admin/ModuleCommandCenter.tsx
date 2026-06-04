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
  liveStats?: { label: string; value: string }[];
  liveRows?: { headers: string[]; rows: string[][] };
};

type AreaGroup = {
  name: string;
  modules: ModuleCard[];
  accent: string;
};

type ModuleCommandCenterProps = {
  modules: ModuleCard[];
  roleName: string;
};

const areaCopy: Record<string, { accent: string }> = {
  Relaciones:   { accent: "from-cyan-400 to-blue-500" },
  Obras:        { accent: "from-amber-300 to-orange-500" },
  Abastecimiento: { accent: "from-emerald-300 to-teal-500" },
  Finanzas:     { accent: "from-sky-300 to-indigo-500" },
  Equipo:       { accent: "from-violet-300 to-fuchsia-500" },
  Indicadores:  { accent: "from-lime-300 to-emerald-500" },
  Accesos:      { accent: "from-blue-300 to-slate-500" },
  Auditoria:    { accent: "from-rose-300 to-red-500" },
};

export function ModuleCommandCenter({
  modules,
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
        {/* Encabezado */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-md sm:px-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-200">
              Mapa de áreas
            </p>
            <h2 className="mt-0.5 text-lg font-extrabold tracking-tight sm:text-xl">
              Escoge una ruta de trabajo
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-extrabold text-blue-50">
            <ShieldIcon />
            <span className="truncate">{roleName}</span>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[260px_1fr]">
          {/* Áreas: grilla 2×N en móvil/tablet, lista vertical en xl */}
          <aside>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:flex xl:flex-col xl:gap-1">
              {areaGroups.map((area) => {
                const isActive = area.name === selectedArea?.name;
                return (
                  <button
                    key={area.name}
                    type="button"
                    onClick={() => selectArea(area)}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200 xl:px-4 ${
                      isActive
                        ? "border-white/30 bg-white/15 shadow-md"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${area.accent} text-white shadow-sm xl:h-9 xl:w-9`}>
                      {getModuleIcon(area.modules[0]?.key ?? "")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold leading-tight text-white sm:text-sm">
                        {area.name}
                      </span>
                      <span className="block text-[10px] text-blue-200/60 xl:text-xs">
                        {area.modules.length} módulo{area.modules.length === 1 ? "" : "s"}
                      </span>
                    </span>
                    {isActive && (
                      <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300 xl:block" />
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Panel principal */}
          <div>
            <div className="rounded-[1.75rem] border border-white/15 bg-white/95 p-4 text-blue-950 shadow-2xl shadow-slate-950/25 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xl font-extrabold sm:text-2xl">
                  {selectedArea?.name ?? "Área"}
                </h3>
                <label className="relative block w-full sm:w-72">
                  <span className="sr-only">Buscar módulo</span>
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-700">
                    <SearchIcon />
                  </span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar módulo o acción..."
                    className="h-11 w-full rounded-2xl border border-blue-100 bg-blue-50 px-11 text-sm font-bold text-blue-950 outline-none transition placeholder:text-blue-900/45 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>

              {visibleAreaModules.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-blue-50 p-5">
                  <h4 className="font-extrabold text-blue-950">Sin coincidencias</h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Prueba con otra palabra o cambia de área.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-5">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:overflow-x-auto xl:pb-1">
                    {visibleAreaModules.map((module, index) => (
                      <button
                        key={module.key}
                        type="button"
                        onClick={() => setActiveModuleKey(module.key)}
                        className={`animate-module-rise flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 xl:min-w-[200px] xl:shrink-0 ${
                          module.key === previewModule?.key
                            ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
                            : "border-blue-100 bg-white hover:bg-blue-50"
                        }`}
                        style={{ animationDelay: `${index * 60}ms` }}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white">
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
  const stats = module.liveStats ?? preview.stats;
  const tableHeaders = module.liveRows?.headers ?? preview.headers;
  const tableRows = module.liveRows?.rows ?? preview.rows;

  return (
    <article className="animate-module-rise overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white shadow-lg shadow-blue-100/60">
      <div className="border-b border-blue-100 bg-blue-950 px-5 py-4 sm:px-6 sm:py-5">
        <h4 className="text-lg font-extrabold text-white sm:text-xl">
          {module.title}
        </h4>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 sm:px-4">
              <p className="text-xl font-extrabold text-blue-950 sm:text-2xl">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 sm:text-[11px]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-blue-100">
          <table className="w-full min-w-[360px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                {tableHeaders.map((header) => (
                  <th key={header} className="px-3 py-3 font-extrabold sm:px-4">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {tableRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-blue-50/50">
                  {row.map((cell, i) => (
                    <td
                      key={i}
                      className={`px-3 py-3 text-sm sm:px-4 ${i === 0 ? "font-semibold text-blue-950" : "text-slate-500"}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end border-t border-blue-100 pt-4">
          <Link
            href={module.href}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-950 sm:w-auto"
          >
            Entrar al módulo
            <ArrowIcon />
          </Link>
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
    },
    materiales: {
      headers: ["Material", "Stock", "Estado"],
      rows: [
        ["Cemento IP-30", "420 bolsas", "Suficiente"],
        ["Acero corrugado", "86 barras", "Reposición"],
        ["Cerámica gris", "1,240 m²", "Disponible"],
      ],
      stats: [
        { label: "Ítems", value: "128" },
        { label: "Bajo stock", value: "7" },
        { label: "Órdenes", value: "14" },
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
        { label: "Pendientes", value: "5" },
        { label: "Pagados", value: "18" },
      ],
    },
    reportes: {
      headers: ["Reporte", "Periodo", "Estado"],
      rows: [
        ["Avance de obras", "Mayo", "Listo"],
        ["Materiales usados", "Semana 4", "Parcial"],
        ["Pagos generales", "Mayo", "Revisión"],
      ],
      stats: [
        { label: "Reportes", value: "16" },
        { label: "Nuevos", value: "4" },
        { label: "Áreas", value: "6" },
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
    },
    logs: {
      headers: ["Evento", "Usuario", "Fecha"],
      rows: [
        ["Inicio de sesión", "admin", "Hoy"],
        ["Actualización", "compras01", "Ayer"],
        ["Consulta", "cliente.demo", "Esta semana"],
      ],
      stats: [
        { label: "Eventos", value: "48" },
        { label: "Hoy", value: "6" },
        { label: "Alertas", value: "1" },
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
      accent: copy.accent,
    };
  });
}

function normalizeArea(area: string) {
  return area === "Auditoría" ? "Auditoria" : area;
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
