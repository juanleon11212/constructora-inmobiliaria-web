import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { isStrongEnoughPassword } from "../../../../lib/validations";

/*
  API RECUPERAR CONTRASEÑA

  Solo se ejecuta cuando se envía el formulario de recuperar contraseña.
  No se ejecuta al abrir login.
  No se ejecuta al cargar datos ya existentes.
*/

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const identificador = String(body.identificador ?? "").trim();
    const nuevaContrasena = String(body.nuevaContrasena ?? "").trim();
    const confirmarContrasena = String(body.confirmarContrasena ?? "").trim();

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
    });

    if (usuario) {
      await prisma.usuario.update({
        where: {
          id_usuario: usuario.id_usuario,
        },
        data: {
          contrasena: nuevaContrasena,
        },
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
    });

    if (cliente) {
      await prisma.cliente.update({
        where: {
          id_cliente: cliente.id_cliente,
        },
        data: {
          contrasena: nuevaContrasena,
        },
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
  } catch {
    return NextResponse.json(
      { message: "Error de conexión con el servidor." },
      { status: 500 }
    );
  }
}