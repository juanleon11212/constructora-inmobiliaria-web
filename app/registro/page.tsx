import { redirect } from "next/navigation";
import { RegisterForm } from "../../components/auth/RegisterForm";
import { getCurrentUser } from "../../lib/auth/current-user";

export default async function RegistroPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <RegisterForm />
      </section>
    </main>
  );
}