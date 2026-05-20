/*
  VALIDACIONES GENERALES

  Estas funciones NO se ejecutan solas.
  Solo se usan cuando un formulario intenta crear o editar datos.
*/

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isStrongEnoughPassword(password: string) {
  return password.trim().length >= 6;
}

export function isOnlyNumbers(value: string) {
  return /^[0-9]+$/.test(value.trim());
}

export function isPositiveNumber(value: number) {
  return !Number.isNaN(value) && value > 0;
}

export function isZeroOrPositiveNumber(value: number) {
  return !Number.isNaN(value) && value >= 0;
}