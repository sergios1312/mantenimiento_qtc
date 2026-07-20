# 🛠️ Mantenimiento QTC — Sistema de Gestión de Activos y Mantenimiento

Este proyecto es una aplicación web empresarial diseñada para el **Grupo QTC**. Su objetivo es digitalizar, programar y auditar los mantenimientos preventivos y correctivos de equipos industriales y de transporte, optimizando la asignación de tareas a los técnicos y generando reportes de auditoría listos en formato PDF.

---

## 🚀 Características Clave

* **Identificación Rápida por Códigos QR:** Incorpora un generador y lector de códigos QR (`qrcode`) para etiquetar los activos físicos de la empresa. Los técnicos pueden escanear el QR del equipo para visualizar su historial técnico, manuales y registrar el checklist de mantenimiento in situ.
* **Control de Checklists e Historiales**: Registra incidencias, repuestos utilizados, firmas digitales y tiempos de servicio por equipo de manera centralizada.
* **Módulo de Analíticas e Indicadores (KPIs):** Panel de control con gráficos interactivos (`recharts`) que ilustran la tasa de fallas por tipo de máquina, costos de mantenimiento acumulados y tiempo promedio de reparación (MTTR).
* **Generación de Reportes PDF**: Exportación de reportes de servicio cerrados firmados digitalmente listos para descargar y compartir.
* **Optimización de Assets en la Nube (Cloudinary):** Integración con Cloudinary para cargar y comprimir las imágenes de evidencia de mantenimiento tomadas por los técnicos, asegurando tiempos de carga ultra-rápidos e integrando vistas miniatura optimizadas.

---

## 🛠️ Stack Tecnológico

* **Framework Core**: Next.js (App Router), React, TypeScript.
* **Estilos**: TailwindCSS.
* **Base de Datos & Backend**: Supabase (`@supabase/supabase-js`).
* **Generador de QR**: `qrcode`.
* **Gráficos & Dashboards**: `recharts`.
* **Documentación y Reportes**: `jspdf` y `jspdf-autotable`.
* **Notificaciones por Correo**: `nodemailer`.

---

## 📐 Estructura de Directorios

```text
mantenimiento_qtc/
├── src/
│   ├── app/                  # Páginas y endpoints de la API (Next.js App Router)
│   ├── components/           # Componentes de UI (Checklists, QR Scanner, Gráficos)
│   ├── lib/                  # Clientes de servicios (Supabase, Cloudinary)
│   └── data/                 # Configuración de checklists fijos y catálogos
├── public/                   # Recursos estáticos
├── package.json              # Gestión de librerías y dependencias
└── tsconfig.json             # Configuración de TypeScript
```

---

## 🧠 Habilidades Técnicas & Aprendizajes

* **Arquitectura de Escaneo de QR Integrada en Web**: Configuración de flujos que acceden a la cámara web del dispositivo del técnico a través del navegador, procesan el video en tiempo real e identifican el ID del activo en milisegundos.
* **Optimización de Carga Visual (Cloudinary CDN)**: Implementación de políticas de compresión sobre la marcha (on-the-fly transformations) de fotos de mantenimiento, reduciendo archivos pesados tomados por celulares a miniaturas ligeras optimizadas para la web.
* **Estructura Transaccional de Datos**: Modelado relacional en Supabase para registrar el historial de eventos del activo garantizando la integridad de datos si un técnico pierde la conexión a internet a mitad del checklist.

---

## 🔧 Configuración en Local

1. Asegúrate de tener **Node.js v18+** instalado.
2. Clona el proyecto e ingresa a la carpeta:
   ```bash
   npm install
   ```
3. Crea un archivo de variables de entorno `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
   CLOUDINARY_URL=tu_cloudinary_url
   ```
4. Levanta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abre [http://localhost:3000](http://localhost:3000) en el navegador.
