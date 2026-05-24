import { prisma } from "./prisma";

type AuditAction =
  | "LOGIN"
  | "CREAR"
  | "EDITAR"
  | "ELIMINAR"
  | "DESACTIVAR"
  | "FINALIZAR"
  | "ERROR"
  | "PRUEBA";

type AuditLogParams = {
  id_usuario?: number | null;
  usuario?: string | null;
  rol?: string | null;
  accion: AuditAction;
  modulo: string;
  sector?: string | null;
  descripcion?: string | null;
  registro_id?: number | null;
};

export async function createAuditLog(params: AuditLogParams) {
  try {
    await prisma.logAuditoria.create({
      data: {
        id_usuario: params.id_usuario ?? null,
        usuario: params.usuario ?? null,
        rol: params.rol ?? null,
        accion: params.accion,
        modulo: params.modulo,
        sector: params.sector ?? null,
        descripcion: params.descripcion ?? null,
        registro_id: params.registro_id ?? null,
      },
    });
  } catch (error) {
    console.error("Error al registrar log de auditoría:", error);
  }
}