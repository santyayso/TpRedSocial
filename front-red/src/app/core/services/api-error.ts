import { HttpErrorResponse } from '@angular/common/http';

// exportamos la funcion
export function apiError(error: unknown): string {

  // preguntamos si es error de http, si no saltamos directo al final
  if (error instanceof HttpErrorResponse) {
    // si ni siquiera hay codigo de error es porque el back ni siquiera respondio
    if (error.status === 0){
      return 'No se pudo conectar con el servidor.';
    } 

    const message = error.error?.message;

    // si es una lista, reotornamos un string separando los distintos errores por un punto
    if (Array.isArray(message)) {
      return message.join('. ');
    }
    
    // si es de tiipo string (nuestros mensajes personalizaods), reetoramos el mismo error
    if (typeof message === 'string') {
      return message;
    }
  }

  // esto es para errores que no son de http
  if (error instanceof Error) {
    return error.message;
  }
  else{
    return 'Ocurrió un error. Intentá nuevamente.';
  }
  
}
