import { prisma } from "../prisma";
import { getSession } from "./session";

export async function getCurrentUser() {
  const session = await getSession();

  if (!session) return null;

  const user = await prisma.usuario.findUnique({
    where: {
      id_usuario: session.id_usuario,
    },
    include: {
      rol: true,
      empleado: true,
    },
  });

  if (!user || user.estado !== "activo") {
    return null;
  }

  return user;
}