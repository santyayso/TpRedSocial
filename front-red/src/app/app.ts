import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { Cargando } from './features/cargando/cargando';
import { Header } from './layout/header/header';
import { Modal } from './shared/components/modal/modal';

@Component({
  imports: [RouterOutlet, Header, Cargando, Modal],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  authService = inject(AuthService);
  private router = inject(Router);

  // el constructor se ejecuta una sola vez, cuando arranca la aplicacion
  constructor() {
    this.validarSesionInicial();
  }

  private validarSesionInicial() {
    // si no hay token guardado ni le preguntamos al back, vamos directo al login
    if (!this.authService.accessToken()) {
      this.authService.validandoSesion.set(false);
      this.router.navigate(['/login']);
      return;
    }

    // si hay token, le preguntamos al back si todavia es valido (el interceptor lo manda en el header)
    this.authService.autorizar().subscribe({
      next: (usuario) => {
        // el token es valido, el back nos devolvio los datos del usuario
        this.authService.currentUser.set(usuario);
        this.authService.iniciarContadorSesion();
        this.authService.validandoSesion.set(false);
        this.router.navigate(['/publicaciones']);
      },
      error: () => {
        // el token no es valido o esta vencido
        this.authService.signOut();
        this.authService.validandoSesion.set(false);
        this.router.navigate(['/login']);
      },
    });
  }

  // cuando el usuario acepta extender la sesion en el modal
  extenderSesion() {
    this.authService.refrescar().subscribe({
      next: (sesion) => {
        // iniciarSesion guarda el token nuevo y reinicia el contador de 10 minutos
        this.authService.iniciarSesion(sesion);
        this.authService.avisoSesionAbierto.set(false);
      },
      error: () => {
        // si falla por un 401 el interceptor ya nos manda al login
        this.authService.avisoSesionAbierto.set(false);
      },
    });
  }
}
