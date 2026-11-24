import { ChatbotComponent } from './chatbot';

describe('ChatbotComponent', () => {
  let component: ChatbotComponent;

  beforeEach(() => {
    component = new ChatbotComponent();
  });

  it('crea el componente con el mensaje de bienvenida', () => {
    expect(component).toBeTruthy();
    expect(component.mensajes.length).toBe(1);
    expect(component.mensajes[0].bot).toBe(true);
    expect(component.mensajes[0].texto).toContain('Droguería Pili');
  });

  it('responde al saludo con instrucciones', () => {
    component.mensaje = 'hola';
    component.enviarMensaje();

    expect(component.mensajes.length).toBe(3);
    expect(component.mensajes[1].bot).toBe(false);
    expect(component.mensajes[1].texto).toBe('hola');
    expect(component.mensajes[2].bot).toBe(true);
    expect(component.mensajes[2].texto).toContain(
      'Escribe el nombre de un medicamento'
    );
  });

  it('responde el precio de un medicamento disponible', () => {
    component.mensaje = '¿cuánto cuesta el acetaminofen?';
    component.enviarMensaje();

    const respuesta = component.mensajes[2].texto;
    expect(respuesta).toContain('ACETAMINOFEN');
    expect(respuesta).toContain('Precio');
    // 5000 con separador de miles.
    expect(respuesta).toMatch(/5[.,]000/);
  });

  it('informa cuando el medicamento no está disponible', () => {
    component.mensaje = 'tienen dolex?';
    component.enviarMensaje();

    expect(component.mensajes[2].texto).toContain(
      'no se encuentra disponible'
    );
  });

  it('ignora un mensaje vacío o de solo espacios', () => {
    component.mensaje = '   ';
    component.enviarMensaje();

    expect(component.mensajes.length).toBe(1);
  });

  it('limpia el input después de enviar', () => {
    component.mensaje = 'hola';
    component.enviarMensaje();

    expect(component.mensaje).toBe('');
  });
});
