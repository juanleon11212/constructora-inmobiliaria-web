import { redirect } from "next/navigation";
import { LoginForm } from "../../components/auth/LoginForm";
import { getCurrentUser } from "../../lib/auth/current-user";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="grid min-h-screen lg:grid-cols-[1.25fr_0.75fr]">
        <div className="relative hidden overflow-hidden lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/login-construccion.jpg')",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-950/20" />

          <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/40 bg-white/10 text-2xl font-bold backdrop-blur">
                  CI
                </div>

                <div>
                  <p className="text-lg font-bold leading-5">
                    CONSTRUCTORA
                  </p>
                  <p className="text-lg font-bold leading-5">
                    INMOBILIARIA
                  </p>
                </div>
              </div>

              <h1 className="mt-24 max-w-xl text-6xl font-extrabold leading-tight">
                Construyendo el futuro{" "}
                <span className="text-amber-400">juntos</span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-200">
                Sistema integrado para la gestión de proyectos, clientes,
                materiales, pagos y más.
              </p>
            </div>

            <div className="grid max-w-2xl grid-cols-3 gap-5">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-lg font-bold">Proyectos</p>
                <p className="mt-1 text-sm text-slate-300">
                  Gestión total
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-lg font-bold">Usuarios</p>
                <p className="mt-1 text-sm text-slate-300">
                  Roles y permisos
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-lg font-bold">Reportes</p>
                <p className="mt-1 text-sm text-slate-300">
                  Datos en tiempo real
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-white px-6 py-10">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}