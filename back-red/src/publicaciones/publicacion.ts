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
  autor: AutorPublicacion | null;
  cantidadMeGusta: number;
  meGusta: boolean;
  createdAt: Date;
}
