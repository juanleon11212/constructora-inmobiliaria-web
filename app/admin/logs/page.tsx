import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";

type PageProps = {
  searchParams?: Promise<{
    accion?: string;
    modulo?: string;
    usuario?: string;
  }>;
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

function contains(value: unknown, search: string) {
  return String(value ?? "")
    .toLowerCase()
    .includes(search.toLowerCase());
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("es-BO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function LogsPage({ searchParams }: PageProps) {
  const user = await requireModule("usuarios");
  const roleName = getRoleName(user);

  const params = await searchParams;

  const accion = String(params?.accion ?? "").trim();
  const modulo = String(params?.modulo ?? "").trim();
  const usuario = String(params?.usuario ?? "").trim();

  const logs = await prisma.logAuditoria.findMany({
    orderBy: {
      fecha: "desc",
    },
    take: 200,
  });

  const logsFiltrados = logs.filter((log) => {
    if (accion && !contains(log.accion, accion)) return false;
    if (modulo && !contains(log.modulo, modulo)) return false;
    if (usuario && !contains(log.usuario, usuario)) return false;

    return true;
  });

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-fixed p-6"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(15,23,42,0.86) 0%, rgba(15,23,42,0.68) 42%, rgba(255,255,255,0.10) 100%), url('/images/usuarios.jpg')",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-white drop-shadow">
              <p className="text-sm font-bold text-blue-100">
                Módulo Auditoría
              </p>

              <h1 className="text-4xl font-extrabold tracking-tight">
                Logs del sistema
              </h1>

              <p className="mt-1 text-sm font-medium text-blue-100">
                Consulta quién ingresó, quién editó información y en qué módulo
                realizó cambios.
              </p>

              <p className="mt-2 text-sm font-bold text-blue-100">
                Rol actual: {roleName}
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

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.7rem] border border-white/40 bg-white/55 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-md">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-900">
              Total logs
            </p>

            <h2 className="mt-2 text-4xl font-black text-slate-950">
              {logs.length}
            </h2>

            <p className="mt-2 text-sm font-bold text-slate-700">
              Registros guardados.
            </p>
          </div>

          <div className="rounded-[1.7rem] border border-white/40 bg-white/55 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-md">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-900">
              Filtrados
            </p>

            <h2 className="mt-2 text-4xl font-black text-slate-950">
              {logsFiltrados.length}
            </h2>

            <p className="mt-2 text-sm font-bold text-slate-700">
              Resultado actual.
            </p>
          </div>

          <div className="rounded-[1.7rem] border border-white/40 bg-white/55 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-md">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-900">
              Último evento
            </p>

            <h2 className="mt-2 text-xl font-black text-slate-950">
              {logs[0]?.accion ?? "Sin registros"}
            </h2>

            <p className="mt-2 text-sm font-bold text-slate-700">
              {logs[0]?.modulo ?? "Todavía no hay actividad registrada."}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-white/40 bg-white/30 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <h2 className="text-2xl font-extrabold text-white drop-shadow">
            Filtros
          </h2>

          <form className="mt-5 grid gap-4 md:grid-cols-4">
            <input
              name="usuario"
              defaultValue={usuario}
              placeholder="Buscar por usuario"
              className="rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none backdrop-blur placeholder:text-slate-500 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-200"
            />

            <input
              name="accion"
              defaultValue={accion}
              placeholder="Buscar por acción"
              className="rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none backdrop-blur placeholder:text-slate-500 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-200"
            />

            <input
              name="modulo"
              defaultValue={modulo}
              placeholder="Buscar por módulo"
              className="rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none backdrop-blur placeholder:text-slate-500 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-200"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-blue-800 to-sky-600 px-5 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/30 transition hover:from-blue-950 hover:to-sky-700"
              >
                Buscar
              </button>

              <Link
                href="/admin/logs"
                className="rounded-xl border border-white/40 bg-white/75 px-5 py-3 text-sm font-extrabold text-blue-900 shadow transition hover:bg-white"
              >
                Limpiar
              </Link>
            </div>
          </form>
        </section>

        <section className="mt-6 overflow-x-auto rounded-[28px] border border-white/40 bg-white/35 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <div className="px-5 py-4">
            <h2 className="text-2xl font-extrabold text-white drop-shadow">
              Historial de acciones
            </h2>

            <p className="mt-1 text-sm font-bold text-blue-100">
              Últimos 200 eventos registrados.
            </p>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead className="bg-white/70 backdrop-blur">
              <tr>
                <th className="border border-white/30 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-800">
                  ID
                </th>
                <th className="border border-white/30 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-800">
                  Fecha
                </th>
                <th className="border border-white/30 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-800">
                  Usuario
                </th>
                <th className="border border-white/30 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-800">
                  Rol
                </th>
                <th className="border border-white/30 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-800">
                  Acción
                </th>
                <th className="border border-white/30 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-800">
                  Módulo
                </th>
                <th className="border border-white/30 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-800">
                  Sector
                </th>
                <th className="border border-white/30 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-800">
                  Descripción
                </th>
                <th className="border border-white/30 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-800">
                  Registro
                </th>
              </tr>
            </thead>

            <tbody className="bg-white/40 backdrop-blur">
              {logsFiltrados.map((log) => (
                <tr key={log.id_log} className="transition hover:bg-white/70">
                  <td className="border border-white/30 px-4 py-3 text-sm font-semibold text-slate-800">
                    {log.id_log}
                  </td>

                  <td className="border border-white/30 px-4 py-3 text-sm font-semibold text-slate-800">
                    {formatDateTime(log.fecha)}
                  </td>

                  <td className="border border-white/30 px-4 py-3 text-sm font-extrabold text-slate-950">
                    {log.usuario ?? "-"}
                  </td>

                  <td className="border border-white/30 px-4 py-3 text-sm font-semibold text-slate-800">
                    {log.rol ?? "-"}
                  </td>

                  <td className="border border-white/30 px-4 py-3 text-sm font-semibold text-slate-800">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold text-blue-800">
                      {log.accion}
                    </span>
                  </td>

                  <td className="border border-white/30 px-4 py-3 text-sm font-semibold text-slate-800">
                    {log.modulo}
                  </td>

                  <td className="border border-white/30 px-4 py-3 text-sm font-semibold text-slate-800">
                    {log.sector ?? "-"}
                  </td>

                  <td className="border border-white/30 px-4 py-3 text-sm font-semibold text-slate-800">
                    {log.descripcion ?? "-"}
                  </td>

                  <td className="border border-white/30 px-4 py-3 text-sm font-semibold text-slate-800">
                    {log.registro_id ?? "-"}
                  </td>
                </tr>
              ))}

              {logsFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="border border-white/30 p-6 text-center font-semibold text-slate-700"
                  >
                    No hay logs registrados.
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