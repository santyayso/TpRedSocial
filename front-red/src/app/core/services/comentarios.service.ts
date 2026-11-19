import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Comentario, ListadoComentarios } from '../models/comentario.interface';

@Injectable({ providedIn: 'root' })
export class ComentariosService {
  private http = inject(HttpClient);

  // los comentarios cuelgan de las publicaciones, asi que usan la misma ruta base
  private url = environment.apiUrl + '/publicaciones';

  listarComentarios(idPublicacion: string, offset: number, limit: number) {
    // fijamos los parametros
    const params = new HttpParams().set('offset', offset).set('limit', limit);

                // entre <> la forma de lo que llega    // conctenamos la url
    return this.http.get<ListadoComentarios>(this.url + '/' + idPublicacion + '/comentarios', { params });
  }

  crearComentario(idPublicacion: string, mensaje: string) {
                // entre <> la forma de lo que llega    // conctenamos la url    // el body es un objeto con el mensaje
    return this.http.post<Comentario>(this.url + '/' + idPublicacion + '/comentarios', { mensaje });
  }

  modificarComentario(idComentario: string, mensaje: string) {
                // entre <> la forma de lo que llega    // conctenamos la url    // el body es un objeto con el mensaje nuevo
    return this.http.put<Comentario>(this.url + '/comentarios/' + idComentario, { mensaje });
  }
}
