import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "../../components/auth/LoginForm";
import { getCurrentUser } from "../../lib/auth/current-user";

const highlights = [
  { value: "8+", label: "Obras activas" },
  { value: "24.8M", label: "Inversión gestionada" },
  { value: "100%", label: "Control seguro" },
];

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/admin");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#071d4b]">
      <Image
        src="/images/login-construccion.jpg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(96deg,rgba(5,27,71,0.98)_0%,rgba(5,36,91,0.93)_43%,rgba(4,34,85,0.68)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(37,117,242,0.35),transparent_28%)]" />

      <section className="relative z-10 mx-auto grid min-h-screen max-w-[1480px] lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="flex flex-col px-5 pb-8 pt-6 text-white sm:px-8 lg:justify-between lg:px-12 lg:py-10">
          <Link href="/" className="flex items-center gap-4" aria-label="Volver al inicio">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0865ec] text-2xl font-extrabold shadow-xl shadow-blue-950/30">
              CI
            </span>
            <span>
              <span className="block text-lg font-extrabold tracking-wide">
                CONSTRUCTORA
              </span>
              <span className="block text-xs font-semibold tracking-[0.34em] text-blue-100">
                INMOBILIARIA
              </span>
            </span>
          </Link>

          <div className="mt-10 max-w-[590px] lg:mt-0">
            <p className="inline-flex rounded-full bg-blue-600/30 px-4 py-2 text-[11px] font-bold tracking-[0.27em] text-blue-100 ring-1 ring-white/10">
              PLATAFORMA INTEGRAL
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Construimos
              <br className="hidden sm:block" /> tu próximo{" "}
              <span className="text-[#55baff]">avance</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm font-medium leading-7 text-blue-100 sm:text-base lg:text-lg">
              Accede a la gestión centralizada de obras, clientes, pagos,
              materiales y reportes de tu constructora.
            </p>
          </div>

          <div className="mt-8 hidden max-w-xl grid-cols-3 gap-3 lg:grid">
            {highlights.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"
              >
                <p className="text-2xl font-extrabold">{item.value}</p>
                <p className="mt-2 text-xs font-semibold text-blue-100">{item.label}</p>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex items-start justify-center px-4 pb-5 sm:px-8 lg:items-center lg:p-10">
          <div className="w-full max-w-[470px]">
            <LoginForm />
            <p className="mt-5 hidden text-center text-xs font-medium text-blue-100 lg:block">
              Acceso protegido para usuarios autorizados.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
