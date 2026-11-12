import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class LogsMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const inicioRequest = Date.now();
     // imprime                //corta todo lo que esta  a la izquierda del ?
    this.logger.log(`${req.method} ${req.originalUrl.split('?')[0]}`);
    res.once('finish', () => {
      // cuando  termina  la respuesta  calcula el tiempo que tardó
      const duracionResponse = Date.now() - inicioRequest;
      this.logger.log(`← ${res.statusCode} (${duracionResponse} ms)`);
    });
    next();
  }
}
