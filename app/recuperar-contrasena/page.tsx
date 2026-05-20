"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

/*
  PÁGINA RECUPERAR CONTRASEÑA

  Permite recuperar contraseña usando:
  - nombre de usuario
  - correo

  Sirve para:
  - usuarios internos
  - clientes
*/

export default function RecuperarContrasenaPage() {
  const [identificador, setIdentificador] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identificador,
          nuevaContrasena,
          confirmarContrasena,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "No se pudo recuperar la contraseña.");
        return;
      }

      setSuccess(data.message ?? "Contraseña actualizada correctamente.");
      setIdentificador("");
      setNuevaContrasena("");
      setConfirmarContrasena("");
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
          Recuperación
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Olvidé mi contraseña
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Escribe tu usuario o correo y crea una nueva contraseña.
        </p>

        <div className="mt-6 space-y-4">
          <input
            value={identificador}
            onChange={(event) => setIdentificador(event.target.value)}
            placeholder="Usuario o correo"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />

          <input
            type="password"
            value={nuevaContrasena}
            onChange={(event) => setNuevaContrasena(event.target.value)}
            placeholder="Nueva contraseña"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />

          <input
            type="password"
            value={confirmarContrasena}
            onChange={(event) => setConfirmarContrasena(event.target.value)}
            placeholder="Confirmar contraseña"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
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
          className="mt-6 w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
        >
          {loading ? "Actualizando..." : "Actualizar contraseña"}
        </button>

        <Link
          href="/login"
          className="mt-5 block text-center text-sm font-semibold text-blue-700"
        >
          Volver al login
        </Link>
      </form>
    </main>
  );
}