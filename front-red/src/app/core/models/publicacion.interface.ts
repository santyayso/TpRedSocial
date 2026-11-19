export interface AutorPublicacion {
  id: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  imagen_url: string;
}

export interface Publicacion {
  id: string;
  titulo: string;
  mensaje: string;
  imagen_url: string;
  autor: AutorPublicacion;
  cantidadMeGusta: number;
  meGusta: boolean;
  createdAt: string;
}

export interface ListadoPublicaciones {
  totalPublicaciones: number;
  offset: number;
  limit: number;
  publicaciones: Publicacion[];
}

export interface EstadoMeGusta {
  id: string;
  cantidadMeGusta: number;
  meGusta: boolean; // para saber si YO le di me gusta, true o false
}

export type OrdenamientoPublicaciones = 'fecha' | 'meGusta';
