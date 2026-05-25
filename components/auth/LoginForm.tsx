"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [recordarme, setRecordarme] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const usuarioGuardado = window.localStorage.getItem("remember_user");

      if (usuarioGuardado) {
        setUsuario(usuarioGuardado);
        setRecordarme(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        setError(data?.error || data?.message || "Usuario o contraseña incorrectos.");
        return;
      }

      if (recordarme) {
        window.localStorage.setItem("remember_user", usuario);
      } else {
        window.localStorage.removeItem("remember_user");
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
    <div className="rounded-[1.75rem] border border-white/80 bg-white/95 p-5 shadow-2xl shadow-blue-950/15 backdrop-blur-xl sm:p-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition hover:text-blue-950 lg:hidden"
      >
        <ArrowLeftIcon />
        Volver al inicio
      </Link>

      <div className="mb-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.26em] text-blue-600">
          Acceso seguro
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#081d4d] sm:text-4xl">
          Iniciar sesión
        </h2>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
          Administra proyectos, pagos y avances desde una sola plataforma.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-[#112d62]">
            Usuario o correo
          </span>
          <span className="relative block">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
              <UserOutlineIcon />
            </span>
            <input
              type="text"
              autoComplete="username"
              required
              value={usuario}
              onChange={(event) => setUsuario(event.target.value)}
              placeholder="Ingresa tu usuario"
              className="w-full rounded-xl border border-blue-100 bg-[#f7faff] py-4 pl-12 pr-4 text-base font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-[#112d62]">
            Contraseña
          </span>
          <span className="relative block">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
              <LockIcon />
            </span>
            <input
              type={mostrarContrasena ? "text" : "password"}
              autoComplete="current-password"
              required
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
              placeholder="Ingresa tu contraseña"
              className="w-full rounded-xl border border-blue-100 bg-[#f7faff] py-4 pl-12 pr-14 text-base font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => setMostrarContrasena((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-700"
              aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {mostrarContrasena ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </span>
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={recordarme}
              onChange={(event) => setRecordarme(event.target.checked)}
              className="h-5 w-5 rounded border-blue-200 accent-blue-700"
            />
            Recordarme
          </label>
          <Link
            href="/recuperar-contrasena"
            className="text-sm font-bold text-blue-700 transition hover:text-blue-950"
          >
            Olvidé mi contraseña
          </Link>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#0865ec] px-6 py-4 text-base font-extrabold text-white shadow-xl shadow-blue-700/25 transition hover:bg-[#064db8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Ingresar al sistema"}
          {!loading && <ArrowRightIcon />}
        </button>
      </form>

      <p className="mt-7 border-t border-blue-50 pt-6 text-center text-sm font-medium text-slate-500">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-extrabold text-blue-700 hover:text-blue-950">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}

function UserOutlineIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" d="M5 20c.6-4 3-6 7-6s6.4 2 7 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path strokeLinecap="round" d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M3 3 21 21" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6.2A10.4 10.4 0 0 1 12 6c6.1 0 9.5 6 9.5 6a16 16 0 0 1-3.3 3.8M6.2 7.5A16.3 16.3 0 0 0 2.5 12s3.4 6 9.5 6c.7 0 1.4-.1 2-.2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m6-6-6 6 6 6" />
    </svg>
  );
}

export { LoginForm };
export default LoginForm;
