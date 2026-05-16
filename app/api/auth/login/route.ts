import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { setSessionCookie } from "../../../../lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json();

  const identifier = String(body.identifier ?? "").trim();
  const password = String(body.password ?? "");

  if (!identifier || !password) {
    return NextResponse.json(
      { message: "Ingresa usuario y contraseña." },
      { status: 400 }
    );
  }

  const empresaUser = await prisma.usuario.findFirst({
    where: {
      estado: "activo",
      nombre_usuario: identifier,
      contrasena: password,
    },
    include: {
      rol: true,
      empleado: true,
    },
  });

  if (empresaUser) {
    await setSessionCookie({
      tipo_cuenta: "empresa",
      id_usuario: empresaUser.id_usuario,
      nombre_usuario: empresaUser.nombre_usuario,
      correo: empresaUser.correo,
      id_rol: empresaUser.id_rol,
      rol: empresaUser.rol.nombre_rol,
      nombre_mostrar: empresaUser.empleado
        ? `${empresaUser.empleado.nombres} ${empresaUser.empleado.apellidos}`
        : empresaUser.nombre_usuario,
    });

    return NextResponse.json({
      ok: true,
      redirectTo: "/admin",
      tipo_cuenta: "empresa",
    });
  }

  const cliente = await prisma.cliente.findFirst({
    where: {
      estado_cuenta: "activo",
      nombre_usuario: identifier,
      contrasena: password,
    },
    include: {
      rol: true,
    },
  });

  if (cliente && cliente.id_rol) {
    await setSessionCookie({
      tipo_cuenta: "cliente",
      id_cliente: cliente.id_cliente,
      nombre_usuario: cliente.nombre_usuario ?? "",
      correo: cliente.correo,
      id_rol: cliente.id_rol,
      rol: cliente.rol?.nombre_rol ?? "Cliente",
      nombre_mostrar:
        cliente.razon_social ??
        `${cliente.nombres ?? ""} ${cliente.apellidos ?? ""}`.trim(),
    });

    return NextResponse.json({
      ok: true,
      redirectTo: "/admin",
      tipo_cuenta: "cliente",
    });
  }

  return NextResponse.json(
    { message: "Usuario o contraseña incorrectos." },
    { status: 401 }
  );
}