import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrdenPublicaciones, Publicacion } from '../../core/models/publicacion.interface';
import { apiError } from '../../core/services/api-error';
import { AuthService } from '../../core/services/auth.service';
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { Modal } from '../../shared/components/modal/modal';
import { PublicacionCard } from '../../shared/components/publicacion-card/publicacion-card';

@Component({
  selector: 'app-publicaciones',
  imports: [ReactiveFormsModule, RouterLink, PublicacionCard, Modal],
  // imports: [RouterLink, PublicacionCard],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
})
export class Publicaciones {
  authService = inject(AuthService);
  private publicacionesService = inject(PublicacionesService);
  private fb = inject(FormBuilder);

  private tiposValidos = ['image/jpeg', 'image/png', 'image/webp'];
  private maxBytes = 5 * 1024 * 1024;

  readonly limite = 5;

  publicaciones = signal<Publicacion[]>([]);
  total = signal(0);
  pagina = signal(0);
  orden = signal<OrdenPublicaciones>('fecha');
  cargando = signal(false);
  error = signal('');
  mensaje = signal<string | null>(null);

  creando = signal(false);
  enviando = signal(false);
  archivo = signal<File | null>(null);
  errorArchivo = signal<string | null>(null);
  errorCrear = signal<string | null>(null);

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.limite)));

  publicacionForm = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/\S/)]],
    mensaje: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(500), Validators.pattern(/\S/)]],
  });

  constructor() {
    if (this.authService.currentUser()) this.cargar();
  }

  get f() {
    return this.publicacionForm.controls;
  }

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.publicacionesService
      .listar(this.pagina() * this.limite, this.limite, this.orden())
      .subscribe({
        next: (listado) => {
          this.publicaciones.set(listado.publicaciones);
          this.total.set(listado.total);
          this.cargando.set(false);
        },
        error: (error) => {
          this.error.set(apiError(error));
          this.cargando.set(false);
        },
      });
  }

  cambiarOrden(valor: string) {
    this.orden.set(valor as OrdenPublicaciones);
    this.pagina.set(0);
    this.cargar();
  }

  cambiarPagina(cambio: number) {
    const nueva = this.pagina() + cambio;
    if (nueva < 0 || nueva >= this.totalPaginas()) return;
    this.pagina.set(nueva);
    this.cargar();
  }

  onEliminada() {
    if (this.publicaciones().length === 1 && this.pagina() > 0) {
      this.pagina.update((pagina) => pagina - 1);
    }
    this.cargar();
  }

  abrirCrear() {
    this.publicacionForm.reset();
    this.archivo.set(null);
    this.errorArchivo.set(null);
    this.errorCrear.set(null);
    this.creando.set(true);
  }

  cerrarCrear() {
    this.creando.set(false);
  }

  onArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    this.archivo.set(null);
    this.errorArchivo.set(null);
    if (!archivo) return;
    if (!this.tiposValidos.includes(archivo.type)) {
      this.errorArchivo.set('Solo se admiten imágenes JPEG, PNG o WebP');
      return;
    }
    if (archivo.size > this.maxBytes) {
      this.errorArchivo.set('La imagen no puede superar los 5 MB');
      return;
    }
    this.archivo.set(archivo);
  }

  publicar() {
    this.publicacionForm.markAllAsTouched();
    if (this.publicacionForm.invalid || this.errorArchivo()) return;

    const { titulo, mensaje } = this.publicacionForm.getRawValue();
    const datos = new FormData();
    datos.append('titulo', titulo);
    datos.append('mensaje', mensaje);
    const archivo = this.archivo();
    if (archivo) datos.append('imagen', archivo);

    this.enviando.set(true);
    this.errorCrear.set(null);
    this.publicacionesService.crear(datos).subscribe({
      next: () => {
        this.enviando.set(false);
        this.creando.set(false);
        this.orden.set('fecha');
        this.pagina.set(0);
        this.cargar();
        this.mensaje.set('Publicación creada correctamente');
      },
      error: (error) => {
        this.errorCrear.set(apiError(error));
        this.enviando.set(false);
      },
    });
  }
}
