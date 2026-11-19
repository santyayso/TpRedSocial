import { AutorPublicacion } from './publicacion.interface';

export interface Comentario {
  id: string;
  mensaje: string;
  modificado: boolean; // true si el autor lo edito despues de escribirlo
  autor: AutorPublicacion;
  createdAt: string;
}

export interface ListadoComentarios {
  totalComentarios: number;
  offset: number;
  limit: number;
  comentarios: Comentario[];
}
