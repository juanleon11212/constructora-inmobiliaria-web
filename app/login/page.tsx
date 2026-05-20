import { redirect } from "next/navigation";
import { LoginForm } from "../../components/auth/LoginForm";
import { getCurrentUser } from "../../lib/auth/current-user";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-100">
      <section className="grid min-h-screen lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative hidden overflow-hidden lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
            style={{
              backgroundImage: "url('/images/login-construccion.jpg.png')",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-900/80 to-sky-700/30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),_transparent_35%)]" />

          <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
            <div>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-200/50 bg-blue-500/20 text-2xl font-black text-white shadow-lg shadow-blue-950/30 backdrop-blur">
                  CI
                </div>

                <div>
                  <p className="text-xl font-black leading-5 tracking-wide text-white">
                    CONSTRUCTORA
                  </p>
                  <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-blue-100">
                    INMOBILIARIA
                  </p>
                </div>
              </div>

              <h1 className="mt-24 max-w-2xl text-6xl font-extrabold leading-tight tracking-tight text-white">
                Construyendo el futuro{" "}
                <span className="bg-gradient-to-r from-sky-300 to-blue-100 bg-clip-text text-transparent">
                  juntos
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-blue-100">
                Sistema integrado para la gestión de proyectos, clientes,
                materiales, pagos y administración de obras.
              </p>
            </div>

            <div className="grid max-w-3xl grid-cols-3 gap-5">
              <div className="rounded-2xl border border-blue-200/25 bg-white/10 p-5 shadow-lg shadow-blue-950/20 backdrop-blur">
                <p className="text-lg font-bold text-white">Proyectos</p>
                <p className="mt-1 text-sm text-blue-100">Gestión total</p>
              </div>

              <div className="rounded-2xl border border-blue-200/25 bg-white/10 p-5 shadow-lg shadow-blue-950/20 backdrop-blur">
                <p className="text-lg font-bold text-white">Usuarios</p>
                <p className="mt-1 text-sm text-blue-100">Roles y permisos</p>
              </div>

              <div className="rounded-2xl border border-blue-200/25 bg-white/10 p-5 shadow-lg shadow-blue-950/20 backdrop-blur">
                <p className="text-lg font-bold text-white">Reportes</p>
                <p className="mt-1 text-sm text-blue-100">Datos en tiempo real</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-sky-100 px-6 py-10">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}