import { redirect } from "next/navigation";
import { getCurrentUser } from "./current-user";
import { AppModule, canAccessModule } from "./permissions";

export async function requireModule(module: AppModule) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const roleName = user.rol?.nombre_rol;

  if (!canAccessModule(roleName, module)) {
    redirect("/admin");
  }

  return user;
}