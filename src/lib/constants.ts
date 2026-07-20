// Lista de usuarios autorizados a entrar al dashboard.
// La sesión se identifica por `usuario` (cookie sede_session) y se
// valida el PIN contra esta lista en el flujo de login.
//
// Reemplaza este placeholder por tus usuarios reales antes de desplegar.
export const SUCURSALES_DATA = [
  {
    usuario: "admin",
    ciudad: "Oficina Central",
    responsable: "Administrador",
    telefono: "",
    correo: "admin@example.com",
    pin: "4153",
    role: "admin",
    maneja_stock: false,
  },
];
