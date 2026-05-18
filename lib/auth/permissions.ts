/*
  PERMISOS DEL SISTEMA

  Aquí se define qué puede ver y qué puede hacer cada rol.

  Importante:
  Los permisos son por ROL, no por persona.

  Ejemplo:
  Todos los usuarios con rol "Contabilidad" tendrán los mismos permisos.
  Todos los usuarios con rol "Almacen" tendrán los mismos permisos.
*/

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
    description: "Controlar materiales, inventario, almacenes y compras.",
    href: "/admin/materiales",
  },
  {
    key: "pagos",
    title: "Pagos",
    description: "Consultar y registrar movimientos económicos.",
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

/*
  MÓDULOS VISIBLES POR ROL

  Esto decide qué tarjetas aparecen en /admin.
*/
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

  "Encargado de Obra": [
    "proyectos",
    "materiales",
    "reportes",
  ],

  Almacen: [
    "materiales",
    "reportes",
  ],

  Almacén: [
    "materiales",
    "reportes",
  ],

  Contabilidad: [
    "clientes",
    "proyectos",
    "pagos",
    "reportes",
  ],

  "Recursos Humanos": [
    "empleados",
    "reportes",
  ],

  Compras: [
    "materiales",
    "pagos",
    "reportes",
  ],

  Cliente: [
    "proyectos",
    "pagos",
  ],
};

/*
  ACCIONES PERMITIDAS POR ROL

  view      = ver
  create    = crear
  edit      = editar
  delete    = eliminar o desactivar
  manage    = administración completa
  assign    = asignar
  inventory = controlar inventario
  purchase  = compras
  report    = reportes
*/
export const roleActionPermissions: Record<
  string,
  Partial<Record<AppModule, AppAction[]>>
> = {
  Administrador: {
    clientes: ["view", "create", "edit", "delete", "manage"],
    empleados: ["view", "create", "edit", "delete", "manage"],
    proyectos: ["view", "create", "edit", "delete", "assign", "manage"],
    materiales: ["view", "create", "edit", "delete", "inventory", "purchase", "manage"],
    pagos: ["view", "create", "edit", "delete", "manage"],
    reportes: ["view", "report", "manage"],
    usuarios: ["view", "create", "edit", "delete", "manage"],
  },

  "Encargado de Obra": {
    proyectos: ["view", "edit", "assign"],
    materiales: ["view"],
    reportes: ["view", "report"],
  },

  Almacen: {
    materiales: ["view", "create", "edit", "inventory"],
    reportes: ["view", "report"],
  },

  Almacén: {
    materiales: ["view", "create", "edit", "inventory"],
    reportes: ["view", "report"],
  },

  Contabilidad: {
    clientes: ["view"],
    proyectos: ["view"],
    pagos: ["view"],
    reportes: ["view", "report"],
  },

  "Recursos Humanos": {
    empleados: ["view", "create", "edit"],
    reportes: ["view", "report"],
  },

  Compras: {
    materiales: ["view", "create", "edit", "purchase"],
    pagos: ["view"],
    reportes: ["view", "report"],
  },

  Cliente: {
    proyectos: ["view"],
    pagos: ["view"],
  },
};

/*
  TEXTO PARA MOSTRAR EN LA INTERFAZ

  Esto aparece en /admin para explicar qué puede y qué no puede hacer cada rol.
*/
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
    clientes: {
      can: [
        "Ver todos los clientes",
        "Crear clientes",
        "Editar clientes",
        "Ver proyectos del cliente",
        "Activar o desactivar clientes",
      ],
      cannot: [],
    },
    empleados: {
      can: [
        "Ver todos los empleados",
        "Crear empleados",
        "Editar empleados",
        "Desactivar empleados",
        "Relacionar empleados con cargos",
      ],
      cannot: [],
    },
    proyectos: {
      can: [
        "Ver todos los proyectos",
        "Crear proyectos",
        "Editar proyectos",
        "Actualizar estado del proyecto",
        "Eliminar proyectos de forma lógica",
        "Asignar o controlar información de obra",
      ],
      cannot: [],
    },
    materiales: {
      can: [
        "Ver materiales",
        "Crear materiales",
        "Editar materiales",
        "Controlar inventario",
        "Registrar información de compras",
        "Consultar almacenes y proveedores",
      ],
      cannot: [],
    },
    pagos: {
      can: [
        "Ver todos los pagos",
        "Registrar pagos",
        "Relacionar pagos con clientes, empleados o proveedores",
        "Relacionar pagos con proyectos",
      ],
      cannot: [],
    },
    reportes: {
      can: [
        "Ver reportes generales",
        "Ver reportes de clientes",
        "Ver reportes de empleados",
        "Ver reportes de proyectos",
        "Ver reportes de materiales",
        "Ver reportes de pagos",
      ],
      cannot: [],
    },
    usuarios: {
      can: [
        "Ver usuarios internos",
        "Crear usuarios para empleados",
        "Editar usuarios",
        "Asignar roles",
        "Desactivar cuentas",
      ],
      cannot: [],
    },
  },

  "Encargado de Obra": {
    proyectos: {
      can: [
        "Ver proyectos",
        "Gestionar información operativa de obra",
        "Actualizar avances u observaciones de obra",
        "Revisar estado del proyecto",
        "Consultar empleados asignados a obra cuando se implemente esa parte",
      ],
      cannot: [
        "No puede crear proyectos desde cero",
        "No puede eliminar proyectos",
        "No puede crear usuarios",
        "No puede registrar pagos",
        "No puede editar clientes",
      ],
    },
    materiales: {
      can: [
        "Ver materiales disponibles",
        "Consultar materiales usados en obra",
        "Revisar disponibilidad de materiales",
      ],
      cannot: [
        "No puede registrar compras",
        "No puede modificar pagos",
        "No puede administrar usuarios",
        "No puede editar clientes",
      ],
    },
    reportes: {
      can: [
        "Ver reportes de obra",
        "Ver reportes de proyectos",
        "Ver reportes de materiales relacionados a obra",
      ],
      cannot: [
        "No puede ver reportes financieros completos",
        "No puede ver reportes de usuarios",
        "No puede cambiar roles",
      ],
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
      ],
      cannot: [
        "No puede crear usuarios",
        "No puede editar clientes",
        "No puede registrar pagos",
        "No puede crear proyectos",
        "No puede editar empleados",
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
      ],
      cannot: [
        "No puede crear usuarios",
        "No puede editar clientes",
        "No puede registrar pagos",
        "No puede crear proyectos",
        "No puede editar empleados",
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

  Contabilidad: {
    clientes: {
      can: [
        "Ver clientes",
        "Consultar datos de clientes",
        "Consultar pagos relacionados al cliente",
      ],
      cannot: [
        "No puede crear clientes",
        "No puede editar clientes",
        "No puede eliminar clientes",
        "No puede crear usuarios",
      ],
    },
    proyectos: {
      can: [
        "Ver proyectos",
        "Consultar datos del proyecto",
        "Consultar pagos relacionados al proyecto",
      ],
      cannot: [
        "No puede crear proyectos",
        "No puede editar proyectos",
        "No puede eliminar proyectos",
        "No puede registrar avance de obra",
      ],
    },
    pagos: {
      can: [
        "Ver pagos",
        "Consultar pagos de clientes",
        "Consultar pagos de empleados",
        "Consultar pagos de proveedores",
        "Consultar pagos relacionados a proyectos",
      ],
      cannot: [
        "No puede crear pagos",
        "No puede editar pagos",
        "No puede eliminar pagos",
        "No puede registrar compras",
        "No puede modificar inventario",
      ],
    },
    reportes: {
      can: [
        "Ver reportes financieros",
        "Ver resumen de pagos",
        "Ver resumen de clientes",
        "Ver resumen de proyectos",
      ],
      cannot: [
        "No puede administrar usuarios",
        "No puede modificar inventario",
        "No puede crear compras",
      ],
    },
  },

  "Recursos Humanos": {
    empleados: {
      can: [
        "Ver empleados",
        "Crear empleados",
        "Editar empleados",
        "Cambiar estado del empleado",
        "Consultar cargos",
      ],
      cannot: [
        "No puede crear usuarios",
        "No puede eliminar usuarios",
        "No puede registrar pagos",
        "No puede crear proyectos",
        "No puede editar clientes",
        "No puede modificar materiales",
      ],
    },
    reportes: {
      can: [
        "Ver reportes de empleados",
        "Consultar personal activo e inactivo",
        "Consultar información laboral",
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
        "Registrar información relacionada a compras",
        "Editar datos relacionados a materiales comprados",
        "Consultar proveedores cuando se implemente la vista de proveedores",
        "Consultar materiales necesarios para proyectos",
      ],
      cannot: [
        "No puede crear usuarios",
        "No puede editar empleados",
        "No puede editar clientes",
        "No puede crear proyectos",
        "No puede registrar pagos de clientes",
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
        "No puede editar pagos",
        "No puede eliminar pagos",
      ],
    },
    reportes: {
      can: [
        "Ver reportes de compras",
        "Ver reportes de materiales",
        "Ver resumen de proveedores",
        "Ver pagos relacionados a proveedores",
      ],
      cannot: [
        "No puede ver reportes de usuarios",
        "No puede administrar roles",
        "No puede ver reportes completos de empleados",
      ],
    },
  },

  Cliente: {
    proyectos: {
      can: [
        "Ver solo sus proyectos",
        "Consultar estado de avance",
        "Ver información relacionada con sus obras",
      ],
      cannot: [
        "No puede ver proyectos de otros clientes",
        "No puede crear proyectos",
        "No puede editar proyectos",
      ],
    },
    pagos: {
      can: [
        "Ver solo sus pagos",
        "Consultar pagos realizados o pendientes",
      ],
      cannot: [
        "No puede ver pagos de otros clientes",
        "No puede registrar pagos",
        "No puede editar pagos",
      ],
    },
  },
};

export function getModulesByRole(roleName?: string | null) {
  if (!roleName) return [];

  const allowedModules = rolePermissions[roleName] ?? [];

  return allModules.filter((module) => allowedModules.includes(module.key));
}

export function canAccessModule(
  roleName: string | null | undefined,
  module: AppModule
) {
  if (!roleName) return false;

  return rolePermissions[roleName]?.includes(module) ?? false;
}

export function canDo(
  roleName: string | null | undefined,
  module: AppModule,
  action: AppAction
) {
  if (!roleName) return false;

  return roleActionPermissions[roleName]?.[module]?.includes(action) ?? false;
}

export function getModuleDetails(roleName: string, module: AppModule) {
  return (
    roleModuleDetails[roleName]?.[module] ?? {
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
      "Controla materiales, almacenes, inventario y reportes de stock.",
    Almacén:
      "Controla materiales, almacenes, inventario y reportes de stock.",
    Contabilidad:
      "Consulta clientes, proyectos, pagos y reportes financieros. No crea ni edita pagos.",
    "Recursos Humanos":
      "Gestiona empleados, cargos y reportes relacionados al personal.",
    Compras:
      "Gestiona materiales, compras y reportes relacionados a proveedores.",
    Cliente:
      "Consulta únicamente sus proyectos y sus pagos.",
  };

  return summaries[roleName] ?? "Rol con permisos limitados.";
}