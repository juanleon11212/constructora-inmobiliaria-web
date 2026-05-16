import crypto from "crypto";
import { cookies } from "next/headers";

export type AuthSession = {
  tipo_cuenta: "empresa" | "cliente";
  id_usuario?: number;
  id_cliente?: number;
  nombre_usuario: string;
  correo?: string | null;
  id_rol: number;
  rol: string;
  nombre_mostrar: string;
};

type SessionPayload = AuthSession & {
  createdAt: number;
};

const SESSION_COOKIE = "constructora_session";
const SERVER_STARTED_AT = Date.now();

function getSecret() {
  return process.env.AUTH_SECRET ?? "dev-secret";
}

function sign(value: string) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(value)
    .digest("base64url");
}

export function createSessionToken(payload: AuthSession) {
  const sessionPayload: SessionPayload = {
    ...payload,
    createdAt: Date.now(),
  };

  const data = Buffer.from(JSON.stringify(sessionPayload)).toString("base64url");
  const signature = sign(data);

  return `${data}.${signature}`;
}

export function verifySessionToken(token?: string): AuthSession | null {
  if (!token) return null;

  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  const expectedSignature = sign(data);
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    ) as SessionPayload;

    if (!payload.createdAt) return null;

    if (payload.createdAt < SERVER_STARTED_AT) {
      return null;
    }

    return {
      tipo_cuenta: payload.tipo_cuenta,
      id_usuario: payload.id_usuario,
      id_cliente: payload.id_cliente,
      nombre_usuario: payload.nombre_usuario,
      correo: payload.correo,
      id_rol: payload.id_rol,
      rol: payload.rol,
      nombre_mostrar: payload.nombre_mostrar,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: AuthSession) {
  const cookieStore = await cookies();
  const token = createSessionToken(payload);

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return verifySessionToken(token);
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}