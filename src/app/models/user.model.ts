// Un usuario es quien inicia sesión en la aplicación. No es lo mismo que un autor:
// los autores son datos del backoffice, como los libros.
export type UserRole = 'user' | 'admin';

// El usuario tal como lo devuelve la API (nunca trae la contraseña)
export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

// POST /auth/register
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: User;
}

// POST /auth/login
export interface LoginRequest {
  email: string;
  password: string;
}

// El refresh token no viene en el JSON: el backend lo deja en una cookie HttpOnly
export interface LoginResponse {
  token: string;
  user: User;
}

// POST /auth/refresh (sin body: el refresh token va en la cookie)
export interface RefreshResponse {
  token: string;
}

// GET /users/me: el usuario con sesión, para recuperarlo al recargar la página
export interface MeResponse {
  user: User;
}
