import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";
import RoleEmployeeSelect from "../../../components/froms/RoleEmployeeSelect";
import {
  TableFilter,
  type FilterOption,
} from "../../../components/admin/TableFilter";
import { containsText, equalsText } from "../../../lib/table-filter";
import { createAuditLog } from "../../../lib/audit-log";

/*
  MÓDULO USUARIOS

  Ruta:
  /admin/usuarios

  Funciones:
  - Crear usuario interno.
  - Editar usuario.
  - Desactivar usuario.
  - Filtrar usuarios.
  - Registrar logs de crear, editar y desactivar.
*/

type PageProps = {
  searchParams?: Promise<{
    editar?: string;
    filtro?: string;
    campo?: string;
    valor?: string;
    error?: string;
  }>;
};

function getText(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

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

const inputClass =
  "w-full rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none backdrop-blur placeholder:text-slate-500 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-200";

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
    <div className="rounded-[1.7rem] border border-white/40 bg-white/50 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-900">
            {label}
          </p>

          <h3 className="mt-2 text-3xl font-black text-slate-950">
            {value}
          </h3>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-900/90 text-2xl text-white shadow-lg">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-sm font-bold text-slate-700">{helper}</p>
    </div>
  );
}

/*
  CREAR USUARIO
*/
async function crearUsuario(formData: FormData) {
  "use server";

  const user = await requireModule("usuarios");
  const roleName = getRoleName(user);

  if (roleName !== "Administrador") {
    redirect("/admin/usuarios");
  }

  const nombre_usuario = getText(formData, "nombre_usuario");
  const correo = getText(formData, "correo");
  const contrasena = getText(formData, "contrasena");
  const estado = getText(formData, "estado") || "activo";

  const id_rol = Number(formData.get("id_rol"));
  const id_empleado = Number(formData.get("id_empleado"));

  if (!nombre_usuario || !correo || !contrasena || !id_rol || !id_empleado) {
    redirect("/admin/usuarios?error=datos-obligatorios");
  }

  const rol = await prisma.rol.findUnique({
    where: {
      id_rol,
    },
  });

  if (!rol) {
    redirect("/admin/usuarios?error=rol-invalido");
  }

  if (rol.nombre_rol === "Cliente") {
    redirect("/admin/usuarios?error=rol-cliente");
  }

  const empleado = await prisma.empleado.findUnique({
    where: {
      id_empleado,
    },
  });

  if (!empleado) {
    redirect("/admin/usuarios?error=empleado-invalido");
  }

  const usuarioExistente = await prisma.usuario.findFirst({
    where: {
      OR: [{ nombre_usuario }, { correo }],
    },
  });

  if (usuarioExistente) {
    redirect("/admin/usuarios?error=usuario-existente");
  }

  const empleadoConUsuario = await prisma.usuario.findFirst({
    where: {
      id_empleado,
    },
  });

  if (empleadoConUsuario) {
    redirect("/admin/usuarios?error=empleado-con-usuario");
  }

  const usuarioCreado = await prisma.usuario.create({
    data: {
      nombre_usuario,
      correo,
      contrasena,
      estado,
      id_rol,
      id_empleado,
    },
  });

  await createAuditLog({
    id_usuario: user.id_usuario ?? null,
    usuario: user.nombre_usuario ?? null,
    rol: roleName,
    accion: "CREAR",
    modulo: "Usuarios",
    sector: "Crear usuario",
    descripcion: `Se creó el usuario ${nombre_usuario}.`,
    registro_id: usuarioCreado.id_usuario,
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

/*
  EDITAR USUARIO
*/
async function editarUsuario(formData: FormData) {
  "use server";

  const user = await requireModule("usuarios");
  const roleName = getRoleName(user);

  if (roleName !== "Administrador") {
    redirect("/admin/usuarios");
  }

  const id_usuario = Number(formData.get("id_usuario"));

  if (!id_usuario) {
    redirect("/admin/usuarios?error=id-invalido");
  }

  const nombre_usuario = getText(formData, "nombre_usuario");
  const correo = getText(formData, "correo");
  const contrasena = getText(formData, "contrasena");
  const estado = getText(formData, "estado") || "activo";
  const id_rol = Number(formData.get("id_rol"));

  if (!nombre_usuario || !correo || !id_rol) {
    redirect(`/admin/usuarios?editar=${id_usuario}&error=datos-obligatorios`);
  }

  const rol = await prisma.rol.findUnique({
    where: {
      id_rol,
    },
  });

  if (!rol) {
    redirect(`/admin/usuarios?editar=${id_usuario}&error=rol-invalido`);
  }

  if (rol.nombre_rol === "Cliente") {
    redirect(`/admin/usuarios?editar=${id_usuario}&error=rol-cliente`);
  }

  const usuarioDuplicado = await prisma.usuario.findFirst({
    where: {
      id_usuario: {
        not: id_usuario,
      },
      OR: [{ nombre_usuario }, { correo }],
    },
  });

  if (usuarioDuplicado) {
    redirect(`/admin/usuarios?editar=${id_usuario}&error=usuario-existente`);
  }

  const data: {
    nombre_usuario: string;
    correo: string;
    estado: string;
    id_rol: number;
    contrasena?: string;
  } = {
    nombre_usuario,
    correo,
    estado,
    id_rol,
  };

  if (contrasena) {
    data.contrasena = contrasena;
  }

  await prisma.usuario.update({
    where: {
      id_usuario,
    },
    data,
  });

  await createAuditLog({
    id_usuario: user.id_usuario ?? null,
    usuario: user.nombre_usuario ?? null,
    rol: roleName,
    accion: "EDITAR",
    modulo: "Usuarios",
    sector: "Editar usuario",
    descripcion: `Se editó el usuario con ID ${id_usuario}.`,
    registro_id: id_usuario,
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

/*
  DESACTIVAR USUARIO
  No se borra físicamente. Solo se cambia estado a inactivo.
*/
async function eliminarUsuario(formData: FormData) {
  "use server";

  const user = await requireModule("usuarios");
  const roleName = getRoleName(user);

  if (roleName !== "Administrador") {
    redirect("/admin/usuarios");
  }

  const id_usuario = Number(formData.get("id_usuario"));

  if (!id_usuario) {
    redirect("/admin/usuarios?error=id-invalido");
  }

  if (user.id_usuario === id_usuario) {
    redirect("/admin/usuarios?error=no-autodesactivar");
  }

  await prisma.usuario.update({
    where: {
      id_usuario,
    },
    data: {
      estado: "inactivo",
    },
  });

  await createAuditLog({
    id_usuario: user.id_usuario ?? null,
    usuario: user.nombre_usuario ?? null,
    rol: roleName,
    accion: "DESACTIVAR",
    modulo: "Usuarios",
    sector: "Desactivar usuario",
    descripcion: `Se desactivó el usuario con ID ${id_usuario}.`,
    registro_id: id_usuario,
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export default async function UsuariosPage({ searchParams }: PageProps) {
  const user = await requireModule("usuarios");
  const params = await searchParams;

  const roleName = getRoleName(user);
  const isAdmin = roleName === "Administrador";

  if (!isAdmin) {
    redirect("/admin");
  }

  const idEditar = Number(params?.editar);

  const filtroActivo = params?.filtro === "1";
  const campoFiltro = String(params?.campo ?? "").trim();
  const valorFiltro = String(params?.valor ?? "").trim();
  const hayFiltro = Boolean(campoFiltro && valorFiltro);

  const opcionesFiltroUsuarios: FilterOption[] = [
    {
      value: "id_usuario",
      label: "ID usuario",
      placeholder: "Ejemplo: 1",
    },
    {
      value: "nombre_usuario",
      label: "Nombre de usuario",
      placeholder: "Ejemplo: admin",
    },
    {
      value: "correo",
      label: "Correo",
      placeholder: "Ejemplo: usuario@correo.com",
    },
    {
      value: "rol",
      label: "Rol",
      placeholder: "Ejemplo: Administrador",
    },
    {
      value: "empleado",
      label: "Empleado",
      placeholder: "Ejemplo: Juan",
    },
    {
      value: "estado",
      label: "Estado",
      placeholder: "Ejemplo: activo",
    },
  ];

  const roles = await prisma.rol.findMany({
    where: {
      nombre_rol: {
        not: "Cliente",
      },
    },
    orderBy: {
      id_rol: "asc",
    },
  });

  const empleados = await prisma.empleado.findMany({
    orderBy: {
      id_empleado: "asc",
    },
  });

  const cargos = await prisma.cargo.findMany({
    orderBy: {
      nombre_cargo: "asc",
    },
  });

  const usuarios = await prisma.usuario.findMany({
    orderBy: {
      id_usuario: "desc",
    },
  });

  const usuarioEditar = idEditar
    ? await prisma.usuario.findUnique({
        where: {
          id_usuario: idEditar,
        },
      })
    : null;

  const rolMap = new Map(roles.map((rol) => [rol.id_rol, rol.nombre_rol]));

  const empleadoMap = new Map(
    empleados.map((empleado) => [
      empleado.id_empleado,
      `${empleado.nombres} ${empleado.apellidos}`,
    ])
  );

  const usuariosFiltrados = usuarios.filter((usuario) => {
    if (!hayFiltro) return true;

    if (campoFiltro === "id_usuario") {
      return equalsText(usuario.id_usuario, valorFiltro);
    }

    if (campoFiltro === "nombre_usuario") {
      return containsText(usuario.nombre_usuario, valorFiltro);
    }

    if (campoFiltro === "correo") {
      return containsText(usuario.correo, valorFiltro);
    }

    if (campoFiltro === "rol") {
      return containsText(rolMap.get(usuario.id_rol), valorFiltro);
    }

    if (campoFiltro === "empleado") {
      return containsText(
        usuario.id_empleado ? empleadoMap.get(usuario.id_empleado) : "-",
        valorFiltro
      );
    }

    if (campoFiltro === "estado") {
      return containsText(usuario.estado, valorFiltro);
    }

    return true;
  });

  const empleadosConUsuario = new Set(
    usuarios
      .map((usuario) => usuario.id_empleado)
      .filter((id): id is number => id !== null)
  );

  const empleadosSinUsuario = empleados.filter(
    (empleado) => !empleadosConUsuario.has(empleado.id_empleado)
  );

  const rolesParaSelector = roles.map((rol) => ({
    id_rol: rol.id_rol,
    nombre_rol: rol.nombre_rol,
  }));

  const cargosParaSelector = cargos.map((cargo) => ({
    id_cargo: cargo.id_cargo,
    nombre_cargo: cargo.nombre_cargo,
  }));

  const empleadosParaSelector = empleadosSinUsuario.map((empleado) => ({
    id_empleado: empleado.id_empleado,
    nombres: empleado.nombres,
    apellidos: empleado.apellidos,
    ci: empleado.ci,
    id_cargo: empleado.id_cargo,
  }));

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-fixed p-6"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.62) 36%, rgba(255,255,255,0.12) 100%), url('/images/usuarios.jpg')",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-white drop-shadow">
              <p className="text-sm font-bold text-blue-100">
                Módulo Usuarios
              </p>

              <h1 className="text-4xl font-extrabold tracking-tight">
                Usuarios
              </h1>

              <p className="mt-1 text-sm font-medium text-blue-100">
                Administración de cuentas internas de la empresa.
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

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Usuarios"
            value={usuarios.length}
            helper="Cuentas internas registradas"
            icon="👥"
          />

          <StatCard
            label="Filtrados"
            value={usuariosFiltrados.length}
            helper="Resultados visibles según búsqueda"
            icon="🔎"
          />

          <StatCard
            label="Roles"
            value={roles.length}
            helper="Roles disponibles para asignar"
            icon="🛡️"
          />

          <StatCard
            label="Empleados"
            value={empleados.length}
            helper="Empleados disponibles para usuario"
            icon="🏗️"
          />
        </section>

        {params?.error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-bold text-red-700 shadow-lg backdrop-blur">
            {params.error === "datos-obligatorios" &&
              "Usuario, correo, contraseña, rol y empleado son obligatorios."}

            {params.error === "rol-invalido" &&
              "El rol seleccionado no existe."}

            {params.error === "rol-cliente" &&
              "El rol Cliente no se crea en Usuarios. Se crea desde la tabla Cliente."}

            {params.error === "empleado-invalido" &&
              "El empleado seleccionado no existe."}

            {params.error === "usuario-existente" &&
              "Ya existe un usuario con ese nombre o correo."}

            {params.error === "empleado-con-usuario" &&
              "Ese empleado ya tiene una cuenta de usuario."}

            {params.error === "id-invalido" &&
              "El ID del usuario no es válido."}

            {params.error === "no-autodesactivar" &&
              "No puedes eliminar o desactivar tu propia cuenta."}
          </div>
        )}

        {!usuarioEditar && (
          <section className="mt-6 rounded-[28px] border border-white/40 bg-white/30 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
            <h2 className="text-2xl font-extrabold text-white drop-shadow">
              Crear usuario interno
            </h2>

            <p className="mt-1 text-sm font-bold text-blue-100">
              Primero selecciona el rol. Luego aparecerán solo los empleados con
              cargo correspondiente a ese rol.
            </p>

            <form
              action={crearUsuario}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input
                name="nombre_usuario"
                placeholder="Nombre de usuario *"
                className={inputClass}
              />

              <input
                name="correo"
                placeholder="Correo *"
                className={inputClass}
              />

              <input
                type="password"
                name="contrasena"
                placeholder="Contraseña *"
                className={inputClass}
              />

              <RoleEmployeeSelect
                roles={rolesParaSelector}
                cargos={cargosParaSelector}
                empleados={empleadosParaSelector}
              />

              <select
                name="estado"
                defaultValue="activo"
                className={inputClass}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-blue-800 to-sky-600 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/30 transition hover:from-blue-950 hover:to-sky-700"
                >
                  Crear usuario
                </button>
              </div>
            </form>
          </section>
        )}

        {usuarioEditar && (
          <section className="mt-6 rounded-[28px] border border-white/40 bg-white/30 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white drop-shadow">
                  Editar usuario
                </h2>

                <p className="mt-1 text-sm font-bold text-blue-100">
                  Modifica rol, estado, correo o contraseña del usuario.
                </p>
              </div>

              <Link
                href="/admin/usuarios"
                scroll={false}
                className="rounded-xl border border-white/40 bg-white/70 px-4 py-2 text-sm font-extrabold text-blue-900 transition hover:bg-white"
              >
                Cancelar
              </Link>
            </div>

            <form
              action={editarUsuario}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input
                type="hidden"
                name="id_usuario"
                defaultValue={usuarioEditar.id_usuario}
              />

              <input
                name="nombre_usuario"
                placeholder="Nombre de usuario *"
                defaultValue={usuarioEditar.nombre_usuario}
                className={inputClass}
              />

              <input
                name="correo"
                placeholder="Correo *"
                defaultValue={usuarioEditar.correo}
                className={inputClass}
              />

              <input
                type="password"
                name="contrasena"
                placeholder="Nueva contraseña o dejar vacío"
                className={inputClass}
              />

              <select
                name="id_rol"
                defaultValue={usuarioEditar.id_rol}
                className={inputClass}
              >
                {roles.map((rol) => (
                  <option key={rol.id_rol} value={rol.id_rol}>
                    {rol.nombre_rol}
                  </option>
                ))}
              </select>

              <select
                name="estado"
                defaultValue={usuarioEditar.estado}
                className={inputClass}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-blue-800 to-sky-600 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/30 transition hover:from-blue-950 hover:to-sky-700"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="mt-6 rounded-[28px] border border-white/40 bg-white/25 p-1 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <TableFilter
            basePath="/admin/usuarios"
            title="Filtro de usuarios"
            currentLabel="Usuarios"
            options={opcionesFiltroUsuarios}
            filtroActivo={filtroActivo}
            campoFiltro={campoFiltro}
            valorFiltro={valorFiltro}
            resultados={usuariosFiltrados.length}
          />
        </div>

        <section className="mt-6 overflow-x-auto rounded-[28px] border border-white/40 bg-white/35 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <div className="px-5 py-4">
            <h2 className="text-2xl font-extrabold text-white drop-shadow">
              Lista de usuarios registrados
            </h2>

            <p className="mt-1 text-sm font-bold text-blue-100">
              Registros visibles: {usuariosFiltrados.length}
            </p>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead className="bg-white/70 backdrop-blur">
              <tr>
                <th className={tableHeaderClass}>ID</th>
                <th className={tableHeaderClass}>Usuario</th>
                <th className={tableHeaderClass}>Correo</th>
                <th className={tableHeaderClass}>Rol</th>
                <th className={tableHeaderClass}>Empleado</th>
                <th className={tableHeaderClass}>Estado</th>
                <th className={tableHeaderClass}>Acciones</th>
              </tr>
            </thead>

            <tbody className="bg-white/40 backdrop-blur">
              {usuariosFiltrados.map((usuario) => (
                <tr
                  key={usuario.id_usuario}
                  className="transition hover:bg-white/70"
                >
                  <td className={tableCellClass}>{usuario.id_usuario}</td>

                  <td className="border border-white/30 px-4 py-3 text-sm font-extrabold text-slate-950">
                    {usuario.nombre_usuario}
                  </td>

                  <td className={tableCellClass}>{usuario.correo}</td>

                  <td className={tableCellClass}>
                    {rolMap.get(usuario.id_rol) ?? "-"}
                  </td>

                  <td className={tableCellClass}>
                    {usuario.id_empleado
                      ? empleadoMap.get(usuario.id_empleado) ?? "-"
                      : "-"}
                  </td>

                  <td className={tableCellClass}>{usuario.estado}</td>

                  <td className="border border-white/30 px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/usuarios?editar=${usuario.id_usuario}`}
                        scroll={false}
                        className="rounded-lg bg-white/75 px-3 py-2 text-xs font-extrabold text-blue-900 shadow transition hover:bg-white"
                      >
                        Editar
                      </Link>

                      {usuario.estado !== "inactivo" && (
                        <form action={eliminarUsuario}>
                          <input
                            type="hidden"
                            name="id_usuario"
                            value={usuario.id_usuario}
                          />

                          <button
                            type="submit"
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-extrabold text-white shadow transition hover:bg-red-700"
                          >
                            Desactivar
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="border border-white/30 p-6 text-center font-semibold text-slate-700"
                  >
                    No hay usuarios registrados.
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