import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  EstadoMeGusta,
  ListadoPublicaciones,
  OrdenPublicaciones,
  Publicacion,
} from '../models/publicacion.interface';

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private http = inject(HttpClient);
  private url = environment.apiUrl + '/publicaciones';

  listar(offset: number, limit: number, orden: OrdenPublicaciones, autor?: string) {
    let params = new HttpParams().set('offset', offset).set('limit', limit).set('orden', orden);
    if (autor) params = params.set('autor', autor);
    return this.http.get<ListadoPublicaciones>(this.url, { params });
  }

  crear(datos: FormData) {
    return this.http.post<Publicacion>(this.url, datos);
  }

  eliminar(id: string) {
    return this.http.delete<void>(this.url + '/' + id);
  }

  darMeGusta(id: string) {
    return this.http.post<EstadoMeGusta>(this.url + '/' + id + '/me-gusta', {});
  }

  quitarMeGusta(id: string) {
    return this.http.delete<EstadoMeGusta>(this.url + '/' + id + '/me-gusta');
  }
}
