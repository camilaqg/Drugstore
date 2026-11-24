// Modelo del usuario tal como lo devuelve el backend:
// GET /usuario y GET /usuario/:id responden sin la contraseña.
export interface Usuario {
  // El backend siempre devuelve el id en las consultas; queda opcional
  // porque el registro crea el usuario sin id (lo asigna el servidor).
  id?: number;
  nombre: string;
  correo: string;
  usuario: string;
  rol: string;
}

// Roles válidos del backend (T5): solo 'admin' y 'cliente'.
export type RolUsuario = 'admin' | 'cliente';

// Datos que acepta PATCH /usuario/:id (solo admin). `contrasena` es
// opcional: si no se manda, el servidor no cambia la contraseña.
export interface ActualizarUsuario {
  nombre?: string;
  correo?: string;
  rol?: RolUsuario;
  contrasena?: string;
}
