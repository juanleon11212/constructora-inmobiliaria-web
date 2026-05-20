import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { setSessionCookie } from "../../../../lib/auth/session";

/*
  LOGIN

  Importante:
  - Aquí NO se valida contraseña mínima.
  - Aquí NO se valida correo.
  - Aquí NO se bloquean datos ya creados.
  - Solo se busca si existe usuario/correo + contraseña en la base.

  Las validaciones fuertes van en registro/crear/editar,
  no en iniciar sesión.
*/

export async function POST(request: Request) {
  try {
    const body = await request.json();

    /*
      Aceptamos ambos nombres por si tu formulario usa:
      - identifier/password
      o:
      - nombre_usuario/contrasena
    */
    const identifier = String(
      body.identifier ?? body.nombre_usuario ?? ""
    ).trim();

    const password = String(
      body.password ?? body.contrasena ?? ""
    ).trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Ingresa usuario y contraseña." },
        { status: 400 }
      );
    }

    /*
      Busca primero usuarios internos de empresa.
      Puede entrar con:
      - nombre_usuario
      - correo
    */
    const empresaUser = await prisma.usuario.findFirst({
      where: {
        estado: "activo",
        contrasena: password,
        OR: [
          { nombre_usuario: identifier },
          { correo: identifier },
        ],
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

    /*
      Si no encuentra usuario empresa, busca cliente.
      Puede entrar con:
      - nombre_usuario
      - correo
    */
    const cliente = await prisma.cliente.findFirst({
      where: {
        estado_cuenta: "activo",
        contrasena: password,
        OR: [
          { nombre_usuario: identifier },
          { correo: identifier },
        ],
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
  } catch {
    return NextResponse.json(
      { message: "Error de conexión con el servidor." },
      { status: 500 }
    );
  }
}