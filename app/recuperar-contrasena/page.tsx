"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RecuperarContrasenaPage() {
  const [usuario, setUsuario] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!usuario || !nuevaContrasena || !confirmarContrasena) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (nuevaContrasena.length < 6) {
      setError("La nueva contraseña debe tener mínimo 6 caracteres.");
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/recuperar-contrasena", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario,
          correo: usuario,
          nombre_usuario: usuario,
          nuevaContrasena,
          contrasena: nuevaContrasena,
          password: nuevaContrasena,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.error ||
            data?.message ||
            "No se pudo actualizar la contraseña."
        );
        return;
      }

      setSuccess(
        "Contraseña actualizada correctamente. Ahora puedes iniciar sesión."
      );

      setUsuario("");
      setNuevaContrasena("");
      setConfirmarContrasena("");
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10"
      style={{
        backgroundImage:
          "linear-gradient(120deg, rgba(2,6,23,0.94) 0%, rgba(15,23,42,0.84) 45%, rgba(37,99,235,0.58) 100%), url('/images/login-construccion.jpg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute -left-32 top-16 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />

      <section className="relative grid w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/10 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden bg-gradient-to-br from-blue-950/95 via-slate-950/90 to-blue-800/80 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-200/40 bg-blue-500/20 text-2xl font-black shadow-xl backdrop-blur">
                CI
              </div>

              <div>
                <p className="text-xl font-black">CONSTRUCTORA</p>
                <p className="text-sm font-bold tracking-[0.35em] text-blue-200">
                  SEGURIDAD
                </p>
              </div>
            </div>

            <h1 className="mt-16 text-5xl font-black leading-tight tracking-tight">
              Recupera tu acceso al sistema
            </h1>

            <p className="mt-5 max-w-md text-base font-medium leading-7 text-blue-100">
              Cambia tu contraseña usando tu usuario o correo registrado. Luego
              podrás volver a iniciar sesión normalmente.
            </p>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm font-bold text-blue-100">
              Protección de cuenta
            </p>
            <p className="mt-1 text-2xl font-black">
              Nueva contraseña segura
            </p>
          </div>
        </aside>

        <div className="bg-white/95 p-7 shadow-2xl sm:p-10 lg:p-12">
          <div className="mx-auto max-w-xl">
            <div className="mb-8">
              <div className="inline-flex rounded-2xl bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.32em] text-blue-700">
                Recuperación
              </div>

              <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-950">
                Cambiar contraseña
              </h2>

              <p className="mt-2 text-base font-medium leading-7 text-slate-500">
                Ingresa tu usuario o correo y define una nueva contraseña.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                value={usuario}
                onChange={setUsuario}
                placeholder="Usuario o correo"
                icon="👤"
              />

              <Input
                type="password"
                value={nuevaContrasena}
                onChange={setNuevaContrasena}
                placeholder="Nueva contraseña"
                icon="🔒"
              />

              <Input
                type="password"
                value={confirmarContrasena}
                onChange={setConfirmarContrasena}
                placeholder="Confirmar contraseña"
                icon="✅"
              />

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-800 to-sky-600 px-6 py-4 text-base font-black text-white shadow-xl shadow-blue-700/25 transition hover:from-blue-950 hover:to-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Actualizando..." : "Actualizar contraseña"}
              </button>

              <div className="rounded-2xl bg-slate-50 px-5 py-4 text-center">
                <p className="text-sm font-medium text-slate-500">
                  ¿Recordaste tu contraseña?{" "}
                  <Link
                    href="/login"
                    className="font-black text-blue-700 hover:text-blue-900"
                  >
                    Volver al login
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: string;
  type?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 pl-12 text-base font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}