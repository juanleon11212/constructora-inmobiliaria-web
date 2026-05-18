export type AppModule =
  | "clientes"
  | "empleados"
  | "proyectos"
  | "materiales"
  | "pagos"
  | "reportes"
  | "usuarios";

export type AppAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "manage"
  | "assign"
  | "inventory"
  | "purchase"
  | "report";

export type ModuleItem = {
  key: AppModule;
  title: string;
  description: string;
  href: string;
};

export const allModules: ModuleItem[] = [
  {
    key: "clientes",
    title: "Clientes",
    description: "Administrar y consultar clientes registrados.",
    href: "/admin/clientes",
  },
  {
    key: "empleados",
    title: "Empleados",
    description: "Gestionar empleados, cargos y personal interno.",
    href: "/admin/empleados",
  },
  {
    key: "proyectos",
    title: "Proyectos",
    description: "Gestionar obras y proyectos de construcción.",
    href: "/admin/proyectos",
  },
  {
    key: "materiales",
    title: "Materiales",
    description: "Controlar materiales, inventario, almacenes, proveedores y compras.",
    href: "/admin/materiales",
  },
  {
    key: "pagos",
    title: "Pagos",
    description: "Registrar y consultar pagos del sistema.",
    href: "/admin/pagos",
  },
  {
    key: "reportes",
    title: "Reportes",
    description: "Ver resúmenes y reportes del sistema.",
    href: "/admin/reportes",
  },
  {
    key: "usuarios",
    title: "Usuarios",
    description: "Administrar usuarios internos y roles.",
    href: "/admin/usuarios",
  },
];

export const rolePermissions: Record<string, AppModule[]> = {
  Administrador: [
    "clientes",
    "empleados",
    "proyectos",
    "materiales",
    "pagos",
    "reportes",
    "usuarios",
  ],

  "Encargado de Obra": ["proyectos", "materiales", "reportes"],

  Almacen: ["materiales", "reportes"],

  Almacén: ["materiales", "reportes"],

  Contabilidad: ["clientes", "proyectos", "pagos", "reportes"],

  "Recursos Humanos": ["empleados", "reportes"],

  Compras: ["materiales", "pagos", "reportes"],

  Cliente: ["proyectos", "pagos"],
};

export const roleActionPermissions: Record<
  string,
  Partial<Record<AppModule, AppAction[]>>
> = {
  Administrador: {
    clientes: ["view", "create", "edit", "delete", "manage"],
    empleados: ["view", "create", "edit", "delete", "manage"],
    proyectos: ["view", "create", "edit", "delete", "assign", "manage"],
    materiales: [
      "view",
      "create",
      "edit",
      "delete",
      "inventory",
      "purchase",
      "manage",
    ],
    pagos: ["view", "create", "edit", "delete", "manage"],
    reportes: ["view", "report", "manage"],
    usuarios: ["view", "create", "edit", "delete", "manage"],
  },

  "Encargado de Obra": {
    proyectos: ["view", "edit", "assign"],
    materiales: ["view"],
    reportes: ["view"],
  },

  Almacen: {
    materiales: ["view", "create", "edit", "inventory"],
    reportes: ["view"],
  },

  Almacén: {
    materiales: ["view", "create", "edit", "inventory"],
    reportes: ["view"],
  },

  Contabilidad: {
    clientes: ["view"],
    proyectos: ["view"],
    pagos: ["view", "create", "edit"],
    reportes: ["view", "report"],
  },

  "Recursos Humanos": {
    empleados: ["view", "create", "edit"],
    reportes: ["view"],
  },

  Compras: {
    materiales: ["view", "create", "edit", "purchase"],
    pagos: ["view"],
    reportes: ["view"],
  },

  Cliente: {
    proyectos: ["view"],
    pagos: ["view"],
  },
};

export const roleModuleDetails: Record<
  string,
  Partial<
    Record<
      AppModule,
      {
        can: string[];
        cannot: string[];
      }
    >
  >
> = {
  Administrador: {
    materiales: {
      can: [
        "Ver materiales",
        "Crear materiales",
        "Editar materiales",
        "Controlar stock",
        "Consultar inventario",
        "Ver almacenes",
        "Crear proveedores",
        "Editar proveedores",
        "Registrar compras de materiales",
        "Ver compras realizadas",
      ],
      cannot: [],
    },
  },

  Almacen: {
    materiales: {
      can: [
        "Ver materiales",
        "Crear materiales",
        "Editar materiales",
        "Controlar stock",
        "Consultar inventario",
        "Ver almacenes",
        "Actualizar cantidad disponible por material y almacén",
      ],
      cannot: [
        "No puede registrar compras",
        "No puede gestionar proveedores",
        "No puede registrar pagos",
        "No puede crear proyectos",
        "No puede editar clientes",
        "No puede editar empleados",
        "No puede administrar usuarios",
      ],
    },
    reportes: {
      can: [
        "Ver reportes de inventario",
        "Ver materiales registrados",
        "Ver resumen de stock",
      ],
      cannot: [
        "No puede ver reportes financieros completos",
        "No puede cambiar roles",
      ],
    },
  },

  Almacén: {
    materiales: {
      can: [
        "Ver materiales",
        "Crear materiales",
        "Editar materiales",
        "Controlar stock",
        "Consultar inventario",
        "Ver almacenes",
        "Actualizar cantidad disponible por material y almacén",
      ],
      cannot: [
        "No puede registrar compras",
        "No puede gestionar proveedores",
        "No puede registrar pagos",
        "No puede crear proyectos",
        "No puede editar clientes",
        "No puede editar empleados",
        "No puede administrar usuarios",
      ],
    },
    reportes: {
      can: [
        "Ver reportes de inventario",
        "Ver materiales registrados",
        "Ver resumen de stock",
      ],
      cannot: [
        "No puede ver reportes financieros completos",
        "No puede cambiar roles",
      ],
    },
  },

  Compras: {
    materiales: {
      can: [
        "Ver materiales",
        "Crear materiales",
        "Editar materiales",
        "Ver proveedores",
        "Crear proveedores",
        "Editar proveedores",
        "Registrar compras de materiales",
        "Seleccionar proveedor",
        "Seleccionar proyecto relacionado",
        "Seleccionar almacén destino",
        "Registrar número de factura",
        "Registrar estado de pago de la compra",
        "Ver compras realizadas",
      ],
      cannot: [
        "No puede controlar stock directamente",
        "No puede modificar inventario manualmente",
        "No puede crear usuarios",
        "No puede editar empleados",
        "No puede editar clientes",
        "No puede crear proyectos",
        "No puede registrar pagos de clientes",
        "No puede registrar pagos a empleados",
        "No puede cambiar roles",
      ],
    },
    pagos: {
      can: [
        "Ver pagos relacionados a proveedores",
        "Consultar pagos de compras",
      ],
      cannot: [
        "No puede registrar pagos de clientes",
        "No puede registrar pagos a empleados",
        "No puede editar pagos generales",
        "No puede eliminar pagos",
      ],
    },
    reportes: {
      can: [
        "Ver reportes de compras",
        "Ver reportes de proveedores",
        "Ver materiales comprados",
      ],
      cannot: [
        "No puede ver reportes completos de usuarios",
        "No puede cambiar roles",
      ],
    },
  },

  Contabilidad: {
    clientes: {
      can: ["Ver clientes", "Consultar datos de clientes"],
      cannot: ["No puede crear clientes", "No puede editar clientes"],
    },
    proyectos: {
      can: ["Ver proyectos", "Consultar información de proyectos"],
      cannot: ["No puede crear proyectos", "No puede editar proyectos"],
    },
    pagos: {
      can: [
        "Ver pagos",
        "Registrar pagos",
        "Editar pagos",
        "Consultar pagos de clientes",
        "Consultar pagos de empleados",
        "Consultar pagos de proveedores",
      ],
      cannot: [
        "No puede eliminar pagos",
        "No puede registrar compras",
        "No puede modificar inventario",
      ],
    },
    reportes: {
      can: ["Ver reportes financieros", "Ver resumen de pagos"],
      cannot: ["No puede administrar usuarios"],
    },
  },

  "Encargado de Obra": {
    proyectos: {
      can: [
        "Ver proyectos",
        "Gestionar información operativa de obra",
        "Actualizar avances u observaciones",
      ],
      cannot: [
        "No puede registrar pagos",
        "No puede crear usuarios",
        "No puede editar clientes",
      ],
    },
    materiales: {
      can: [
        "Ver materiales disponibles",
        "Consultar materiales usados en obra",
      ],
      cannot: [
        "No puede registrar compras",
        "No puede controlar inventario",
      ],
    },
    reportes: {
      can: ["Ver reportes de obra"],
      cannot: ["No puede ver reportes financieros completos"],
    },
  },

  "Recursos Humanos": {
    empleados: {
      can: [
        "Ver empleados",
        "Crear empleados",
        "Editar empleados",
        "Cambiar estado de empleados",
      ],
      cannot: [
        "No puede registrar pagos",
        "No puede modificar materiales",
        "No puede crear proyectos",
      ],
    },
    reportes: {
      can: ["Ver reportes de empleados"],
      cannot: ["No puede ver reportes financieros completos"],
    },
  },

  Cliente: {
    proyectos: {
      can: ["Ver solo sus proyectos", "Consultar estado de sus obras"],
      cannot: ["No puede crear ni editar proyectos"],
    },
    pagos: {
      can: ["Ver solo sus pagos"],
      cannot: ["No puede registrar ni editar pagos"],
    },
  },
};

export function getModulesByRole(roleName?: string | null) {
  if (!roleName) return [];

  const cleanRoleName = roleName.trim();
  const allowedModules = rolePermissions[cleanRoleName] ?? [];

  return allModules.filter((module) => allowedModules.includes(module.key));
}

export function canAccessModule(
  roleName: string | null | undefined,
  module: AppModule
) {
  if (!roleName) return false;

  const cleanRoleName = roleName.trim();

  return rolePermissions[cleanRoleName]?.includes(module) ?? false;
}

export function canDo(
  roleName: string | null | undefined,
  module: AppModule,
  action: AppAction
) {
  if (!roleName) return false;

  const cleanRoleName = roleName.trim();

  return (
    roleActionPermissions[cleanRoleName]?.[module]?.includes(action) ?? false
  );
}

export function getModuleDetails(roleName: string, module: AppModule) {
  const cleanRoleName = roleName.trim();

  return (
    roleModuleDetails[cleanRoleName]?.[module] ?? {
      can: ["Ver información permitida para este rol."],
      cannot: ["No puede acceder a funciones no asignadas a su rol."],
    }
  );
}

export function getRoleSummary(roleName: string) {
  const summaries: Record<string, string> = {
    Administrador:
      "Tiene acceso completo al sistema y puede administrar todos los módulos.",
    "Encargado de Obra":
      "Gestiona información operativa de proyectos, obra y materiales.",
    Almacen:
      "Controla materiales, inventario, stock y almacenes.",
    Almacén:
      "Controla materiales, inventario, stock y almacenes.",
    Contabilidad:
      "Gestiona pagos, clientes, proyectos y reportes financieros.",
    "Recursos Humanos":
      "Gestiona empleados, cargos y reportes del personal.",
    Compras:
      "Gestiona proveedores, compras de materiales y reportes de compras.",
    Cliente:
      "Consulta únicamente sus proyectos y sus pagos.",
  };

  return summaries[roleName.trim()] ?? "Rol con permisos limitados.";
}