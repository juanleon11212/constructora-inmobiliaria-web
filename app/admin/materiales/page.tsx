import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireModule } from "../../../lib/auth/require-permission";

/*
  MÓDULO MATERIALES

  Ruta:
  /admin/materiales

  Qué hace:
  - Lista materiales.
  - Crea materiales.
  - Relaciona cada material con una categoría.
  - Muestra inventario general.
*/

type PageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getText(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

async function crearMaterial(formData: FormData) {
  "use server";

  const user = await requireModule("materiales");

  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

  if (roleName !== "Administrador") {
    redirect("/admin/materiales");
  }

  const nombre_material = getText(formData, "nombre_material");
  const descripcion = getText(formData, "descripcion");
  const unidad_medida = getText(formData, "unidad_medida");
  const precio_unitario = Number(formData.get("precio_unitario"));
  const stock_minimo = Number(formData.get("stock_minimo") ?? 0);
  const id_categoria_material = Number(formData.get("id_categoria_material"));

  if (!nombre_material || !unidad_medida || !precio_unitario || !id_categoria_material) {
    redirect("/admin/materiales?error=datos-obligatorios");
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

export default async function MaterialesPage({ searchParams }: PageProps) {
  const user = await requireModule("materiales");
  const params = await searchParams;

  const roleName =
    typeof user.rol === "string" ? user.rol : user.rol?.nombre_rol ?? "";

  const isAdmin = roleName === "Administrador";

  const categorias = await prisma.categoria_material.findMany({
    orderBy: {
      nombre_categoria: "asc",
    },
  });

  const materiales = await prisma.material.findMany({
    orderBy: {
      id_material: "desc",
    },
  });

  const inventario = await prisma.inventario.findMany({
    orderBy: {
      id_inventario: "desc",
    },
    take: 20,
  });

  const almacenes = await prisma.almacen.findMany();

  const categoriaMap = new Map(
    categorias.map((categoria) => [
      categoria.id_categoria_material,
      categoria.nombre_categoria,
    ])
  );

  const materialMap = new Map(
    materiales.map((material) => [material.id_material, material.nombre_material])
  );

  const almacenMap = new Map(
    almacenes.map((almacen) => [almacen.id_almacen, almacen.nombre_almacen])
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Módulo Materiales
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Materiales</h1>
            <p className="mt-1 text-slate-600">
              Control de materiales e inventario.
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
              "Nombre, unidad, precio y categoría son obligatorios."}
          </div>
        )}

        {isAdmin && (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Crear material
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Este formulario guarda un material en la tabla material.
            </p>

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
                    {material.precio_unitario.toString()}
                  </td>
                  <td className="border p-3">
                    {material.stock_minimo.toString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <h2 className="p-5 text-xl font-bold text-slate-900">
            Inventario reciente
          </h2>

          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-200">
              <tr>
                <th className="border p-3 text-left">Material</th>
                <th className="border p-3 text-left">Almacén</th>
                <th className="border p-3 text-left">Cantidad</th>
                <th className="border p-3 text-left">Actualización</th>
              </tr>
            </thead>

            <tbody>
              {inventario.map((item) => (
                <tr key={item.id_inventario}>
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
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}