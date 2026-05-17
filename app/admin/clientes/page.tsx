import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";

/*
  MÓDULO CLIENTES

  Ruta:
  /admin/clientes

  Funciones:
  - Ver todos los clientes.
  - Crear cliente.
  - Editar cliente.
  - Ver detalle del cliente.
  - Ver proyectos del cliente.

  Reglas:
  - Administrador puede crear y editar.
  - Roles con permiso de clientes pueden ver.
*/

type PageProps = {
  searchParams?: Promise<{
    editar?: string;
    ver?: string;
    error?: string;
  }>;
};

/*
  Lee un campo del formulario y lo convierte a texto limpio.
*/
function getText(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

/*
  CREAR CLIENTE

  Esta acción guarda un cliente nuevo en la tabla cliente.
*/
async function crearCliente(formData: FormData) {
  "use server";

  const user = await requireModule("clientes");

  const roleName =
  typeof user.rol === "string"
    ? user.rol
    : user.rol?.nombre_rol ?? "";

if (roleName !== "Administrador") {
  redirect("/admin/clientes");
}

  const nombres = getText(formData, "nombres");
  const apellidos = getText(formData, "apellidos");
  const razon_social = getText(formData, "razon_social");
  const ci_nit = getText(formData, "ci_nit");
  const telefono = getText(formData, "telefono");
  const correo = getText(formData, "correo");
  const direccion = getText(formData, "direccion");
  const nombre_usuario = getText(formData, "nombre_usuario");
  const contrasena = getText(formData, "contrasena");

  if (!ci_nit || !correo) {
    redirect("/admin/clientes?error=datos-obligatorios");
  }

  if (nombre_usuario && !contrasena) {
    redirect("/admin/clientes?error=password-requerido");
  }

  const clienteExistente = await prisma.cliente.findFirst({
    where: {
      OR: [
        { ci_nit },
        ...(nombre_usuario ? [{ nombre_usuario }] : []),
      ],
    },
  });

  if (clienteExistente) {
    redirect("/admin/clientes?error=cliente-existente");
  }

  const rolCliente = await prisma.rol.findFirst({
    where: {
      nombre_rol: "Cliente",
    },
  });

  await prisma.cliente.create({
    data: {
      nombres: nombres || null,
      apellidos: apellidos || null,
      razon_social: razon_social || null,
      ci_nit,
      telefono: telefono || null,
      correo,
      direccion: direccion || null,
      nombre_usuario: nombre_usuario || null,
      contrasena: contrasena || null,
      estado_cuenta: "activo",
      id_rol: rolCliente?.id_rol ?? null,
    },
  });

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

/*
  EDITAR CLIENTE

  Esta acción actualiza un cliente existente.
*/
async function editarCliente(formData: FormData) {
  "use server";

  const user = await requireModule("clientes");

const roleName =
  typeof user.rol === "string"
    ? user.rol
    : user.rol?.nombre_rol ?? "";

if (roleName !== "Administrador") {
  redirect("/admin/clientes");
}

  const id_cliente = Number(formData.get("id_cliente"));

  if (!id_cliente) {
    redirect("/admin/clientes?error=id-invalido");
  }

  const nombres = getText(formData, "nombres");
  const apellidos = getText(formData, "apellidos");
  const razon_social = getText(formData, "razon_social");
  const ci_nit = getText(formData, "ci_nit");
  const telefono = getText(formData, "telefono");
  const correo = getText(formData, "correo");
  const direccion = getText(formData, "direccion");
  const nombre_usuario = getText(formData, "nombre_usuario");
  const contrasena = getText(formData, "contrasena");
  const estado_cuenta = getText(formData, "estado_cuenta") || "activo";

  if (!ci_nit || !correo) {
    redirect(`/admin/clientes?editar=${id_cliente}&error=datos-obligatorios`);
  }

  const clienteDuplicado = await prisma.cliente.findFirst({
    where: {
      id_cliente: {
        not: id_cliente,
      },
      OR: [
        { ci_nit },
        ...(nombre_usuario ? [{ nombre_usuario }] : []),
      ],
    },
  });

  if (clienteDuplicado) {
    redirect(`/admin/clientes?editar=${id_cliente}&error=cliente-existente`);
  }

  const data: any = {
    nombres: nombres || null,
    apellidos: apellidos || null,
    razon_social: razon_social || null,
    ci_nit,
    telefono: telefono || null,
    correo,
    direccion: direccion || null,
    nombre_usuario: nombre_usuario || null,
    estado_cuenta,
  };

  /*
    La contraseña solo se modifica si escribes una nueva.
    Si el campo queda vacío, mantiene la anterior.
  */
  if (contrasena) {
    data.contrasena = contrasena;
  }

  await prisma.cliente.update({
    where: {
      id_cliente,
    },
    data,
  });

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

export default async function ClientesPage({ searchParams }: PageProps) {
  /*
    Protege el módulo clientes.
  */
  const user = await requireModule("clientes");

  const params = await searchParams;

  /*
    Solo el administrador puede crear y editar.
  */
  const roleName =
  typeof user.rol === "string"
    ? user.rol
    : user.rol?.nombre_rol ?? "";

const isAdmin = roleName === "Administrador";

  const idEditar = Number(params?.editar);
  const idVer = Number(params?.ver);

  /*
    Lista todos los clientes.
  */
  const clientes = await prisma.cliente.findMany({
    orderBy: {
      id_cliente: "desc",
    },
  });

  /*
    Cliente seleccionado para editar.
  */
  const clienteEditar = idEditar
    ? await prisma.cliente.findUnique({
        where: {
          id_cliente: idEditar,
        },
      })
    : null;

  /*
    Cliente seleccionado para ver detalle.
  */
  const clienteVer = idVer
    ? await prisma.cliente.findUnique({
        where: {
          id_cliente: idVer,
        },
      })
    : null;

  /*
    Proyectos relacionados al cliente seleccionado.
  */
  const proyectosCliente = idVer
    ? await prisma.proyecto.findMany({
        where: {
          id_cliente: idVer,
        },
        orderBy: {
          id_proyecto: "desc",
        },
      })
    : [];

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Módulo Clientes
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Clientes
            </h1>

            <p className="mt-1 text-slate-600">
              Administración de clientes de la constructora.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            Volver al panel
          </Link>
        </div>

        {params?.error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error === "datos-obligatorios" &&
              "CI/NIT y correo son obligatorios."}

            {params.error === "password-requerido" &&
              "Si colocas usuario de acceso, también debes colocar contraseña."}

            {params.error === "cliente-existente" &&
              "Ya existe un cliente con ese CI/NIT o usuario."}

            {params.error === "id-invalido" &&
              "El ID del cliente no es válido."}
          </div>
        )}

        {isAdmin && !clienteEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Crear cliente
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Este formulario registra un cliente nuevo en la tabla cliente.
            </p>

            <form
              action={crearCliente}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input
                name="nombres"
                placeholder="Nombres"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="apellidos"
                placeholder="Apellidos"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="razon_social"
                placeholder="Razón social si es empresa"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-2"
              />

              <input
                name="ci_nit"
                placeholder="CI/NIT *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="telefono"
                placeholder="Teléfono"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="correo"
                placeholder="Correo *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="direccion"
                placeholder="Dirección"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="nombre_usuario"
                placeholder="Usuario de acceso opcional"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                type="password"
                name="contrasena"
                placeholder="Contraseña opcional"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Crear cliente
                </button>
              </div>
            </form>
          </section>
        )}

        {isAdmin && clienteEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Editar cliente
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Modifica los datos del cliente seleccionado.
                </p>
              </div>

              <Link
                href="/admin/clientes"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </Link>
            </div>

            <form
              action={editarCliente}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input
                type="hidden"
                name="id_cliente"
                defaultValue={clienteEditar.id_cliente}
              />

              <input
                name="nombres"
                placeholder="Nombres"
                defaultValue={clienteEditar.nombres ?? ""}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="apellidos"
                placeholder="Apellidos"
                defaultValue={clienteEditar.apellidos ?? ""}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="razon_social"
                placeholder="Razón social"
                defaultValue={clienteEditar.razon_social ?? ""}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-2"
              />

              <input
                name="ci_nit"
                placeholder="CI/NIT *"
                defaultValue={clienteEditar.ci_nit}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="telefono"
                placeholder="Teléfono"
                defaultValue={clienteEditar.telefono ?? ""}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="correo"
                placeholder="Correo *"
                defaultValue={clienteEditar.correo ?? ""}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="direccion"
                placeholder="Dirección"
                defaultValue={clienteEditar.direccion ?? ""}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="nombre_usuario"
                placeholder="Usuario de acceso"
                defaultValue={clienteEditar.nombre_usuario ?? ""}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                type="password"
                name="contrasena"
                placeholder="Nueva contraseña o dejar vacío"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <select
                name="estado_cuenta"
                defaultValue={clienteEditar.estado_cuenta ?? "activo"}
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

        {clienteVer && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Detalle del cliente
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Información del cliente y proyectos relacionados.
                </p>
              </div>

              <Link
                href="/admin/clientes"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cerrar detalle
              </Link>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <p>
                <span className="font-semibold">ID:</span>{" "}
                {clienteVer.id_cliente}
              </p>

              <p>
                <span className="font-semibold">CI/NIT:</span>{" "}
                {clienteVer.ci_nit}
              </p>

              <p>
                <span className="font-semibold">Nombre:</span>{" "}
                {clienteVer.razon_social ||
                  `${clienteVer.nombres ?? ""} ${
                    clienteVer.apellidos ?? ""
                  }`}
              </p>

              <p>
                <span className="font-semibold">Correo:</span>{" "}
                {clienteVer.correo ?? "-"}
              </p>

              <p>
                <span className="font-semibold">Teléfono:</span>{" "}
                {clienteVer.telefono ?? "-"}
              </p>

              <p>
                <span className="font-semibold">Usuario:</span>{" "}
                {clienteVer.nombre_usuario ?? "-"}
              </p>
            </div>

            <h3 className="mt-6 text-lg font-bold text-slate-900">
              Proyectos del cliente
            </h3>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-200">
                  <tr>
                    <th className="border p-3 text-left">ID</th>
                    <th className="border p-3 text-left">Proyecto</th>
                    <th className="border p-3 text-left">Ubicación</th>
                    <th className="border p-3 text-left">Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {proyectosCliente.map((proyecto) => (
                    <tr key={proyecto.id_proyecto}>
                      <td className="border p-3">{proyecto.id_proyecto}</td>

                      <td className="border p-3">
                        {proyecto.nombre_proyecto}
                      </td>

                      <td className="border p-3">
                        {proyecto.ubicacion ?? "-"}
                      </td>

                      <td className="border p-3">
                        {proyecto.estado ?? "-"}
                      </td>
                    </tr>
                  ))}

                  {proyectosCliente.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="border p-6 text-center text-slate-500"
                      >
                        Este cliente todavía no tiene proyectos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-200">
              <tr>
                <th className="border p-3 text-left">ID</th>
                <th className="border p-3 text-left">Cliente</th>
                <th className="border p-3 text-left">CI/NIT</th>
                <th className="border p-3 text-left">Teléfono</th>
                <th className="border p-3 text-left">Correo</th>
                <th className="border p-3 text-left">Usuario</th>
                <th className="border p-3 text-left">Estado</th>
                <th className="border p-3 text-left">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {clientes.map((cliente) => {
                const nombreCliente =
                  cliente.razon_social ||
                  `${cliente.nombres ?? ""} ${cliente.apellidos ?? ""}`.trim() ||
                  "Sin nombre";

                return (
                  <tr key={cliente.id_cliente} className="hover:bg-slate-50">
                    <td className="border p-3">{cliente.id_cliente}</td>

                    <td className="border p-3 font-medium text-slate-900">
                      {nombreCliente}
                    </td>

                    <td className="border p-3">{cliente.ci_nit}</td>

                    <td className="border p-3">
                      {cliente.telefono ?? "-"}
                    </td>

                    <td className="border p-3">
                      {cliente.correo ?? "-"}
                    </td>

                    <td className="border p-3">
                      {cliente.nombre_usuario ?? "-"}
                    </td>

                    <td className="border p-3">
                      {cliente.estado_cuenta ?? "-"}
                    </td>

                    <td className="border p-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/clientes?ver=${cliente.id_cliente}`}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Ver
                        </Link>

                        {isAdmin && (
                          <Link
                            href={`/admin/clientes?editar=${cliente.id_cliente}`}
                            className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Editar
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {clientes.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="border p-6 text-center text-slate-500"
                  >
                    No hay clientes registrados.
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