import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { setSessionCookie } from "../../../../lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json();

  const identifier = String(body.identifier ?? "").trim();
  const password = String(body.password ?? "");

  if (!identifier || !password) {
    return NextResponse.json(
      { message: "Ingresa usuario/correo y contraseña." },
      { status: 400 }
    );
  }

  const user = await prisma.usuario.findFirst({
    where: {
      estado: "activo",
      OR: [{ nombre_usuario: identifier }, { correo: identifier }],
    },
    include: {
      rol: true,
      empleado: true,
    },
  });

  if (!user || user.contrasena !== password) {
    return NextResponse.json(
      { message: "Usuario o contraseña incorrectos." },
      { status: 401 }
    );
  }

  await setSessionCookie({
    id_usuario: user.id_usuario,
    nombre_usuario: user.nombre_usuario,
    correo: user.correo,
    id_rol: user.id_rol,
    rol: user.rol.nombre_rol,
    empleado: user.empleado
      ? `${user.empleado.nombres} ${user.empleado.apellidos}`
      : null,
  });

  return NextResponse.json({
    ok: true,
    redirectTo: "/admin",
    user: {
      id_usuario: user.id_usuario,
      nombre_usuario: user.nombre_usuario,
      correo: user.correo,
      rol: user.rol.nombre_rol,
    },
  });
}