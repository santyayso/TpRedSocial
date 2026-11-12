import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/usuario.interface';

export interface Sesion {
  access_token: string;
  usuario: Usuario;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private url = environment.apiUrl + '/auth';
  private key = 'red-social-token';
  currentUser = signal<Usuario | null>(null);

  accessToken() {
    return localStorage.getItem(this.key);
  }

  signIn(email: string, password: string) {
    return this.http.post<Sesion>(this.url + '/login', { email, password });
  }

  signUp(datos: FormData) {
    return this.http.post<Sesion>(this.url + '/register', datos);
  }

  iniciarSesion(sesion: Sesion) {
    localStorage.setItem(this.key, sesion.access_token);
    this.currentUser.set(sesion.usuario);
  }

  restaurarSesion() {
    if (!this.accessToken()) return of(null);
    return this.http.get<Usuario>(this.url + '/me').pipe(
      tap((usuario) => this.currentUser.set(usuario)),
      catchError(() => {
        this.signOut();
        return of(null);
      }),
    );
  }

  signOut() {
    localStorage.removeItem(this.key);
    this.currentUser.set(null);
  }
}
