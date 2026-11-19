import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Comentario } from '../../core/models/comentario.interface';
import { Publicacion } from '../../core/models/publicacion.interface';
import { apiError } from '../../core/services/api-error';
import { AuthService } from '../../core/services/auth.service';
import { ComentariosService } from '../../core/services/comentarios.service';
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { Modal } from '../../shared/components/modal/modal';
import { PublicacionCard } from '../../shared/components/publicacion-card/publicacion-card';

// cantidad de comentarios que se traen en la primera carga y cada vez que se toca "cargar mas"
const COMENTARIOS_POR_CARGA = 5;

@Component({
  selector: 'app-publicacion-detalle',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, Modal, PublicacionCard],
  templateUrl: './publicacion-detalle.html',
  styleUrl: './publicacion-detalle.css',
})
export class PublicacionDetalle {
  authService = inject(AuthService);
  private publicacionesService = inject(PublicacionesService);
  private comentariosService = inject(ComentariosService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // el id de la publicacion viene en la url (/publicaciones/:id), lo sacamos de ahi
  private idPublicacion = this.route.snapshot.paramMap.get('id') ?? '';

  publicacion = signal<Publicacion | null>(null);
  comentarios = signal<Comentario[]>([]);
  totalComentarios = signal(0);
  // guarda el comentario que se esta editando. si es null, el formulario esta creando uno nuevo
  comentarioEnEdicion = signal<Comentario | null>(null);
  enviando = signal(false);
  cargandoMasComentarios = signal(false);
  mensajeModal = signal<string | null>(null);

  constructor() {
    if (this.authService.currentUser()) {
      this.cargarPublicacion();
      this.cargarComentarios();
    }
  }

  // ==========
  // CARGAR PUBLICACION Y COMENTARIOS
  // ==========
  cargarPublicacion() {
    this.publicacionesService.obtenerPublicacion(this.idPublicacion).subscribe({
      next: (respuesta) => {
        this.publicacion.set(respuesta);
      },
      error: (error) => {
        this.mensajeModal.set(apiError(error));
      },
    });
  }

  // primera carga: trae los primeros comentarios (offset 0)
  cargarComentarios() {
    this.comentariosService
      .listarComentarios(this.idPublicacion, 0, COMENTARIOS_POR_CARGA)
      .subscribe({
        next: (respuesta) => {
          this.comentarios.set(respuesta.comentarios);
          this.totalComentarios.set(respuesta.totalComentarios);
        },
        error: (error) => {
          this.mensajeModal.set(apiError(error));
        },
      });
  }

  // boton "cargar mas": trae los siguientes y los suma a los que ya estamos mostrando
  cargarMasComentarios() {
    this.cargandoMasComentarios.set(true);

    // el offset es la cantidad de comentarios que ya estamos mostrando, para saltearlos y traer los que siguen
    const offset = this.comentarios().length;

    this.comentariosService
      .listarComentarios(this.idPublicacion, offset, COMENTARIOS_POR_CARGA)
      .subscribe({
        next: (respuesta) => {
          // Los ...  desarman una lista y ponen sus elementos sueltos
          // arma una lista nueva que tiene en orden todos los elementos de la primera y después todos los de la segunda
          this.comentarios.set([...this.comentarios(), ...respuesta.comentarios]);
          this.totalComentarios.set(respuesta.totalComentarios);
          this.cargandoMasComentarios.set(false);
        },
        error: (error) => {
          this.mensajeModal.set(apiError(error));
          this.cargandoMasComentarios.set(false);
        },
      });
  }

  // cuando se elimina la publicacion desde la card, volvemos a la otra pagina
  volverAPublicaciones() {
    this.router.navigate(['/publicaciones']);
  }

  // ==========
  // FORM COMENTARIO (sirve para crear y para editar)
  // ==========
  comentarioForm = this.fb.nonNullable.group({                            // valida que no haya espacios en blanco
    mensaje: ['', [Validators.required, Validators.maxLength(300), Validators.pattern(/\S/)]],
  });

  get formularioControles() {
    return this.comentarioForm.controls;
  }

  // solo el autor del comentario puede editarlo
  esMiComentario(comentario: Comentario) {
    return comentario.autor.id === this.authService.currentUser()?.id;
  }

  // pasamos el comentario al formulario para editarlo
  prepararEdicion(comentario: Comentario) {
    this.comentarioEnEdicion.set(comentario);
    this.comentarioForm.patchValue({ mensaje: comentario.mensaje });
  }

  terminarEdicion() {
    this.comentarioEnEdicion.set(null);
    this.comentarioForm.reset();
  }

  guardarComentario() {
    this.comentarioForm.markAllAsTouched();
    if (this.comentarioForm.invalid) {
      return;
    }

    const { mensaje } = this.comentarioForm.getRawValue();
    this.enviando.set(true);

    // si hay un comentario en edicion lo modificamos, si no creamos uno nuevo
    const comentarioAEditar = this.comentarioEnEdicion();
    if (comentarioAEditar) {
      this.modificarComentario(comentarioAEditar.id, mensaje);
    } else {
      this.crearComentario(mensaje);
    }
  }

  private crearComentario(mensaje: string) {
    this.comentariosService.crearComentario(this.idPublicacion, mensaje).subscribe({
      next: (comentarioCreado) => {
        // el comentario nuevo se muestra arriba de todo, porque los mas recientes van primero
        this.comentarios.set([comentarioCreado, ...this.comentarios()]);
        this.totalComentarios.set(this.totalComentarios() + 1);
        this.comentarioForm.reset();
        this.enviando.set(false);
      },
      error: (error) => {
        this.mensajeModal.set(apiError(error));
        this.enviando.set(false);
      },
    });
  }

  private modificarComentario(idComentario: string, mensaje: string) {
    this.comentariosService.modificarComentario(idComentario, mensaje).subscribe({
      next: (comentarioModificado) => {
        // recorremos la lista y reemplazamos solo el comentario que se modifico, los demas quedan igual
        const comentariosActualizados = this.comentarios().map((comentario) => {
          if (comentario.id === comentarioModificado.id) {
            return comentarioModificado;
          }
          return comentario;
        });
        this.comentarios.set(comentariosActualizados);
        this.terminarEdicion();
        this.enviando.set(false);
      },
      error: (error) => {
        this.mensajeModal.set(apiError(error));
        this.enviando.set(false);
      },
    });
  }
}
