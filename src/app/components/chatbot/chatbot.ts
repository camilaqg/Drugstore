import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.css']
})

export class ChatbotComponent {

  // ABRIR Y CERRAR CHAT
  abierto = false;

  // MENSAJE DEL INPUT
  mensaje = '';

  // MENSAJES DEL CHAT
  mensajes: any[] = [

    {
      texto: '¡Hola! Bienvenido a Droguería Pili. Soy tu asistente virtual. Puedes consultar la disponibilidad y el precio de cualquier medicamento escribiendo su nombre.',
      bot: true
    }

  ];

  // MEDICAMENTOS DISPONIBLES
  medicamentosDisponibles = [

    {
      nombre: 'acetaminofen',
      precio: 5000
    },

    {
      nombre: 'ibuprofeno',
      precio: 8000
    },

    {
      nombre: 'amoxicilina',
      precio: 12000
    }

  ];

  // ENVIAR MENSAJE
  enviarMensaje(): void {

    if (!this.mensaje.trim()) {
      return;
    }

    const textoUsuario = this.mensaje;

    // MENSAJE DEL USUARIO
    this.mensajes.push({

      texto: textoUsuario,
      bot: false

    });

    // LIMPIAR INPUT
    this.mensaje = '';

    // RESPUESTA DEL BOT
    const respuesta = this.generarRespuesta(textoUsuario);

    this.mensajes.push({

      texto: respuesta,
      bot: true

    });

  }

  // GENERAR RESPUESTA
  generarRespuesta(texto: string): string {

    const mensaje = texto.toLowerCase().trim();

    // SALUDOS
    if (

      mensaje === 'hola' ||
      mensaje === 'buenas' ||
      mensaje === 'buenos dias' ||
      mensaje === 'buenas tardes' ||
      mensaje === 'buenas noches'

    ) {

      return '¡Hola! Escribe el nombre de un medicamento y te indicaré si está disponible y cuál es su precio.';

    }

    // BUSCAR MEDICAMENTO
    for (let medicamento of this.medicamentosDisponibles) {

      if (mensaje.includes(medicamento.nombre)) {

        return ` El medicamento ${medicamento.nombre.toUpperCase()} está disponible.

Precio: COP $${medicamento.precio.toLocaleString()}`;

      }

    }

    // NO ENCONTRADO
    return 'El medicamento consultado no se encuentra disponible en este momento.';

  }

}