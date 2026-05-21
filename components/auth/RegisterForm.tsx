"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    const nombre_usuario = String(formData.get("nombre_usuario") ?? "").trim();
    const contrasena = String(formData.get("contrasena") ?? "").trim();
    const confirmar_contrasena = String(
      formData.get("confirmar_contrasena") ?? ""
    ).trim();
    const correo = String(formData.get("correo") ?? "").trim();
    const nombres = String(formData.get("nombres") ?? "").trim();
    const apellidos = String(formData.get("apellidos") ?? "").trim();
    const razon_social = String(formData.get("razon_social") ?? "").trim();
    const ci_nit = String(formData.get("ci_nit") ?? "").trim();
    const telefono = String(formData.get("telefono") ?? "").trim();
    const direccion = String(formData.get("direccion") ?? "").trim();

    if (!nombre_usuario || !contrasena || !correo || !ci_nit) {
      setError("Usuario, contraseña, correo y CI/NIT son obligatorios.");
      setLoading(false);
      return;
    }

    if (!correo.includes("@") || !correo.includes(".")) {
      setError("Ingresa un correo válido.");
      setLoading(false);
      return;
    }

    if (contrasena.length < 6) {
      setError("La contraseña debe tener mínimo 6 caracteres.");
      setLoading(false);
      return;
    }

    if (contrasena !== confirmar_contrasena) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_usuario,
          usuario: nombre_usuario,
          contrasena,
          password: contrasena,
          correo,
          nombres,
          apellidos,
          razon_social,
          ci_nit,
          telefono,
          direccion,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || data?.message || "No se pudo crear la cuenta.");
        return;
      }

      router.push("/login");
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/10 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="hidden bg-gradient-to-br from-blue-950/95 via-slate-950/90 to-blue-800/80 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-200/40 bg-blue-500/20 text-2xl font-black shadow-xl backdrop-blur">
              CI
            </div>

            <div>
              <p className="text-xl font-black">CONSTRUCTORA</p>
              <p className="text-sm font-bold tracking-[0.35em] text-blue-200">
                INMOBILIARIA
              </p>
            </div>
          </div>

          <h1 className="mt-16 text-5xl font-black leading-tight tracking-tight">
            Crea tu cuenta y entra al sistema
          </h1>

          <p className="mt-5 max-w-md text-base font-medium leading-7 text-blue-100">
            Registra tus datos como cliente para consultar proyectos, pagos y
            avances relacionados con tu cuenta.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm font-bold text-blue-100">
              Acceso para clientes
            </p>
            <p className="mt-1 text-2xl font-black">Registro seguro</p>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm font-bold text-blue-100">
              Gestión empresarial
            </p>
            <p className="mt-1 text-2xl font-black">
              Proyectos, pagos y reportes
            </p>
          </div>
        </div>
      </aside>

      <div className="bg-white/95 p-6 shadow-2xl sm:p-10 lg:p-12">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="inline-flex rounded-2xl bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.32em] text-blue-700">
              Registro
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-950">
              Crear cuenta
            </h2>

            <p className="mt-2 max-w-2xl text-base font-medium leading-7 text-slate-500">
              Completa tus datos. Los campos obligatorios están marcados con
              asterisco.
            </p>
          </div>

          <Link
            href="/login"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
          >
            Volver al login
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <Input
            label="Usuario *"
            name="nombre_usuario"
            placeholder="cliente_01"
            icon="👤"
          />

          <Input
            label="Correo *"
            name="correo"
            placeholder="cliente@email.com"
            icon="✉️"
          />

          <Input
            label="Contraseña *"
            name="contrasena"
            type="password"
            placeholder="Mínimo 6 caracteres"
            icon="🔒"
          />

          <Input
            label="Confirmar contraseña *"
            name="confirmar_contrasena"
            type="password"
            placeholder="Repite tu contraseña"
            icon="✅"
          />

          <Input label="Nombres" name="nombres" placeholder="Pedro" icon="👤" />

          <Input
            label="Apellidos"
            name="apellidos"
            placeholder="Mamani"
            icon="👥"
          />

          <Input
            label="Razón social"
            name="razon_social"
            placeholder="Opcional si es empresa"
            icon="🏢"
            className="md:col-span-2"
          />

          <Input label="CI/NIT *" name="ci_nit" placeholder="1234567" icon="💳" />

          <Input
            label="Teléfono"
            name="telefono"
            placeholder="70000000"
            icon="📞"
          />

          <Input
            label="Dirección"
            name="direccion"
            placeholder="Zona Norte, Av. Principal"
            icon="📍"
            className="md:col-span-2"
          />

          {error && (
            <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-slate-50 p-5">
            <div>
              <p className="text-sm font-black text-slate-900">¿Todo listo?</p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Al crear tu cuenta podrás iniciar sesión con tu usuario.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-gradient-to-r from-blue-800 to-sky-600 px-8 py-4 text-base font-black text-white shadow-xl shadow-blue-700/25 transition hover:from-blue-950 hover:to-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  placeholder,
  icon,
  type = "text",
  className = "",
}: {
  label: string;
  name: string;
  placeholder: string;
  icon: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-extrabold text-slate-700">
        {label}
      </span>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>

        <input
          type={type}
          name={name}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 pl-12 text-base font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </div>
    </label>
  );
}

export default RegisterForm;