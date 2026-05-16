import crypto from "crypto";
import { cookies } from "next/headers";

export type AuthSession = {
  id_usuario: number;
  nombre_usuario: string;
  correo: string;
  id_rol: number;
  rol: string;
  empleado?: string | null;
};

const SESSION_COOKIE = "constructora_session";
const SESSION_MAX_AGE = 60 * 60 * 8;

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
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
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
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
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
    maxAge: SESSION_MAX_AGE,
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