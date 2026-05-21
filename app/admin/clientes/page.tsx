import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";
import {
  TableFilter,
  type FilterOption,
} from "../../../components/admin/TableFilter";
import { containsText, equalsText } from "../../../lib/table-filter";

<<<<<<< HEAD
=======
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
  - Filtrar clientes por ID, nombre, CI/NIT, teléfono, correo, usuario y estado.

  Reglas:
  - Administrador puede crear y editar.
  - Roles con permiso de clientes pueden ver.
*/

>>>>>>> f6dabfb (Agregar filtros en pagos empleados clientes usuarios y reportes)
type PageProps = {
  searchParams?: Promise<{
    editar?: string;
    ver?: string;
    filtro?: string;
    campo?: string;
    valor?: string;
    error?: string;
  }>;
};

function getText(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

const inputClass =
  "w-full rounded-xl border border-white/50 bg-white/75 px-4 py-3 pl-11 text-sm font-bold text-blue-950 shadow-sm outline-none backdrop-blur transition placeholder:text-slate-600 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-200";

const tableHeaderClass =
  "border border-white/30 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-800";

const tableCellClass =
  "border border-white/30 px-4 py-3 text-sm font-semibold text-slate-800";

function TextInput({
  name,
  placeholder,
  type = "text",
  defaultValue,
  icon,
  className = "",
}: {
  name: string;
  placeholder: string;
  type?: string;
  defaultValue?: string | number;
  icon: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
        {icon}
      </span>

      <input
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={inputClass}
      />
    </div>
  );
}

async function crearCliente(formData: FormData) {
  "use server";

  const user = await requireModule("clientes");

<<<<<<< HEAD
  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

  if (roleName !== "Administrador") {
=======
  if (user.rol.nombre_rol !== "Administrador") {
>>>>>>> f6dabfb (Agregar filtros en pagos empleados clientes usuarios y reportes)
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
      OR: [{ ci_nit }, ...(nombre_usuario ? [{ nombre_usuario }] : [])],
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

async function editarCliente(formData: FormData) {
  "use server";

  const user = await requireModule("clientes");

<<<<<<< HEAD
  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

  if (roleName !== "Administrador") {
=======
  if (user.rol.nombre_rol !== "Administrador") {
>>>>>>> f6dabfb (Agregar filtros en pagos empleados clientes usuarios y reportes)
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
      OR: [{ ci_nit }, ...(nombre_usuario ? [{ nombre_usuario }] : [])],
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
  const user = await requireModule("clientes");
  const params = await searchParams;

<<<<<<< HEAD
  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

  const isAdmin = roleName === "Administrador";
=======
  /*
    Solo el administrador puede crear y editar.
  */
  const isAdmin = user.rol.nombre_rol === "Administrador";
>>>>>>> f6dabfb (Agregar filtros en pagos empleados clientes usuarios y reportes)

  const idEditar = Number(params?.editar);
  const idVer = Number(params?.ver);

<<<<<<< HEAD
=======
  /*
    Datos del filtro.
  */
  const filtroActivo = params?.filtro === "1";
  const campoFiltro = String(params?.campo ?? "").trim();
  const valorFiltro = String(params?.valor ?? "").trim();
  const hayFiltro = Boolean(campoFiltro && valorFiltro);

  const opcionesFiltroClientes: FilterOption[] = [
    {
      value: "id_cliente",
      label: "ID cliente",
      placeholder: "Ejemplo: 1",
    },
    {
      value: "nombre",
      label: "Nombre / Razón social",
      placeholder: "Ejemplo: Juan o Constructora",
    },
    {
      value: "ci_nit",
      label: "CI/NIT",
      placeholder: "Ejemplo: 123456",
    },
    {
      value: "telefono",
      label: "Teléfono",
      placeholder: "Ejemplo: 70000000",
    },
    {
      value: "correo",
      label: "Correo",
      placeholder: "Ejemplo: cliente@email.com",
    },
    {
      value: "usuario",
      label: "Usuario",
      placeholder: "Ejemplo: cliente_demo",
    },
    {
      value: "estado",
      label: "Estado",
      placeholder: "Ejemplo: activo",
    },
  ];

  /*
    Lista todos los clientes.
  */
>>>>>>> f6dabfb (Agregar filtros en pagos empleados clientes usuarios y reportes)
  const clientes = await prisma.cliente.findMany({
    orderBy: {
      id_cliente: "desc",
    },
  });

<<<<<<< HEAD
=======
  /*
    Filtro visual de clientes.
    No cambia la base de datos, solo cambia lo que se muestra en la tabla.
  */
  const clientesFiltrados = clientes.filter((cliente) => {
    if (!hayFiltro) return true;

    const nombreCliente =
      cliente.razon_social ||
      `${cliente.nombres ?? ""} ${cliente.apellidos ?? ""}`.trim() ||
      "Sin nombre";

    if (campoFiltro === "id_cliente") {
      return equalsText(cliente.id_cliente, valorFiltro);
    }

    if (campoFiltro === "nombre") {
      return containsText(nombreCliente, valorFiltro);
    }

    if (campoFiltro === "ci_nit") {
      return containsText(cliente.ci_nit, valorFiltro);
    }

    if (campoFiltro === "telefono") {
      return containsText(cliente.telefono, valorFiltro);
    }

    if (campoFiltro === "correo") {
      return containsText(cliente.correo, valorFiltro);
    }

    if (campoFiltro === "usuario") {
      return containsText(cliente.nombre_usuario, valorFiltro);
    }

    if (campoFiltro === "estado") {
      return containsText(cliente.estado_cuenta, valorFiltro);
    }

    return true;
  });

  /*
    Cliente seleccionado para editar.
  */
>>>>>>> f6dabfb (Agregar filtros en pagos empleados clientes usuarios y reportes)
  const clienteEditar = idEditar
    ? await prisma.cliente.findUnique({
        where: {
          id_cliente: idEditar,
        },
      })
    : null;

  const clienteVer = idVer
    ? await prisma.cliente.findUnique({
        where: {
          id_cliente: idVer,
        },
      })
    : null;

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
    <main
      className="min-h-screen bg-cover bg-center bg-fixed p-6"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.62) 32%, rgba(255,255,255,0.18) 100%), url('/images/clientes-fondo.jpg')",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-white drop-shadow">
            <p className="text-sm font-bold text-blue-100">
              Módulo de Gestión de Clientes
            </p>

<<<<<<< HEAD
            <h1 className="text-4xl font-extrabold tracking-tight">
              Módulo Clientes
            </h1>
=======
            <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
>>>>>>> f6dabfb (Agregar filtros en pagos empleados clientes usuarios y reportes)

            <p className="mt-1 text-sm font-medium text-blue-100">
              Administración de clientes de la constructora.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-white/40 bg-white/70 px-5 py-3 text-sm font-extrabold text-blue-900 shadow-xl shadow-slate-900/20 backdrop-blur transition hover:bg-white"
          >
            Volver al Panel Principal
          </Link>
        </div>

        {params?.error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-bold text-red-700 shadow-lg backdrop-blur">
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
<<<<<<< HEAD
          <section className="mt-6 rounded-3xl border border-white/40 bg-white/25 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
            <h2 className="text-2xl font-extrabold text-white drop-shadow">
              Administración de Clientes
            </h2>
=======
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Crear cliente</h2>
>>>>>>> f6dabfb (Agregar filtros en pagos empleados clientes usuarios y reportes)

            <p className="mt-1 text-sm font-bold text-blue-100">
              Crear Nuevo Cliente
            </p>

            <form action={crearCliente} className="mt-5">
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/40 bg-white/45 p-5 shadow-xl shadow-slate-900/20 backdrop-blur-md">
                  <h3 className="mb-4 text-base font-extrabold text-slate-900">
                    Información General
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    <TextInput name="nombres" placeholder="Nombres" icon="👤" />
                    <TextInput name="apellidos" placeholder="Apellidos" icon="👥" />

                    <TextInput
                      name="razon_social"
                      placeholder="Razón Social"
                      icon="🏢"
                      className="md:col-span-2"
                    />

                    <TextInput
                      name="ci_nit"
                      placeholder="CI/NIT"
                      icon="💳"
                      className="md:col-span-2"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/40 bg-white/45 p-5 shadow-xl shadow-slate-900/20 backdrop-blur-md">
                  <h3 className="mb-4 text-base font-extrabold text-slate-900">
                    Datos de Contacto
                  </h3>

                  <div className="grid gap-4">
                    <TextInput name="telefono" placeholder="Teléfono" icon="📞" />
                    <TextInput name="correo" placeholder="Correo" icon="✉️" />
                    <TextInput name="direccion" placeholder="Dirección" icon="📍" />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/40 bg-white/45 p-5 shadow-xl shadow-slate-900/20 backdrop-blur-md">
                  <h3 className="mb-4 text-base font-extrabold text-slate-900">
                    Información de Acceso
                  </h3>

                  <div className="grid gap-4">
                    <TextInput
                      name="nombre_usuario"
                      placeholder="Usuario"
                      icon="👤"
                    />

                    <TextInput
                      type="password"
                      name="contrasena"
                      placeholder="Contraseña"
                      icon="🔑"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="mt-5 rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/30 transition hover:from-blue-950 hover:to-blue-700"
              >
                Crear Cliente
              </button>
            </form>
          </section>
        )}

        {isAdmin && clienteEditar && (
          <section className="mt-6 rounded-3xl border border-white/40 bg-white/35 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white drop-shadow">
                  Editar cliente
                </h2>

                <p className="mt-1 text-sm font-bold text-blue-100">
                  Modifica los datos del cliente seleccionado.
                </p>
              </div>

              <Link
                href="/admin/clientes"
<<<<<<< HEAD
                className="rounded-xl border border-white/40 bg-white/70 px-4 py-2 text-sm font-extrabold text-blue-900 transition hover:bg-white"
=======
                scroll={false}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
>>>>>>> f6dabfb (Agregar filtros en pagos empleados clientes usuarios y reportes)
              >
                Cancelar
              </Link>
            </div>

            <form action={editarCliente} className="mt-5">
              <input
                type="hidden"
                name="id_cliente"
                defaultValue={clienteEditar.id_cliente}
              />

              <div className="grid gap-5 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/40 bg-white/45 p-5 shadow-xl shadow-slate-900/20 backdrop-blur-md">
                  <h3 className="mb-4 text-base font-extrabold text-slate-900">
                    Información General
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput
                      name="nombres"
                      placeholder="Nombres"
                      defaultValue={clienteEditar.nombres ?? ""}
                      icon="👤"
                    />

                    <TextInput
                      name="apellidos"
                      placeholder="Apellidos"
                      defaultValue={clienteEditar.apellidos ?? ""}
                      icon="👥"
                    />

                    <TextInput
                      name="razon_social"
                      placeholder="Razón Social"
                      defaultValue={clienteEditar.razon_social ?? ""}
                      icon="🏢"
                      className="md:col-span-2"
                    />

                    <TextInput
                      name="ci_nit"
                      placeholder="CI/NIT"
                      defaultValue={clienteEditar.ci_nit}
                      icon="💳"
                      className="md:col-span-2"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/40 bg-white/45 p-5 shadow-xl shadow-slate-900/20 backdrop-blur-md">
                  <h3 className="mb-4 text-base font-extrabold text-slate-900">
                    Datos de Contacto
                  </h3>

                  <div className="grid gap-4">
                    <TextInput
                      name="telefono"
                      placeholder="Teléfono"
                      defaultValue={clienteEditar.telefono ?? ""}
                      icon="📞"
                    />

                    <TextInput
                      name="correo"
                      placeholder="Correo"
                      defaultValue={clienteEditar.correo ?? ""}
                      icon="✉️"
                    />

                    <TextInput
                      name="direccion"
                      placeholder="Dirección"
                      defaultValue={clienteEditar.direccion ?? ""}
                      icon="📍"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/40 bg-white/45 p-5 shadow-xl shadow-slate-900/20 backdrop-blur-md">
                  <h3 className="mb-4 text-base font-extrabold text-slate-900">
                    Información de Acceso
                  </h3>

                  <div className="grid gap-4">
                    <TextInput
                      name="nombre_usuario"
                      placeholder="Usuario"
                      defaultValue={clienteEditar.nombre_usuario ?? ""}
                      icon="👤"
                    />

                    <TextInput
                      type="password"
                      name="contrasena"
                      placeholder="Nueva contraseña o dejar vacío"
                      icon="🔑"
                    />

                    <select
                      name="estado_cuenta"
                      defaultValue={clienteEditar.estado_cuenta ?? "activo"}
                      className="w-full rounded-xl border border-white/50 bg-white/75 px-4 py-3 text-sm font-bold text-blue-950 shadow-sm outline-none backdrop-blur transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-200"
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="mt-5 rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/30 transition hover:from-blue-950 hover:to-blue-700"
              >
                Guardar Cambios
              </button>
            </form>
          </section>
        )}

        {clienteVer && (
          <section className="mt-6 rounded-3xl border border-white/40 bg-white/45 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Detalle del cliente
                </h2>

                <p className="mt-1 text-sm font-bold text-slate-700">
                  Información del cliente y proyectos relacionados.
                </p>
              </div>

              <Link
                href="/admin/clientes"
<<<<<<< HEAD
                className="rounded-xl border border-white/40 bg-white/70 px-4 py-2 text-sm font-extrabold text-blue-900 transition hover:bg-white"
=======
                scroll={false}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
>>>>>>> f6dabfb (Agregar filtros en pagos empleados clientes usuarios y reportes)
              >
                Cerrar detalle
              </Link>
            </div>

            <div className="mt-5 grid gap-4 rounded-2xl bg-white/60 p-5 md:grid-cols-2">
              <p className="font-semibold text-slate-800">
                <span className="font-extrabold text-blue-950">ID:</span>{" "}
                {clienteVer.id_cliente}
              </p>

              <p className="font-semibold text-slate-800">
                <span className="font-extrabold text-blue-950">CI/NIT:</span>{" "}
                {clienteVer.ci_nit}
              </p>

              <p className="font-semibold text-slate-800">
                <span className="font-extrabold text-blue-950">Nombre:</span>{" "}
                {clienteVer.razon_social ||
                  `${clienteVer.nombres ?? ""} ${clienteVer.apellidos ?? ""}`}
              </p>

              <p className="font-semibold text-slate-800">
                <span className="font-extrabold text-blue-950">Correo:</span>{" "}
                {clienteVer.correo ?? "-"}
              </p>

              <p className="font-semibold text-slate-800">
                <span className="font-extrabold text-blue-950">Teléfono:</span>{" "}
                {clienteVer.telefono ?? "-"}
              </p>

              <p className="font-semibold text-slate-800">
                <span className="font-extrabold text-blue-950">Usuario:</span>{" "}
                {clienteVer.nombre_usuario ?? "-"}
              </p>
            </div>

            <h3 className="mt-6 text-lg font-extrabold text-slate-900">
              Proyectos del cliente
            </h3>

            <div className="mt-3 overflow-x-auto rounded-2xl border border-white/40">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-white/70 backdrop-blur">
                  <tr>
                    <th className={tableHeaderClass}>ID</th>
                    <th className={tableHeaderClass}>Proyecto</th>
                    <th className={tableHeaderClass}>Ubicación</th>
                    <th className={tableHeaderClass}>Estado</th>
                  </tr>
                </thead>

                <tbody className="bg-white/40 backdrop-blur">
                  {proyectosCliente.map((proyecto) => (
                    <tr
                      key={proyecto.id_proyecto}
                      className="transition hover:bg-white/70"
                    >
                      <td className={tableCellClass}>{proyecto.id_proyecto}</td>
                      <td className={tableCellClass}>
                        {proyecto.nombre_proyecto}
                      </td>
                      <td className={tableCellClass}>
                        {proyecto.ubicacion ?? "-"}
                      </td>
                      <td className={tableCellClass}>{proyecto.estado ?? "-"}</td>
                    </tr>
                  ))}

                  {proyectosCliente.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="border border-white/30 p-6 text-center font-semibold text-slate-700"
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

<<<<<<< HEAD
        <section className="mt-6 overflow-x-auto rounded-3xl border border-white/40 bg-white/35 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
          <div className="px-5 py-4">
            <h2 className="text-2xl font-extrabold text-white drop-shadow">
              Lista de Clientes Registrados
            </h2>
          </div>

=======
        <TableFilter
          basePath="/admin/clientes"
          title="Filtro de clientes"
          currentLabel="Clientes"
          options={opcionesFiltroClientes}
          filtroActivo={filtroActivo}
          campoFiltro={campoFiltro}
          valorFiltro={valorFiltro}
          resultados={clientesFiltrados.length}
        />

        <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
>>>>>>> f6dabfb (Agregar filtros en pagos empleados clientes usuarios y reportes)
          <table className="w-full border-collapse text-sm">
            <thead className="bg-white/70 backdrop-blur">
              <tr>
                <th className={tableHeaderClass}>ID</th>
                <th className={tableHeaderClass}>Cliente</th>
                <th className={tableHeaderClass}>CI/NIT</th>
                <th className={tableHeaderClass}>Teléfono</th>
                <th className={tableHeaderClass}>Correo</th>
                <th className={tableHeaderClass}>Usuario</th>
                <th className={tableHeaderClass}>Estado</th>
                <th className={tableHeaderClass}>Acciones</th>
              </tr>
            </thead>

<<<<<<< HEAD
            <tbody className="bg-white/40 backdrop-blur">
              {clientes.map((cliente) => {
=======
            <tbody>
              {clientesFiltrados.map((cliente) => {
>>>>>>> f6dabfb (Agregar filtros en pagos empleados clientes usuarios y reportes)
                const nombreCliente =
                  cliente.razon_social ||
                  `${cliente.nombres ?? ""} ${cliente.apellidos ?? ""}`.trim() ||
                  "Sin nombre";

                return (
                  <tr
                    key={cliente.id_cliente}
                    className="transition hover:bg-white/70"
                  >
                    <td className={tableCellClass}>{cliente.id_cliente}</td>

                    <td className="border border-white/30 px-4 py-3 text-sm font-extrabold text-slate-950">
                      {nombreCliente}
                    </td>

                    <td className={tableCellClass}>{cliente.ci_nit}</td>

                    <td className={tableCellClass}>
                      {cliente.telefono ?? "-"}
                    </td>

<<<<<<< HEAD
                    <td className={tableCellClass}>{cliente.correo ?? "-"}</td>
=======
                    <td className="border p-3">{cliente.correo ?? "-"}</td>
>>>>>>> f6dabfb (Agregar filtros en pagos empleados clientes usuarios y reportes)

                    <td className={tableCellClass}>
                      {cliente.nombre_usuario ?? "-"}
                    </td>

                    <td className={tableCellClass}>
                      {cliente.estado_cuenta ?? "-"}
                    </td>

                    <td className="border border-white/30 px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/clientes?ver=${cliente.id_cliente}`}
<<<<<<< HEAD
                          className="rounded-lg bg-white/70 px-3 py-2 text-xs font-extrabold text-slate-800 shadow transition hover:bg-white"
=======
                          scroll={false}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
>>>>>>> f6dabfb (Agregar filtros en pagos empleados clientes usuarios y reportes)
                        >
                          Ver
                        </Link>

                        {isAdmin && (
                          <Link
                            href={`/admin/clientes?editar=${cliente.id_cliente}`}
<<<<<<< HEAD
                            className="rounded-lg bg-white/70 px-3 py-2 text-xs font-extrabold text-blue-900 shadow transition hover:bg-white"
=======
                            scroll={false}
                            className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white"
>>>>>>> f6dabfb (Agregar filtros en pagos empleados clientes usuarios y reportes)
                          >
                            Editar
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {clientesFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="border border-white/30 p-6 text-center font-semibold text-slate-700"
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