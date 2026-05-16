"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
          identifier,
          password,
          remember,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "No se pudo iniciar sesión.");
        return;
      }

      router.push(data.redirectTo ?? "/admin");
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
      className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-300/60"
    >
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-4xl font-black text-amber-400">
          CI
        </div>

        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Bienvenido
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Inicia sesión para continuar
        </p>
      </div>

      <div className="mt-8 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Correo electrónico / Usuario
          </label>

          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Ingresa tu correo o usuario"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Contraseña
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Ingresa tu contraseña"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Recordarme
          </label>

          <button
            type="button"
            className="font-semibold text-blue-700 hover:text-blue-800"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-700/30 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">o continúa con</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          type="button"
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Google
        </button>

        <button
          type="button"
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Microsoft
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        ¿No tienes cuenta?{" "}
        <a
          href="/registro"
          className="font-semibold text-blue-700 hover:text-blue-800"
        >
          Regístrate aquí
        </a>
      </p>
    </form>
  );
}