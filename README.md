# 🪴 TERRA - Macetas de Autor & Diseño Botánico

Sistema web integral de catálogo, pedidos por WhatsApp y panel administrativo para negocios de venta de macetas artesanales y decoración botánica.

---

## 🏛️ Arquitectura del Proyecto

Este repositorio contiene la solución completa de **Frontend** y **Backend**:

```
terra-macetas/
├── src/                          # Frontend en React 19 + TypeScript + Tailwind CSS
├── public/                       # Assets estáticos y favicon
├── backend/                      # Backend API en ASP.NET Core 8 + SQL Server
│   ├── Controllers/              # Endpoints REST (Products, Lines, Company, Orders, Dashboard)
│   ├── Data/                     # EF Core AppDbContext y Seed inicial
│   ├── DTOs/                     # Data Transfer Objects
│   ├── Models/                   # Entidades de base de datos
│   ├── Services/                 # EvolutionWhatsAppService (WhatsApp Gateway $0)
│   ├── docker-compose-evolution.yml # Gateway WhatsApp Autónomo en Docker
│   ├── TerraMacetas.sln          # Solución para abrir en Visual Studio
│   └── appsettings.json          # Configuración de SQL Server y Gateway
├── package.json                  # Dependencias frontend (React, Lucide, Tailwind, Vite)
└── README.md                     # Documentación general
```

---

## ✨ Características Principales

### 🌿 1. Sitio Público & Catálogo
- **Diseño Orgánico & Minimalista:** Paleta neutra (crema, tonos tierra, verde salvia y grafito) con tipografía *Cormorant Garamond* y *Plus Jakarta Sans*.
- **Catálogo Interactivo:** Búsqueda en tiempo real, filtro dinámico por líneas de diseño y ordenamiento por precios.
- **Detalle de Producto:** Galería interactiva con miniaturas, especificaciones de material/acabado y piezas relacionadas.
- **Carrito de Compras con Flujo Sutil de WhatsApp:**
  - El cliente completa solo sus datos de entrega (*Nombre, Teléfono y Ciudad*).
  - Al confirmar, el pedido se guarda en **SQL Server** y se genera el mensaje para WhatsApp.
  - La pantalla muestra el agradecimiento personalizado: *"¡Muchas gracias por realizar tu pedido! En un momento alguien de [Empresa] se estará contactando con vos"*.
  - El carrito se vacía de forma automática.

### 📊 2. Panel Administrativo (`/admin`)
- **Dashboard de Métricas en Vivo:**
  - Contador de visitas totales a la tienda y visitas del día.
  - Pedidos realizados, pedidos pendientes y pedidos cerrados con facturación acumulada.
  - **Gestor de Pedidos:** Tabla con detalle de productos y botón **`Dar por Cerrado` ✅** para registrar la venta concretada.
- **Gestión de Líneas:** CRUD de familias de macetas con selector de fotos e indicadores de modelos activos.
- **Gestión de Productos:** CRUD de catálogo con fotos, precios en Guaraníes (₲), dimensiones y toggle activo/inactivo (sin requerir stock obligatorio).
- **Datos de la Empresa:** Configuración del nombre del negocio, logo, número de WhatsApp de pedidos, teléfono de contacto, dirección física y horarios.

### 🤖 3. WhatsApp Gateway Autónomo (Costo $0 en VPS Contabo)
- Integración preparada con **Evolution API** (`backend/docker-compose-evolution.yml`) para enviar automáticamente la notificación al negocio y la confirmación al cliente escaneando un código QR una sola vez.

---

## 🚀 Cómo Ejecutar Localmente

### 1. Iniciar el Backend (ASP.NET Core + SQL Server)
1. Abrir `backend/TerraMacetas.sln` en **Visual Studio** y presionar **F5** (o mediante consola):
   ```bash
   cd backend
   dotnet run --urls http://127.0.0.1:5000
   ```
2. Swagger UI disponible en: `http://127.0.0.1:5000/swagger`

### 2. Iniciar el Frontend (React + Vite)
1. En la raíz del proyecto:
   ```bash
   npm install
   npm run dev
   ```
2. Abrir en el navegador: `http://127.0.0.1:5173/`
3. Panel administrativo: `http://127.0.0.1:5173/admin/dashboard` (*Credenciales: `admin@terra.com` / `admin123`*)

---

## ☁️ Despliegue en Servidor Contabo
Consultar el archivo [`backend/GUIA_DESPLIEGUE_CONTABO.md`](./backend/GUIA_DESPLIEGUE_CONTABO.md) para los pasos detallados de publicación con Nginx y Docker.
