"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Rol = {
  id_rol: number;
  nombre_rol: string;
};

type Cargo = {
  id_cargo: number;
  nombre_cargo: string;
};

export function RegisterForm() {
  const router = useRouter();

  const [tipoCuenta, setTipoCuenta] = useState<"cliente" | "usuario">(
    "cliente"
  );

  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);

  const [form, setForm] = useState({
    nombre_usuario: "",
    contrasena: "",
    correo: "",

    nombres: "",
    apellidos: "",
    razon_social: "",
    ci_nit: "",
    ci: "",
    telefono: "",
    direccion: "",
    fecha_nacimiento: "",

    id_rol: "",
    id_cargo: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const response = await fetch("/api/registro/opciones");

      if (response.ok) {
        const data = await response.json();

        setRoles(data.rolesEmpresa ?? []);
        setCargos(data.cargosEmpleado ?? []);
      }
    }

    loadData();
  }, []);

  function updateField(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function changeTipoCuenta(tipo: "cliente" | "usuario") {
    setTipoCuenta(tipo);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo_cuenta: tipoCuenta,
          ...form,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "No se pudo registrar.");
        return;
      }

      setSuccess(data.message ?? "Registro correcto.");

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
          Registro
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Crear cuenta
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Selecciona si crearás una cuenta de cliente o un usuario de empresa.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-slate-100 p-2">
        <button
          type="button"
          onClick={() => changeTipoCuenta("cliente")}
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            tipoCuenta === "cliente"
              ? "bg-blue-700 text-white"
              : "text-slate-600"
          }`}
        >
          Cliente
        </button>

        <button
          type="button"
          onClick={() => changeTipoCuenta("usuario")}
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            tipoCuenta === "usuario"
              ? "bg-blue-700 text-white"
              : "text-slate-600"
          }`}
        >
          Usuario empresa
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Usuario
          </label>
          <input
            value={form.nombre_usuario}
            onChange={(e) => updateField("nombre_usuario", e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            placeholder={tipoCuenta === "cliente" ? "cliente_10" : "jrojas"}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Contraseña
          </label>
          <input
            type="password"
            value={form.contrasena}
            onChange={(e) => updateField("contrasena", e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            placeholder="123456"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Correo
          </label>
          <input
            value={form.correo}
            onChange={(e) => updateField("correo", e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            placeholder="correo@email.com"
          />
        </div>

        {tipoCuenta === "cliente" && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nombres
              </label>
              <input
                value={form.nombres}
                onChange={(e) => updateField("nombres", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                placeholder="Pedro"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Apellidos
              </label>
              <input
                value={form.apellidos}
                onChange={(e) => updateField("apellidos", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                placeholder="Mamani"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Razón social
              </label>
              <input
                value={form.razon_social}
                onChange={(e) => updateField("razon_social", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                placeholder="Opcional si es empresa"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                CI/NIT
              </label>
              <input
                value={form.ci_nit}
                onChange={(e) => updateField("ci_nit", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                placeholder="1234567"
              />
            </div>
          </>
        )}

        {tipoCuenta === "usuario" && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Rol a crear
              </label>
              <select
                value={form.id_rol}
                onChange={(e) => updateField("id_rol", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Selecciona un rol</option>
                {roles.map((rol) => (
                  <option key={rol.id_rol} value={rol.id_rol}>
                    {rol.nombre_rol}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Cargo del empleado
              </label>
              <select
                value={form.id_cargo}
                onChange={(e) => updateField("id_cargo", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Selecciona un cargo</option>
                {cargos.map((cargo) => (
                  <option key={cargo.id_cargo} value={cargo.id_cargo}>
                    {cargo.nombre_cargo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nombres
              </label>
              <input
                value={form.nombres}
                onChange={(e) => updateField("nombres", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                placeholder="Juan"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Apellidos
              </label>
              <input
                value={form.apellidos}
                onChange={(e) => updateField("apellidos", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                placeholder="Rojas"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                CI
              </label>
              <input
                value={form.ci}
                onChange={(e) => updateField("ci", e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                placeholder="9876543"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                value={form.fecha_nacimiento}
                onChange={(e) =>
                  updateField("fecha_nacimiento", e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Teléfono
          </label>
          <input
            value={form.telefono}
            onChange={(e) => updateField("telefono", e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            placeholder="70000000"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Dirección
          </label>
          <input
            value={form.direccion}
            onChange={(e) => updateField("direccion", e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            placeholder="Zona Norte"
          />
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Registrando..." : "Crear cuenta"}
      </button>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{" "}
        <a href="/login" className="font-semibold text-blue-700">
          Inicia sesión
        </a>
      </p>
    </form>
  );
}