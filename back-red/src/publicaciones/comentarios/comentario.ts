import type { AutorPublicacionInterface } from '../publicacion';

export interface ComentarioInterface {
  id: string;
  mensaje: string;
  modificado: boolean;
  autor: AutorPublicacionInterface | null;
  createdAt: Date;
}
