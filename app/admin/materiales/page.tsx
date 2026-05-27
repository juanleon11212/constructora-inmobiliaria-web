import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ReactNode } from "react";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";
import { canDo } from "../../../lib/auth/permissions";

type PageProps = {
  searchParams?: Promise<{
    paso?: string;
    lista?: string;
    editar?: string;
    editarProveedor?: string;
    id_material?: string;
    id_almacen?: string;
    id_proveedor?: string;
    id_orden?: string;
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
    ? "border-blue-500 bg-blue-100/75 text-blue-950 shadow-blue-950/25"
    : "border-white/40 bg-white/35 text-white hover:bg-white/45 shadow-slate-950/20";
}

function ModuleIcon({ type }: { type: string }) {
  const bg: Record<string, string> = {
    materiales: "bg-blue-100 text-blue-700",
    inventario: "bg-emerald-100 text-emerald-700",
    almacenes: "bg-amber-100 text-amber-700",
    proveedores: "bg-violet-100 text-violet-700",
    ordenes: "bg-amber-100 text-amber-700",
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

function StatusBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    solicitada: "bg-amber-100 text-amber-800 ring-amber-200",
    recibida: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    pendiente: "bg-amber-100 text-amber-800 ring-amber-200",
    parcial: "bg-sky-100 text-sky-800 ring-sky-200",
    pagado: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold capitalize ring-1 ${
        styles[value.toLowerCase()] ?? "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {value}
    </span>
  );
}

function FormField({
  label,
  hint,
  wide = false,
  children,
}: {
  label: string;
  hint?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={wide ? "md:col-span-2" : undefined}>
      <span className={fieldLabelClass}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs font-medium text-slate-500">{hint}</span>}
    </label>
  );
}

const glassPanel =
  "rounded-[2rem] border border-white/40 bg-white/20 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

const tableWrapperClass =
  "mt-6 overflow-hidden rounded-[2rem] border border-white/50 bg-white/90 shadow-2xl shadow-slate-950/20 backdrop-blur-md";

const tableHeadClass =
  "border-b border-slate-700 bg-slate-900 p-3 text-left text-xs font-extrabold uppercase tracking-wide text-white";

const tableCellClass =
  "border-b border-slate-100 p-3 text-sm font-semibold text-slate-800";

const fieldLabelClass =
  "mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-600";

const formPanelClass =
  "rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-md";

const filterOptionsByList: Record<
  string,
  {
    value: string;
    label: string;
    placeholder: string;
  }[]
> = {
  materiales: [
    { value: "id_material", label: "ID material", placeholder: "Ejemplo: 1" },
    {
      value: "nombre_material",
      label: "Nombre del material",
      placeholder: "Ejemplo: cemento",
    },
    { value: "categoria", label: "Categoría", placeholder: "Ejemplo: acero" },
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
    { value: "material", label: "Material", placeholder: "Ejemplo: cemento" },
    { value: "almacen", label: "Almacén", placeholder: "Ejemplo: central" },
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
    { value: "id_almacen", label: "ID almacén", placeholder: "Ejemplo: 1" },
    {
      value: "nombre_almacen",
      label: "Nombre del almacén",
      placeholder: "Ejemplo: central",
    },
    { value: "ubicacion", label: "Ubicación", placeholder: "Ejemplo: zona norte" },
    { value: "descripcion", label: "Descripción", placeholder: "Ejemplo: principal" },
  ],
  proveedores: [
    { value: "id_proveedor", label: "ID proveedor", placeholder: "Ejemplo: 1" },
    {
      value: "nombre_proveedor",
      label: "Nombre del proveedor",
      placeholder: "Ejemplo: cementos",
    },
    { value: "nit", label: "NIT", placeholder: "Ejemplo: 100001" },
    { value: "telefono", label: "Teléfono", placeholder: "Ejemplo: 70000000" },
    {
      value: "correo",
      label: "Correo",
      placeholder: "Ejemplo: proveedor@email.com",
    },
  ],
  compras: [
    { value: "id_compra", label: "ID compra", placeholder: "Ejemplo: 1" },
    {
      value: "numero_factura",
      label: "Número de factura",
      placeholder: "Ejemplo: FC-001",
    },
    { value: "proveedor", label: "Proveedor", placeholder: "Ejemplo: cementos" },
    { value: "proyecto", label: "Proyecto", placeholder: "Ejemplo: vivienda" },
    { value: "almacen", label: "Almacén", placeholder: "Ejemplo: central" },
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
    { value: "total_compra", label: "Total compra", placeholder: "Ejemplo: 2500" },
  ],
  ordenes: [
    { value: "id_orden", label: "ID orden", placeholder: "Ejemplo: 1" },
    {
      value: "numero_orden",
      label: "Numero de orden",
      placeholder: "Ejemplo: OC-001",
    },
    { value: "proveedor", label: "Proveedor", placeholder: "Ejemplo: cementos" },
    { value: "proyecto", label: "Proyecto", placeholder: "Ejemplo: vivienda" },
    { value: "estado", label: "Estado", placeholder: "Ejemplo: solicitada" },
    { value: "fecha_orden", label: "Fecha orden", placeholder: "Ejemplo: 2026-05-20" },
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

  const material = await prisma.material.create({
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

  redirect(
    `/admin/materiales?paso=orden&lista=materiales&id_material=${material.id_material}`
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

  revalidatePath("/admin/materiales");
  redirect("/admin/materiales?lista=materiales");
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

  const proveedor = await prisma.proveedor.create({
    data: {
      nombre_proveedor,
      nit,
      telefono: telefono || null,
      correo: correo || null,
      direccion: direccion || null,
    },
  });

  revalidatePath("/admin/materiales");

  redirect(
    `/admin/materiales?paso=orden&lista=proveedores&id_material=${id_material}&id_almacen=${id_almacen}&id_proveedor=${proveedor.id_proveedor}`
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

async function crearOrdenCompra(formData: FormData) {
  "use server";

  const user = await requireModule("materiales");
  const roleName = getRoleName(user);

  if (!canDo(roleName, "materiales", "purchase")) {
    redirect("/admin/materiales");
  }

  const numero_orden = getText(formData, "numero_orden");
  const fecha_orden = getText(formData, "fecha_orden");
  const observacion = getText(formData, "observacion");

  const id_proveedor = Number(formData.get("id_proveedor"));
  const id_proyecto = Number(formData.get("id_proyecto"));
  const id_almacen = Number(formData.get("id_almacen"));
  const id_material = Number(formData.get("id_material"));
  const cantidad = Number(formData.get("cantidad"));
  const precio_unitario = Number(formData.get("precio_unitario"));

  if (
    !numero_orden ||
    !fecha_orden ||
    !id_proveedor ||
    !id_proyecto ||
    !id_almacen ||
    !id_material ||
    Number.isNaN(cantidad) ||
    Number.isNaN(precio_unitario)
  ) {
    redirect("/admin/materiales?paso=orden&error=orden-obligatoria");
  }

  if (cantidad <= 0 || precio_unitario <= 0) {
    redirect("/admin/materiales?paso=orden&error=orden-invalida");
  }

  const ordenExistente = await prisma.orden_compra.findFirst({
    where: {
      numero_orden,
    },
  });

  if (ordenExistente) {
    redirect("/admin/materiales?paso=orden&error=orden-existente");
  }

  const subtotal = cantidad * precio_unitario;

  const orden = await prisma.$transaction(async (tx) => {
    const nuevaOrden = await tx.orden_compra.create({
      data: {
        numero_orden,
        fecha_orden: new Date(fecha_orden),
        total_estimado: subtotal,
        estado: "solicitada",
        observacion: observacion || null,
        id_proveedor,
        id_proyecto,
        id_almacen,
        id_usuario_registro: user.id_usuario ?? null,
      },
    });

    await tx.detalle_orden_compra.create({
      data: {
        id_orden: nuevaOrden.id_orden,
        id_material,
        cantidad,
        precio_unitario,
        subtotal,
      },
    });

    return nuevaOrden;
  });

  revalidatePath("/admin/materiales");
  redirect(`/admin/materiales?lista=ordenes&paso=recepcion&id_orden=${orden.id_orden}`);
}

async function recibirOrdenCompra(formData: FormData) {
  "use server";

  const user = await requireModule("materiales");
  const roleName = getRoleName(user);

  if (!canDo(roleName, "materiales", "purchase")) {
    redirect("/admin/materiales");
  }

  const id_orden = Number(formData.get("id_orden"));
  const numero_factura = getText(formData, "numero_factura");
  const fecha_compra = getText(formData, "fecha_compra");
  const estado_pago = getText(formData, "estado_pago") || "pendiente";
  const observacion = getText(formData, "observacion");

  if (!id_orden || !numero_factura || !fecha_compra) {
    redirect("/admin/materiales?paso=recepcion&lista=ordenes&error=recepcion-obligatoria");
  }

  const [orden, detalle, compraExistente] = await Promise.all([
    prisma.orden_compra.findUnique({ where: { id_orden } }),
    prisma.detalle_orden_compra.findFirst({ where: { id_orden } }),
    prisma.compra_material.findFirst({ where: { numero_factura } }),
  ]);

  if (!orden || !detalle || orden.estado === "recibida") {
    redirect("/admin/materiales?paso=recepcion&lista=ordenes&error=orden-no-disponible");
  }

  if (compraExistente) {
    redirect(`/admin/materiales?paso=recepcion&lista=ordenes&id_orden=${id_orden}&error=factura-existente`);
  }

  await prisma.$transaction(async (tx) => {
    const compra = await tx.compra_material.create({
      data: {
        numero_factura,
        fecha_compra: new Date(fecha_compra),
        total_compra: orden.total_estimado,
        estado_pago,
        observacion: observacion || orden.observacion || null,
        id_proveedor: orden.id_proveedor,
        id_proyecto: orden.id_proyecto,
        id_almacen: orden.id_almacen,
        id_usuario_registro: user.id_usuario ?? null,
        id_orden,
      },
    });

    await tx.detalle_compra_material.create({
      data: {
        id_compra: compra.id_compra,
        id_material: detalle.id_material,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        subtotal: detalle.subtotal,
      },
    });

    const inventarioExistente = await tx.inventario.findFirst({
      where: {
        id_material: detalle.id_material,
        id_almacen: orden.id_almacen,
      },
    });

    if (inventarioExistente) {
      await tx.inventario.update({
        where: {
          id_inventario: inventarioExistente.id_inventario,
        },
        data: {
          cantidad_disponible:
            Number(inventarioExistente.cantidad_disponible) +
            Number(detalle.cantidad),
          fecha_actualizacion: new Date(),
        },
      });
    } else {
      await tx.inventario.create({
        data: {
          id_material: detalle.id_material,
          id_almacen: orden.id_almacen,
          cantidad_disponible: detalle.cantidad,
          fecha_actualizacion: new Date(),
        },
      });
    }

    await tx.orden_compra.update({
      where: { id_orden },
      data: { estado: "recibida" },
    });
  });

  revalidatePath("/admin/materiales");
  redirect("/admin/materiales?lista=compras&paso=recepcion");
}

export default async function MaterialesPage({ searchParams }: PageProps) {
  const user = await requireModule("materiales");
  const params = await searchParams;

  const roleName = getRoleName(user);

  const canCreateMaterial = canDo(roleName, "materiales", "create");
  const canEditMaterial = canDo(roleName, "materiales", "edit");
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
  const selectedOrdenId = Number(params?.id_orden) || "";

  const [
    categorias,
    materiales,
    inventario,
    almacenes,
    proveedores,
    proyectos,
    compras,
    detalleCompras,
    ordenes,
    detalleOrdenes,
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
    prisma.orden_compra.findMany({
      orderBy: {
        id_orden: "desc",
      },
    }),
    prisma.detalle_orden_compra.findMany({
      orderBy: {
        id_detalle_orden: "desc",
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

  const ordenMap = new Map(
    ordenes.map((orden) => [orden.id_orden, orden.numero_orden])
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

  const ordenesFiltradas = ordenes.filter((orden) => {
    if (!hayFiltro) return true;

    if (campoFiltro === "id_orden") {
      return equalsText(orden.id_orden, valorFiltro);
    }

    if (campoFiltro === "numero_orden") {
      return containsText(orden.numero_orden, valorFiltro);
    }

    if (campoFiltro === "proveedor") {
      return containsText(proveedorMap.get(orden.id_proveedor), valorFiltro);
    }

    if (campoFiltro === "proyecto") {
      return containsText(proyectoMap.get(orden.id_proyecto), valorFiltro);
    }

    if (campoFiltro === "estado") {
      return containsText(orden.estado, valorFiltro);
    }

    if (campoFiltro === "fecha_orden") {
      return containsText(formatDate(orden.fecha_orden), valorFiltro);
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

  const ordenesFiltradasIds = new Set(
    ordenesFiltradas.map((orden) => orden.id_orden)
  );

  const detalleOrdenesFiltrados =
    lista === "ordenes" && hayFiltro
      ? detalleOrdenes.filter((detalle) =>
          ordenesFiltradasIds.has(detalle.id_orden)
        )
      : detalleOrdenes;

  const totalVisiblePorLista: Record<string, number> = {
    materiales: materialesFiltrados.length,
    inventario: inventarioFiltrado.length,
    almacenes: almacenesFiltrados.length,
    proveedores: proveedoresFiltrados.length,
    ordenes: ordenesFiltradas.length,
    compras: comprasFiltradas.length,
  };

  const ordenesPendientes = ordenes.filter(
    (orden) => orden.estado === "solicitada"
  ).length;
  const unidadesDisponibles = inventario.reduce(
    (total, item) => total + Number(item.cantidad_disponible),
    0
  );
  const workflowSteps = [
    {
      key: "material",
      label: "Crear material",
      caption: "Define qué insumo necesitas controlar.",
      lista: "materiales",
    },
    {
      key: "proveedor",
      label: "Proveedor",
      caption: "Registra o elige quién abastecerá.",
      lista: "proveedores",
    },
    {
      key: "orden",
      label: "Emitir orden",
      caption: "Solicita cantidad y precio estimado.",
      lista: "ordenes",
    },
    {
      key: "recepcion",
      label: "Recibir pedido",
      caption: "Confirma factura e ingresa el stock.",
      lista: "compras",
    },
  ];
  const consultationLinks = [
    { key: "materiales", label: "Materiales", count: materiales.length },
    { key: "inventario", label: "Inventario / Stock", count: inventario.length },
    { key: "almacenes", label: "Almacenes", count: almacenes.length },
    { key: "proveedores", label: "Proveedores", count: proveedores.length },
    { key: "ordenes", label: "Órdenes", count: ordenes.length },
    { key: "compras", label: "Compras recibidas", count: compras.length },
  ];

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-fixed p-6"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(15,23,42,0.76) 0%, rgba(15,23,42,0.48) 45%, rgba(255,255,255,0.10) 100%), url('/images/materiales-fondo.jpg')",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4 text-white drop-shadow">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-blue-200/40 bg-blue-100/15 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-blue-100">
              Abastecimiento de obra
            </p>

            <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
              Materiales y compras
            </h1>

            <p className="mt-3 text-base font-semibold text-white/90">
              Pide materiales al proveedor, recibe la factura y deja que el
              inventario se actualice automáticamente.
            </p>

            <p className="mt-3 text-sm font-bold text-white/80">
              Sesión activa: {roleName}
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-white/40 bg-white/20 px-5 py-3 text-sm font-extrabold text-white shadow-xl backdrop-blur transition hover:bg-white/30"
          >
            Volver al panel
          </Link>
        </div>

        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Materiales", materiales.length, "Tipos registrados", "bg-blue-50 text-blue-800"],
            ["Proveedores", proveedores.length, "Contactos disponibles", "bg-violet-50 text-violet-800"],
            ["Órdenes pendientes", ordenesPendientes, "Esperando recepción", "bg-amber-50 text-amber-800"],
            ["Existencias", unidadesDisponibles.toFixed(2), "Unidades en inventario", "bg-emerald-50 text-emerald-800"],
          ].map(([label, value, caption, style]) => (
            <article
              key={String(label)}
              className={`rounded-2xl border border-white/70 p-4 shadow-xl shadow-slate-950/10 ${style}`}
            >
              <p className="text-xs font-extrabold uppercase tracking-widest opacity-75">
                {label}
              </p>
              <p className="mt-2 text-3xl font-black">{value}</p>
              <p className="mt-1 text-xs font-bold opacity-80">{caption}</p>
            </article>
          ))}
        </section>

        <section className={`mt-6 ${glassPanel}`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-blue-100">
                Flujo para crear
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-white drop-shadow">
                Ciclo de abastecimiento
              </h2>
              <p className="mt-1 text-sm font-semibold text-white/90">
                Sigue estos cuatro pasos para ingresar stock correctamente.
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-extrabold text-emerald-800 shadow">
              Stock automático al recibir
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <Link
                key={step.key}
                href={`/admin/materiales?paso=${step.key}&lista=${step.lista}`}
                scroll={false}
                className={`group rounded-2xl border p-4 shadow-xl backdrop-blur transition ${getCardClass(
                  paso === step.key
                )}`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-xs font-black text-blue-900">
                    {index + 1}
                  </span>
                  <ModuleIcon type={step.lista} />
                </div>
                <p className="mt-4 text-base font-extrabold">{step.label}</p>
                <p className="mt-1 text-xs font-semibold opacity-80">{step.caption}</p>
              </Link>
            ))}
          </div>
        </section>

        {params?.error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-bold text-red-700 shadow-lg backdrop-blur">
            {params.error === "datos-obligatorios" &&
              "Nombre, unidad, precio y categoría son obligatorios."}
            {params.error === "precio-invalido" &&
              "El precio debe ser mayor a cero."}
            {params.error === "stock-minimo-invalido" &&
              "El stock mínimo no puede ser negativo."}
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
            {params.error === "orden-obligatoria" &&
              "Numero de orden, fecha, proveedor, proyecto, almacen, material, cantidad y precio son obligatorios."}
            {params.error === "orden-invalida" &&
              "La cantidad y el precio de la orden deben ser mayores a cero."}
            {params.error === "orden-existente" &&
              "Ya existe una orden con ese numero."}
            {params.error === "recepcion-obligatoria" &&
              "Selecciona una orden e ingresa factura y fecha de recepcion."}
            {params.error === "orden-no-disponible" &&
              "La orden no existe o ya fue recibida."}
          </div>
        )}

        {canCreateMaterial &&
          paso === "material" &&
          !materialEditar &&
          !proveedorEditar && (
            <section className={`mt-6 ${formPanelClass}`}>
              <p className="text-xs font-extrabold uppercase tracking-widest text-blue-700">
                Paso 1 de 4
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
                Crear un material
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Registra el insumo una sola vez. Luego podrás solicitarlo a cualquier proveedor.
              </p>

              <form
                action={crearMaterial}
                className="mt-6 grid gap-4 md:grid-cols-2"
              >
                <FormField label="Nombre del material *">
                  <input name="nombre_material" placeholder="Ej. Cemento IP-30" className={inputClass} />
                </FormField>

                <FormField label="Categoría *">
                  <select name="id_categoria_material" className={selectClass}>
                    <option value="">Selecciona una categoría</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id_categoria_material} value={categoria.id_categoria_material}>
                        {categoria.nombre_categoria}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Unidad de medida *" hint="Ejemplos: bolsa, metro, pieza.">
                  <input name="unidad_medida" placeholder="Ej. bolsa" className={inputClass} />
                </FormField>

                <FormField label="Precio referencial unitario *">
                  <input type="number" step="0.01" name="precio_unitario" placeholder="Ej. 55.00" className={inputClass} />
                </FormField>

                <FormField label="Stock mínimo recomendado" hint="Sirve para identificar cuándo volver a pedir.">
                  <input type="number" step="0.01" name="stock_minimo" placeholder="Ej. 20" className={inputClass} />
                </FormField>

                <FormField label="Descripción" wide>
                  <input name="descripcion" placeholder="Características o marca preferida" className={inputClass} />
                </FormField>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-blue-800 to-sky-600 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/40 transition hover:from-blue-950 hover:to-sky-700"
                  >
                    Crear material y continuar
                  </button>
                </div>
              </form>
            </section>
          )}

        {canEditMaterial && materialEditar && (
          <section className={`mt-6 ${formPanelClass}`}>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-extrabold text-slate-950">
                Editar material
              </h2>

              <Link
                href="/admin/materiales?lista=materiales"
                scroll={false}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200"
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

              <FormField label="Nombre del material *">
                <input name="nombre_material" defaultValue={materialEditar.nombre_material} className={inputClass} />
              </FormField>

              <FormField label="Categoría *">
                <select name="id_categoria_material" defaultValue={materialEditar.id_categoria_material} className={selectClass}>
                  {categorias.map((categoria) => (
                    <option key={categoria.id_categoria_material} value={categoria.id_categoria_material}>
                      {categoria.nombre_categoria}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Unidad de medida *">
                <input name="unidad_medida" defaultValue={materialEditar.unidad_medida} className={inputClass} />
              </FormField>

              <FormField label="Precio referencial unitario *">
                <input type="number" step="0.01" name="precio_unitario" defaultValue={materialEditar.precio_unitario.toString()} className={inputClass} />
              </FormField>

              <FormField label="Stock mínimo recomendado">
                <input type="number" step="0.01" name="stock_minimo" defaultValue={materialEditar.stock_minimo.toString()} className={inputClass} />
              </FormField>

              <FormField label="Descripción" wide>
                <input name="descripcion" defaultValue={materialEditar.descripcion ?? ""} className={inputClass} />
              </FormField>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-blue-800 to-sky-600 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/40 transition hover:from-blue-950 hover:to-sky-700"
                >
                  Guardar material
                </button>
              </div>
            </form>
          </section>
        )}

        {canPurchase && paso === "proveedor" && !proveedorEditar && (
          <section className={`mt-6 ${formPanelClass}`}>
            <div className="grid gap-6 lg:grid-cols-[1fr_290px]">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-violet-700">
                  Paso 2 de 4
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
                  Registrar proveedor
                </h2>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Guarda los datos de contacto para reutilizar este proveedor en futuras órdenes.
                </p>

                <form action={crearProveedor} className="mt-6 grid gap-4 md:grid-cols-2">
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

                  <FormField label="Nombre o razón social *">
                    <input name="nombre_proveedor" placeholder="Ej. Cementos Bolivia S.A." className={inputClass} />
                  </FormField>

                  <FormField label="NIT *" hint="No se permiten proveedores duplicados.">
                    <input name="nit" placeholder="Ej. 100001" className={inputClass} />
                  </FormField>

                  <FormField label="Teléfono">
                    <input name="telefono" placeholder="Ej. 70002001" className={inputClass} />
                  </FormField>

                  <FormField label="Correo">
                    <input name="correo" placeholder="ventas@proveedor.com" className={inputClass} />
                  </FormField>

                  <FormField label="Dirección" wide>
                    <input name="direccion" placeholder="Dirección de oficina o despacho" className={inputClass} />
                  </FormField>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="rounded-xl bg-gradient-to-r from-violet-700 to-blue-700 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-violet-950/20 transition hover:from-violet-800 hover:to-blue-800"
                    >
                      Guardar proveedor y continuar a la orden
                    </button>
                  </div>
                </form>
              </div>

              <aside className="rounded-2xl bg-violet-50 p-5 text-violet-950 ring-1 ring-violet-100">
                <p className="text-xs font-extrabold uppercase tracking-widest text-violet-700">
                  Consejo
                </p>
                <h3 className="mt-2 text-lg font-extrabold">
                  ¿Ya está registrado?
                </h3>
                <p className="mt-2 text-sm font-medium text-violet-800">
                  No crees el mismo proveedor otra vez. Puedes seleccionarlo directamente al emitir la orden.
                </p>
                <Link
                  href="/admin/materiales?paso=orden&lista=proveedores"
                  scroll={false}
                  className="mt-5 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-violet-800 shadow-sm ring-1 ring-violet-200 transition hover:bg-violet-100"
                >
                  Usar proveedor existente
                </Link>
              </aside>
            </div>
          </section>
        )}

        {canPurchase && proveedorEditar && (
          <section className={`mt-6 ${formPanelClass}`}>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-extrabold text-slate-950">
                Editar proveedor
              </h2>

              <Link
                href="/admin/materiales?lista=proveedores"
                scroll={false}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200"
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

              <FormField label="Nombre o razón social *">
                <input name="nombre_proveedor" defaultValue={proveedorEditar.nombre_proveedor} className={inputClass} />
              </FormField>

              <FormField label="NIT *">
                <input name="nit" defaultValue={proveedorEditar.nit} className={inputClass} />
              </FormField>

              <FormField label="Teléfono">
                <input name="telefono" defaultValue={proveedorEditar.telefono ?? ""} className={inputClass} />
              </FormField>

              <FormField label="Correo">
                <input name="correo" defaultValue={proveedorEditar.correo ?? ""} className={inputClass} />
              </FormField>

              <FormField label="Dirección" wide>
                <input name="direccion" defaultValue={proveedorEditar.direccion ?? ""} className={inputClass} />
              </FormField>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-blue-800 to-sky-600 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/40 transition hover:from-blue-950 hover:to-sky-700"
                >
                  Guardar proveedor
                </button>
              </div>
            </form>
          </section>
        )}

        {canPurchase &&
          paso === "orden" &&
          !materialEditar &&
          !proveedorEditar && (
            <section className={`mt-6 ${formPanelClass}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-amber-700">
                    Paso 3 de 4
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
                    Emitir orden de compra
                  </h2>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Define lo que necesitas pedir. Todavía no se modifica el inventario.
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 ring-1 ring-amber-100">
                  Estado inicial: <StatusBadge value="solicitada" />
                </div>
              </div>

              <form
                action={crearOrdenCompra}
                className="mt-6 grid gap-4 md:grid-cols-2"
              >
                <FormField label="Número de orden *" hint="Usa una secuencia clara, por ejemplo OC-002.">
                  <input name="numero_orden" placeholder="OC-002" className={inputClass} />
                </FormField>
                <FormField label="Fecha de solicitud *">
                  <input type="date" name="fecha_orden" className={inputClass} />
                </FormField>

                <FormField label="Proveedor *">
                  <select name="id_proveedor" defaultValue={selectedProveedorId} className={selectClass}>
                    <option value="">Selecciona un proveedor</option>
                    {proveedores.map((proveedor) => (
                      <option key={proveedor.id_proveedor} value={proveedor.id_proveedor}>
                        {proveedor.nombre_proveedor}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Proyecto relacionado *">
                  <select name="id_proyecto" className={selectClass}>
                    <option value="">Selecciona una obra</option>
                    {proyectos.map((proyecto) => (
                      <option key={proyecto.id_proyecto} value={proyecto.id_proyecto}>
                        {proyecto.nombre_proyecto}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Almacén de destino *" hint="Aquí se ingresará el stock al recibir.">
                  <select name="id_almacen" defaultValue={selectedAlmacenId} className={selectClass}>
                    <option value="">Selecciona un almacén</option>
                    {almacenes.map((almacen) => (
                      <option key={almacen.id_almacen} value={almacen.id_almacen}>
                        {almacen.nombre_almacen}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Material solicitado *">
                  <select name="id_material" defaultValue={selectedMaterialId} className={selectClass}>
                    <option value="">Selecciona el material</option>
                    {materiales.map((material) => (
                      <option key={material.id_material} value={material.id_material}>
                        {material.nombre_material}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Cantidad solicitada *">
                  <input type="number" step="0.01" name="cantidad" placeholder="Ej. 100" className={inputClass} />
                </FormField>
                <FormField label="Precio estimado unitario *">
                  <input type="number" step="0.01" name="precio_unitario" placeholder="Ej. 55.00" className={inputClass} />
                </FormField>
                <FormField label="Observación del pedido" wide>
                  <input name="observacion" placeholder="Entrega requerida, marca o especificación" className={inputClass} />
                </FormField>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-blue-800 to-sky-600 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-950/40 transition hover:from-blue-950 hover:to-sky-700"
                  >
                    Enviar orden al proveedor
                  </button>
                </div>
              </form>
            </section>
          )}

        {canPurchase &&
          paso === "recepcion" &&
          !materialEditar &&
          !proveedorEditar && (
            <section className={`mt-6 ${formPanelClass}`}>
              <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
                Paso 4 de 4
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
                Recibir pedido y registrar factura
              </h2>
              <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-100">
                Al confirmar esta recepción, el material se sumará automáticamente al inventario del almacén indicado en la orden.
              </div>

              <form
                action={recibirOrdenCompra}
                className="mt-6 grid gap-4 md:grid-cols-2"
              >
                <FormField label="Orden pendiente por recibir *" wide>
                  <select name="id_orden" defaultValue={selectedOrdenId} className={selectClass}>
                    <option value="">Selecciona la orden recibida</option>
                    {ordenes
                      .filter((orden) => orden.estado === "solicitada")
                      .map((orden) => (
                        <option key={orden.id_orden} value={orden.id_orden}>
                          {orden.numero_orden} - {proveedorMap.get(orden.id_proveedor)} - Bs. {orden.total_estimado.toString()}
                        </option>
                      ))}
                  </select>
                </FormField>

                <FormField label="Número de factura *">
                  <input name="numero_factura" placeholder="Ej. FC-002" className={inputClass} />
                </FormField>
                <FormField label="Fecha de recepción *">
                  <input type="date" name="fecha_compra" className={inputClass} />
                </FormField>

                <FormField label="Estado del pago">
                  <select name="estado_pago" defaultValue="pendiente" className={selectClass}>
                    <option value="pendiente">Pago pendiente</option>
                    <option value="parcial">Pago parcial</option>
                    <option value="pagado">Pagado</option>
                  </select>
                </FormField>
                <FormField label="Observación de recepción">
                  <input name="observacion" placeholder="Ej. Entrega completa, sin daños" className={inputClass} />
                </FormField>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-emerald-950/40 transition hover:from-emerald-900 hover:to-green-700"
                  >
                    Confirmar recepción e ingresar stock
                  </button>
                </div>
              </form>
            </section>
          )}

        <section className={`mt-8 ${glassPanel}`}>
          <p className="text-xs font-extrabold uppercase tracking-widest text-blue-100">
            Después de crear
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-white drop-shadow">
            Consultar registros
          </h2>
          <p className="mt-1 text-sm font-semibold text-white/90">
            Revisa el estado del abastecimiento, el stock recibido y los contactos registrados.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {consultationLinks.map((item) => (
              <Link
                key={item.key}
                href={`/admin/materiales?paso=${paso}&lista=${item.key}`}
                scroll={false}
                className={`flex items-center justify-between rounded-2xl border p-4 shadow-lg transition ${
                  lista === item.key
                    ? "border-blue-300 bg-white text-blue-950"
                    : "border-white/30 bg-white/25 text-white hover:bg-white/35"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ModuleIcon type={item.key} />
                  <span className="text-sm font-extrabold">{item.label}</span>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-black ${
                  lista === item.key ? "bg-blue-100 text-blue-800" : "bg-white/20 text-white"
                }`}>
                  {item.count}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className={`mt-5 ${formPanelClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 shadow-lg">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
                  <path
                    d="M10.5 18a7.5 7.5 0 1 1 5.3-2.2L21 21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-950">
                  Buscar en {lista.charAt(0).toUpperCase() + lista.slice(1)}
                </h2>

                <p className="text-sm font-medium text-slate-600">
                  Filtra rápidamente la información que necesitas consultar.
                </p>
              </div>
            </div>

            {!filtroActivo && (
              <Link
                href={`/admin/materiales?paso=${paso}&lista=${lista}&filtro=1`}
                scroll={false}
                className="rounded-xl bg-gradient-to-r from-blue-800 to-sky-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg transition hover:from-blue-950 hover:to-sky-700"
              >
                Activar búsqueda
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
                className={selectClass}
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
                className={inputClass}
              />

              <button
                type="submit"
                className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-extrabold text-white shadow-lg transition hover:bg-blue-900"
              >
                Buscar
              </button>

              <Link
                href={`/admin/materiales?paso=${paso}&lista=${lista}`}
                scroll={false}
                className="rounded-xl border border-white/40 bg-white/75 px-5 py-3 text-center text-sm font-extrabold text-blue-900 shadow-lg transition hover:bg-white"
              >
                Limpiar
              </Link>
            </form>
          )}

          {hayFiltro && (
            <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-blue-100">
              Buscando por{" "}
              <span className="font-extrabold">
                {opcionSeleccionada?.label}
              </span>
              : <span className="font-extrabold">{valorFiltro}</span> —
              Resultados:{" "}
              <span className="font-extrabold">
                {totalVisiblePorLista[lista] ?? 0}
              </span>
            </div>
          )}
        </section>

        {lista === "materiales" && (
          <section className={tableWrapperClass}>
            <h2 className="p-5 text-2xl font-extrabold text-slate-950">
              Lista de materiales
            </h2>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className={tableHeadClass}>ID</th>
                  <th className={tableHeadClass}>Material</th>
                  <th className={tableHeadClass}>Categoría</th>
                  <th className={tableHeadClass}>Unidad</th>
                  <th className={tableHeadClass}>Precio</th>
                  <th className={tableHeadClass}>Stock mínimo</th>
                  {canEditMaterial && (
                    <th className={tableHeadClass}>Acciones</th>
                  )}
                </tr>
              </thead>

              <tbody className="bg-white/45">
                {materialesFiltrados.map((material) => (
                  <tr key={material.id_material} className="hover:bg-blue-50/80">
                    <td className={tableCellClass}>{material.id_material}</td>
                    <td className="border border-white/30 p-3 text-sm font-extrabold text-blue-950">
                      {material.nombre_material}
                    </td>
                    <td className={tableCellClass}>
                      {categoriaMap.get(material.id_categoria_material) ?? "-"}
                    </td>
                    <td className={tableCellClass}>{material.unidad_medida}</td>
                    <td className={tableCellClass}>
                      Bs. {material.precio_unitario.toString()}
                    </td>
                    <td className={tableCellClass}>
                      {material.stock_minimo.toString()}
                    </td>

                    {canEditMaterial && (
                      <td className={tableCellClass}>
                        <Link
                          href={`/admin/materiales?editar=${material.id_material}&lista=materiales`}
                          scroll={false}
                          className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-extrabold text-white shadow transition hover:bg-blue-900"
                        >
                          Editar
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {lista === "inventario" && (
          <section className={tableWrapperClass}>
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-2xl font-extrabold text-slate-950">
                Inventario disponible
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Estas cantidades se incrementan al confirmar una recepción de orden.
              </p>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
              {inventarioFiltrado.map((item) => (
                <article
                  key={item.id_inventario}
                  className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm"
                >
                  <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
                    {almacenMap.get(item.id_almacen) ?? "Almacén"}
                  </p>
                  <h3 className="mt-2 text-lg font-extrabold text-slate-950">
                    {materialMap.get(item.id_material) ?? "-"}
                  </h3>
                  <p className="mt-4 text-3xl font-black text-emerald-700">
                    {item.cantidad_disponible.toString()}
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    unidades disponibles
                  </p>
                  <p className="mt-4 text-xs font-medium text-slate-500">
                    Actualizado: {formatDate(item.fecha_actualizacion)}
                  </p>
                </article>
              ))}
              {inventarioFiltrado.length === 0 && (
                <p className="col-span-full rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                  Todavía no hay stock recibido para mostrar.
                </p>
              )}
            </div>
          </section>
        )}

        {lista === "almacenes" && (
          <section className={tableWrapperClass}>
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-2xl font-extrabold text-slate-950">
                Almacenes de recepción
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Selecciona uno en la orden para dirigir allí el material recibido.
              </p>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
              {almacenesFiltrados.map((almacen) => (
                <article key={almacen.id_almacen} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
                  <div className="flex items-center justify-between">
                    <ModuleIcon type="almacenes" />
                    <span className="text-xs font-extrabold text-amber-700">#{almacen.id_almacen}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold text-slate-950">{almacen.nombre_almacen}</h3>
                  <p className="mt-2 text-sm font-semibold text-amber-900">{almacen.ubicacion ?? "Ubicación no registrada"}</p>
                  <p className="mt-3 text-sm font-medium text-slate-600">{almacen.descripcion ?? "Sin descripción"}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {lista === "proveedores" && (
          <section className={tableWrapperClass}>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950">Proveedores</h2>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  Contactos habilitados para generar órdenes de compra.
                </p>
              </div>
              {canPurchase && (
                <Link
                  href="/admin/materiales?paso=proveedor&lista=proveedores"
                  scroll={false}
                  className="rounded-xl bg-violet-700 px-4 py-3 text-sm font-extrabold text-white shadow transition hover:bg-violet-800"
                >
                  Nuevo proveedor
                </Link>
              )}
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
              {proveedoresFiltrados.map((proveedor) => (
                <article key={proveedor.id_proveedor} className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <ModuleIcon type="proveedores" />
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-extrabold text-violet-700">
                      NIT {proveedor.nit}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold text-slate-950">
                    {proveedor.nombre_proveedor}
                  </h3>
                  <div className="mt-4 space-y-2 text-sm font-medium text-slate-600">
                    <p>Tel: {proveedor.telefono ?? "No registrado"}</p>
                    <p>{proveedor.correo ?? "Correo no registrado"}</p>
                    <p>{proveedor.direccion ?? "Dirección no registrada"}</p>
                  </div>
                  {canPurchase && (
                    <div className="mt-5 flex gap-2">
                      <Link
                        href={`/admin/materiales?paso=orden&lista=ordenes&id_proveedor=${proveedor.id_proveedor}`}
                        scroll={false}
                        className="flex-1 rounded-xl bg-blue-700 px-3 py-2 text-center text-xs font-extrabold text-white transition hover:bg-blue-900"
                      >
                        Emitir orden
                      </Link>
                      <Link
                        href={`/admin/materiales?editarProveedor=${proveedor.id_proveedor}&lista=proveedores`}
                        scroll={false}
                        className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-700 transition hover:bg-slate-200"
                      >
                        Editar
                      </Link>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {lista === "ordenes" && (
          <section className={tableWrapperClass}>
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-2xl font-extrabold text-slate-950">
                Órdenes de compra emitidas
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Las órdenes solicitadas quedan pendientes hasta confirmar la recepción.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className={tableHeadClass}>Orden</th>
                  <th className={tableHeadClass}>Proveedor</th>
                  <th className={tableHeadClass}>Proyecto</th>
                  <th className={tableHeadClass}>Almacen destino</th>
                  <th className={tableHeadClass}>Fecha</th>
                  <th className={tableHeadClass}>Total estimado</th>
                  <th className={tableHeadClass}>Estado</th>
                  {canPurchase && <th className={tableHeadClass}>Acción</th>}
                </tr>
              </thead>

              <tbody className="bg-white/45">
                {ordenesFiltradas.map((orden) => (
                  <tr key={orden.id_orden} className="hover:bg-blue-50/80">
                    <td className={tableCellClass}>{orden.numero_orden}</td>
                    <td className={tableCellClass}>
                      {proveedorMap.get(orden.id_proveedor) ?? "-"}
                    </td>
                    <td className={tableCellClass}>
                      {proyectoMap.get(orden.id_proyecto) ?? "-"}
                    </td>
                    <td className={tableCellClass}>
                      {almacenMap.get(orden.id_almacen) ?? "-"}
                    </td>
                    <td className={tableCellClass}>{formatDate(orden.fecha_orden)}</td>
                    <td className={tableCellClass}>Bs. {orden.total_estimado.toString()}</td>
                    <td className={tableCellClass}>
                      <StatusBadge value={orden.estado} />
                    </td>
                    {canPurchase && (
                      <td className={tableCellClass}>
                        {orden.estado === "solicitada" ? (
                          <Link
                            href={`/admin/materiales?paso=recepcion&lista=ordenes&id_orden=${orden.id_orden}`}
                            scroll={false}
                            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-emerald-800"
                          >
                            Recibir
                          </Link>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">Finalizada</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              </table>
            </div>

            <div className="border-t border-white/40 p-5">
              <h3 className="text-xl font-extrabold text-slate-950">
                Materiales solicitados
              </h3>
              <table className="mt-4 w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={tableHeadClass}>Orden</th>
                    <th className={tableHeadClass}>Material</th>
                    <th className={tableHeadClass}>Cantidad</th>
                    <th className={tableHeadClass}>Precio estimado</th>
                    <th className={tableHeadClass}>Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white/35">
                  {detalleOrdenesFiltrados.map((detalle) => (
                    <tr key={detalle.id_detalle_orden} className="hover:bg-blue-50/80">
                      <td className={tableCellClass}>{ordenMap.get(detalle.id_orden) ?? "-"}</td>
                      <td className={tableCellClass}>{materialMap.get(detalle.id_material) ?? "-"}</td>
                      <td className={tableCellClass}>{detalle.cantidad.toString()}</td>
                      <td className={tableCellClass}>Bs. {detalle.precio_unitario.toString()}</td>
                      <td className={tableCellClass}>Bs. {detalle.subtotal.toString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {lista === "compras" && (
          <section className={tableWrapperClass}>
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-2xl font-extrabold text-slate-950">
                Recepciones confirmadas
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Facturas registradas que ya ingresaron material al inventario.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className={tableHeadClass}>ID</th>
                  <th className={tableHeadClass}>Factura</th>
                  <th className={tableHeadClass}>Proveedor</th>
                  <th className={tableHeadClass}>Proyecto</th>
                  <th className={tableHeadClass}>Almacén</th>
                  <th className={tableHeadClass}>Fecha</th>
                  <th className={tableHeadClass}>Total</th>
                  <th className={tableHeadClass}>Estado pago</th>
                </tr>
              </thead>

              <tbody className="bg-white/45">
                {comprasFiltradas.map((compra) => (
                  <tr key={compra.id_compra} className="hover:bg-blue-50/80">
                    <td className={tableCellClass}>{compra.id_compra}</td>
                    <td className={tableCellClass}>{compra.numero_factura}</td>
                    <td className={tableCellClass}>
                      {proveedorMap.get(compra.id_proveedor) ?? "-"}
                    </td>
                    <td className={tableCellClass}>
                      {proyectoMap.get(compra.id_proyecto) ?? "-"}
                    </td>
                    <td className={tableCellClass}>
                      {almacenMap.get(compra.id_almacen) ?? "-"}
                    </td>
                    <td className={tableCellClass}>
                      {formatDate(compra.fecha_compra)}
                    </td>
                    <td className={tableCellClass}>
                      Bs. {compra.total_compra.toString()}
                    </td>
                    <td className={tableCellClass}>
                      <StatusBadge value={compra.estado_pago} />
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>

            <div className="border-t border-white/40 p-5">
              <h3 className="text-xl font-extrabold text-slate-950">
                Detalle de compras
              </h3>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={tableHeadClass}>ID</th>
                      <th className={tableHeadClass}>Factura</th>
                      <th className={tableHeadClass}>Material</th>
                      <th className={tableHeadClass}>Cantidad</th>
                      <th className={tableHeadClass}>Precio</th>
                      <th className={tableHeadClass}>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white/35">
                    {detalleComprasFiltrados.map((detalle) => (
                      <tr
                        key={detalle.id_detalle_compra}
                        className="hover:bg-blue-50/80"
                        >
                        <td className={tableCellClass}>
                          {detalle.id_detalle_compra}
                        </td>
                        <td className={tableCellClass}>
                          {compraMap.get(detalle.id_compra) ?? "-"}
                        </td>
                        <td className={tableCellClass}>
                          {materialMap.get(detalle.id_material) ?? "-"}
                        </td>
                        <td className={tableCellClass}>
                          {detalle.cantidad.toString()}
                        </td>
                        <td className={tableCellClass}>
                          Bs. {detalle.precio_unitario.toString()}
                        </td>
                        <td className={tableCellClass}>
                          Bs. {detalle.subtotal.toString()}
                        </td>
                      </tr>
                    ))}
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
