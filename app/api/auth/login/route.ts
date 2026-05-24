import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { setSessionCookie } from "../../../../lib/auth/session";
import { createAuditLog } from "../../../../lib/audit-log";

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
      Aceptamos varios nombres por si tu formulario usa:
      - identifier/password
      - nombre_usuario/contrasena
      - usuario/contrasena
      - correo/contrasena
    */
    const identifier = String(
      body.identifier ?? body.nombre_usuario ?? body.usuario ?? body.correo ?? ""
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

      await createAuditLog({
        id_usuario: empresaUser.id_usuario ?? null,
        usuario: empresaUser.nombre_usuario ?? empresaUser.correo ?? "Usuario",
        rol: empresaUser.rol?.nombre_rol ?? "Usuario",
        accion: "LOGIN",
        modulo: "Autenticación",
        sector: "Inicio de sesión",
        descripcion: `El usuario ${
          empresaUser.nombre_usuario ?? empresaUser.correo
        } inició sesión en el sistema.`,
        registro_id: empresaUser.id_usuario ?? null,
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

      await createAuditLog({
        id_usuario: cliente.id_cliente ?? null,
        usuario:
          cliente.nombre_usuario ??
          cliente.correo ??
          cliente.ci_nit ??
          "Cliente",
        rol: cliente.rol?.nombre_rol ?? "Cliente",
        accion: "LOGIN",
        modulo: "Autenticación",
        sector: "Inicio de sesión",
        descripcion: `El cliente ${
          cliente.nombre_usuario ?? cliente.correo ?? cliente.ci_nit
        } inició sesión en el sistema.`,
        registro_id: cliente.id_cliente ?? null,
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
  } catch (error) {
    console.error("Error en login:", error);

    return NextResponse.json(
      { message: "Error de conexión con el servidor." },
      { status: 500 }
    );
  }
}