import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { isStrongEnoughPassword } from "../../../../lib/validations";
import { createAuditLog } from "../../../../lib/audit-log";

/*
  API RECUPERAR CONTRASEÑA

  Solo se ejecuta cuando se envía el formulario de recuperar contraseña.
  No se ejecuta al abrir login.
  No se ejecuta al cargar datos ya existentes.

  LOGS:
  - Registra cuando un usuario interno cambia contraseña.
  - Registra cuando un cliente cambia contraseña.
*/

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const identificador = String(
      body.identificador ??
        body.usuario ??
        body.correo ??
        body.nombre_usuario ??
        ""
    ).trim();

    const nuevaContrasena = String(
      body.nuevaContrasena ??
        body.contrasena ??
        body.password ??
        ""
    ).trim();

    const confirmarContrasena = String(
      body.confirmarContrasena ??
        body.confirmar_contrasena ??
        body.confirmPassword ??
        ""
    ).trim();

    if (!identificador || !nuevaContrasena || !confirmarContrasena) {
      return NextResponse.json(
        { message: "Todos los campos son obligatorios." },
        { status: 400 }
      );
    }

    if (!isStrongEnoughPassword(nuevaContrasena)) {
      return NextResponse.json(
        { message: "La contraseña debe tener mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    if (nuevaContrasena !== confirmarContrasena) {
      return NextResponse.json(
        { message: "Las contraseñas no coinciden." },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [{ nombre_usuario: identificador }, { correo: identificador }],
      },
      include: {
        rol: true,
      },
    });

    if (usuario) {
      const usuarioActualizado = await prisma.usuario.update({
        where: {
          id_usuario: usuario.id_usuario,
        },
        data: {
          contrasena: nuevaContrasena,
        },
        include: {
          rol: true,
        },
      });

      await createAuditLog({
        id_usuario: usuarioActualizado.id_usuario ?? null,
        usuario:
          usuarioActualizado.nombre_usuario ??
          usuarioActualizado.correo ??
          "Usuario",
        rol: usuarioActualizado.rol?.nombre_rol ?? "Usuario",
        accion: "EDITAR",
        modulo: "Autenticación",
        sector: "Cambiar contraseña",
        descripcion: `Se cambió la contraseña del usuario ${
          usuarioActualizado.nombre_usuario ?? usuarioActualizado.correo
        }.`,
        registro_id: usuarioActualizado.id_usuario ?? null,
      });

      return NextResponse.json({
        ok: true,
        message: "Contraseña de usuario actualizada correctamente.",
      });
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        OR: [{ nombre_usuario: identificador }, { correo: identificador }],
      },
      include: {
        rol: true,
      },
    });

    if (cliente) {
      const clienteActualizado = await prisma.cliente.update({
        where: {
          id_cliente: cliente.id_cliente,
        },
        data: {
          contrasena: nuevaContrasena,
        },
        include: {
          rol: true,
        },
      });

      await createAuditLog({
        id_usuario: clienteActualizado.id_cliente ?? null,
        usuario:
          clienteActualizado.nombre_usuario ??
          clienteActualizado.correo ??
          clienteActualizado.ci_nit ??
          "Cliente",
        rol: clienteActualizado.rol?.nombre_rol ?? "Cliente",
        accion: "EDITAR",
        modulo: "Autenticación",
        sector: "Cambiar contraseña",
        descripcion: `Se cambió la contraseña del cliente ${
          clienteActualizado.nombre_usuario ??
          clienteActualizado.correo ??
          clienteActualizado.ci_nit
        }.`,
        registro_id: clienteActualizado.id_cliente ?? null,
      });

      return NextResponse.json({
        ok: true,
        message: "Contraseña de cliente actualizada correctamente.",
      });
    }

    return NextResponse.json(
      { message: "No se encontró una cuenta con ese usuario o correo." },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error al recuperar contraseña:", error);

    return NextResponse.json(
      { message: "Error de conexión con el servidor." },
      { status: 500 }
    );
  }
}