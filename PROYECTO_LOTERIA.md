# 🎰 Lotería Visitas Web - Sistema de Control de Accesos

PWA desarrollada con **Angular 20** para el control de visitas en la Lotería de Córdoba.

## 🏗️ Arquitectura

- **Framework**: Angular 20 (Standalone Components)
- **Estado**: Signals API (input, output, signal, computed)
- **UI Kit**: Angular Material + TailwindCSS
- **Patrones**: Clean Architecture + Feature-First
- **Control Flow**: Nueva sintaxis (@if, @for)

## 📁 Estructura del Proyecto

```
src/app/
├── core/                    # Servicios e infraestructura core
│   ├── guards/             # Guards funcionales (CanActivateFn)
│   │   ├── auth.guard.ts
│   │   └── role.guard.ts
│   ├── interceptors/       # Interceptores HTTP funcionales
│   │   └── auth.interceptor.ts
│   ├── models/             # Interfaces y modelos
│   │   └── visitor.model.ts
│   └── services/           # Servicios globales
│       ├── auth.service.ts
│       ├── visits.service.ts
│       └── innovation.service.ts
│
├── features/               # Módulos por funcionalidad
│   ├── auth/
│   │   └── login/
│   │       └── login.component.ts
│   ├── check-in/          # Módulo de recepción (Kiosco)
│   │   ├── check-in.component.ts
│   │   ├── qr-scanner.component.ts
│   │   └── scan-dni.component.ts
│   └── dashboard/         # Módulo administrativo
│       └── dashboard.component.ts
│
├── shared/                # Componentes reutilizables
│   └── components/
│       ├── kiosk-button.component.ts
│       └── status-tag.component.ts
│
└── environments/          # Configuración por entorno
    ├── environment.ts
    └── environment.prod.ts
```

## 🚀 Funcionalidades Principales

### 1. Check-In (Modo Kiosco)
- ✅ Escaneo de QR con `@zxing/ngx-scanner`
- ✅ OCR de DNI con `tesseract.js`
- ✅ Formulario manual de registro
- ✅ Interfaz táctil optimizada

### 2. Dashboard Administrativo
- ✅ Tabla con Angular Material
- ✅ Filtros por estado, fecha, búsqueda
- ✅ Registro de check-out
- ✅ Exportación de datos

### 3. Autenticación y Seguridad
- ✅ Login con JWT
- ✅ Guards por roles (ADMIN, GUARDIA, SUPERVISOR)
- ✅ Interceptor Bearer Token
- ✅ Manejo de sesión con LocalStorage

## 🔧 Configuración

### Variables de Entorno

Edita `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1' // URL de tu backend
};
```

### Instalación

```bash
# Instalar dependencias
npm install

# Instalar PrimeNG (si no está)
npm install primeng primeicons

# Ejecutar en desarrollo
npm start
```

### Configuración del Backend

El frontend espera que el backend (Node.js 20) exponga estos endpoints:

```
POST   /api/v1/auth/login
POST   /api/v1/visits
GET    /api/v1/visits
GET    /api/v1/visits/:id
POST   /api/v1/visits/check-in/qr
PATCH  /api/v1/visits/:id/check-out
PATCH  /api/v1/visits/:id/cancel
```

## 📱 Características Técnicas Angular 20

### Signals en lugar de @Input/@Output
```typescript
// ❌ Forma antigua
@Input() label: string;
@Output() clicked = new EventEmitter();

// ✅ Forma moderna (Angular 20)
readonly label = input.required<string>();
readonly clicked = output<void>();
```

### Nueva Sintaxis de Control Flow
```typescript
// ❌ Forma antigua
*ngIf="condition"
*ngFor="let item of items"

// ✅ Forma moderna
@if (condition) { }
@for (item of items; track item.id) { }
```

### Componentes Standalone
Todos los componentes son standalone (sin NgModules):
```typescript
@Component({
  selector: 'app-example',
  imports: [CommonModule, FormsModule],
  template: `...`
})
```

### Inyección con inject()
```typescript
// ❌ Forma antigua
constructor(private service: MyService) {}

// ✅ Forma moderna
private readonly service = inject(MyService);
```

## 🎨 UI/UX

- **Kiosco**: Botones grandes, alto contraste, navegación simple
- **Admin**: Tabla responsive, filtros avanzados, acciones rápidas
- **Responsive**: Optimizado para tablets y desktop
- **Accesibilidad**: Íconos, tooltips, feedback visual

## 🔐 Roles y Permisos

| Rol | Check-In | Dashboard | Gestión |
|-----|----------|-----------|---------|
| GUARDIA | ✅ | ❌ | ❌ |
| SUPERVISOR | ✅ | ✅ | ❌ |
| ADMIN | ✅ | ✅ | ✅ |

## 📦 Dependencias Principales

```json
{
  "@angular/core": "^20.3.0",
  "@angular/material": "^20.2.14",
  "@zxing/ngx-scanner": "^20.0.0",
  "tesseract.js": "^6.0.1",
  "date-fns": "^4.1.0",
  "tailwindcss": "^3"
}
```

## 🚦 Próximos Pasos

1. Implementar el backend en Node.js 20
2. Configurar HTTPS y certificados
3. Implementar PWA manifest y service workers
4. Agregar notificaciones push
5. Implementar modo offline

## 📞 Soporte

Para consultas técnicas o mejoras, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2025  
**Stack**: Angular 20 + Node.js 20 + PostgreSQL/MongoDB
