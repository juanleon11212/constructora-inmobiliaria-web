"use client";

import { useMemo, useState } from "react";

type RolOption = {
  id_rol: number;
  nombre_rol: string;
};

type CargoOption = {
  id_cargo: number;
  nombre_cargo: string;
};

type Props = {
  roles: RolOption[];
  cargos: CargoOption[];
  defaultCargoId?: number | null;
};

/*
  Este componente se usa en Empleados.

  Primero eliges el área/rol laboral:
  - Encargado de Obra
  - Almacen
  - Contabilidad
  - Recursos Humanos
  - Compras

  Luego aparecen solo los cargos que corresponden a ese rol.
*/

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const cargosPorRol: Record<string, string[]> = {
  "encargado de obra": [
    "encargado de obra",
    "supervisor de obra",
    "ingeniero civil",
    "residente de obra",
    "maestro de obra",
    "jefe de obra",
  ],

  almacen: [
    "almacen",
    "almacenero",
    "encargado de almacen",
    "jefe de almacen",
    "auxiliar de almacen",
    "responsable de almacen",
  ],

  contabilidad: [
    "contador",
    "contabilidad",
    "auxiliar contable",
    "asistente contable",
    "jefe de contabilidad",
  ],

  "recursos humanos": [
    "recursos humanos",
    "rrhh",
    "jefe de personal",
    "talento humano",
    "auxiliar administrativo",
    "administrativo",
  ],

  compras: [
    "compras",
    "jefe de compras",
    "auxiliar de compras",
    "encargado de compras",
    "responsable de compras",
  ],
};

function getRoleKey(nombreRol: string) {
  const role = normalize(nombreRol);

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

function cargoCorrespondeAlRol(nombreRol: string, nombreCargo: string) {
  const roleKey = getRoleKey(nombreRol);
  const cargo = normalize(nombreCargo);

  const cargosPermitidos = cargosPorRol[roleKey] ?? [];

  return cargosPermitidos.some((cargoPermitido) => {
    const limpio = normalize(cargoPermitido);

    return cargo.includes(limpio) || limpio.includes(cargo);
  });
}

function getInitialRoleId(
  roles: RolOption[],
  cargos: CargoOption[],
  defaultCargoId?: number | null
) {
  if (!defaultCargoId) return "";

  const cargo = cargos.find((item) => item.id_cargo === defaultCargoId);

  if (!cargo) return "";

  const rol = roles.find((item) =>
    cargoCorrespondeAlRol(item.nombre_rol, cargo.nombre_cargo)
  );

  return rol ? String(rol.id_rol) : "";
}

export default function RoleCargoSelect({
  roles,
  cargos,
  defaultCargoId,
}: Props) {
  const [selectedRoleId, setSelectedRoleId] = useState(() =>
    getInitialRoleId(roles, cargos, defaultCargoId)
  );

  const [selectedCargoId, setSelectedCargoId] = useState(
    defaultCargoId ? String(defaultCargoId) : ""
  );

  const selectedRole = roles.find(
    (rol) => String(rol.id_rol) === selectedRoleId
  );

  const cargosFiltrados = useMemo(() => {
    if (!selectedRole) return [];

    return cargos.filter((cargo) =>
      cargoCorrespondeAlRol(selectedRole.nombre_rol, cargo.nombre_cargo)
    );
  }, [selectedRole, cargos]);

  function handleRoleChange(value: string) {
    setSelectedRoleId(value);
    setSelectedCargoId("");
  }

  return (
    <>
      <select
        name="area_rol"
        value={selectedRoleId}
        onChange={(event) => handleRoleChange(event.target.value)}
        className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
      >
        <option value="">Primero selecciona el área *</option>

        {roles.map((rol) => (
          <option key={rol.id_rol} value={rol.id_rol}>
            {rol.nombre_rol}
          </option>
        ))}
      </select>

      <select
        name="id_cargo"
        value={selectedCargoId}
        onChange={(event) => setSelectedCargoId(event.target.value)}
        disabled={!selectedRoleId}
        className="rounded-xl border border-slate-300 px-4 py-3 text-sm disabled:bg-slate-100 disabled:text-slate-400"
      >
        {!selectedRoleId && (
          <option value="">Primero selecciona el área</option>
        )}

        {selectedRoleId && cargosFiltrados.length === 0 && (
          <option value="">No hay cargos para esta área</option>
        )}

        {cargosFiltrados.map((cargo) => (
          <option key={cargo.id_cargo} value={cargo.id_cargo}>
            {cargo.nombre_cargo}
          </option>
        ))}
      </select>
    </>
  );
}