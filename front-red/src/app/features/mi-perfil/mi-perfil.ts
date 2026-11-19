import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Publicacion } from '../../core/models/publicacion.interface';
import { apiError } from '../../core/services/api-error';
import { AuthService } from '../../core/services/auth.service';
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { PublicacionCard } from '../../shared/components/publicacion-card/publicacion-card';

@Component({
  selector: 'app-mi-perfil',
  imports: [DatePipe, RouterLink, PublicacionCard],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil {
  authService = inject(AuthService);
  private publicacionesService = inject(PublicacionesService);

  publicaciones = signal<Publicacion[]>([]);
  cargando = signal(false);
  error = signal('');

  constructor() {
    if (this.authService.currentUser()) this.cargarPublicaciones();
  }

  cargarPublicaciones() {
    const usuario = this.authService.currentUser();
    if (!usuario){
      return;
    } 
    this.cargando.set(true);
    this.error.set('');

    // parametro de offset en 0 y limite en 3, ordenadas por fecha y solo las del  usuario que esta loggeado
    this.publicacionesService.listarPublicaciones(0, 3, 'fecha', usuario.id).subscribe({
      next: (respuesta) => {
        this.publicaciones.set(respuesta.publicaciones);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(apiError(error));
        this.cargando.set(false);
      },
    });
  }
}
