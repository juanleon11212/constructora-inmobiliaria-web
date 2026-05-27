"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Project = {
  name: string;
  category: string;
  status: string;
  detail: string;
  image: string;
  location: string;
  progress: number;
  delivery: string;
  summary: string;
  features: string[];
};

const projects: Project[] = [
  {
    name: "Torre Horizonte",
    category: "Oficinas",
    status: "En construcción",
    detail: "Oficinas corporativas · 12,450 m²",
    image: "/images/portfolio-comercial-cover.webp",
    location: "Zona Empresarial Norte",
    progress: 62,
    delivery: "Diciembre 2026",
    summary:
      "Complejo corporativo con espacios flexibles, accesos controlados y áreas comerciales en planta baja.",
    features: ["12 niveles de oficinas", "Parqueos cubiertos", "Control de avance"],
  },
  {
    name: "Residencial Alborada",
    category: "Vivienda",
    status: "En planificación",
    detail: "Residencias premium · 26 unidades",
    image: "/images/portfolio-vivienda-cover.webp",
    location: "Zona Norte",
    progress: 18,
    delivery: "Junio 2027",
    summary:
      "Viviendas familiares contemporáneas con iluminación natural, jardines y planificación eficiente.",
    features: ["26 viviendas", "Áreas verdes", "Diseño familiar"],
  },
  {
    name: "Centro Empresarial",
    category: "Comercial",
    status: "En construcción",
    detail: "Complejo empresarial · 8,300 m²",
    image: "/images/portfolio-comercial-cover.webp",
    location: "Centro de la ciudad",
    progress: 47,
    delivery: "Marzo 2027",
    summary:
      "Edificio comercial pensado para oficinas y servicios, con circulación cómoda y fachada moderna.",
    features: ["Locales comerciales", "Oficinas modulares", "Acceso vehicular"],
  },
  {
    name: "Condominio Vista Azul",
    category: "Vivienda",
    status: "Finalizado",
    detail: "Condominio familiar · 42 viviendas",
    image: "/images/portfolio-vivienda-cover.webp",
    location: "Distrito Jardín",
    progress: 100,
    delivery: "Entregado",
    summary:
      "Condominio entregado para familias, con viviendas amplias, calles internas y espacios recreativos.",
    features: ["42 viviendas", "Obra entregada", "Espacios recreativos"],
  },
  {
    name: "Plaza Comercial del Sol",
    category: "Comercial",
    status: "En construcción",
    detail: "Centro de servicios · 5,100 m²",
    image: "/images/portfolio-comercial-cover.webp",
    location: "Avenida Central",
    progress: 35,
    delivery: "Septiembre 2027",
    summary:
      "Plaza de servicios con locales abiertos al público, terrazas y circulación peatonal accesible.",
    features: ["Locales y terrazas", "Acceso universal", "5,100 m²"],
  },
];

const capabilities = [
  {
    title: "Gestión centralizada",
    text: "Toda la información de tus proyectos en un solo lugar.",
    icon: NetworkIcon,
  },
  {
    title: "Control en tiempo real",
    text: "Monitorea avances, costos y recursos al instante.",
    icon: ClockIcon,
  },
  {
    title: "Colaboración efectiva",
    text: "Equipos conectados, comunicación fluida y tareas alineadas.",
    icon: TeamIcon,
  },
  {
    title: "Seguridad y respaldo",
    text: "Tus datos protegidos con los más altos estándares.",
    icon: ShieldIcon,
  },
];

const demoScenes = [
  {
    year: "2012",
    title: "Nacimos con una idea clara",
    text: "Construir espacios sólidos, humanos y pensados para el futuro de cada familia y empresa.",
    image: "/images/login-construccion.jpg.png",
  },
  {
    year: "2016",
    title: "Los primeros grandes proyectos",
    text: "Sumamos profesionales, tecnología y planificación para entregar obras con calidad comprobable.",
    image: "/images/portfolio-vivienda-cover.webp",
  },
  {
    year: "2021",
    title: "Crecimos junto a nuestros clientes",
    text: "Viviendas y edificios corporativos nos impulsaron a gestionar cada avance con transparencia.",
    image: "/images/portfolio-comercial-cover.webp",
  },
  {
    year: "HOY",
    title: "Construyendo el futuro juntos",
    text: "Una plataforma integral conecta proyectos, pagos, materiales y reportes en tiempo real.",
    image: "/images/portfolio-proyectos-background.webp",
  },
];

export default function LandingPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselCycle, setCarouselCycle] = useState(0);
  const [profileProject, setProfileProject] = useState<Project | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoScene, setDemoScene] = useState(0);
  const [demoPlaying, setDemoPlaying] = useState(true);
  const activeProject = projects[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % projects.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [carouselCycle]);

  useEffect(() => {
    if (!demoOpen || !demoPlaying) {
      return;
    }

    const timer = window.setInterval(() => {
      setDemoScene((current) => (current + 1) % demoScenes.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [demoOpen, demoPlaying]);

  function selectPreviousProject() {
    setActiveIndex((current) => (current - 1 + projects.length) % projects.length);
    setCarouselCycle((current) => current + 1);
  }

  function selectNextProject() {
    setActiveIndex((current) => (current + 1) % projects.length);
    setCarouselCycle((current) => current + 1);
  }

  function selectProject(index: number) {
    setActiveIndex(index);
    setCarouselCycle((current) => current + 1);
  }

  function openDemo() {
    setDemoScene(0);
    setDemoPlaying(true);
    setDemoOpen(true);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#eef4fc] text-[#09245b]">
      <section className="relative isolate overflow-hidden pb-28 text-white lg:pb-32">
        <Image
          src="/images/portfolio-proyectos-background.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,33,89,0.98)_0%,rgba(6,42,101,0.93)_32%,rgba(6,43,105,0.67)_59%,rgba(6,35,86,0.36)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-44 bg-gradient-to-t from-[#eaf2fc] via-[#eaf2fc]/60 to-transparent" />

        <header className="mx-auto flex max-w-[1480px] items-center justify-between gap-5 px-4 py-5 sm:px-8 sm:py-7 lg:px-12">
          <Link href="/" className="flex items-center gap-3 sm:gap-4" aria-label="Constructora Inmobiliaria">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0561ed] text-xl font-extrabold shadow-xl shadow-blue-950/20 sm:h-14 sm:w-14 sm:text-2xl">
              CI
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-wide sm:text-lg">CONSTRUCTORA</span>
              <span className="block text-[10px] font-semibold tracking-[0.26em] text-blue-100 sm:text-xs sm:tracking-[0.34em]">
                INMOBILIARIA
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1.5 backdrop-blur lg:flex">
              <a href="#proyectos" className="rounded-full px-5 py-3 text-sm font-bold text-blue-50 transition hover:bg-white/15">
                Proyectos
              </a>
              <a href="#perfil-proyectos" className="rounded-full px-5 py-3 text-sm font-bold text-blue-50 transition hover:bg-white/15">
                Fichas públicas
              </a>
              <a href="#servicios" className="rounded-full px-5 py-3 text-sm font-bold text-blue-50 transition hover:bg-white/15">
                Servicios
              </a>
            </nav>

            <Link
              href="/login"
              aria-label="Iniciar sesión"
              className="inline-flex items-center gap-2 rounded-full bg-[#063da9] px-4 py-3 text-sm font-bold shadow-xl shadow-blue-950/20 transition hover:bg-[#0759df] sm:gap-3 sm:px-7 sm:py-4"
            >
              <UserIcon />
              <span className="hidden sm:inline">Iniciar sesión</span>
              <ArrowRightIcon />
            </Link>
          </div>
        </header>

        <nav className="mx-4 flex gap-2 overflow-x-auto rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur sm:mx-8 lg:hidden">
          <a href="#proyectos" className="whitespace-nowrap rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-blue-50">
            Proyectos
          </a>
          <a href="#perfil-proyectos" className="whitespace-nowrap rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-blue-50">
            Perfiles públicos
          </a>
          <a href="#servicios" className="whitespace-nowrap rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-blue-50">
            Servicios
          </a>
        </nav>

        <div className="mx-auto grid max-w-[1480px] items-center gap-8 px-4 pb-8 pt-5 sm:px-8 sm:pt-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:px-12 lg:pb-12 lg:pt-6">
          <div className="max-w-xl">
            <p className="inline-flex rounded-full bg-blue-600/30 px-5 py-3 text-[11px] font-bold tracking-[0.27em] text-blue-100 ring-1 ring-white/10">
              PLATAFORMA INTEGRAL
            </p>
            <h1 className="mt-5 text-[2.65rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl xl:text-[4.4rem]">
              Construyendo
              <br />
              el <span className="text-[#54b7ff]">futuro</span> juntos
            </h1>
            <p className="mt-5 max-w-lg text-base font-medium leading-7 text-blue-50 sm:text-lg">
              Sistema integrado para la gestión de proyectos, clientes,
              materiales, pagos y administración de obras.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#perfil-proyectos"
                className="inline-flex items-center gap-4 rounded-xl bg-[#0868f7] px-6 py-4 text-sm font-bold shadow-xl shadow-blue-950/20 transition hover:bg-blue-500"
              >
                Ver proyectos públicos
                <ArrowRightIcon />
              </a>
              <button
                type="button"
                onClick={openDemo}
                className="inline-flex items-center gap-3 rounded-xl border border-blue-200/60 bg-blue-950/25 px-6 py-4 text-sm font-bold transition hover:bg-white/10"
              >
                <PlayIcon />
                Conocer la empresa
              </button>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={selectPreviousProject}
              aria-label="Proyecto anterior"
              className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-blue-700 shadow-lg transition hover:scale-105 sm:h-12 sm:w-12 lg:left-0 lg:-translate-x-1/2"
            >
              <ChevronLeftIcon />
            </button>

            <article className="relative h-[330px] overflow-hidden rounded-[22px] border border-blue-100/70 shadow-2xl shadow-blue-950/30 sm:h-[390px] sm:rounded-[26px]">
              <Image
                key={activeProject.image}
                src={activeProject.image}
                alt={activeProject.name}
                fill
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="object-cover transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#061b49]/95 via-transparent to-transparent" />
              <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#096cf7]/90 px-3 py-2 text-xs font-bold sm:left-5 sm:top-5 sm:px-4 sm:text-sm">
                <StarIcon />
                Proyecto destacado
              </span>
              <div className="absolute inset-x-0 bottom-0 flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-end sm:gap-4 sm:p-6">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{activeProject.name}</h2>
                  <p className="mt-1 text-sm font-medium text-blue-50 sm:text-base">{activeProject.detail}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileProject(activeProject)}
                  className="inline-flex shrink-0 items-center justify-center gap-4 rounded-xl border border-blue-300/40 bg-blue-950/55 px-6 py-3 text-sm font-bold backdrop-blur transition hover:bg-blue-800"
                >
                  Ver ficha pública
                  <ArrowRightIcon />
                </button>
              </div>
            </article>

            <button
              type="button"
              onClick={selectNextProject}
              aria-label="Proyecto siguiente"
              className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-blue-700 shadow-lg transition hover:scale-105 sm:h-12 sm:w-12 lg:right-0 lg:translate-x-1/2"
            >
              <ChevronRightIcon />
            </button>

            <div className="mt-4 flex items-center justify-center gap-3">
              {projects.map((project, index) => (
                <button
                  key={project.name}
                  type="button"
                  onClick={() => selectProject(index)}
                  aria-label={`Mostrar ${project.name}`}
                  aria-current={index === activeIndex}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeIndex ? "w-8 bg-blue-400" : "w-4 bg-white/65"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="proyectos" className="relative z-10 mx-auto -mt-20 max-w-[1480px] px-4 sm:-mt-24 sm:px-8 lg:px-12">
        <div className="rounded-[22px] border border-blue-100 bg-white/90 px-5 py-5 shadow-xl shadow-blue-100/70 backdrop-blur sm:px-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-3 text-xs font-extrabold uppercase text-[#082b72]">
              <BuildingIcon />
              Proyectos destacados
            </p>
            <a href="#perfil-proyectos" className="flex items-center gap-2 text-xs font-bold text-blue-700">
              Ver fichas públicas
              <ChevronRightIcon />
            </a>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-visible">
            {projects.map((project, index) => (
              <button
                key={project.name}
                type="button"
                onClick={() => selectProject(index)}
                className="min-w-[215px] flex-1 text-left lg:min-w-0"
              >
                <span className={`relative block h-24 overflow-hidden rounded-xl ring-offset-2 transition ${index === activeIndex ? "ring-2 ring-blue-500" : ""}`}>
                  <Image
                    src={project.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 18vw, 230px"
                    className="object-cover"
                  />
                </span>
                <span className="mt-2 block text-sm font-bold text-blue-900">{project.name}</span>
                <span className="block text-xs font-medium text-slate-500">
                  {project.category} · {project.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        <section id="perfil-proyectos" className="mt-5 rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/70 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.26em] text-blue-700">
                Consulta abierta
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-blue-950">
                Conoce nuestros proyectos sin iniciar sesión
              </h2>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600 sm:text-base">
                Revisa ubicación, etapa, avance y características principales.
                El acceso privado se utiliza únicamente para administrar la obra.
              </p>
            </div>
            <Link
              href="/registro"
              className="inline-flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-extrabold text-blue-800 transition hover:bg-blue-100"
            >
              Crear cuenta de cliente
              <ArrowRightIcon />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {projects.slice(0, 3).map((project) => (
              <article
                key={project.name}
                className="group overflow-hidden rounded-[1.7rem] border border-blue-100 bg-white shadow-lg shadow-blue-100/70 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.name}
                    fill
                    sizes="(min-width: 1280px) 30vw, (min-width: 768px) 46vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/85 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold text-blue-800">
                    {project.status}
                  </span>
                  <p className="absolute bottom-4 left-4 text-lg font-extrabold text-white">
                    {project.name}
                  </p>
                </div>
                <div className="p-5">
                  <div className="flex justify-between gap-3 text-xs font-bold text-slate-500">
                    <span>{project.category}</span>
                    <span>{project.progress}% avance</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm font-medium leading-6 text-slate-600">
                    {project.summary}
                  </p>
                  <button
                    type="button"
                    onClick={() => setProfileProject(project)}
                    className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-blue-700 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-blue-950"
                  >
                    Ver perfil del proyecto
                    <ArrowRightIcon />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div id="servicios" className="mt-5 grid scroll-mt-6 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1.06fr]">
          <MetricCard
            icon={<TrendIcon />}
            title="Obras en ejecución"
            value="8"
            caption="Proyectos activos"
            footer="↓ +2 vs. mes anterior"
          />
          <MetricCard
            icon={<MoneyIcon />}
            title="Inversión total"
            value="$ 24.8M"
            caption="Presupuesto en curso"
            footer="↓ +12% vs. mes anterior"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-[8px] border-blue-600 border-l-blue-100 text-xs font-extrabold text-blue-900">
              72%
            </div>
          </MetricCard>
          <MetricCard
            icon={<CardIcon />}
            title="Pagos pendientes"
            value="$ 2.4M"
            caption="Por cobrar"
            footer="5 facturas pendientes"
          />
          <MetricCard
            icon={<ChartIcon />}
            title="Reportes"
            value="16"
            caption="Reportes generados"
            footer="Este mes"
          />
          <aside className="flex min-h-[190px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#0846b6] to-[#062c80] p-6 text-white shadow-lg sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:min-h-[210px]">
            <div>
              <h2 className="text-xl font-extrabold leading-tight">Planifica. Controla.<br />Construye.</h2>
              <p className="mt-3 text-sm leading-6 text-blue-100">
                Todo lo que necesitas para gestionar tus proyectos con eficiencia y transparencia.
              </p>
            </div>
            <a href="#perfil-proyectos" className="flex items-center gap-3 text-sm font-bold">
              Explorar proyectos
              <ArrowRightIcon />
            </a>
          </aside>
        </div>

        <div className="mt-3 mb-7 grid gap-3 rounded-2xl border border-blue-100 bg-white/80 p-4 shadow-lg shadow-blue-100/60 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map(({ title, text, icon: Icon }) => (
            <div key={title} className="flex gap-4 p-2">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Icon />
              </span>
              <div>
                <h2 className="text-sm font-bold text-blue-950">{title}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {profileProject && (
        <PublicProjectProfile
          project={profileProject}
          onClose={() => setProfileProject(null)}
        />
      )}

      {demoOpen && (
        <DemoStory
          scene={demoScene}
          playing={demoPlaying}
          onClose={() => setDemoOpen(false)}
          onTogglePlaying={() => setDemoPlaying((current) => !current)}
          onSelectScene={setDemoScene}
        />
      )}
    </main>
  );
}

function PublicProjectProfile({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#03102d]/90 p-3 backdrop-blur-md sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Perfil público de ${project.name}`}
    >
      <article className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-[1.02fr_0.98fr]">
        <div className="relative min-h-[290px] bg-blue-950 lg:min-h-[630px]">
          <Image
            src={project.image}
            alt={project.name}
            fill
            sizes="(min-width: 1024px) 500px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/95 via-blue-950/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
            <span className="rounded-full bg-sky-500/90 px-4 py-2 text-xs font-extrabold">
              {project.status}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight">
              {project.name}
            </h2>
            <p className="mt-2 text-sm font-semibold text-blue-100">
              {project.category} · {project.detail}
            </p>
          </div>
        </div>

        <div className="flex flex-col p-6 text-blue-950 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar perfil del proyecto"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl font-bold text-blue-950 shadow-lg transition hover:bg-blue-50"
          >
            ×
          </button>

          <p className="text-xs font-extrabold uppercase tracking-[0.26em] text-blue-700">
            Perfil público
          </p>
          <h3 className="mt-3 text-2xl font-extrabold">
            Información del proyecto
          </h3>
          <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
            {project.summary}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <PublicDataCard label="Ubicación" value={project.location} />
            <PublicDataCard label="Entrega estimada" value={project.delivery} />
          </div>

          <div className="mt-5 rounded-2xl bg-blue-950 p-5 text-white">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  Avance general
                </p>
                <p className="mt-2 text-4xl font-extrabold">{project.progress}%</p>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-2 text-xs font-bold">
                {project.status}
              </span>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.22em] text-blue-700">
            Características
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.features.map((feature) => (
              <span
                key={feature}
                className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800"
              >
                {feature}
              </span>
            ))}
          </div>

          <div className="mt-auto flex flex-wrap gap-3 pt-8">
            <Link
              href="/registro"
              className="flex-1 rounded-xl bg-blue-700 px-5 py-3 text-center text-sm font-extrabold text-white transition hover:bg-blue-950"
            >
              Registrarme como cliente
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 text-center text-sm font-extrabold text-blue-900 transition hover:bg-blue-100"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

function PublicDataCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-700">
        {label}
      </p>
      <p className="mt-2 text-sm font-extrabold text-blue-950">{value}</p>
    </div>
  );
}

function DemoStory({
  scene,
  playing,
  onClose,
  onTogglePlaying,
  onSelectScene,
}: {
  scene: number;
  playing: boolean;
  onClose: () => void;
  onTogglePlaying: () => void;
  onSelectScene: (index: number) => void;
}) {
  const activeScene = demoScenes[scene];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#03102d]/90 p-3 backdrop-blur-md sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Historia de Constructora Inmobiliaria"
    >
      <article className="relative w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#071d4b] shadow-2xl">
        <div className="relative aspect-[9/13] max-h-[78vh] min-h-[470px] sm:aspect-video sm:min-h-0">
          <Image
            key={activeScene.image}
            src={activeScene.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 960px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#041536] via-[#051b48]/40 to-[#041536]/35" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar video"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl text-white backdrop-blur transition hover:bg-white/25"
          >
            ×
          </button>

          <div className="absolute left-5 top-5 rounded-full bg-blue-600/80 px-4 py-2 text-xs font-bold tracking-[0.24em] text-white">
            NUESTRA HISTORIA
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-10">
            <p className="text-sm font-extrabold tracking-[0.28em] text-[#59baff]">
              {activeScene.year}
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
              {activeScene.title}
            </h2>
            <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-blue-50 sm:text-base">
              {activeScene.text}
            </p>

            <div className="mt-7 flex items-center gap-4">
              <button
                type="button"
                onClick={onTogglePlaying}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0868f7] text-white shadow-lg"
                aria-label={playing ? "Pausar historia" : "Reproducir historia"}
              >
                {playing ? <PauseIcon /> : <PlayIcon />}
              </button>
              <div className="flex flex-1 gap-2">
                {demoScenes.map((item, index) => (
                  <button
                    key={item.year}
                    type="button"
                    aria-label={`Ir a escena ${item.year}`}
                    onClick={() => onSelectScene(index)}
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/30"
                  >
                    <span
                      className={`block h-full bg-blue-400 transition-all ${
                        index <= scene ? "w-full" : "w-0"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  caption,
  footer,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  caption: string;
  footer: string;
  children?: React.ReactNode;
}) {
  return (
    <article className="flex min-h-[132px] justify-between gap-3 rounded-2xl border border-blue-100 bg-white/85 p-5 shadow-lg shadow-blue-100/60">
      <div>
        <p className="flex items-center gap-3 text-sm font-bold text-blue-950">
          <span className="text-blue-600">{icon}</span>
          {title}
        </p>
        <p className="mt-3 text-2xl font-extrabold text-blue-950">{value}</p>
        <p className="text-xs font-medium text-slate-500">{caption}</p>
        <p className="mt-3 text-[11px] font-semibold text-blue-700">{footer}</p>
      </div>
      {children}
    </article>
  );
}

type IconProps = { className?: string };

function ArrowRightIcon({ className = "h-4 w-4" }: IconProps) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" /></svg>;
}

function ChevronLeftIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" /></svg>;
}

function ChevronRightIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" /></svg>;
}

function UserIcon() {
  return <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5.33 0-8 2.67-8 5.5V21h16v-1.5c0-2.83-2.67-5.5-8-5.5Z" /></svg>;
}

function PlayIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path fill="currentColor" stroke="none" d="m10 8 6 4-6 4Z" /></svg>;
}

function PauseIcon() {
  return <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 5h4v14H7zm6 0h4v14h-4z" /></svg>;
}

function StarIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinejoin="round" d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" /></svg>;
}

function BuildingIcon() {
  return <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16M6 21V9l6-3v15m0-12h6v12M9 12h.01M9 16h.01M15 13h.01M15 17h.01" /></svg>;
}

function TrendIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5m0 0 4 4m-4-4L1 8m6 8 5-5 4 3 5-7" /></svg>;
}

function MoneyIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M12 3v18m4-14.5c-.8-.8-2-1.3-4-1.3-2.2 0-3.7 1.2-3.7 3 0 4.2 7.4 2.1 7.4 6.2 0 1.8-1.5 3-3.9 3-2 0-3.4-.6-4.3-1.6" /></svg>;
}

function CardIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></svg>;
}

function ChartIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 20V4m0 16h17M8 16l4-5 3 3 5-8" /></svg>;
}

function NetworkIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="17" r="2.5" /><circle cx="19" cy="17" r="2.5" /><path d="m10.5 7-4 7.5m7-7.5 4 7.5M7.5 17h9" /></svg>;
}

function ClockIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v6l4 2" /></svg>;
}

function TeamIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3" /><path d="M3 20v-2c0-2.8 2.4-5 6-5s6 2.2 6 5v2H3Z" /><path strokeLinecap="round" d="M16 5a3 3 0 0 1 0 6m2 3c1.8.6 3 2 3 4v2h-3" /></svg>;
}

function ShieldIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinejoin="round" d="M12 3 20 7v6c0 4.5-3.5 7.4-8 8-4.5-.6-8-3.5-8-8V7l8-4Z" /><path strokeLinecap="round" d="M12 8v8m-3-4h6" /></svg>;
}
