"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

/*
  REGISTRO PÚBLICO

  Esta pantalla solo registra clientes.

  Importante:
  - Un cliente NO tiene cargo.
  - Un cliente NO se crea desde la tabla usuario.
  - El cliente se guarda en la tabla cliente.
  - El rol Cliente se asigna automáticamente desde el backend.
*/

export function RegisterForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    nombre_usuario: "",
    contrasena: "",
    correo: "",
    nombres: "",
    apellidos: "",
    razon_social: "",
    ci_nit: "",
    telefono: "",
    direccion: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
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
          tipo_cuenta: "cliente",
          ...form,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "No se pudo registrar.");
        return;
      }

      setSuccess(data.message ?? "Cliente registrado correctamente.");

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
          Registro de cliente
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Crear cuenta de cliente
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Este registro es solo para clientes. Los empleados y usuarios internos
          los crea el administrador desde el panel.
        </p>
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
            placeholder="cliente_10"
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
            placeholder="cliente@email.com"
          />
        </div>

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

        <div className="md:col-span-2">
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
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-700/30 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Registrando..." : "Crear cuenta de cliente"}
      </button>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{" "}
        <a
          href="/login"
          className="font-semibold text-blue-700 hover:text-blue-800"
        >
          Inicia sesión
        </a>
      </p>
    </form>
  );
}