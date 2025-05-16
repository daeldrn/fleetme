import { PrismaClient } from '@prisma/client';

// Declara una variable global para el cliente Prisma
// Esto es para evitar crear múltiples instancias en desarrollo debido al hot-reloading
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Crea la instancia del cliente Prisma, reutilizándola si ya existe en el entorno global (desarrollo)
// o creando una nueva instancia en producción.
export const prisma =
  global.prisma ||
  new PrismaClient({
    // Opcional: Habilitar logging de consultas en desarrollo
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Si estamos en desarrollo, asigna la instancia al objeto global
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Exporta la instancia para usarla en otras partes de la aplicación
export default prisma;
