import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  EstadoMeGusta,
  ListadoPublicaciones,
  OrdenamientoPublicaciones,
  Publicacion,
} from '../models/publicacion.interface';

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private http = inject(HttpClient);

  // esta  es la ruta comun para todas las peticiones
  private url = environment.apiUrl + '/publicaciones';
                                                                        // parametro opcional
  listarPublicaciones(offset: number, limit: number, orden: OrdenamientoPublicaciones, autor?: string) {
    // fijamos los parametros
    let params = new HttpParams().set('offset', offset).set('limit', limit).set('orden', orden);
    if (autor) params = params.set('autor', autor);
  
                // entre <> la forma de lo que llega
    return this.http.get<ListadoPublicaciones>(this.url, { params });
  }

  obtenerPublicacion(id: string) {
              // entre <> la forma de lo que llega    // conctenamos la url
    return this.http.get<Publicacion>(this.url + '/' + id);
  }

  crear(datos: FormData) {
              // entre <> la forma de lo que llega
    return this.http.post<Publicacion>(this.url, datos);
  }

  eliminar(id: string) {
             // aca entre <> no llega nada // conctenamos la url
    return this.http.delete<void>(this.url + '/' + id);
  }

  darMeGusta(id: string) {
                       // entre <> la forma de lo que llega    // conctenamos la url
    return this.http.post<EstadoMeGusta>(this.url + '/' + id + '/me-gusta', {});
  }

  quitarMeGusta(id: string) {
                       // entre <> la forma de lo que llega      // conctenamos la url
    return this.http.delete<EstadoMeGusta>(this.url + '/' + id + '/me-gusta');
  }
}
