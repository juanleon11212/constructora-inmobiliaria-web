"use client";

import Link from "next/link";
import { FormEvent } from "react";
import { useRouter } from "next/navigation";

export type FilterOption = {
  value: string;
  label: string;
  placeholder: string;
};

type TableFilterProps = {
  basePath: string;
  title: string;
  currentLabel: string;
  options: FilterOption[];
  filtroActivo: boolean;
  campoFiltro: string;
  valorFiltro: string;
  resultados: number;
  extraParams?: Record<string, string | number | undefined>;
};

function buildHref(
  basePath: string,
  params: Record<string, string | number | undefined>
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return query ? `${basePath}?${query}` : basePath;
}

export function TableFilter({
  basePath,
  title,
  currentLabel,
  options,
  filtroActivo,
  campoFiltro,
  valorFiltro,
  resultados,
  extraParams = {},
}: TableFilterProps) {
  const router = useRouter();

  const opcionSeleccionada =
    options.find((opcion) => opcion.value === campoFiltro) ?? options[0];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const campo = String(formData.get("campo") ?? "");
    const valor = String(formData.get("valor") ?? "");

    const href = buildHref(basePath, {
      ...extraParams,
      filtro: "1",
      campo,
      valor,
    });

    /*
      IMPORTANTE:
      Esto hace que el filtro se actualice sin volver al inicio de la página.
    */
    router.push(href, {
      scroll: false,
    });
  }

  return (
    <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
              <path
                d="M10.5 18a7.5 7.5 0 1 1 5.3-2.2L21 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>

            <p className="text-sm text-slate-500">
              Lista actual:{" "}
              <span className="font-semibold text-slate-700">
                {currentLabel}
              </span>
            </p>
          </div>
        </div>

        {!filtroActivo && (
          <Link
            href={buildHref(basePath, {
              ...extraParams,
              filtro: "1",
            })}
            scroll={false}
            className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Buscar con lupa
          </Link>
        )}
      </div>

      {filtroActivo && (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 md:grid-cols-[260px_1fr_auto_auto]"
        >
          {Object.entries(extraParams).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value ?? ""} />
          ))}

          <input type="hidden" name="filtro" value="1" />

          <select
            name="campo"
            defaultValue={campoFiltro || opcionSeleccionada?.value}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
          >
            {options.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>

          <input
            name="valor"
            defaultValue={valorFiltro}
            placeholder={opcionSeleccionada?.placeholder ?? "Escribe para buscar"}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />

          <button
            type="submit"
            className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Buscar
          </button>

          <Link
            href={buildHref(basePath, extraParams)}
            scroll={false}
            className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Limpiar
          </Link>
        </form>
      )}

      {campoFiltro && valorFiltro && (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Buscando por{" "}
          <span className="font-semibold">{opcionSeleccionada?.label}</span>:{" "}
          <span className="font-semibold">{valorFiltro}</span> — Resultados:{" "}
          <span className="font-semibold">{resultados}</span>
        </div>
      )}
    </section>
  );
}