import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/usuario.interface';

export interface Sesion {
  access_token: string;
  usuario: Usuario;
}

// el token vence a los 15 minutos, asi que avisamos a los 10 (10 minutos pasados a milisegundos)
const MILISEGUNDOS_HASTA_AVISO = 10 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private url = environment.apiUrl + '/auth';
  private key = 'red-social-token';
  // aca guardamos el momento en que empezo la sesion (o en que se refresco el token), para calcular cuanto falta para el aviso
  private keyInicioSesion = 'red-social-inicio-sesion';
  // guarda el temporizador que esta corriendo, para poder cancelarlo
  private temporizadorAviso: number | null = null;

  currentUser = signal<Usuario | null>(null);
  // true mientras la app valida el token contra el back al iniciar (en ese tiempo se muestra la pantalla de cargando)
  validandoSesion = signal(true);
  // true cuando hay que mostrar el modal que avisa que quedan 5 minutos de sesion
  avisoSesionAbierto = signal(false);

  accessToken() {
    return localStorage.getItem(this.key);
  }

  // el primer dato puede ser el correo o el nombre de usuario, el back se encarga de ver cual es
  signIn(emailOUsuario: string, password: string) {
    return this.http.post<Sesion>(this.url + '/login', { emailOUsuario, password });
  }

  signUp(datos: FormData) {
    return this.http.post<Sesion>(this.url + '/register', datos);
  }

  // valida el token (que viaja en el header gracias al interceptor) y si es valido devuelve el usuario
  autorizar() {
    return this.http.post<Usuario>(this.url + '/autorizar', {});
  }

  // pide un token nuevo (que vuelve a durar 15 minutos) a cambio del que todavia es valido
  refrescar() {
    return this.http.post<Sesion>(this.url + '/refrescar', {});
  }

  iniciarSesion(sesion: Sesion) {
    localStorage.setItem(this.key, sesion.access_token);
    // Date.now() devuelve la hora actual en milisegundos
    localStorage.setItem(this.keyInicioSesion, String(Date.now()));
    this.currentUser.set(sesion.usuario);
    this.iniciarContadorSesion();
  }

  // arranca el contador de 10 minutos, cuando termina se abre el modal que avisa que quedan 5 minutos
  iniciarContadorSesion() {
    // si ya habia un contador corriendo lo cancelamos, para que no queden dos a la vez
    this.detenerContadorSesion();

    // si recargamos la pagina, el contador arranca de nuevo, pero la sesion empezo antes
    // por eso restamos el tiempo que ya paso desde que empezo la sesion
    const inicioGuardado = localStorage.getItem(this.keyInicioSesion);
    let milisegundosTranscurridos = 0;
    if (inicioGuardado) {
      milisegundosTranscurridos = Date.now() - Number(inicioGuardado);
    }

    let milisegundosRestantes = MILISEGUNDOS_HASTA_AVISO - milisegundosTranscurridos;
    if (milisegundosRestantes < 0) {
      milisegundosRestantes = 0;
    }

    // setTimeout ejecuta la funcion una sola vez, cuando pasan los milisegundos que le pasamos
    this.temporizadorAviso = window.setTimeout(() => {
      this.avisoSesionAbierto.set(true);
    }, milisegundosRestantes);
  }

  private detenerContadorSesion() {
    if (this.temporizadorAviso !== null) {
      window.clearTimeout(this.temporizadorAviso);
      this.temporizadorAviso = null;
    }
  }

  signOut() {
    localStorage.removeItem(this.key);
    localStorage.removeItem(this.keyInicioSesion);
    this.detenerContadorSesion();
    this.avisoSesionAbierto.set(false);
    this.currentUser.set(null);
  }
}
