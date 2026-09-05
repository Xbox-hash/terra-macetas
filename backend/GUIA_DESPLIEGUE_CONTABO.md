# Guía de Despliegue en Servidor Contabo (Backend + Frontend + Evolution API)

Esta guía detalla cómo desplegar el proyecto en un servidor VPS de **Contabo** con costo de gateway WhatsApp **$0 USD**.

---

## 🏗️ Arquitectura en el VPS Contabo

```
                    ┌────────────────────────┐
                    │      VPS CONTABO       │
                    │                        │
  [Navegador Web] ──┼─► NGINX (Reverse Proxy)│
                    │     ├─► Frontend (React / Dist) [:80/:443]
                    │     ├─► Backend (ASP.NET Core)  [:5000]
                    │     └─► SQL Server / PostgreSQL
                    │
  [Backend .NET]  ──┼─► Evolution API (Docker) [:8080]
                    │         │
                    │         ▼ (WhatsApp Web Protocol)
                    │     [WhatsApp Celular Empresa]
                    └────────────────────────┘
```

---

## 🚀 Paso 1: Levantar Evolution API (WhatsApp Gateway) en Contabo

En la carpeta del backend ya tenés el archivo [`docker-compose-evolution.yml`](file:///C:/repos/TerraMacetas.Api/docker-compose-evolution.yml).

1. Subir ese archivo al servidor VPS.
2. Ejecutar:
   ```bash
   docker compose -f docker-compose-evolution.yml up -d
   ```
3. El servicio estará activo en el puerto `8080`.

---

## 📲 Paso 2: Vincular el número de WhatsApp de la Empresa (QR)

1. En tu navegador abrí: `http://IP_DE_TU_CONTABO:8080/instance/create` (o mediante Postman / Dashboard de Evolution).
2. Creá la instancia `terra_instance`:
   ```bash
   curl -X POST "http://localhost:8080/instance/create" \
     -H "Content-Type: application/json" \
     -H "apikey: TerraSecretApiKey2026_WhatsAppGateway!" \
     -d '{"instanceName": "terra_instance", "qrcode": true}'
   ```
3. Escaneá el **código QR** que aparece con el WhatsApp del negocio (*Dispositivos vinculados*).
4. ¡Listo! A partir de ese momento el servidor tiene permiso para enviar mensajes solos.

---

## ⚙️ Paso 3: Configuración en ASP.NET Core (`appsettings.json`)

En tu [`appsettings.json`](file:///C:/repos/TerraMacetas.Api/appsettings.json) del backend:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=TerraMacetasDb;User Id=sa;Password=TuPasswordSeguro!;TrustServerCertificate=True;"
  },
  "WhatsAppGateway": {
    "Enabled": true,
    "BaseUrl": "http://localhost:8080",
    "ApiKey": "TerraSecretApiKey2026_WhatsAppGateway!",
    "InstanceName": "terra_instance"
  }
}
```

---

## 📩 Qué sucede automáticamente al recibir un pedido:

Cuando un cliente presiona **"Confirmar y Enviar Pedido"** en la web:
1. El backend guarda la orden en la tabla `dbo.Orders` de SQL Server.
2. El servicio `EvolutionWhatsAppService.cs` dispara **2 mensajes automáticos**:
   - **Al WhatsApp del Dueño/Empresa:** Recibe la notificación de nuevo pedido con el desglose de macetas, monto total y datos del cliente.
   - **Al WhatsApp del Cliente:** Recibe un mensaje automático agradeciéndole la compra e informándole que en instantes se comunicarán con él.
