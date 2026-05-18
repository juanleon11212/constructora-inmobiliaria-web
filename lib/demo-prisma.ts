/*
  DEMO PRISMA

  Este archivo simula la base de datos usando arreglos en memoria.

  Sirve para que tus amigos puedan ejecutar el frontend sin instalar SQL Server.

  IMPORTANTE:
  - No guarda datos reales.
  - Si reinicias el servidor, los datos vuelven al estado inicial.
  - Solo sirve para pruebas de interfaz.
*/

export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

const roles = [
  { id_rol: 1, nombre_rol: "Administrador", descripcion: "Control total del sistema" },
  { id_rol: 2, nombre_rol: "Encargado de Obra", descripcion: "Gestiona proyectos y avances de obra" },
  { id_rol: 3, nombre_rol: "Almacen", descripcion: "Controla materiales e inventario" },
  { id_rol: 4, nombre_rol: "Contabilidad", descripcion: "Consulta pagos, clientes y proyectos" },
  { id_rol: 5, nombre_rol: "Recursos Humanos", descripcion: "Gestiona empleados y cargos" },
  { id_rol: 6, nombre_rol: "Compras", descripcion: "Gestiona compras y proveedores" },
  { id_rol: 7, nombre_rol: "Cliente", descripcion: "Consulta sus proyectos y pagos" },
];

const cargos = [
  { id_cargo: 1, nombre_cargo: "Administrador", descripcion: "Gestión general" },
  { id_cargo: 2, nombre_cargo: "Ingeniero Civil", descripcion: "Obra" },
  { id_cargo: 3, nombre_cargo: "Almacenero", descripcion: "Almacén" },
  { id_cargo: 4, nombre_cargo: "Contador", descripcion: "Contabilidad" },
  { id_cargo: 5, nombre_cargo: "Auxiliar Administrativo", descripcion: "RRHH" },
  { id_cargo: 6, nombre_cargo: "Jefe de Compras", descripcion: "Compras" },
];

const empleados = [
  {
    id_empleado: 1,
    nombres: "Admin",
    apellidos: "Demo",
    ci: "900001",
    telefono: "70000001",
    direccion: "Cuenta demo",
    fecha_nacimiento: null,
    fecha_ingreso: new Date("2026-01-01"),
    estado: "activo",
    id_cargo: 1,
  },
  {
    id_empleado: 2,
    nombres: "Encargado",
    apellidos: "Obra Demo",
    ci: "900002",
    telefono: "70000002",
    direccion: "Cuenta demo",
    fecha_nacimiento: null,
    fecha_ingreso: new Date("2026-01-02"),
    estado: "activo",
    id_cargo: 2,
  },
  {
    id_empleado: 3,
    nombres: "Almacen",
    apellidos: "Demo",
    ci: "900003",
    telefono: "70000003",
    direccion: "Cuenta demo",
    fecha_nacimiento: null,
    fecha_ingreso: new Date("2026-01-03"),
    estado: "activo",
    id_cargo: 3,
  },
  {
    id_empleado: 4,
    nombres: "Contabilidad",
    apellidos: "Demo",
    ci: "900004",
    telefono: "70000004",
    direccion: "Cuenta demo",
    fecha_nacimiento: null,
    fecha_ingreso: new Date("2026-01-04"),
    estado: "activo",
    id_cargo: 4,
  },
  {
    id_empleado: 5,
    nombres: "Recursos",
    apellidos: "Humanos Demo",
    ci: "900005",
    telefono: "70000005",
    direccion: "Cuenta demo",
    fecha_nacimiento: null,
    fecha_ingreso: new Date("2026-01-05"),
    estado: "activo",
    id_cargo: 5,
  },
  {
    id_empleado: 6,
    nombres: "Compras",
    apellidos: "Demo",
    ci: "900006",
    telefono: "70000006",
    direccion: "Cuenta demo",
    fecha_nacimiento: null,
    fecha_ingreso: new Date("2026-01-06"),
    estado: "activo",
    id_cargo: 6,
  },
];

const usuarios = [
  {
    id_usuario: 1,
    nombre_usuario: "admin_demo",
    correo: "admin.demo@constructora.com",
    contrasena: "123456",
    estado: "activo",
    fecha_creacion: new Date("2026-01-01"),
    id_rol: 1,
    id_empleado: 1,
    id_cliente: null,
  },
  {
    id_usuario: 2,
    nombre_usuario: "obra_demo",
    correo: "obra.demo@constructora.com",
    contrasena: "123456",
    estado: "activo",
    fecha_creacion: new Date("2026-01-02"),
    id_rol: 2,
    id_empleado: 2,
    id_cliente: null,
  },
  {
    id_usuario: 3,
    nombre_usuario: "almacen_demo",
    correo: "almacen.demo@constructora.com",
    contrasena: "123456",
    estado: "activo",
    fecha_creacion: new Date("2026-01-03"),
    id_rol: 3,
    id_empleado: 3,
    id_cliente: null,
  },
  {
    id_usuario: 4,
    nombre_usuario: "contabilidad_demo",
    correo: "contabilidad.demo@constructora.com",
    contrasena: "123456",
    estado: "activo",
    fecha_creacion: new Date("2026-01-04"),
    id_rol: 4,
    id_empleado: 4,
    id_cliente: null,
  },
  {
    id_usuario: 5,
    nombre_usuario: "rrhh_demo",
    correo: "rrhh.demo@constructora.com",
    contrasena: "123456",
    estado: "activo",
    fecha_creacion: new Date("2026-01-05"),
    id_rol: 5,
    id_empleado: 5,
    id_cliente: null,
  },
  {
    id_usuario: 6,
    nombre_usuario: "compras_demo",
    correo: "compras.demo@constructora.com",
    contrasena: "123456",
    estado: "activo",
    fecha_creacion: new Date("2026-01-06"),
    id_rol: 6,
    id_empleado: 6,
    id_cliente: null,
  },
];

const clientes = [
  {
    id_cliente: 1,
    nombres: "Cliente",
    apellidos: "Demo",
    razon_social: null,
    ci_nit: "990001",
    telefono: "70001001",
    correo: "cliente.demo@constructora.com",
    direccion: "Zona Norte",
    nombre_usuario: "cliente_demo",
    contrasena: "123456",
    estado_cuenta: "activo",
    id_rol: 7,
  },
  {
    id_cliente: 2,
    nombres: "Constructora",
    apellidos: null,
    razon_social: "Grupo Empresarial Tunari",
    ci_nit: "990002",
    telefono: "70001002",
    correo: "tunari@empresa.com",
    direccion: "Cochabamba",
    nombre_usuario: "tunari_demo",
    contrasena: "123456",
    estado_cuenta: "activo",
    id_rol: 7,
  },
];

const categorias = [
  { id_categoria_material: 1, nombre_categoria: "Cemento", descripcion: "Materiales cementantes" },
  { id_categoria_material: 2, nombre_categoria: "Acero", descripcion: "Fierro y estructuras" },
  { id_categoria_material: 3, nombre_categoria: "Herramientas", descripcion: "Herramientas de trabajo" },
];

const materiales = [
  {
    id_material: 1,
    nombre_material: "Cemento IP-30",
    descripcion: "Bolsa de cemento",
    unidad_medida: "bolsa",
    precio_unitario: 55,
    stock_minimo: 20,
    id_categoria_material: 1,
  },
  {
    id_material: 2,
    nombre_material: "Fierro 12mm",
    descripcion: "Barra de construcción",
    unidad_medida: "barra",
    precio_unitario: 68,
    stock_minimo: 30,
    id_categoria_material: 2,
  },
  {
    id_material: 3,
    nombre_material: "Pala de construcción",
    descripcion: "Herramienta manual",
    unidad_medida: "unidad",
    precio_unitario: 90,
    stock_minimo: 5,
    id_categoria_material: 3,
  },
];

const almacenes = [
  {
    id_almacen: 1,
    nombre_almacen: "Almacén Central",
    ubicacion: "Zona Norte",
    descripcion: "Almacén principal",
  },
  {
    id_almacen: 2,
    nombre_almacen: "Almacén Obra Sur",
    ubicacion: "Zona Sur",
    descripcion: "Almacén secundario",
  },
];

const inventario = [
  {
    id_inventario: 1,
    id_material: 1,
    id_almacen: 1,
    cantidad_disponible: 150,
    fecha_actualizacion: new Date("2026-05-01"),
  },
  {
    id_inventario: 2,
    id_material: 2,
    id_almacen: 1,
    cantidad_disponible: 80,
    fecha_actualizacion: new Date("2026-05-02"),
  },
  {
    id_inventario: 3,
    id_material: 3,
    id_almacen: 2,
    cantidad_disponible: 12,
    fecha_actualizacion: new Date("2026-05-03"),
  },
];

const proveedores = [
  {
    id_proveedor: 1,
    nombre_proveedor: "Proveedor Cementos Bolivia",
    telefono: "70002001",
    correo: "cementos@proveedor.com",
    direccion: "Av. Industrial",
  },
  {
    id_proveedor: 2,
    nombre_proveedor: "Aceros Cochabamba",
    telefono: "70002002",
    correo: "aceros@proveedor.com",
    direccion: "Av. Blanco Galindo",
  },
];

const proyectos = [
  {
    id_proyecto: 1,
    nombre_proyecto: "Vivienda Familiar Norte",
    descripcion: "Construcción de vivienda de dos plantas",
    ubicacion: "Zona Norte",
    fecha_inicio: new Date("2026-02-01"),
    fecha_fin_estimada: new Date("2026-08-01"),
    fecha_fin_real: null,
    estado: "en_ejecucion",
    id_cliente: 1,
    id_usuario_registro: 1,
  },
  {
    id_proyecto: 2,
    nombre_proyecto: "Edificio Comercial Tunari",
    descripcion: "Edificio para oficinas",
    ubicacion: "Centro",
    fecha_inicio: new Date("2026-03-10"),
    fecha_fin_estimada: new Date("2026-12-15"),
    fecha_fin_real: null,
    estado: "pendiente",
    id_cliente: 2,
    id_usuario_registro: 1,
  },
  {
    id_proyecto: 3,
    nombre_proyecto: "Remodelación Cliente Demo",
    descripcion: "Remodelación de ambientes interiores",
    ubicacion: "Sacaba",
    fecha_inicio: new Date("2026-04-05"),
    fecha_fin_estimada: new Date("2026-07-20"),
    fecha_fin_real: null,
    estado: "en_ejecucion",
    id_cliente: 1,
    id_usuario_registro: 1,
  },
];

const pagos = [
  {
    id_pago: 1,
    tipo_pago: "cliente",
    fecha_pago: new Date("2026-05-01"),
    monto: 5000,
    metodo_pago: "transferencia",
    descripcion: "Anticipo de obra",
    id_cliente: 1,
    id_empleado: null,
    id_proveedor: null,
    id_proyecto: 1,
    id_usuario_registro: 1,
  },
  {
    id_pago: 2,
    tipo_pago: "proveedor",
    fecha_pago: new Date("2026-05-03"),
    monto: 2500,
    metodo_pago: "efectivo",
    descripcion: "Compra de cemento",
    id_cliente: null,
    id_empleado: null,
    id_proveedor: 1,
    id_proyecto: 1,
    id_usuario_registro: 1,
  },
  {
    id_pago: 3,
    tipo_pago: "empleado",
    fecha_pago: new Date("2026-05-05"),
    monto: 1200,
    metodo_pago: "transferencia",
    descripcion: "Pago semanal",
    id_cliente: null,
    id_empleado: 2,
    id_proveedor: null,
    id_proyecto: 1,
    id_usuario_registro: 1,
  },
  {
    id_pago: 4,
    tipo_pago: "cliente",
    fecha_pago: new Date("2026-05-07"),
    monto: 8000,
    metodo_pago: "deposito",
    descripcion: "Pago inicial edificio",
    id_cliente: 2,
    id_empleado: null,
    id_proveedor: null,
    id_proyecto: 2,
    id_usuario_registro: 1,
  },
];

function getIdField(modelName: string) {
  const ids: Record<string, string> = {
    rol: "id_rol",
    cargo: "id_cargo",
    empleado: "id_empleado",
    usuario: "id_usuario",
    cliente: "id_cliente",
    categoria_material: "id_categoria_material",
    material: "id_material",
    almacen: "id_almacen",
    inventario: "id_inventario",
    proveedor: "id_proveedor",
    proyecto: "id_proyecto",
    pago: "id_pago",
  };

  return ids[modelName];
}

function matchesWhere(item: any, where?: any): boolean {
  if (!where) return true;

  return Object.entries(where).every(([key, condition]) => {
    if (key === "OR" && Array.isArray(condition)) {
      return condition.some((subWhere) => matchesWhere(item, subWhere));
    }

    if (condition === undefined) return true;

    if (
      condition &&
      typeof condition === "object" &&
      !Array.isArray(condition) &&
      !(condition instanceof Date)
    ) {
      if ("not" in condition) {
        return item[key] !== condition.not;
      }

      if ("in" in condition && Array.isArray(condition.in)) {
        return condition.in.includes(item[key]);
      }

      if ("notIn" in condition && Array.isArray(condition.notIn)) {
        return !condition.notIn.includes(item[key]);
      }
    }

    return item[key] === condition;
  });
}

function orderRows(rows: any[], orderBy?: any) {
  if (!orderBy) return rows;

  const [field, direction] = Object.entries(orderBy)[0] as [string, string];

  return [...rows].sort((a, b) => {
    if (a[field] > b[field]) return direction === "desc" ? -1 : 1;
    if (a[field] < b[field]) return direction === "desc" ? 1 : -1;
    return 0;
  });
}

function includeRelations(modelName: string, item: any, args?: any) {
  if (!item) return null;

  let result = { ...item };

  if (args?.include?.rol) {
    result.rol = roles.find((rol) => rol.id_rol === item.id_rol) ?? null;
  }

  if (modelName === "usuario" && args?.include?.empleado) {
    result.empleado =
      empleados.find((empleado) => empleado.id_empleado === item.id_empleado) ??
      null;
  }

  if (args?.select) {
    const selected: any = {};

    Object.entries(args.select).forEach(([key, value]) => {
      if (value) {
        selected[key] = result[key];
      }
    });

    return selected;
  }

  return result;
}

function createModel(modelName: string, rows: any[]) {
  const idField = getIdField(modelName);

  return {
    async findMany(args?: any) {
      let result = rows.filter((item) => matchesWhere(item, args?.where));
      result = orderRows(result, args?.orderBy);

      if (args?.take) {
        result = result.slice(0, args.take);
      }

      return result.map((item) => includeRelations(modelName, item, args));
    },

    async findFirst(args?: any) {
      const result = rows.find((item) => matchesWhere(item, args?.where));
      return includeRelations(modelName, result, args);
    },

    async findUnique(args?: any) {
      const where = args?.where ?? {};
      const result = rows.find((item) =>
        Object.entries(where).every(([key, value]) => item[key] === value)
      );

      return includeRelations(modelName, result, args);
    },

    async create(args: any) {
      const nextId =
        rows.length > 0
          ? Math.max(...rows.map((item) => Number(item[idField] ?? 0))) + 1
          : 1;

      const created = {
        [idField]: nextId,
        ...args.data,
      };

      rows.push(created);

      return created;
    },

    async update(args: any) {
      const where = args?.where ?? {};
      const index = rows.findIndex((item) =>
        Object.entries(where).every(([key, value]) => item[key] === value)
      );

      if (index === -1) {
        throw new Error(`Registro no encontrado en ${modelName}`);
      }

      rows[index] = {
        ...rows[index],
        ...args.data,
      };

      return rows[index];
    },

    async updateMany(args: any) {
      let count = 0;

      rows.forEach((item, index) => {
        if (matchesWhere(item, args?.where)) {
          rows[index] = {
            ...item,
            ...args.data,
          };
          count++;
        }
      });

      return { count };
    },

    async count(args?: any) {
      return rows.filter((item) => matchesWhere(item, args?.where)).length;
    },

    async aggregate(args?: any) {
      const filtered = rows.filter((item) => matchesWhere(item, args?.where));

      const result: any = {
        _sum: {},
      };

      if (args?._sum) {
        Object.keys(args._sum).forEach((field) => {
          result._sum[field] = filtered.reduce(
            (total, item) => total + Number(item[field] ?? 0),
            0
          );
        });
      }

      return result;
    },
  };
}

export const demoPrisma = {
  rol: createModel("rol", roles),
  cargo: createModel("cargo", cargos),
  empleado: createModel("empleado", empleados),
  usuario: createModel("usuario", usuarios),
  cliente: createModel("cliente", clientes),
  categoria_material: createModel("categoria_material", categorias),
  material: createModel("material", materiales),
  almacen: createModel("almacen", almacenes),
  inventario: createModel("inventario", inventario),
  proveedor: createModel("proveedor", proveedores),
  proyecto: createModel("proyecto", proyectos),
  pago: createModel("pago", pagos),
};