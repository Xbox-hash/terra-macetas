# 🚀 Guía de Despliegue y Configuración en Producción (VPS Contabo)

Esta guía explica paso a paso cómo configurar **Evolution API (WhatsApp Autónomo)** y el acceso de **Superusuario / Desarrollador** al desplegar en tu VPS de Contabo.

---

## 🏗️ Arquitectura de Servicios en Contabo

```
                    ┌────────────────────────┐
                    │      VPS CONTABO       │
                    │                        │
  [Navegador Web] ──┼─► NGINX (Reverse Proxy)│
                    │     ├─► Frontend (React / Dist) [:80/:443]
                    │     ├─► Backend (.NET 8 Web API) [:5000]
                    │     └─► SQL Server / PostgreSQL
                    │
  [Backend .NET]  ──┼─► Evolution API (Docker) [:8080]
                    │         │
                    │         ▼ (WhatsApp Web Protocol)
                    │     [WhatsApp Celular Empresa]
                    └────────────────────────┘
```

---

## 🛠️ PASO 1: Levantar Evolution API en Contabo

1. Conectate por SSH a tu servidor Contabo:
   ```bash
   ssh root@TU_IP_CONTABO
   ```
2. Creá el directorio y subí el archivo `docker-compose-evolution.yml`:
   ```bash
   mkdir -p /opt/terra/evolution && cd /opt/terra/evolution
   ```
3. Iniciá los contenedores:
   ```bash
   docker compose -f docker-compose-evolution.yml up -d
   ```
4. Verificá que los contenedores estén activos:
   ```bash
   docker ps
   ```

---

## 📱 PASO 2: Vincular el WhatsApp del Negocio (Código QR)

1. Creá la instancia `terra_bot` en tu servidor:
   ```bash
   curl -X POST "http://localhost:8080/instance/create" \
     -H "Content-Type: application/json" \
     -H "apikey: TerraSecretApiKey2026_WhatsAppGateway!" \
     -d '{"instanceName": "terra_bot", "qrcode": true, "integration": "WHATSAPP-BAILEYS"}'
   ```
2. Obtené el código QR de conexión:
   ```bash
   curl -X GET "http://localhost:8080/instance/connect/terra_bot" \
     -H "apikey: TerraSecretApiKey2026_WhatsAppGateway!"
   ```
3. Escaneá el QR desde el teléfono del negocio (**WhatsApp > Ajustes > Dispositivos vinculados > Vincular dispositivo**).

---

## 🔑 PASO 3: Configuración con tu Superusuario en el Panel Web

Una vez que la web esté publicada en tu dominio:

1. Ingresá al panel: `https://tudominio.com/admin/login`
2. **Iniciá sesión como Desarrollador**:
   - **Usuario:** `dev`
   - **Contraseña:** `dev12345`
3. Andá a **Datos de la Empresa** (`/admin/empresa`).
4. Verás la tarjeta exclusiva para desarrollador:
   - **URL Servidor Evolution API:** `http://localhost:8080` (o `http://127.0.0.1:8080`).
   - **Nombre de Instancia:** `terra_bot`.
   - **API Key:** `TerraSecretApiKey2026_WhatsAppGateway!`.
5. Presioná **Guardar Información**.

---

## 👤 PASO 4: Entrega al Cliente

Al entregarle el sistema al cliente:
- Le entregás su usuario: `admin` (Contraseña: `admin123` o la que elija).
- **El cliente NUNCA verá** los datos técnicos del gateway, API Keys, ni la existencia del usuario `dev`. Solo verá su número de teléfono comercial para recibir pedidos.
