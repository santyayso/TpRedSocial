import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Publicacion } from '../../../core/models/publicacion.interface';
import { apiError } from '../../../core/services/api-error';
import { AuthService } from '../../../core/services/auth.service';
import { PublicacionesService } from '../../../core/services/publicaciones.service';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-publicacion-card',
  imports: [DatePipe, RouterLink, Modal],
  templateUrl: './publicacion-card.html',
  styleUrl: './publicacion-card.css',
})
export class PublicacionCard implements OnInit {
  authService = inject(AuthService);
  private publicacionesService = inject(PublicacionesService);

  publicacion = input.required<Publicacion>();
  eliminada = output<void>();
  meGusta = signal(false); // para guardar el booleano que viene del back. True si YO le di me gusta
  cantidadMeGusta = signal(0);
  procesando = signal(false); // para bloquear el boton de me  gusta
  modalEliminarAbierta = signal(false);
  mensajeError = signal<string | null>(null);
  mostrarVerPublicacion = input(true);
  
  ngOnInit() {
    this.meGusta.set(this.publicacion().meGusta);
    this.cantidadMeGusta.set(this.publicacion().cantidadMeGusta);
  }


  // con este computed averiguamos si la publicacion es mia, comparando el autor con el usuario actual
  esMia = computed(
    () => this.publicacion().autor.id === this.authService.currentUser()?.id,
  );


  alternarMeGusta() {
    if (this.procesando()){
      return;
    } 

    this.procesando.set(true);
    const id = this.publicacion().id;

    // guardamos la accion que vamos a ejecutar en una variable
    // la accion que vamos a ejecutar, por defecto es darMe gusta
    let accion = this.publicacionesService.darMeGusta(id);

    if (this.meGusta()) {
      // si el me gusta ya esta puesto, vamos a ejecutar el quitar
      accion = this.publicacionesService.quitarMeGusta(id);
    }

    // subscribe es lo que ejecuta la accion (peticion) y nos deja decidir que hacer con la respuesta 
    // subscribe es una funcion que recibe como parametro un objeto con 2 propiedades (next y error), y 
    // dentro de cada una de ellas va un callback 
    accion.subscribe(
        {
          next: (respuesta) => {
            this.meGusta.set(respuesta.meGusta);
            this.cantidadMeGusta.set(respuesta.cantidadMeGusta);
            this.procesando.set(false);

            // respuesta nos da un objeto con estos datos 
            // {
            //   "meGusta": true,
            //     "cantidadMeGusta": 3
            // }
            },
          error: (error) => {
            // si falla, seteamos el mensaje de error para mostrarlo en una modal
            this.mensajeError.set(apiError(error));
            this.procesando.set(false);
            },
        }
  );
  }

  // para cuando toca el boton de eliminar (co la modal ya abierta)
  eliminar() {
    this.modalEliminarAbierta.set(false);

    // subscribe es lo que ejecuta la accion (peticion) y nos deja decidir que hacer con la respuesta 
    // subscribe es una funcion que recibe como parametro un objeto con 2 propiedades (next y error), y 
    // dentro de cada una de ellas va un callback 
    this.publicacionesService.eliminar(this.publicacion().id).subscribe(
      {
        // emitimos el evento al padre para que lo saque de la lista
        next: () => this.eliminada.emit(),
        // si falla, seteamos el mensaje de error para mostrarlo en una modal
        error: (error) => this.mensajeError.set(apiError(error)),
      }
    );
  }
}
