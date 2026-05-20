"use client";

import { useMemo, useState } from "react";

/*
  COMPONENTE: RoleEmployeeSelect

  Qué hace:
  - Muestra el selector de rol.
  - Según el rol elegido, filtra los empleados.
  - Solo muestra empleados cuyo cargo corresponde al rol.

  Ejemplo:
  Rol Contabilidad -> muestra empleados con cargo Contador.
  Rol Almacen -> muestra empleados con cargo Almacenero.
  Rol Compras -> muestra empleados con cargo Compras.
*/

type RolOption = {
  id_rol: number;
  nombre_rol: string;
};

type CargoOption = {
  id_cargo: number;
  nombre_cargo: string;
};

type EmpleadoOption = {
  id_empleado: number;
  nombres: string | null;
  apellidos: string | null;
  ci: string | null;
  id_cargo: number | null;
};

type Props = {
  roles: RolOption[];
  cargos: CargoOption[];
  empleados: EmpleadoOption[];
};

/*
  Normaliza texto:
  - Quita tildes.
  - Convierte a minúscula.
  - Evita problemas entre "Almacén" y "Almacen".
*/
function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/*
  Aquí defines qué cargos corresponden a cada rol.

  Si en tu base tienes cargos con otros nombres,
  agrega esos nombres en la lista correspondiente.
*/
const cargosPorRol: Record<string, string[]> = {
  administrador: [
    "administrador",
    "gerente",
    "director",
    "administrador general",
  ],

  "encargado de obra": [
    "encargado de obra",
    "supervisor de obra",
    "ingeniero civil",
    "residente de obra",
    "maestro de obra",
  ],

  almacen: [
    "almacen",
    "almacenero",
    "encargado de almacen",
    "jefe de almacen",
    "auxiliar de almacen",
  ],

  contabilidad: [
    "contador",
    "contabilidad",
    "auxiliar contable",
    "asistente contable",
  ],

  "recursos humanos": [
    "recursos humanos",
    "rrhh",
    "auxiliar administrativo",
    "administrativo",
    "jefe de personal",
  ],

  compras: [
    "compras",
    "jefe de compras",
    "auxiliar de compras",
    "encargado de compras",
  ],
};

/*
  Convierte el nombre del rol a una clave conocida.
*/
function getRoleKey(nombreRol: string) {
  const role = normalize(nombreRol);

  if (role.includes("administrador")) return "administrador";
  if (role.includes("encargado") && role.includes("obra")) {
    return "encargado de obra";
  }
  if (role.includes("almacen")) return "almacen";
  if (role.includes("contabilidad")) return "contabilidad";
  if (role.includes("recursos") || role.includes("humanos")) {
    return "recursos humanos";
  }
  if (role.includes("compras")) return "compras";

  return role;
}

/*
  Verifica si el cargo del empleado corresponde al rol elegido.
*/
function cargoCorrespondeAlRol(nombreRol: string, nombreCargo: string) {
  const roleKey = getRoleKey(nombreRol);
  const cargo = normalize(nombreCargo);

  const cargosPermitidos = cargosPorRol[roleKey] ?? [];

  return cargosPermitidos.some((cargoPermitido) => {
    const cargoPermitidoNormalizado = normalize(cargoPermitido);

    return (
      cargo.includes(cargoPermitidoNormalizado) ||
      cargoPermitidoNormalizado.includes(cargo)
    );
  });
}

export default function RoleEmployeeSelect({
  roles,
  cargos,
  empleados,
}: Props) {
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const selectedRole = roles.find(
    (rol) => String(rol.id_rol) === selectedRoleId
  );

  const cargoMap = useMemo(() => {
    return new Map(cargos.map((cargo) => [cargo.id_cargo, cargo.nombre_cargo]));
  }, [cargos]);

  const empleadosFiltrados = useMemo(() => {
    if (!selectedRole) return [];

    return empleados.filter((empleado) => {
      if (!empleado.id_cargo) return false;

      const nombreCargo = cargoMap.get(empleado.id_cargo);

      if (!nombreCargo) return false;

      return cargoCorrespondeAlRol(selectedRole.nombre_rol, nombreCargo);
    });
  }, [selectedRole, empleados, cargoMap]);

  return (
    <>
      {/* Selector de rol */}
      <select
        name="id_rol"
        value={selectedRoleId}
        onChange={(event) => setSelectedRoleId(event.target.value)}
        className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
      >
        <option value="">Selecciona rol *</option>

        {roles.map((rol) => (
          <option key={rol.id_rol} value={rol.id_rol}>
            {rol.nombre_rol}
          </option>
        ))}
      </select>

      {/* Selector de empleado filtrado por cargo */}
      <select
        name="id_empleado"
        disabled={!selectedRoleId}
        className="rounded-xl border border-slate-300 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-400"
      >
        {!selectedRoleId && (
          <option value="">Primero selecciona un rol</option>
        )}

        {selectedRoleId && empleadosFiltrados.length === 0 && (
          <option value="">
            No hay empleados con cargo correspondiente a este rol
          </option>
        )}

        {empleadosFiltrados.map((empleado) => {
          const nombreCargo = empleado.id_cargo
            ? cargoMap.get(empleado.id_cargo)
            : "-";

          return (
            <option key={empleado.id_empleado} value={empleado.id_empleado}>
              {empleado.nombres} {empleado.apellidos} - Cargo: {nombreCargo} -
              CI: {empleado.ci ?? "-"}
            </option>
          );
        })}
      </select>
    </>
  );
}