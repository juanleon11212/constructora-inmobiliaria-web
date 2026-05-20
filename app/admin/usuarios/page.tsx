import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";
import RoleEmployeeSelect from "../../../components/froms/RoleEmployeeSelect";

/*
  MÓDULO USUARIOS

  Ruta:
  /admin/usuarios

  Qué hace:
  - Muestra usuarios internos de la empresa.
  - Permite crear usuario para un empleado.
  - Permite asignar rol.
  - Permite editar usuario.
  - Permite desactivar usuario.
  - Filtra empleados según el rol elegido y el cargo del empleado.

  Importante:
  - Cargo pertenece a empleado.
  - Rol pertenece a usuario.
  - La relación correcta es:
    cargo -> empleado -> usuario -> rol

  Ejemplo:
  Cargo: Contador
  Empleado: Carlos Pinto
  Usuario: cpinto
  Rol: Contabilidad
*/

type PageProps = {
  searchParams?: Promise<{
    editar?: string;
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

/*
  CREAR USUARIO

  Crea un usuario interno relacionado con un empleado.
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

  /*
    Cliente no se crea aquí.
    Cliente se maneja desde la tabla cliente.
  */
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

  await prisma.usuario.create({
    data: {
      nombre_usuario,
      correo,
      contrasena,
      estado,
      id_rol,
      id_empleado,
    },
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

/*
  EDITAR USUARIO

  Actualiza:
  - nombre de usuario
  - correo
  - contraseña, si se escribe una nueva
  - rol
  - estado
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

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

/*
  ELIMINAR USUARIO

  No se borra físicamente.
  Solo se cambia estado a inactivo.
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

  /*
    Evita que el administrador se desactive a sí mismo.
  */
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

  /*
    Trae roles, pero excluye Cliente porque cliente se maneja en tabla cliente.
  */
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

  /*
    Trae empleados.
  */
  const empleados = await prisma.empleado.findMany({
    orderBy: {
      id_empleado: "asc",
    },
  });

  /*
    Trae cargos.
    Esto sirve para filtrar empleados según rol seleccionado.
  */
  const cargos = await prisma.cargo.findMany({
    orderBy: {
      nombre_cargo: "asc",
    },
  });

  /*
    Trae usuarios internos.
  */
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

  /*
    Empleados que ya tienen usuario.
  */
  const empleadosConUsuario = new Set(
    usuarios
      .map((usuario) => usuario.id_empleado)
      .filter((id): id is number => id !== null)
  );

  /*
    Solo se muestran empleados sin cuenta.
  */
  const empleadosSinUsuario = empleados.filter(
    (empleado) => !empleadosConUsuario.has(empleado.id_empleado)
  );

  /*
    Datos simples para el componente RoleEmployeeSelect.
  */
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
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Módulo Usuarios
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Usuarios
            </h1>

            <p className="mt-1 text-slate-600">
              Administración de cuentas internas de la empresa.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            Volver al panel
          </Link>
        </div>

        {/* Mensajes de error */}
        {params?.error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

        {/* Crear usuario */}
        {!usuarioEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Crear usuario interno
            </h2>

            <p className="mt-1 text-sm text-slate-500">
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
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="correo"
                placeholder="Correo *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                type="password"
                name="contrasena"
                placeholder="Contraseña *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <RoleEmployeeSelect
                roles={rolesParaSelector}
                cargos={cargosParaSelector}
                empleados={empleadosParaSelector}
              />

              <select
                name="estado"
                defaultValue="activo"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Crear usuario
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Editar usuario */}
        {usuarioEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Editar usuario
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Modifica rol, estado, correo o contraseña del usuario.
                </p>
              </div>

              <Link
                href="/admin/usuarios"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
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
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="correo"
                placeholder="Correo *"
                defaultValue={usuarioEditar.correo}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                type="password"
                name="contrasena"
                placeholder="Nueva contraseña o dejar vacío"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <select
                name="id_rol"
                defaultValue={usuarioEditar.id_rol}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
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
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Tabla de usuarios */}
        <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-200">
              <tr>
                <th className="border p-3 text-left">ID</th>
                <th className="border p-3 text-left">Usuario</th>
                <th className="border p-3 text-left">Correo</th>
                <th className="border p-3 text-left">Rol</th>
                <th className="border p-3 text-left">Empleado</th>
                <th className="border p-3 text-left">Estado</th>
                <th className="border p-3 text-left">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id_usuario} className="hover:bg-slate-50">
                  <td className="border p-3">{usuario.id_usuario}</td>

                  <td className="border p-3 font-medium text-slate-900">
                    {usuario.nombre_usuario}
                  </td>

                  <td className="border p-3">{usuario.correo}</td>

                  <td className="border p-3">
                    {rolMap.get(usuario.id_rol) ?? "-"}
                  </td>

                  <td className="border p-3">
                    {usuario.id_empleado
                      ? empleadoMap.get(usuario.id_empleado) ?? "-"
                      : "-"}
                  </td>

                  <td className="border p-3">{usuario.estado}</td>

                  <td className="border p-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/usuarios?editar=${usuario.id_usuario}`}
                        className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white"
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
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                          >
                            Eliminar
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {usuarios.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="border p-6 text-center text-slate-500"
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