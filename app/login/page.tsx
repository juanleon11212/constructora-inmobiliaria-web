import { redirect } from "next/navigation";
import { LoginForm } from "../../components/auth/LoginForm";
import { getCurrentUser } from "../../lib/auth/current-user";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-10">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div className="text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">
            Constructora e Inmobiliaria
          </p>

          <h2 className="mt-6 text-5xl font-bold leading-tight">
            Gestión completa de proyectos, clientes y obras.
          </h2>

          <p className="mt-6 max-w-xl text-lg text-blue-100">
            Administra clientes, empleados, proyectos, materiales, pagos,
            cotizaciones y reportes desde un solo sistema.
          </p>

          <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-3xl font-bold">26</p>
              <p className="text-sm text-blue-100">tablas</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-3xl font-bold">SQL</p>
              <p className="text-sm text-blue-100">Server</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-3xl font-bold">Roles</p>
              <p className="text-sm text-blue-100">por usuario</p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}