import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();

  const tipo_cuenta = String(body.tipo_cuenta ?? "").trim();

  if (tipo_cuenta === "cliente") {
    return registrarCliente(body);
  }

  if (tipo_cuenta === "usuario") {
    return registrarUsuarioEmpresa(body);
  }

  return NextResponse.json(
    { message: "Tipo de cuenta no válido." },
    { status: 400 }
  );
}

async function registrarCliente(body: any) {
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
          "Para cliente: usuario, contraseña, CI/NIT y correo son obligatorios.",
      },
      { status: 400 }
    );
  }

  const existeCliente = await prisma.cliente.findFirst({
    where: {
      OR: [{ nombre_usuario }, { ci_nit }],
    },
  });

  if (existeCliente) {
    return NextResponse.json(
      { message: "El usuario o CI/NIT ya está registrado como cliente." },
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
    data: {
      id_cliente: cliente.id_cliente,
      nombre_usuario: cliente.nombre_usuario,
      correo: cliente.correo,
    },
  });
}

async function registrarUsuarioEmpresa(body: any) {
  const nombre_usuario = String(body.nombre_usuario ?? "").trim();
  const correo = String(body.correo ?? "").trim();
  const contrasena = String(body.contrasena ?? "").trim();

  const nombres = String(body.nombres ?? "").trim();
  const apellidos = String(body.apellidos ?? "").trim();
  const ci = String(body.ci ?? "").trim();
  const telefono = String(body.telefono ?? "").trim();
  const direccion = String(body.direccion ?? "").trim();
  const fecha_nacimiento = String(body.fecha_nacimiento ?? "").trim();

  const id_rol = Number(body.id_rol);
  const id_cargo = Number(body.id_cargo);

  if (
    !nombre_usuario ||
    !correo ||
    !contrasena ||
    !nombres ||
    !apellidos ||
    !ci ||
    !id_rol ||
    !id_cargo
  ) {
    return NextResponse.json(
      {
        message:
          "Para usuario empresa: usuario, correo, contraseña, nombres, apellidos, CI, rol y cargo son obligatorios.",
      },
      { status: 400 }
    );
  }

  const rol = await prisma.rol.findUnique({
    where: {
      id_rol,
    },
  });

  if (!rol) {
    return NextResponse.json(
      { message: "El rol seleccionado no existe." },
      { status: 400 }
    );
  }

  if (rol.nombre_rol === "Administrador" || rol.nombre_rol === "Cliente") {
    return NextResponse.json(
      {
        message:
          "No puedes crear cuentas de Administrador ni Cliente desde esta opción.",
      },
      { status: 400 }
    );
  }

  const cargo = await prisma.cargo.findUnique({
    where: {
      id_cargo,
    },
  });

  if (!cargo) {
    return NextResponse.json(
      { message: "El cargo seleccionado no existe." },
      { status: 400 }
    );
  }

  const existeUsuario = await prisma.usuario.findFirst({
    where: {
      OR: [{ nombre_usuario }, { correo }],
    },
  });

  if (existeUsuario) {
    return NextResponse.json(
      { message: "El usuario o correo ya existe en la tabla usuario." },
      { status: 409 }
    );
  }

  const existeEmpleado = await prisma.empleado.findFirst({
    where: {
      ci,
    },
  });

  if (existeEmpleado) {
    return NextResponse.json(
      { message: "Ya existe un empleado con ese CI." },
      { status: 409 }
    );
  }

  const resultado = await prisma.$transaction(async (tx) => {
    const empleado = await tx.empleado.create({
      data: {
        nombres,
        apellidos,
        ci,
        telefono: telefono || null,
        direccion: direccion || null,
        fecha_nacimiento: fecha_nacimiento
          ? new Date(fecha_nacimiento)
          : null,
        fecha_ingreso: new Date(),
        estado: "activo",
        id_cargo,
      },
    });

    const usuario = await tx.usuario.create({
      data: {
        nombre_usuario,
        correo,
        contrasena,
        estado: "activo",
        id_rol,
        id_empleado: empleado.id_empleado,
      },
    });

    return {
      empleado,
      usuario,
    };
  });

  return NextResponse.json({
    ok: true,
    message: "Usuario de empresa registrado correctamente.",
    tipo_cuenta: "usuario",
    data: {
      id_empleado: resultado.empleado.id_empleado,
      id_usuario: resultado.usuario.id_usuario,
      nombre_usuario: resultado.usuario.nombre_usuario,
      rol: rol.nombre_rol,
      cargo: cargo.nombre_cargo,
    },
  });
}