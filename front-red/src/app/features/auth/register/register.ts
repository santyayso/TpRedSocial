import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiError } from '../../../core/services/api-error';
import { AuthService } from '../../../core/services/auth.service';
import { contraseniasIguales, fechaPasada } from '../../../core/validators/registro.validators';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  private tiposValidos = ['image/jpeg', 'image/png', 'image/webp'];
  private maxBytes = 5 * 1024 * 1024;

  hoy = new Date().toISOString().slice(0, 10);

  registerForm = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/\S/)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/\S/)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      nombreUsuario: [
        '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[a-zA-Z0-9_]+$/)],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(72),
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/),
        ],
      ],
      repetirPassword: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required, fechaPasada]],
      descripcion: ['', [Validators.required, Validators.maxLength(300), Validators.pattern(/\S/)]],
    },
    { validators: contraseniasIguales },
  );

  archivo = signal<File | null>(null);
  errorArchivo = signal<string | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  get f() {
    return this.registerForm.controls;
  }

  onArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    this.archivo.set(null);
    if (!archivo) {
      this.errorArchivo.set('La imagen de perfil es obligatoria');
      return;
    }
    if (!this.tiposValidos.includes(archivo.type)) {
      this.errorArchivo.set('Solo se admiten imágenes JPEG, PNG o WebP');
      return;
    }
    if (archivo.size > this.maxBytes) {
      this.errorArchivo.set('La imagen no puede superar los 5 MB');
      return;
    }
    this.errorArchivo.set(null);
    this.archivo.set(archivo);
  }

  onSubmit() {
    this.registerForm.markAllAsTouched();
    const archivo = this.archivo();
    if (!archivo && !this.errorArchivo()) {
      this.errorArchivo.set('La imagen de perfil es obligatoria');
    }
    if (this.registerForm.invalid || !archivo) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const valores = this.registerForm.getRawValue();
    const datos = new FormData();
    datos.append('nombre', valores.nombre);
    datos.append('apellido', valores.apellido);
    datos.append('email', valores.email);
    datos.append('nombreUsuario', valores.nombreUsuario);
    datos.append('password', valores.password);
    datos.append('fechaNacimiento', valores.fechaNacimiento);
    datos.append('descripcion', valores.descripcion);
    datos.append('imagen', archivo);

    this.authService.signUp(datos).subscribe({
      next: (sesion) => {
        this.authService.iniciarSesion(sesion);
        this.isLoading.set(false);
        this.router.navigate(['/publicaciones']);
      },
      error: (error) => {
        this.errorMessage.set(apiError(error));
        this.isLoading.set(false);
      },
    });
  }
}
