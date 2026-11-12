import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const contraseniasIguales: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  const password = grupo.get('password')?.value;
  const repetir = grupo.get('repetirPassword')?.value;
  return password === repetir ? null : { contraseniasDistintas: true };
};

export const fechaPasada: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  return new Date(control.value) > new Date() ? { fechaFutura: true } : null;
};
