"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/*
  LOGIN

  Funcionalidades:
  - Iniciar sesión.
  - Recordar usuario si el checkbox está marcado.
  - No guardar contraseña.
  - Enlace a recuperar contraseña.
*/

export function LoginForm() {
  const router = useRouter();

  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("remembered_username");

    if (savedUser) {
      setNombreUsuario(savedUser);
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_usuario: nombreUsuario,
          contrasena,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Usuario o contraseña incorrectos.");
        return;
      }

      if (rememberMe) {
        localStorage.setItem("remembered_username", nombreUsuario);
      } else {
        localStorage.removeItem("remembered_username");
      }

      router.push("/admin");
      router.refresh();
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
          Acceso al sistema
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Iniciar sesión
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Ingresa con tu usuario y contraseña.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Usuario
          </label>

          <input
            value={nombreUsuario}
            onChange={(event) => setNombreUsuario(event.target.value)}
            placeholder="admin_demo"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Contraseña
          </label>

          <input
            type="password"
            value={contrasena}
            onChange={(event) => setContrasena(event.target.value)}
            placeholder="123456"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4"
          />
          Recordarme
        </label>

        <Link
          href="/recuperar-contrasena"
          className="text-sm font-semibold text-blue-700 hover:text-blue-800"
        >
          Olvidé mi contraseña
        </Link>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-blue-700">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}