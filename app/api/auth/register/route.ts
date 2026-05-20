import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import {
  isOnlyNumbers,
  isStrongEnoughPassword,
  isValidEmail,
} from "../../../../lib/validations";

/*
  API REGISTRO

  Solo registra clientes nuevos.

  Las validaciones solo se ejecutan cuando alguien presiona
  "Crear cuenta de cliente".

  No afecta clientes ya creados en la base.
*/

export async function POST(request: Request) {
  const body = await request.json();

  const nombre_usuario = String(body.nombre_usuario ?? "").trim();
  const contrasena = String(body.contrasena ?? "").trim();
  const nombres = String(body.nombres ?? "").trim();
  const apellidos = String(body.apellidos ?? "").trim();
  const razon_social = String(body.razon_social ?? "").trim();
  const ci_nit = String(body.ci_nit ?? "").trim();
  const telefono = String(body.telefono ?? "").trim();
  const correo = String(body.correo ?? "").trim();
  const direccion = String(body.direccion ?? "").trim();

  if (!nombre_usuario || !contrasena || !ci_nit || !correo) {
    return NextResponse.json(
      {
        message:
          "Usuario, contraseña, CI/NIT y correo son obligatorios.",
      },
      { status: 400 }
    );
  }
  if (!isStrongEnoughPassword(contrasena)) {
  return NextResponse.json(
    { message: "La contraseña debe tener mínimo 6 caracteres." },
    { status: 400 }
  );
}

if (!isValidEmail(correo)) {
  return NextResponse.json(
    { message: "El correo no tiene un formato válido." },
    { status: 400 }
  );
}

if (!isOnlyNumbers(ci_nit)) {
  return NextResponse.json(
    { message: "El CI/NIT debe contener solo números." },
    { status: 400 }
  );
}

if (telefono && !isOnlyNumbers(telefono)) {
  return NextResponse.json(
    { message: "El teléfono debe contener solo números." },
    { status: 400 }
  );
}

  if (!isStrongEnoughPassword(contrasena)) {
    return NextResponse.json(
      { message: "La contraseña debe tener mínimo 6 caracteres." },
      { status: 400 }
    );
  }

  if (!isValidEmail(correo)) {
    return NextResponse.json(
      { message: "El correo no tiene un formato válido." },
      { status: 400 }
    );
  }

  if (!isOnlyNumbers(ci_nit)) {
    return NextResponse.json(
      { message: "El CI/NIT debe contener solo números." },
      { status: 400 }
    );
  }

  if (telefono && !isOnlyNumbers(telefono)) {
    return NextResponse.json(
      { message: "El teléfono debe contener solo números." },
      { status: 400 }
    );
  }

  const existeCliente = await prisma.cliente.findFirst({
    where: {
      OR: [{ nombre_usuario }, { ci_nit }, { correo }],
    },
  });

  if (existeCliente) {
    return NextResponse.json(
      {
        message:
          "El usuario, correo o CI/NIT ya está registrado como cliente.",
      },
      { status: 409 }
    );
  }

  const rolCliente = await prisma.rol.findFirst({
    where: {
      nombre_rol: "Cliente",
    },
  });

  if (!rolCliente) {
    return NextResponse.json(
      { message: "No existe el rol Cliente en la base de datos." },
      { status: 500 }
    );
  }

  const cliente = await prisma.cliente.create({
    data: {
      nombre_usuario,
      contrasena,
      nombres: nombres || null,
      apellidos: apellidos || null,
      razon_social: razon_social || null,
      ci_nit,
      telefono: telefono || null,
      correo,
      direccion: direccion || null,
      estado_cuenta: "activo",
      id_rol: rolCliente.id_rol,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Cliente registrado correctamente.",
    tipo_cuenta: "cliente",
    cliente: {
      id_cliente: cliente.id_cliente,
      nombre_usuario: cliente.nombre_usuario,
      correo: cliente.correo,
    },
  });
}