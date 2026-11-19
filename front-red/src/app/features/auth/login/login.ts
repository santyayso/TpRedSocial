import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiError } from '../../../core/services/api-error';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.nonNullable.group({
    // puede ser el correo o el nombre de usuario, por eso ya no usamos Validators.email
    emailOUsuario: ['', [Validators.required, Validators.minLength(3)]],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)],
    ],
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { emailOUsuario, password } = this.loginForm.getRawValue();

    this.authService.signIn(emailOUsuario, password).subscribe({
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
