export interface AutorPublicacionInterface {
  id: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  imagen_url: string;
}

export interface PublicacionInterface {
  id: string;
  titulo: string;
  mensaje: string;
  imagen_url: string;
  autor: AutorPublicacionInterface | null;
  cantidadMeGusta: number;
  meGusta: boolean;
  createdAt: Date;
}
