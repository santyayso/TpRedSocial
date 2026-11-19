import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrdenamientoPublicaciones, Publicacion } from '../../core/models/publicacion.interface';
import { apiError } from '../../core/services/api-error';
import { AuthService } from '../../core/services/auth.service';
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { Modal } from '../../shared/components/modal/modal';
import { PublicacionCard } from '../../shared/components/publicacion-card/publicacion-card';

const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // ESTO ES EQUIVALENTE A 5 MEGAS
const LIMITE_PUBLICACIONES_POR_PAGINA = 5;

@Component({
  selector: 'app-publicaciones',
  imports: [ReactiveFormsModule, RouterLink, PublicacionCard, Modal],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
})
export class Publicaciones {
  authService = inject(AuthService);
  private publicacionesService = inject(PublicacionesService);
  private fb = inject(FormBuilder);

  publicaciones = signal<Publicacion[]>([]);
  totalPublicaciones = signal(0);
  numeroPagina = signal(0);
  ordenamiento = signal<OrdenamientoPublicaciones>('fecha');
  archivo = signal<File | null>(null);
  modalCrearAbierta = signal(false);
  enviando = signal(false);

  // cargando = signal(false);
  mensajeModal = signal<string | null>(null);
  errorArchivo = signal<string | null>(null);
  errorCrear = signal<string | null>(null);

  constructor() {
    if (this.authService.currentUser()) {
      this.cargarPublicaciones();
    }
  }

  cargarPublicaciones() {
    // this.cargando.set(true);

    // subscribe es lo que ejecuta la accion (peticion) y nos deja decidir que hacer con la respuesta 
    // subscribe es una funcion que recibe como parametro un objeto con 2 propiedades (next y error), y 
    // dentro de cada una de ellas va un callback 
    // el primer parametro del listar es el offset para saltear X cantidad de publicaciones segun la numeroPagina en la que estamos
    // el segundo parametro del listar es para limitar y que solo traiga 5 publicaciones
    this.publicacionesService
      .listarPublicaciones(this.numeroPagina() * LIMITE_PUBLICACIONES_POR_PAGINA, LIMITE_PUBLICACIONES_POR_PAGINA, this.ordenamiento())
      .subscribe({
          next: (respuesta) => {
            this.publicaciones.set(respuesta.publicaciones);
            this.totalPublicaciones.set(respuesta.totalPublicaciones);
            // this.cargando.set(false);
          },
          error: (error) => {
            this.mensajeModal.set(apiError(error));
            // this.cargando.set(false);
          },
        });
  }

  totalPaginas = computed(() => {
    // ceil redondea hacia arriba   
    // el calculo es totalPublicaciones de publicaciones dividido publicaciones por numeroPagina
    const numeroPaginas = Math.ceil(this.totalPublicaciones() / LIMITE_PUBLICACIONES_POR_PAGINA);
    // minimo una numeroPagina
    if (numeroPaginas < 1) {
      return 1;
    }
    return numeroPaginas;
  });



  // ==========
  // PAGINACION
  // ==========

  // el parametro cambio es +1 o -1
  cambiarPagina(cambio: number) {
    const nuevaPagina = this.numeroPagina() + cambio;
    // si con el cambio es menor a 0 o mayor al totalPublicaciones, no hacemos nada (dejamos igual)
    if (nuevaPagina < 0 || nuevaPagina >= this.totalPaginas()) {
      return;
    }
    this.numeroPagina.set(nuevaPagina);
    this.cargarPublicaciones(); // llamamos al cargarPublicaciones (ahora va a cargarPublicaciones distinto porque cambio el this.numeroPagina)
  }


  // ==========
  // ORDENAMIENTO
  // ==========
  cambiarOrdenamiento(valor: string) {
    this.ordenamiento.set(valor as OrdenamientoPublicaciones);
    this.numeroPagina.set(0);
    this.cargarPublicaciones();
  }


  // ==========
  // ELIMINAR PUBLICACION (CUANDO LA CARD EMITE EL EVENTO)
  // ==========
  // esto es solo para retroceder de pagina y hacer la nueva consulta a Mongo cuando se elimina
  // el borrado real esta en la card
  eliminarPublicacion() {
    // retrocede una pagina si estabamos en una pagina donde hay una sola publicacion
    if (this.publicaciones().length === 1 && this.numeroPagina() > 0) {
      this.numeroPagina.update((numeroPagina) => numeroPagina - 1);
    }
    this.cargarPublicaciones();
  }

  // ==========
  // FORM NUEVA PUBLICACION
  // ==========
  publicacionForm = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    mensaje: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(500)]],
  });


  get formularioControles() {
    return this.publicacionForm.controls;
  }

  abrirModalCrear() {
    this.publicacionForm.reset();
    this.archivo.set(null);
    this.errorArchivo.set(null);
    this.errorCrear.set(null);
    this.modalCrearAbierta.set(true);
  }

  cerrarModalCrear() {
    this.modalCrearAbierta.set(false);
  }


  crearPublicacion() {
    this.publicacionForm.markAllAsTouched();
    if (this.publicacionForm.invalid || this.errorArchivo()){
      return;
    }
       
    const { titulo, mensaje } = this.publicacionForm.getRawValue();

    // armamos el objeto FormData para enviarlo al back
    const datos = new FormData();
    datos.append('titulo', titulo);
    datos.append('mensaje', mensaje);
    const archivo = this.archivo();
    if (archivo) {
      datos.append('imagen', archivo);
    }

    this.enviando.set(true);
    this.errorCrear.set(null);
    
    // subscribe es lo que ejecuta la accion (peticion) y nos deja decidir que hacer con la respuesta 
    // subscribe es una funcion que recibe como parametro un objeto con 2 propiedades (next y error), y 
    // dentro de cada una de ellas va un callback 
    this.publicacionesService.crear(datos).subscribe({
      next: () => {
        this.enviando.set(false);
        this.modalCrearAbierta.set(false);
        this.ordenamiento.set('fecha');
        this.numeroPagina.set(0);
        this.cargarPublicaciones();
        this.mensajeModal.set('Publicación creada correctamente');
      },
      error: (error) => {
        this.errorCrear.set(apiError(error));
        this.enviando.set(false);
      },
    });
  }

  seleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;

    this.archivo.set(null);
    this.errorArchivo.set(null);

    if (!archivo) {
      return;
    }
    if (!TIPOS_VALIDOS.includes(archivo.type)) {
      this.errorArchivo.set('Solo se admiten imágenes JPEG, PNG o WebP');
      return;
    }
    if (archivo.size > MAX_BYTES) {
      this.errorArchivo.set('La imagen no puede superar los 5 MB');
      return;
    }

    this.archivo.set(archivo);
  }

}
