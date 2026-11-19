import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal {
  titulo = input('');
  // void para que al emitir el evento al padre no se mande nada
  cerrarModal = output<void>();
}
