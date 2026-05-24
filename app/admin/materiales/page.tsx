import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";
import { canDo } from "../../../lib/auth/permissions";
import { createAuditLog } from "../../../lib/audit-log";
/*
  MÓDULO MATERIALES

  Ruta:
  /admin/materiales

  Incluye:
  - Ciclo de trabajo:
    1. Crear material
    2. Controlar stock
    3. Crear proveedor
    4. Registrar compra

  - Tarjetas visuales para listas:
    Materiales, Inventario, Almacenes, Proveedores, Compras realizadas

  - Filtro con lupa:
    Cada lista tiene sus propios campos de búsqueda.
*/

type PageProps = {
  searchParams?: Promise<{
    paso?: string;
    lista?: string;
    editar?: string;
    editarProveedor?: string;
    id_material?: string;
    id_almacen?: string;
    id_proveedor?: string;
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
  if (typeof user.rol === "string") return user.rol;

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

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toISOString().slice(0, 10);
}

function containsText(value: unknown, search: string) {
  return String(value ?? "")
    .toLowerCase()
    .includes(search.toLowerCase());
}

function equalsText(value: unknown, search: string) {
  return String(value ?? "").trim() === search.trim();
}

function getCardClass(active: boolean) {
  return active
    ? "border-blue-600 bg-blue-50 text-blue-900"
    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50";
}

function ModuleIcon({ type }: { type: string }) {
  const bg: Record<string, string> = {
    materiales: "bg-blue-100 text-blue-700",
    inventario: "bg-emerald-100 text-emerald-700",
    almacenes: "bg-amber-100 text-amber-700",
    proveedores: "bg-violet-100 text-violet-700",
    compras: "bg-rose-100 text-rose-700",
  };

  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
        bg[type] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
        <path
          d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M4 7.5 12 12l8-4.5M12 12v9"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    </div>
  );
}

const filterOptionsByList: Record<
  string,
  {
    value: string;
    label: string;
    placeholder: string;
  }[]
> = {
  materiales: [
    {
      value: "id_material",
      label: "ID material",
      placeholder: "Ejemplo: 1",
    },
    {
      value: "nombre_material",
      label: "Nombre del material",
      placeholder: "Ejemplo: cemento",
    },
    {
      value: "categoria",
      label: "Categoría",
      placeholder: "Ejemplo: acero",
    },
    {
      value: "unidad_medida",
      label: "Unidad de medida",
      placeholder: "Ejemplo: bolsa",
    },
    {
      value: "precio_unitario",
      label: "Precio unitario",
      placeholder: "Ejemplo: 55",
    },
  ],

  inventario: [
    {
      value: "id_inventario",
      label: "ID inventario",
      placeholder: "Ejemplo: 1",
    },
    {
      value: "material",
      label: "Material",
      placeholder: "Ejemplo: cemento",
    },
    {
      value: "almacen",
      label: "Almacén",
      placeholder: "Ejemplo: central",
    },
    {
      value: "cantidad_disponible",
      label: "Cantidad disponible",
      placeholder: "Ejemplo: 100",
    },
    {
      value: "fecha_actualizacion",
      label: "Fecha actualización",
      placeholder: "Ejemplo: 2026-05-20",
    },
  ],

  almacenes: [
    {
      value: "id_almacen",
      label: "ID almacén",
      placeholder: "Ejemplo: 1",
    },
    {
      value: "nombre_almacen",
      label: "Nombre del almacén",
      placeholder: "Ejemplo: central",
    },
    {
      value: "ubicacion",
      label: "Ubicación",
      placeholder: "Ejemplo: zona norte",
    },
    {
      value: "descripcion",
      label: "Descripción",
      placeholder: "Ejemplo: principal",
    },
  ],

  proveedores: [
    {
      value: "id_proveedor",
      label: "ID proveedor",
      placeholder: "Ejemplo: 1",
    },
    {
      value: "nombre_proveedor",
      label: "Nombre del proveedor",
      placeholder: "Ejemplo: cementos",
    },
    {
      value: "nit",
      label: "NIT",
      placeholder: "Ejemplo: 100001",
    },
    {
      value: "telefono",
      label: "Teléfono",
      placeholder: "Ejemplo: 70000000",
    },
    {
      value: "correo",
      label: "Correo",
      placeholder: "Ejemplo: proveedor@email.com",
    },
  ],

  compras: [
    {
      value: "id_compra",
      label: "ID compra",
      placeholder: "Ejemplo: 1",
    },
    {
      value: "numero_factura",
      label: "Número de factura",
      placeholder: "Ejemplo: FC-001",
    },
    {
      value: "proveedor",
      label: "Proveedor",
      placeholder: "Ejemplo: cementos",
    },
    {
      value: "proyecto",
      label: "Proyecto",
      placeholder: "Ejemplo: vivienda",
    },
    {
      value: "almacen",
      label: "Almacén",
      placeholder: "Ejemplo: central",
    },
    {
      value: "estado_pago",
      label: "Estado de pago",
      placeholder: "Ejemplo: pagado",
    },
    {
      value: "fecha_compra",
      label: "Fecha compra",
      placeholder: "Ejemplo: 2026-05-20",
    },
    {
      value: "total_compra",
      label: "Total compra",
      placeholder: "Ejemplo: 2500",
    },
  ],
};

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
    !id_categoria_material ||
    Number.isNaN(precio_unitario)
  ) {
    redirect("/admin/materiales?paso=material&error=datos-obligatorios");
  }

  if (precio_unitario <= 0) {
    redirect("/admin/materiales?paso=material&error=precio-invalido");
  }

  if (Number.isNaN(stock_minimo) || stock_minimo < 0) {
    redirect("/admin/materiales?paso=material&error=stock-minimo-invalido");
  }
  const materialCreado = await prisma.material.create({
    data: {
      nombre_material,
      descripcion: descripcion || null,
      unidad_medida,
      precio_unitario,
      stock_minimo: stock_minimo || 0,
      id_categoria_material,
    },
  });
 await createAuditLog({
  id_usuario: user.id_usuario ?? null,
  usuario: user.nombre_usuario ?? null,
  rol: roleName,
  accion: "CREAR",
  modulo: "Materiales",
  sector: "Crear material",
  descripcion: `Se creó el material ${nombre_material}.`,
  registro_id: materialCreado.id_material,
});
  revalidatePath("/admin/materiales");

  redirect(
    `/admin/materiales?paso=stock&lista=materiales&id_material=${materialCreado.id_material}`
  );
}

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
    !id_categoria_material ||
    Number.isNaN(precio_unitario)
  ) {
    redirect(`/admin/materiales?editar=${id_material}&error=datos-obligatorios`);
  }

  if (precio_unitario <= 0) {
    redirect(`/admin/materiales?editar=${id_material}&error=precio-invalido`);
  }

  if (Number.isNaN(stock_minimo) || stock_minimo < 0) {
    redirect(
      `/admin/materiales?editar=${id_material}&error=stock-minimo-invalido`
    );
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
   await createAuditLog({
  id_usuario: user.id_usuario ?? null,
  usuario: user.nombre_usuario ?? null,
  rol: roleName,
  accion: "EDITAR",
  modulo: "Materiales",
  sector: "Editar material",
  descripcion: `Se editó el material con ID ${id_material}.`,
  registro_id: id_material,
});

  revalidatePath("/admin/materiales");
  redirect("/admin/materiales?lista=materiales");
}

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
    redirect("/admin/materiales?paso=stock&error=stock-obligatorio");
  }

  if (cantidad_disponible < 0) {
    redirect("/admin/materiales?paso=stock&error=stock-invalido");
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
  await createAuditLog({
  id_usuario: user.id_usuario ?? null,
  usuario: user.nombre_usuario ?? null,
  rol: roleName,
  accion: "EDITAR",
  modulo: "Inventario",
  sector: "Controlar stock",
  descripcion: `Se actualizó el stock del material con ID ${id_material}.`,
  registro_id: id_material,
});

  revalidatePath("/admin/materiales");

  redirect(
    `/admin/materiales?paso=proveedor&lista=inventario&id_material=${id_material}&id_almacen=${id_almacen}`
  );
}

async function crearProveedor(formData: FormData) {
  "use server";

  const user = await requireModule("materiales");
  const roleName = getRoleName(user);

  if (!canDo(roleName, "materiales", "purchase")) {
    redirect("/admin/materiales");
  }

  const id_material = Number(formData.get("id_material")) || "";
  const id_almacen = Number(formData.get("id_almacen")) || "";

  const nombre_proveedor = getText(formData, "nombre_proveedor");
  const nit = getText(formData, "nit");
  const telefono = getText(formData, "telefono");
  const correo = getText(formData, "correo");
  const direccion = getText(formData, "direccion");

  if (!nombre_proveedor || !nit) {
    redirect(
      `/admin/materiales?paso=proveedor&error=proveedor-obligatorio&id_material=${id_material}&id_almacen=${id_almacen}`
    );
  }

  const proveedorExistente = await prisma.proveedor.findFirst({
    where: {
      nit,
    },
  });

  if (proveedorExistente) {
    redirect(
      `/admin/materiales?paso=proveedor&error=proveedor-existente&id_material=${id_material}&id_almacen=${id_almacen}`
    );
  }

  const proveedorCreado = await prisma.proveedor.create({
    data: {
      nombre_proveedor,
      nit,
      telefono: telefono || null,
      correo: correo || null,
      direccion: direccion || null,
    },
  });
  await createAuditLog({
  id_usuario: user.id_usuario ?? null,
  usuario: user.nombre_usuario ?? null,
  rol: roleName,
  accion: "CREAR",
  modulo: "Proveedores",
  sector: "Crear proveedor",
  descripcion: `Se creó un proveedor.`,
  registro_id: proveedorCreado.id_proveedor,
});
  revalidatePath("/admin/materiales");

  redirect(
    `/admin/materiales?paso=compra&lista=proveedores&id_material=${id_material}&id_almacen=${id_almacen}&id_proveedor=${proveedorCreado.id_proveedor}`
  );
}

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
  redirect("/admin/materiales?lista=proveedores");
}

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
    Number.isNaN(cantidad) ||
    Number.isNaN(precio_unitario)
  ) {
    redirect("/admin/materiales?paso=compra&error=compra-obligatoria");
  }

  if (cantidad <= 0 || precio_unitario <= 0) {
    redirect("/admin/materiales?paso=compra&error=compra-invalida");
  }

  const compraExistente = await prisma.compra_material.findFirst({
    where: {
      numero_factura,
    },
  });

  if (compraExistente) {
    redirect("/admin/materiales?paso=compra&error=factura-existente");
  }

  const subtotal = cantidad * precio_unitario;

const compraCreada = await prisma.compra_material.create({
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
  await createAuditLog({
  id_usuario: user.id_usuario ?? null,
  usuario: user.nombre_usuario ?? null,
  rol: roleName,
  accion: "CREAR",
  modulo: "Compras",
  sector: "Registrar compra de material",
  descripcion: `Se registró una compra de material.`,
  registro_id: compraCreada.id_compra,
});

  await prisma.detalle_compra_material.create({
    data: {
      id_compra: compraCreada.id_compra,
      id_material,
      cantidad,
      precio_unitario,
      subtotal,
    },
  });

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
  redirect("/admin/materiales?lista=compras&paso=material");
}

export default async function MaterialesPage({ searchParams }: PageProps) {
  const user = await requireModule("materiales");
  const params = await searchParams;

  const roleName = getRoleName(user);

  const canCreateMaterial = canDo(roleName, "materiales", "create");
  const canEditMaterial = canDo(roleName, "materiales", "edit");
  const canControlStock = canDo(roleName, "materiales", "inventory");
  const canPurchase = canDo(roleName, "materiales", "purchase");

  const paso = params?.paso ?? "material";
  const lista = params?.lista ?? "materiales";

  const filtroActivo = params?.filtro === "1";
  const campoFiltro = String(params?.campo ?? "").trim();
  const valorFiltro = String(params?.valor ?? "").trim();

  const opcionesFiltro =
    filterOptionsByList[lista] ?? filterOptionsByList.materiales;

  const opcionSeleccionada =
    opcionesFiltro.find((opcion) => opcion.value === campoFiltro) ??
    opcionesFiltro[0];

  const hayFiltro = Boolean(campoFiltro && valorFiltro);

  const idEditar = Number(params?.editar);
  const idEditarProveedor = Number(params?.editarProveedor);

  const selectedMaterialId = Number(params?.id_material) || "";
  const selectedAlmacenId = Number(params?.id_almacen) || "";
  const selectedProveedorId = Number(params?.id_proveedor) || "";

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

  const materialesFiltrados = materiales.filter((material) => {
    if (!hayFiltro) return true;

    if (campoFiltro === "id_material") {
      return equalsText(material.id_material, valorFiltro);
    }

    if (campoFiltro === "nombre_material") {
      return containsText(material.nombre_material, valorFiltro);
    }

    if (campoFiltro === "categoria") {
      return containsText(
        categoriaMap.get(material.id_categoria_material),
        valorFiltro
      );
    }

    if (campoFiltro === "unidad_medida") {
      return containsText(material.unidad_medida, valorFiltro);
    }

    if (campoFiltro === "precio_unitario") {
      return containsText(material.precio_unitario, valorFiltro);
    }

    return true;
  });

  const inventarioFiltrado = inventario.filter((item) => {
    if (!hayFiltro) return true;

    if (campoFiltro === "id_inventario") {
      return equalsText(item.id_inventario, valorFiltro);
    }

    if (campoFiltro === "material") {
      return containsText(materialMap.get(item.id_material), valorFiltro);
    }

    if (campoFiltro === "almacen") {
      return containsText(almacenMap.get(item.id_almacen), valorFiltro);
    }

    if (campoFiltro === "cantidad_disponible") {
      return containsText(item.cantidad_disponible, valorFiltro);
    }

    if (campoFiltro === "fecha_actualizacion") {
      return containsText(formatDate(item.fecha_actualizacion), valorFiltro);
    }

    return true;
  });

  const almacenesFiltrados = almacenes.filter((almacen) => {
    if (!hayFiltro) return true;

    if (campoFiltro === "id_almacen") {
      return equalsText(almacen.id_almacen, valorFiltro);
    }

    if (campoFiltro === "nombre_almacen") {
      return containsText(almacen.nombre_almacen, valorFiltro);
    }

    if (campoFiltro === "ubicacion") {
      return containsText(almacen.ubicacion, valorFiltro);
    }

    if (campoFiltro === "descripcion") {
      return containsText(almacen.descripcion, valorFiltro);
    }

    return true;
  });

  const proveedoresFiltrados = proveedores.filter((proveedor) => {
    if (!hayFiltro) return true;

    if (campoFiltro === "id_proveedor") {
      return equalsText(proveedor.id_proveedor, valorFiltro);
    }

    if (campoFiltro === "nombre_proveedor") {
      return containsText(proveedor.nombre_proveedor, valorFiltro);
    }

    if (campoFiltro === "nit") {
      return containsText(proveedor.nit, valorFiltro);
    }

    if (campoFiltro === "telefono") {
      return containsText(proveedor.telefono, valorFiltro);
    }

    if (campoFiltro === "correo") {
      return containsText(proveedor.correo, valorFiltro);
    }

    return true;
  });

  const comprasFiltradas = compras.filter((compra) => {
    if (!hayFiltro) return true;

    if (campoFiltro === "id_compra") {
      return equalsText(compra.id_compra, valorFiltro);
    }

    if (campoFiltro === "numero_factura") {
      return containsText(compra.numero_factura, valorFiltro);
    }

    if (campoFiltro === "proveedor") {
      return containsText(proveedorMap.get(compra.id_proveedor), valorFiltro);
    }

    if (campoFiltro === "proyecto") {
      return containsText(proyectoMap.get(compra.id_proyecto), valorFiltro);
    }

    if (campoFiltro === "almacen") {
      return containsText(almacenMap.get(compra.id_almacen), valorFiltro);
    }

    if (campoFiltro === "estado_pago") {
      return containsText(compra.estado_pago, valorFiltro);
    }

    if (campoFiltro === "fecha_compra") {
      return containsText(formatDate(compra.fecha_compra), valorFiltro);
    }

    if (campoFiltro === "total_compra") {
      return containsText(compra.total_compra, valorFiltro);
    }

    return true;
  });

  const comprasFiltradasIds = new Set(
    comprasFiltradas.map((compra) => compra.id_compra)
  );

  const detalleComprasFiltrados =
    lista === "compras" && hayFiltro
      ? detalleCompras.filter((detalle) =>
          comprasFiltradasIds.has(detalle.id_compra)
        )
      : detalleCompras;

  const tarjetasListas = [
    {
      key: "materiales",
      title: "Materiales",
      description: "Ver y editar materiales registrados.",
      count: materialesFiltrados.length,
    },
    {
      key: "inventario",
      title: "Inventario",
      description: "Consultar stock por material y almacén.",
      count: inventarioFiltrado.length,
    },
    {
      key: "almacenes",
      title: "Almacenes",
      description: "Ver almacenes disponibles.",
      count: almacenesFiltrados.length,
    },
    {
      key: "proveedores",
      title: "Proveedores",
      description: "Ver y editar proveedores.",
      count: proveedoresFiltrados.length,
    },
    {
      key: "compras",
      title: "Compras realizadas",
      description: "Consultar compras de materiales.",
      count: comprasFiltradas.length,
    },
  ];

  const totalVisiblePorLista: Record<string, number> = {
    materiales: materialesFiltrados.length,
    inventario: inventarioFiltrado.length,
    almacenes: almacenesFiltrados.length,
    proveedores: proveedoresFiltrados.length,
    compras: comprasFiltradas.length,
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Módulo Materiales
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Materiales, Inventario y Compras
            </h1>

            <p className="mt-1 text-slate-600">
              Sigue el ciclo: crear material, controlar stock, crear proveedor y
              registrar compra.
            </p>

            <p className="mt-2 text-sm text-slate-500">
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

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Ciclo de registro de materiales
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Avanza paso por paso. Los datos del paso anterior se seleccionan
            automáticamente cuando es posible.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {[
              ["material", "1", "Crear material"],
              ["stock", "2", "Controlar stock"],
              ["proveedor", "3", "Crear proveedor"],
              ["compra", "4", "Registrar compra"],
            ].map(([key, number, label]) => (
              <Link
                key={key}
                href={`/admin/materiales?paso=${key}&lista=${lista}`}
                scroll={false}
                className={`rounded-2xl border p-4 transition ${ paso === key
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 bg-slate-50 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                    {number}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {params?.error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error === "datos-obligatorios" &&
              "Nombre, unidad, precio y categoría son obligatorios."}

            {params.error === "precio-invalido" &&
              "El precio debe ser mayor a cero."}

            {params.error === "stock-minimo-invalido" &&
              "El stock mínimo no puede ser negativo."}

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

        {canCreateMaterial &&
          paso === "material" &&
          !materialEditar &&
          !proveedorEditar && (
            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Paso 1: Crear material
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
                    Crear material y continuar
                  </button>
                </div>
              </form>
            </section>
          )}

        {canEditMaterial && materialEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">
                Editar material
              </h2>

             <Link
              href="/admin/materiales?lista=materiales"
              scroll={false}
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
                  Guardar material
                </button>
              </div>
            </form>
          </section>
        )}

        {canControlStock &&
          paso === "stock" &&
          !materialEditar &&
          !proveedorEditar && (
            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Paso 2: Controlar stock
              </h2>

              <form
                action={actualizarStock}
                className="mt-5 grid gap-4 md:grid-cols-3"
              >
                <select
                  name="id_material"
                  defaultValue={selectedMaterialId}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Selecciona material *</option>

                  {materiales.map((material) => (
                    <option
                      key={material.id_material}
                      value={material.id_material}
                    >
                      {material.nombre_material}
                    </option>
                  ))}
                </select>

                <select
                  name="id_almacen"
                  defaultValue={selectedAlmacenId}
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
                    Actualizar stock y continuar
                  </button>
                </div>
              </form>
            </section>
          )}

        {canPurchase && paso === "proveedor" && !proveedorEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Paso 3: Crear proveedor
            </h2>

            <form
              action={crearProveedor}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input
                type="hidden"
                name="id_material"
                value={selectedMaterialId}
              />
              <input
                type="hidden"
                name="id_almacen"
                value={selectedAlmacenId}
              />

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
                  Crear proveedor y continuar
                </button>
              </div>
            </form>
          </section>
        )}

        {canPurchase && proveedorEditar && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">
                Editar proveedor
              </h2>

              <Link
                href="/admin/materiales?lista=proveedores"
                scroll={false}
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

        {canPurchase &&
          paso === "compra" &&
          !materialEditar &&
          !proveedorEditar && (
            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Paso 4: Registrar compra de material
              </h2>

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
                  defaultValue={selectedProveedorId}
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
                    <option
                      key={proyecto.id_proyecto}
                      value={proyecto.id_proyecto}
                    >
                      {proyecto.nombre_proyecto}
                    </option>
                  ))}
                </select>

                <select
                  name="id_almacen"
                  defaultValue={selectedAlmacenId}
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
                  defaultValue={selectedMaterialId}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">Material comprado *</option>

                  {materiales.map((material) => (
                    <option
                      key={material.id_material}
                      value={material.id_material}
                    >
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
                    Registrar compra y finalizar ciclo
                  </button>
                </div>
              </form>
            </section>
          )}

        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Listas del módulo
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Selecciona una tarjeta para ver la lista correspondiente.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {tarjetasListas.map((item) => (
              <Link
                key={item.key}
                href={`/admin/materiales?lista=${item.key}&paso=${paso}`}
                scroll={false}
                className={`rounded-[2rem] border p-5 shadow-sm transition ${getCardClass(lista === item.key
                )}`}
              >
                <ModuleIcon type={item.key} />

                <h3 className="mt-4 text-lg font-bold">{item.title}</h3>

                <p className="mt-2 text-sm text-slate-500">
                  {item.description}
                </p>

                <p className="mt-4 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  Total: {item.count}
                </p>
              </Link>
            ))}
          </div>
        </section>

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
                <h2 className="text-xl font-bold text-slate-900">
                  Filtro de búsqueda
                </h2>

                <p className="text-sm text-slate-500">
                  Lista actual:{" "}
                  <span className="font-semibold text-slate-700">
                    {tarjetasListas.find((item) => item.key === lista)?.title}
                  </span>
                </p>
              </div>
            </div>

            {!filtroActivo && (
              <Link
                href={`/admin/materiales?paso=${paso}&lista=${lista}&filtro=1`}
                scroll={false}
                className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Buscar con lupa
              </Link>
            )}
          </div>

          {filtroActivo && (
            <form
              action="/admin/materiales"
              method="get"
              className="mt-5 grid gap-4 md:grid-cols-[260px_1fr_auto_auto]"
            >
              <input type="hidden" name="paso" value={paso} />
              <input type="hidden" name="lista" value={lista} />
              <input type="hidden" name="filtro" value="1" />

              <select
                name="campo"
                defaultValue={campoFiltro || opcionSeleccionada?.value}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              >
                {opcionesFiltro.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>

              <input
                name="valor"
                defaultValue={valorFiltro}
                placeholder={
                  opcionSeleccionada?.placeholder ?? "Escribe para buscar"
                }
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <button
                type="submit"
                className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Buscar
              </button>

              <Link
                href={`/admin/materiales?paso=${paso}&lista=${lista}`}
                scroll={false}
                className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Limpiar
              </Link>
            </form>
          )}

          {hayFiltro && (
            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Buscando por{" "}
              <span className="font-semibold">{opcionSeleccionada?.label}</span>
              : <span className="font-semibold">{valorFiltro}</span> —
              Resultados:{" "}
              <span className="font-semibold">
                {totalVisiblePorLista[lista] ?? 0}
              </span>
            </div>
          )}
        </section>

        {lista === "materiales" && (
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
                {materialesFiltrados.map((material) => (
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
                        href={`/admin/materiales?editar=${material.id_material}&lista=materiales`}
                        scroll={false}
                        className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Editar
                      </Link>
                      </td>
                    )}
                  </tr>
                ))}

                {materialesFiltrados.length === 0 && (
                  <tr>
                    <td
                      colSpan={canEditMaterial ? 7 : 6}
                      className="border p-6 text-center text-slate-500"
                    >
                      No hay materiales para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {lista === "inventario" && (
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
                {inventarioFiltrado.map((item) => (
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
                      {formatDate(item.fecha_actualizacion)}
                    </td>
                  </tr>
                ))}

                {inventarioFiltrado.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="border p-6 text-center text-slate-500"
                    >
                      No hay inventario para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {lista === "almacenes" && (
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
                {almacenesFiltrados.map((almacen) => (
                  <tr key={almacen.id_almacen} className="hover:bg-slate-50">
                    <td className="border p-3">{almacen.id_almacen}</td>

                    <td className="border p-3 font-medium">
                      {almacen.nombre_almacen}
                    </td>

                    <td className="border p-3">{almacen.ubicacion ?? "-"}</td>

                    <td className="border p-3">{almacen.descripcion ?? "-"}</td>
                  </tr>
                ))}

                {almacenesFiltrados.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="border p-6 text-center text-slate-500"
                    >
                      No hay almacenes para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {lista === "proveedores" && (
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

                  {canPurchase && (
                    <th className="border p-3 text-left">Acciones</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {proveedoresFiltrados.map((proveedor) => (
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

                    {canPurchase && (
                      <td className="border p-3">
                       <Link
                        href={`/admin/materiales?editarProveedor=${proveedor.id_proveedor}&lista=proveedores`}
                        scroll={false}
                        className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Editar
                      </Link>
                      </td>
                    )}
                  </tr>
                ))}

                {proveedoresFiltrados.length === 0 && (
                  <tr>
                    <td
                      colSpan={canPurchase ? 6 : 5}
                      className="border p-6 text-center text-slate-500"
                    >
                      No hay proveedores para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {lista === "compras" && (
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
                {comprasFiltradas.map((compra) => (
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
                      {formatDate(compra.fecha_compra)}
                    </td>

                    <td className="border p-3">
                      Bs. {compra.total_compra.toString()}
                    </td>

                    <td className="border p-3">{compra.estado_pago}</td>
                  </tr>
                ))}

                {comprasFiltradas.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="border p-6 text-center text-slate-500"
                    >
                      No hay compras para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="border-t p-5">
              <h3 className="text-lg font-bold text-slate-900">
                Detalle de compras
              </h3>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-slate-100">
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
                    {detalleComprasFiltrados.map((detalle) => (
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

                    {detalleComprasFiltrados.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="border p-6 text-center text-slate-500"
                        >
                          No hay detalles de compra para mostrar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}