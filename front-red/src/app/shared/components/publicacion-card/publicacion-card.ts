import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Publicacion } from '../../../core/models/publicacion.interface';
import { apiError } from '../../../core/services/api-error';
import { AuthService } from '../../../core/services/auth.service';
import { PublicacionesService } from '../../../core/services/publicaciones.service';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-publicacion-card',
  imports: [DatePipe, Modal],
  templateUrl: './publicacion-card.html',
  styleUrl: './publicacion-card.css',
})
export class PublicacionCard implements OnInit {
  authService = inject(AuthService);
  private publicacionesService = inject(PublicacionesService);

  publicacion = input.required<Publicacion>();
  eliminada = output<void>();

  meGusta = signal(false);
  cantidadMeGusta = signal(0);
  procesando = signal(false);
  confirmando = signal(false);
  mensaje = signal<string | null>(null);

  esMia = computed(
    () => this.publicacion().autor?.id === this.authService.currentUser()?.id,
  );

  ngOnInit() {
    this.meGusta.set(this.publicacion().meGusta);
    this.cantidadMeGusta.set(this.publicacion().cantidadMeGusta);
  }

  alternarMeGusta() {
    if (this.procesando()) return;
    this.procesando.set(true);
    const id = this.publicacion().id;
    const accion = this.meGusta()
      ? this.publicacionesService.quitarMeGusta(id)
      : this.publicacionesService.darMeGusta(id);
    accion.subscribe({
      next: (estado) => {
        this.meGusta.set(estado.meGusta);
        this.cantidadMeGusta.set(estado.cantidadMeGusta);
        this.procesando.set(false);
      },
      error: (error) => {
        this.mensaje.set(apiError(error));
        this.procesando.set(false);
      },
    });
  }

  eliminar() {
    this.confirmando.set(false);
    this.publicacionesService.eliminar(this.publicacion().id).subscribe({
      next: () => this.eliminada.emit(),
      error: (error) => this.mensaje.set(apiError(error)),
    });
  }
}
