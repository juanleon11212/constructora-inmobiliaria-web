"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function LoginForm() {
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [recordarme, setRecordarme] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("remember_user");

    if (usuarioGuardado) {
      setUsuario(usuarioGuardado);
      setRecordarme(true);
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
          usuario,
          nombre_usuario: usuario,
          correo: usuario,
          contrasena,
          password: contrasena,
          recordarme,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.error ||
            data?.message ||
            "Usuario o contraseña incorrectos."
        );
        return;
      }

      if (recordarme) {
        localStorage.setItem("remember_user", usuario);
      } else {
        localStorage.removeItem("remember_user");
      }

      router.refresh();
      router.push(data?.redirectTo || "/admin");
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/95 p-7 shadow-2xl shadow-blue-950/10 backdrop-blur-xl">
      <div className="mb-7 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-800 to-sky-600 text-2xl font-black text-white shadow-xl shadow-blue-800/25">
          CI
        </div>

        <p className="mt-5 text-sm font-black uppercase tracking-[0.28em] text-blue-700">
          Acceso al sistema
        </p>

        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
          Iniciar sesión
        </h2>

        <p className="mt-2 text-sm font-medium text-slate-500">
          Ingresa con tu usuario y contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-extrabold text-slate-700">
            Usuario
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              👤
            </span>

            <input
              value={usuario}
              onChange={(event) => setUsuario(event.target.value)}
              placeholder="admin"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 pl-12 text-base font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-extrabold text-slate-700">
            Contraseña
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔒
            </span>

            <input
              type="password"
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
              placeholder="123456"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 pl-12 text-base font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-slate-600">
            <input
              type="checkbox"
              checked={recordarme}
              onChange={(event) => setRecordarme(event.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-blue-700 accent-blue-700"
            />
            Recordarme
          </label>

          <Link
            href="/recuperar-contrasena"
            className="text-sm font-extrabold text-blue-700 transition hover:text-blue-900"
          >
            Olvidé mi contraseña
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-4 text-base font-black text-white shadow-xl shadow-blue-700/25 transition hover:from-blue-950 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <div className="mt-7 rounded-2xl bg-slate-50 px-5 py-4 text-center">
        <p className="text-sm font-medium text-slate-500">
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-black text-blue-700 hover:text-blue-900"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}

export { LoginForm };
export default LoginForm;