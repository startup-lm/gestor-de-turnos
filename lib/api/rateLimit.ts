type RateLimitResponse = {
  success: boolean;
  limit: number;
  remaining: number;
};

// Mapa en memoria para almacenar las marcas de tiempo de las peticiones por IP.
// Persiste entre peticiones dentro de la misma instancia del servidor.
const tracker = new Map<string, number[]>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60 * 1000; // Ejecutar limpieza cada 60 segundos

/**
 * Controla el límite de peticiones de una dirección IP (Sliding Window Algorithm).
 * 
 * @param ip Dirección IP de la petición.
 * @param limit Número máximo de peticiones permitidas en la ventana de tiempo.
 * @param windowMs Duración de la ventana de tiempo en milisegundos.
 */
export function rateLimit(
  ip: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): RateLimitResponse {
  const now = Date.now();

  // 1. Obtener historial para la IP actual
  const timestamps = tracker.get(ip) ?? [];

  // 2. Filtrar únicamente las marcas de tiempo que entran en la ventana deslizante actual
  const validTimestamps = timestamps.filter(time => now - time < windowMs);

  // 3. Limpieza periódica global (Garbage Collector manual)
  // Evita el crecimiento indefinido del mapa en memoria con IPs inactivas
  if (now - lastCleanup > CLEANUP_INTERVAL || tracker.size > 5000) {
    const cutoff = now - windowMs;
    for (const [key, value] of tracker.entries()) {
      const active = value.filter(time => time >= cutoff);
      if (active.length === 0) {
        tracker.delete(key);
      } else {
        tracker.set(key, active);
      }
    }
    lastCleanup = now;
  }

  // 4. Comprobar si supera el límite establecido
  if (validTimestamps.length >= limit) {
    tracker.set(ip, validTimestamps); // Guardar historial filtrado
    return {
      success: false,
      limit,
      remaining: 0,
    };
  }

  // 5. Agregar la marca de tiempo actual y guardar
  validTimestamps.push(now);
  tracker.set(ip, validTimestamps);

  return {
    success: true,
    limit,
    remaining: limit - validTimestamps.length,
  };
}
