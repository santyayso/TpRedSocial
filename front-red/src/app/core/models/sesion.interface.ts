import { Usuario } from "./usuario.interface";
export interface Sesion {
  access_token: string;
  usuario: Usuario;
}