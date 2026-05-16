export type AppModule =
  | "clientes"
  | "empleados"
  | "proyectos"
  | "materiales"
  | "pagos"
  | "reportes"
  | "usuarios";

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
    description: "Administrar clientes registrados.",
    href: "/admin/clientes",
  },
  {
    key: "empleados",
    title: "Empleados",
    description: "Gestionar empleados y cargos.",
    href: "/admin/empleados",
  },
  {
    key: "proyectos",
    title: "Proyectos",
    description: "Gestionar obras y proyectos.",
    href: "/admin/proyectos",
  },
  {
    key: "materiales",
    title: "Materiales",
    description: "Controlar materiales e inventario.",
    href: "/admin/materiales",
  },
  {
    key: "pagos",
    title: "Pagos",
    description: "Registrar y consultar pagos.",
    href: "/admin/pagos",
  },
  {
    key: "reportes",
    title: "Reportes",
    description: "Ver reportes del sistema.",
    href: "/admin/reportes",
  },
  {
    key: "usuarios",
    title: "Usuarios",
    description: "Administrar usuarios y roles.",
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

  "Encargado de Obra": [
    "proyectos",
    "materiales",
    "reportes",
  ],

  Almacen: [
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