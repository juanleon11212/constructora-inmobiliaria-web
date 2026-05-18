import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";
import { canDo } from "../../../lib/auth/permissions";

/*
  MÓDULO MATERIALES

  Ruta:
  /admin/materiales

  Aquí se separan correctamente los roles:

  ALMACÉN:
  - Ver materiales
  - Crear materiales
  - Editar materiales
  - Controlar stock
  - Consultar inventario
  - Ver almacenes

  COMPRAS:
  - Ver materiales
  - Crear materiales
  - Editar materiales
  - Ver proveedores
  - Crear proveedores
  - Editar proveedores
  - Registrar compras de materiales
  - Ver compras realizadas
  - Ver detalle de compras

  ADMINISTRADOR:
  - Puede hacer todo.
*/

type PageProps = {
  searchParams?: Promise<{
    editar?: string;
    editarProveedor?: string;
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
  CREAR MATERIAL

  Lo puede hacer:
  - Administrador
  - Almacén
  - Compras
*/
async function crearMaterial(formData: FormData) {
  "use server";

  const user = await requireModule("materiales");
  const roleName = getRoleName(user);

  if (!canDo(roleName, "materiales", "create")) {
    redirect("/admin/materiales");
  }

  const nombre_material = getText(formData, "nombre_material");
  const descripcion = getText(formData, "descripcion");
  const unidad_medida = getText(formData, "unidad_medida");
  const precio_unitario = Number(formData.get("precio_unitario"));
  const stock_minimo = Number(formData.get("stock_minimo") ?? 0);
  const id_categoria_material = Number(formData.get("id_categoria_material"));

  if (
    !nombre_material ||
    !unidad_medida ||
    !precio_unitario ||
    !id_categoria_material
  ) {
    redirect("/admin/materiales?error=datos-obligatorios");
  }

  if (precio_unitario <= 0) {
    redirect("/admin/materiales?error=precio-invalido");
  }

  await prisma.material.create({
    data: {
      nombre_material,
      descripcion: descripcion || null,
      unidad_medida,
      precio_unitario,
      stock_minimo: stock_minimo || 0,
      id_categoria_material,
    },
  });

  revalidatePath("/admin/materiales");
  redirect("/admin/materiales");
}

/*
  EDITAR MATERIAL

  Lo puede hacer:
  - Administrador
  - Almacén
  - Compras
*/
async function editarMaterial(formData: FormData) {
  "use server";

  const user = await requireModule("materiales");
  const roleName = getRoleName(user);

  if (!canDo(roleName, "materiales", "edit")) {
    redirect("/admin/materiales");
  }

  const id_material = Number(formData.get("id_material"));

  if (!id_material) {
    redirect("/admin/materiales?error=id-invalido");
  }

  const nombre_material = getText(formData, "nombre_material");
  const descripcion = getText(formData, "descripcion");
  const unidad_medida = getText(formData, "unidad_medida");
  const precio_unitario = Number(formData.get("precio_unitario"));
  const stock_minimo = Number(formData.get("stock_minimo") ?? 0);
  const id_categoria_material = Number(formData.get("id_categoria_material"));

  if (
    !nombre_material ||
    !unidad_medida ||
    !precio_unitario ||
    !id_categoria_material
  ) {
    redirect(`/admin/materiales?editar=${id_material}&error=datos-obligatorios`);
  }

  if (precio_unitario <= 0) {
    redirect(`/admin/materiales?editar=${id_material}&error=precio-invalido`);
  }

  await prisma.material.update({
    where: {
      id_material,
    },
    data: {
      nombre_material,
      descripcion: descripcion || null,
      unidad_medida,
      precio_unitario,
      stock_minimo: stock_minimo || 0,
      id_categoria_material,
    },
  });

  revalidatePath("/admin/materiales");
  redirect("/admin/materiales");
}

/*
  ACTUALIZAR STOCK

  Solo lo puede hacer:
  - Administrador
  - Almacén

  Compras NO controla stock directamente.
*/
async function actualizarStock(formData: FormData) {
  "use server";

  const user = await requireModule("materiales");
  const roleName = getRoleName(user);

  if (!canDo(roleName, "materiales", "inventory")) {
    redirect("/admin/materiales");
  }

  const id_material = Number(formData.get("id_material"));
  const id_almacen = Number(formData.get("id_almacen"));
  const cantidad_disponible = Number(formData.get("cantidad_disponible"));

  if (!id_material || !id_almacen || Number.isNaN(cantidad_disponible)) {
    redirect("/admin/materiales?error=stock-obligatorio");
  }

  if (cantidad_disponible < 0) {
    redirect("/admin/materiales?error=stock-invalido");
  }

  const inventarioExistente = await prisma.inventario.findFirst({
    where: {
      id_material,
      id_almacen,
    },
  });

  if (inventarioExistente) {
    await prisma.inventario.update({
      where: {
        id_inventario: inventarioExistente.id_inventario,
      },
      data: {
        cantidad_disponible,
        fecha_actualizacion: new Date(),
      },
    });
  } else {
    await prisma.inventario.create({
      data: {
        id_material,
        id_almacen,
        cantidad_disponible,
        fecha_actualizacion: new Date(),
      },
    });
  }

  revalidatePath("/admin/materiales");
  redirect("/admin/materiales");
}

/*
  CREAR PROVEEDOR

  Lo puede hacer:
  - Administrador
  - Compras
*/
async function crearProveedor(formData: FormData) {
  "use server";

  const user = await requireModule("materiales");
  const roleName = getRoleName(user);

  if (!canDo(roleName, "materiales", "purchase")) {
    redirect("/admin/materiales");
  }

  const nombre_proveedor = getText(formData, "nombre_proveedor");
  const nit = getText(formData, "nit");
  const telefono = getText(formData, "telefono");
  const correo = getText(formData, "correo");
  const direccion = getText(formData, "direccion");

  if (!nombre_proveedor || !nit) {
    redirect("/admin/materiales?error=proveedor-obligatorio");
  }

  const proveedorExistente = await prisma.proveedor.findFirst({
    where: {
      nit,
    },
  });

  if (proveedorExistente) {
    redirect("/admin/materiales?error=proveedor-existente");
  }

  await prisma.proveedor.create({
    data: {
      nombre_proveedor,
      nit,
      telefono: telefono || null,
      correo: correo || null,
      direccion: direccion || null,
    },
  });

  revalidatePath("/admin/materiales");
  redirect("/admin/materiales");
}

/*
  EDITAR PROVEEDOR

  Lo puede hacer:
  - Administrador
  - Compras
*/
async function editarProveedor(formData: FormData) {
  "use server";

  const user = await requireModule("materiales");
  const roleName = getRoleName(user);

  if (!canDo(roleName, "materiales", "purchase")) {
    redirect("/admin/materiales");
  }

  const id_proveedor = Number(formData.get("id_proveedor"));

  if (!id_proveedor) {
    redirect("/admin/materiales?error=proveedor-invalido");
  }

  const nombre_proveedor = getText(formData, "nombre_proveedor");
  const nit = getText(formData, "nit");
  const telefono = getText(formData, "telefono");
  const correo = getText(formData, "correo");
  const direccion = getText(formData, "direccion");

  if (!nombre_proveedor || !nit) {
    redirect(
      `/admin/materiales?editarProveedor=${id_proveedor}&error=proveedor-obligatorio`
    );
  }

  const proveedorDuplicado = await prisma.proveedor.findFirst({
    where: {
      id_proveedor: {
        not: id_proveedor,
      },
      nit,
    },
  });

  if (proveedorDuplicado) {
    redirect(
      `/admin/materiales?editarProveedor=${id_proveedor}&error=proveedor-existente`
    );
  }

  await prisma.proveedor.update({
    where: {
      id_proveedor,
    },
    data: {
      nombre_proveedor,
      nit,
      telefono: telefono || null,
      correo: correo || null,
      direccion: direccion || null,
    },
  });

  revalidatePath("/admin/materiales");
  redirect("/admin/materiales");
}

/*
  REGISTRAR COMPRA

  Lo puede hacer:
  - Administrador
  - Compras

  Esta versión registra una compra con un material.
  Si luego quieres varios materiales por una sola factura,
  se puede mejorar con un formulario dinámico.
*/
async function registrarCompra(formData: FormData) {
  "use server";

  const user = await requireModule("materiales");
  const roleName = getRoleName(user);

  if (!canDo(roleName, "materiales", "purchase")) {
    redirect("/admin/materiales");
  }

  const numero_factura = getText(formData, "numero_factura");
  const fecha_compra = getText(formData, "fecha_compra");
  const estado_pago = getText(formData, "estado_pago") || "pendiente";
  const observacion = getText(formData, "observacion");

  const id_proveedor = Number(formData.get("id_proveedor"));
  const id_proyecto = Number(formData.get("id_proyecto"));
  const id_almacen = Number(formData.get("id_almacen"));
  const id_material = Number(formData.get("id_material"));
  const cantidad = Number(formData.get("cantidad"));
  const precio_unitario = Number(formData.get("precio_unitario"));

  if (
    !numero_factura ||
    !fecha_compra ||
    !id_proveedor ||
    !id_proyecto ||
    !id_almacen ||
    !id_material ||
    !cantidad ||
    !precio_unitario
  ) {
    redirect("/admin/materiales?error=compra-obligatoria");
  }

  if (cantidad <= 0 || precio_unitario <= 0) {
    redirect("/admin/materiales?error=compra-invalida");
  }

  const compraExistente = await prisma.compra_material.findFirst({
    where: {
      numero_factura,
    },
  });

  if (compraExistente) {
    redirect("/admin/materiales?error=factura-existente");
  }

  const subtotal = cantidad * precio_unitario;

  const compra = await prisma.compra_material.create({
    data: {
      numero_factura,
      fecha_compra: new Date(fecha_compra),
      total_compra: subtotal,
      estado_pago,
      observacion: observacion || null,
      id_proveedor,
      id_proyecto,
      id_almacen,
      id_usuario_registro: user.id_usuario ?? null,
    },
  });

  await prisma.detalle_compra_material.create({
    data: {
      id_compra: compra.id_compra,
      id_material,
      cantidad,
      precio_unitario,
      subtotal,
    },
  });

  /*
    Al registrar una compra, se aumenta automáticamente
    el inventario del almacén destino.
  */
  const inventarioExistente = await prisma.inventario.findFirst({
    where: {
      id_material,
      id_almacen,
    },
  });

  if (inventarioExistente) {
    await prisma.inventario.update({
      where: {
        id_inventario: inventarioExistente.id_inventario,
      },
      data: {
        cantidad_disponible:
          Number(inventarioExistente.cantidad_disponible) + cantidad,
        fecha_actualizacion: new Date(),
      },
    });
  } else {
    await prisma.inventario.create({
      data: {
        id_material,
        id_almacen,
        cantidad_disponible: cantidad,
        fecha_actualizacion: new Date(),
      },
    });
  }

  revalidatePath("/admin/materiales");
  redirect("/admin/materiales");
}

export default async function MaterialesPage({ searchParams }: PageProps) {
  const user = await requireModule("materiales");
  const params = await searchParams;

  const roleName = getRoleName(user);

  const canCreateMaterial = canDo(roleName, "materiales", "create");
  const canEditMaterial = canDo(roleName, "materiales", "edit");
  const canControlStock = canDo(roleName, "materiales", "inventory");
  const canPurchase = canDo(roleName, "materiales", "purchase");

  const idEditar = Number(params?.editar);
  const idEditarProveedor = Number(params?.editarProveedor);

  const [
    categorias,
    materiales,
    inventario,
    almacenes,
    proveedores,
    proyectos,
    compras,
    detalleCompras,
  ] = await Promise.all([
    prisma.categoria_material.findMany({
      orderBy: {
        nombre_categoria: "asc",
      },
    }),

    prisma.material.findMany({
      orderBy: {
        id_material: "desc",
      },
    }),

    prisma.inventario.findMany({
      orderBy: {
        id_inventario: "desc",
      },
    }),

    prisma.almacen.findMany({
      orderBy: {
        id_almacen: "asc",
      },
    }),

    prisma.proveedor.findMany({
      orderBy: {
        id_proveedor: "desc",
      },
    }),

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

    prisma.compra_material.findMany({
      orderBy: {
        id_compra: "desc",
      },
    }),

    prisma.detalle_compra_material.findMany({
      orderBy: {
        id_detalle_compra: "desc",
      },
    }),
  ]);

  const materialEditar =
    idEditar && canEditMaterial
      ? await prisma.material.findUnique({
          where: {
            id_material: idEditar,
          },
        })
      : null;

  const proveedorEditar =
    idEditarProveedor && canPurchase
      ? await prisma.proveedor.findUnique({
          where: {
            id_proveedor: idEditarProveedor,
          },
        })
      : null;

  const categoriaMap = new Map(
    categorias.map((categoria) => [
      categoria.id_categoria_material,
      categoria.nombre_categoria,
    ])
  );

  const materialMap = new Map(
    materiales.map((material) => [
      material.id_material,
      material.nombre_material,
    ])
  );

  const almacenMap = new Map(
    almacenes.map((almacen) => [almacen.id_almacen, almacen.nombre_almacen])
  );

  const proveedorMap = new Map(
    proveedores.map((proveedor) => [
      proveedor.id_proveedor,
      proveedor.nombre_proveedor,
    ])
  );

  const proyectoMap = new Map(
    proyectos.map((proyecto) => [
      proyecto.id_proyecto,
      proyecto.nombre_proyecto,
    ])
  );

  const compraMap = new Map(
    compras.map((compra) => [compra.id_compra, compra.numero_factura])
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Módulo Materiales
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Materiales, Inventario y Compras
            </h1>

            <p className="mt-1 text-slate-600">
              Rol actual: {roleName}
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            Volver al panel
          </Link>
        </div>

        {/* Resumen de permisos */}
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-emerald-50 p-5 text-sm text-emerald-800">
            <h2 className="font-bold">Almacén puede:</h2>
            <p className="mt-2">
              Ver materiales, crear materiales, editar materiales, controlar
              stock, consultar inventario y ver almacenes.
            </p>
          </div>

          <div className="rounded-3xl bg-blue-50 p-5 text-sm text-blue-800">
            <h2 className="font-bold">Compras puede:</h2>
            <p className="mt-2">
              Ver proveedores, crear proveedores, editar proveedores, registrar
              compras de materiales y ver compras realizadas.
            </p>
          </div>
        </section>

        {/* Mensajes de error */}
        {params?.error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error === "datos-obligatorios" &&
              "Nombre, unidad, precio y categoría son obligatorios."}

            {params.error === "precio-invalido" &&
              "El precio debe ser mayor a cero."}

            {params.error === "id-invalido" &&
              "El ID del material no es válido."}

            {params.error === "stock-obligatorio" &&
              "Material, almacén y cantidad son obligatorios."}

            {params.error === "stock-invalido" &&
              "La cantidad de stock no puede ser negativa."}

            {params.error === "proveedor-obligatorio" &&
              "Nombre del proveedor y NIT son obligatorios."}

            {params.error === "proveedor-existente" &&
              "Ya existe un proveedor con ese NIT."}

            {params.error === "proveedor-invalido" &&
              "El proveedor seleccionado no es válido."}

            {params.error === "compra-obligatoria" &&
              "Factura, fecha, proveedor, proyecto, almacén, material, cantidad y precio son obligatorios."}

            {params.error === "compra-invalida" &&
              "La cantidad y el precio deben ser mayores a cero."}

            {params.error === "factura-existente" &&
              "Ya existe una compra con ese número de factura."}
          </div>
        )}

        {/* Crear material */}
        {canCreateMaterial && !materialEditar && !proveedorEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Crear material
            </h2>

            <form
              action={crearMaterial}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input
                name="nombre_material"
                placeholder="Nombre del material *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <select
                name="id_categoria_material"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Selecciona categoría *</option>

                {categorias.map((categoria) => (
                  <option
                    key={categoria.id_categoria_material}
                    value={categoria.id_categoria_material}
                  >
                    {categoria.nombre_categoria}
                  </option>
                ))}
              </select>

              <input
                name="unidad_medida"
                placeholder="Unidad de medida *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                type="number"
                step="0.01"
                name="precio_unitario"
                placeholder="Precio unitario *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                type="number"
                step="0.01"
                name="stock_minimo"
                placeholder="Stock mínimo"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="descripcion"
                placeholder="Descripción"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-2"
              />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Crear material
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Editar material */}
        {canEditMaterial && materialEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">
                Editar material
              </h2>

              <Link
                href="/admin/materiales"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </Link>
            </div>

            <form
              action={editarMaterial}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input
                type="hidden"
                name="id_material"
                defaultValue={materialEditar.id_material}
              />

              <input
                name="nombre_material"
                defaultValue={materialEditar.nombre_material}
                placeholder="Nombre del material *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <select
                name="id_categoria_material"
                defaultValue={materialEditar.id_categoria_material}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                {categorias.map((categoria) => (
                  <option
                    key={categoria.id_categoria_material}
                    value={categoria.id_categoria_material}
                  >
                    {categoria.nombre_categoria}
                  </option>
                ))}
              </select>

              <input
                name="unidad_medida"
                defaultValue={materialEditar.unidad_medida}
                placeholder="Unidad de medida *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                type="number"
                step="0.01"
                name="precio_unitario"
                defaultValue={materialEditar.precio_unitario.toString()}
                placeholder="Precio unitario *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                type="number"
                step="0.01"
                name="stock_minimo"
                defaultValue={materialEditar.stock_minimo.toString()}
                placeholder="Stock mínimo"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="descripcion"
                defaultValue={materialEditar.descripcion ?? ""}
                placeholder="Descripción"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-2"
              />

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

        {/* Control de stock: solo Almacén/Admin */}
        {canControlStock && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Controlar stock
            </h2>

            <form
              action={actualizarStock}
              className="mt-5 grid gap-4 md:grid-cols-3"
            >
              <select
                name="id_material"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Selecciona material *</option>

                {materiales.map((material) => (
                  <option key={material.id_material} value={material.id_material}>
                    {material.nombre_material}
                  </option>
                ))}
              </select>

              <select
                name="id_almacen"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Selecciona almacén *</option>

                {almacenes.map((almacen) => (
                  <option key={almacen.id_almacen} value={almacen.id_almacen}>
                    {almacen.nombre_almacen}
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                name="cantidad_disponible"
                placeholder="Cantidad disponible *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Actualizar stock
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Crear proveedor: solo Compras/Admin */}
        {canPurchase && !proveedorEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Crear proveedor
            </h2>

            <form
              action={crearProveedor}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input
                name="nombre_proveedor"
                placeholder="Nombre proveedor *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="nit"
                placeholder="NIT *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="telefono"
                placeholder="Teléfono"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="correo"
                placeholder="Correo"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="direccion"
                placeholder="Dirección"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-2"
              />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Crear proveedor
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Editar proveedor */}
        {canPurchase && proveedorEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">
                Editar proveedor
              </h2>

              <Link
                href="/admin/materiales"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </Link>
            </div>

            <form
              action={editarProveedor}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input
                type="hidden"
                name="id_proveedor"
                defaultValue={proveedorEditar.id_proveedor}
              />

              <input
                name="nombre_proveedor"
                defaultValue={proveedorEditar.nombre_proveedor}
                placeholder="Nombre proveedor *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="nit"
                defaultValue={proveedorEditar.nit}
                placeholder="NIT *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="telefono"
                defaultValue={proveedorEditar.telefono ?? ""}
                placeholder="Teléfono"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="correo"
                defaultValue={proveedorEditar.correo ?? ""}
                placeholder="Correo"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                name="direccion"
                defaultValue={proveedorEditar.direccion ?? ""}
                placeholder="Dirección"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm md:col-span-2"
              />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Guardar proveedor
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Registrar compra: solo Compras/Admin */}
        {canPurchase && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Registrar compra de material
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Registra una compra con proveedor, proyecto, almacén destino y
              material comprado.
            </p>

            <form
              action={registrarCompra}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input
                name="numero_factura"
                placeholder="Número de factura *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha compra *
                </label>

                <input
                  type="date"
                  name="fecha_compra"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <select
                name="id_proveedor"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Selecciona proveedor *</option>

                {proveedores.map((proveedor) => (
                  <option
                    key={proveedor.id_proveedor}
                    value={proveedor.id_proveedor}
                  >
                    {proveedor.nombre_proveedor}
                  </option>
                ))}
              </select>

              <select
                name="id_proyecto"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Selecciona proyecto *</option>

                {proyectos.map((proyecto) => (
                  <option key={proyecto.id_proyecto} value={proyecto.id_proyecto}>
                    {proyecto.nombre_proyecto}
                  </option>
                ))}
              </select>

              <select
                name="id_almacen"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Almacén destino *</option>

                {almacenes.map((almacen) => (
                  <option key={almacen.id_almacen} value={almacen.id_almacen}>
                    {almacen.nombre_almacen}
                  </option>
                ))}
              </select>

              <select
                name="id_material"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="">Material comprado *</option>

                {materiales.map((material) => (
                  <option key={material.id_material} value={material.id_material}>
                    {material.nombre_material}
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                name="cantidad"
                placeholder="Cantidad *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <input
                type="number"
                step="0.01"
                name="precio_unitario"
                placeholder="Precio unitario *"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <select
                name="estado_pago"
                defaultValue="pendiente"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                <option value="pendiente">Pendiente</option>
                <option value="parcial">Parcial</option>
                <option value="pagado">Pagado</option>
              </select>

              <input
                name="observacion"
                placeholder="Observación"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Registrar compra
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Materiales */}
        <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <h2 className="p-5 text-xl font-bold text-slate-900">
            Lista de materiales
          </h2>

          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-200">
              <tr>
                <th className="border p-3 text-left">ID</th>
                <th className="border p-3 text-left">Material</th>
                <th className="border p-3 text-left">Categoría</th>
                <th className="border p-3 text-left">Unidad</th>
                <th className="border p-3 text-left">Precio</th>
                <th className="border p-3 text-left">Stock mínimo</th>

                {canEditMaterial && (
                  <th className="border p-3 text-left">Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {materiales.map((material) => (
                <tr key={material.id_material} className="hover:bg-slate-50">
                  <td className="border p-3">{material.id_material}</td>

                  <td className="border p-3 font-medium">
                    {material.nombre_material}
                  </td>

                  <td className="border p-3">
                    {categoriaMap.get(material.id_categoria_material) ?? "-"}
                  </td>

                  <td className="border p-3">{material.unidad_medida}</td>

                  <td className="border p-3">
                    Bs. {material.precio_unitario.toString()}
                  </td>

                  <td className="border p-3">
                    {material.stock_minimo.toString()}
                  </td>

                  {canEditMaterial && (
                    <td className="border p-3">
                      <Link
                        href={`/admin/materiales?editar=${material.id_material}`}
                        className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Editar
                      </Link>
                    </td>
                  )}
                </tr>
              ))}

              {materiales.length === 0 && (
                <tr>
                  <td
                    colSpan={canEditMaterial ? 7 : 6}
                    className="border p-6 text-center text-slate-500"
                  >
                    No hay materiales registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Inventario */}
        <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <h2 className="p-5 text-xl font-bold text-slate-900">
            Inventario
          </h2>

          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-200">
              <tr>
                <th className="border p-3 text-left">ID</th>
                <th className="border p-3 text-left">Material</th>
                <th className="border p-3 text-left">Almacén</th>
                <th className="border p-3 text-left">Cantidad</th>
                <th className="border p-3 text-left">Actualización</th>
              </tr>
            </thead>

            <tbody>
              {inventario.map((item) => (
                <tr key={item.id_inventario} className="hover:bg-slate-50">
                  <td className="border p-3">{item.id_inventario}</td>

                  <td className="border p-3">
                    {materialMap.get(item.id_material) ?? "-"}
                  </td>

                  <td className="border p-3">
                    {almacenMap.get(item.id_almacen) ?? "-"}
                  </td>

                  <td className="border p-3">
                    {item.cantidad_disponible.toString()}
                  </td>

                  <td className="border p-3">
                    {item.fecha_actualizacion
                      ? new Date(item.fecha_actualizacion)
                          .toISOString()
                          .slice(0, 10)
                      : "-"}
                  </td>
                </tr>
              ))}

              {inventario.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="border p-6 text-center text-slate-500"
                  >
                    No hay inventario registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Almacenes */}
        <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <h2 className="p-5 text-xl font-bold text-slate-900">
            Almacenes
          </h2>

          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-200">
              <tr>
                <th className="border p-3 text-left">ID</th>
                <th className="border p-3 text-left">Almacén</th>
                <th className="border p-3 text-left">Ubicación</th>
                <th className="border p-3 text-left">Descripción</th>
              </tr>
            </thead>

            <tbody>
              {almacenes.map((almacen) => (
                <tr key={almacen.id_almacen} className="hover:bg-slate-50">
                  <td className="border p-3">{almacen.id_almacen}</td>

                  <td className="border p-3 font-medium">
                    {almacen.nombre_almacen}
                  </td>

                  <td className="border p-3">{almacen.ubicacion ?? "-"}</td>

                  <td className="border p-3">{almacen.descripcion ?? "-"}</td>
                </tr>
              ))}

              {almacenes.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="border p-6 text-center text-slate-500"
                  >
                    No hay almacenes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Proveedores: solo Compras/Admin */}
        {canPurchase && (
          <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <h2 className="p-5 text-xl font-bold text-slate-900">
              Proveedores
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border p-3 text-left">ID</th>
                  <th className="border p-3 text-left">Proveedor</th>
                  <th className="border p-3 text-left">NIT</th>
                  <th className="border p-3 text-left">Teléfono</th>
                  <th className="border p-3 text-left">Correo</th>
                  <th className="border p-3 text-left">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {proveedores.map((proveedor) => (
                  <tr key={proveedor.id_proveedor} className="hover:bg-slate-50">
                    <td className="border p-3">{proveedor.id_proveedor}</td>

                    <td className="border p-3 font-medium">
                      {proveedor.nombre_proveedor}
                    </td>

                    <td className="border p-3">{proveedor.nit}</td>

                    <td className="border p-3">
                      {proveedor.telefono ?? "-"}
                    </td>

                    <td className="border p-3">
                      {proveedor.correo ?? "-"}
                    </td>

                    <td className="border p-3">
                      <Link
                        href={`/admin/materiales?editarProveedor=${proveedor.id_proveedor}`}
                        className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}

                {proveedores.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="border p-6 text-center text-slate-500"
                    >
                      No hay proveedores registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* Compras realizadas: solo Compras/Admin */}
        {canPurchase && (
          <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <h2 className="p-5 text-xl font-bold text-slate-900">
              Compras realizadas
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border p-3 text-left">ID</th>
                  <th className="border p-3 text-left">Factura</th>
                  <th className="border p-3 text-left">Proveedor</th>
                  <th className="border p-3 text-left">Proyecto</th>
                  <th className="border p-3 text-left">Almacén</th>
                  <th className="border p-3 text-left">Fecha</th>
                  <th className="border p-3 text-left">Total</th>
                  <th className="border p-3 text-left">Estado pago</th>
                </tr>
              </thead>

              <tbody>
                {compras.map((compra) => (
                  <tr key={compra.id_compra} className="hover:bg-slate-50">
                    <td className="border p-3">{compra.id_compra}</td>

                    <td className="border p-3">{compra.numero_factura}</td>

                    <td className="border p-3">
                      {proveedorMap.get(compra.id_proveedor) ?? "-"}
                    </td>

                    <td className="border p-3">
                      {proyectoMap.get(compra.id_proyecto) ?? "-"}
                    </td>

                    <td className="border p-3">
                      {almacenMap.get(compra.id_almacen) ?? "-"}
                    </td>

                    <td className="border p-3">
                      {new Date(compra.fecha_compra)
                        .toISOString()
                        .slice(0, 10)}
                    </td>

                    <td className="border p-3">
                      Bs. {compra.total_compra.toString()}
                    </td>

                    <td className="border p-3">{compra.estado_pago}</td>
                  </tr>
                ))}

                {compras.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="border p-6 text-center text-slate-500"
                    >
                      No hay compras registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* Detalle de compras: solo Compras/Admin */}
        {canPurchase && (
          <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <h2 className="p-5 text-xl font-bold text-slate-900">
              Detalle de compras
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border p-3 text-left">ID</th>
                  <th className="border p-3 text-left">Factura</th>
                  <th className="border p-3 text-left">Material</th>
                  <th className="border p-3 text-left">Cantidad</th>
                  <th className="border p-3 text-left">Precio</th>
                  <th className="border p-3 text-left">Subtotal</th>
                </tr>
              </thead>

              <tbody>
                {detalleCompras.map((detalle) => (
                  <tr
                    key={detalle.id_detalle_compra}
                    className="hover:bg-slate-50"
                  >
                    <td className="border p-3">
                      {detalle.id_detalle_compra}
                    </td>

                    <td className="border p-3">
                      {compraMap.get(detalle.id_compra) ?? "-"}
                    </td>

                    <td className="border p-3">
                      {materialMap.get(detalle.id_material) ?? "-"}
                    </td>

                    <td className="border p-3">
                      {detalle.cantidad.toString()}
                    </td>

                    <td className="border p-3">
                      Bs. {detalle.precio_unitario.toString()}
                    </td>

                    <td className="border p-3">
                      Bs. {detalle.subtotal.toString()}
                    </td>
                  </tr>
                ))}

                {detalleCompras.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="border p-6 text-center text-slate-500"
                    >
                      No hay detalles de compra registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  );
}