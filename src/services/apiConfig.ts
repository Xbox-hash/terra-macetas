// Proxy inverso a través del servidor Vite:
// Al usar la ruta relativa '/api', cualquier petición del frontend pasa por el servidor local de Vite
// y se reenvía internamente al Backend en el puerto 5000.
// Esto garantiza funcionamiento perfecto en:
// 1. Localhost
// 2. Wi-Fi Local (192.168.x.x)
// 3. Túnel de VS Code (https://...devtunnels.ms) sin errores de SSL ni de CORS.
export const API_BASE = '/api';
