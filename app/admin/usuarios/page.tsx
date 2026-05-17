import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";

/*
  MÓDULO USUARIOS

  Ruta:
  /admin/usuarios

  Qué hace:
  - Muestra los usuarios internos de la empresa.
  - Permite crear usuario para un empleado.
  - Permite asignar rol.
  - Permite cambiar estado del usuario.
  - Permite cambiar contraseña.
  - Solo el Administrador puede crear o editar usuarios.

  Importante:
  - Los clientes NO se crean aquí.
  - Los clientes están en la tabla cliente.
  - Esta pantalla usa la tabla usuario.
*/

type PageProps = {
  searchParams?: Promise<{
    editar?: string;
    error?: string;
  }>;
};

/*
  Función auxiliar para leer campos del formulario.
*/
function getText(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

/*
  CREAR USUARIO

  Crea un usuario interno en la tabla usuario.
  Debe estar relacionado con un empleado mediante id_empleado.
*/
async function crearUsuario(formData: FormData) {
  "use server";

  const user = await requireModule("usuarios");

  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

  /*
    Solo el administrador puede crear usuarios.
  */
  if (roleName !== "Administrador") {
    redirect("/admin/usuarios");
  }

  const nombre_usuario = getText(formData, "nombre_usuario");
  const correo = getText(formData, "correo");
  const contrasena = getText(formData, "contrasena");
  const estado = getText(formData, "estado") || "activo";

  const id_rol = Number(formData.get("id_rol"));
  const id_empleado = Number(formData.get("id_empleado"));

  /*
    Validación de campos obligatorios.
  */
  if (!nombre_usuario || !correo || !contrasena || !id_rol || !id_empleado) {
    redirect("/admin/usuarios?error=datos-obligatorios");
  }

  /*
    Validamos que el rol exista.
  */
  const rol = await prisma.rol.findUnique({
    where: {
      id_rol,
    },
  });

  if (!rol) {
    redirect("/admin/usuarios?error=rol-invalido");
  }

  /*
    Como los clientes se manejan en tabla cliente,
    no permitimos crear usuarios con rol Cliente aquí.
  */
  if (rol.nombre_rol === "Cliente") {
    redirect("/admin/usuarios?error=rol-cliente");
  }

  /*
    Validamos que el empleado exista.
  */
  const empleado = await prisma.empleado.findUnique({
    where: {
      id_empleado,
    },
  });

  if (!empleado) {
    redirect("/admin/usuarios?error=empleado-invalido");
  }

  /*
    Validamos que no exista otro usuario con el mismo nombre o correo.
  */
  const usuarioExistente = await prisma.usuario.findFirst({
    where: {
      OR: [{ nombre_usuario }, { correo }],
    },
  });

  if (usuarioExistente) {
    redirect("/admin/usuarios?error=usuario-existente");
  }

  /*
    Validamos que ese empleado no tenga ya una cuenta.
  */
  const empleadoConUsuario = await prisma.usuario.findFirst({
    where: {
      id_empleado,
    },
  });

  if (empleadoConUsuario) {
    redirect("/admin/usuarios?error=empleado-con-usuario");
  }

  /*
    Creamos el usuario en la tabla usuario.
  */
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

  Actualiza rol, estado, correo, usuario y contraseña.
*/
async function editarUsuario(formData: FormData) {
  "use server";

  const user = await requireModule("usuarios");

  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

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

  /*
    Validamos que no exista otro usuario con el mismo usuario o correo.
  */
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

  /*
    Datos a actualizar.
    La contraseña solo cambia si se escribe una nueva.
  */
  const data: any = {
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
  Se cambia el estado a "inactivo" para que ya no pueda iniciar sesión.
*/
async function eliminarUsuario(formData: FormData) {
  "use server";

  const user = await requireModule("usuarios");

  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

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
  /*
    Protege la página.
    Solo roles con permiso de usuarios pueden entrar.
  */
  const user = await requireModule("usuarios");

  const params = await searchParams;

  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

  const isAdmin = roleName === "Administrador";

  /*
    Si no es administrador, no debería administrar usuarios.
  */
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
    Trae todos los empleados.
  */
  const empleados = await prisma.empleado.findMany({
    orderBy: {
      id_empleado: "asc",
    },
  });

  /*
    Trae todos los usuarios internos.
  */
  const usuarios = await prisma.usuario.findMany({
    orderBy: {
      id_usuario: "desc",
    },
  });

  /*
    Usuario seleccionado para editar.
  */
  const usuarioEditar = idEditar
    ? await prisma.usuario.findUnique({
        where: {
          id_usuario: idEditar,
        },
      })
    : null;

  /*
    Mapas para mostrar nombres en la tabla.
  */
  const rolMap = new Map(roles.map((rol) => [rol.id_rol, rol.nombre_rol]));

  const empleadoMap = new Map(
    empleados.map((empleado) => [
      empleado.id_empleado,
      `${empleado.nombres} ${empleado.apellidos}`,
    ])
  );

  /*
    Empleados que todavía no tienen usuario.
    Sirve para evitar crear dos usuarios para el mismo empleado.
  */
  const empleadosConUsuario = new Set(
    usuarios
      .map((usuario) => usuario.id_empleado)
      .filter((id): id is number => id !== null)
  );

  const empleadosSinUsuario = empleados.filter(
    (empleado) => !empleadosConUsuario.has(empleado.id_empleado)
  );

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

        {/* Formulario de creación */}
        {!usuarioEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Crear usuario interno
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Este formulario crea una cuenta en la tabla usuario para un empleado existente.
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

              <select
                name="id_rol"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Selecciona rol *</option>
                {roles.map((rol) => (
                  <option key={rol.id_rol} value={rol.id_rol}>
                    {rol.nombre_rol}
                  </option>
                ))}
              </select>

              <select
                name="id_empleado"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Selecciona empleado *</option>
                {empleadosSinUsuario.map((empleado) => (
                  <option
                    key={empleado.id_empleado}
                    value={empleado.id_empleado}
                  >
                    {empleado.id_empleado} - {empleado.nombres}{" "}
                    {empleado.apellidos}
                  </option>
                ))}
              </select>

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

        {/* Formulario de edición */}
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