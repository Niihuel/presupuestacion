## Guía de estilos PRETENSA

### Paleta y temas
- **Claro**: `--primary: #0056a0` (PRETENSA Blue), `--secondary: #d92c3a` (PRETENSA Red), `--background: #F7F9FB`, `--foreground: #1a1a1a`, `--card: #ffffff`, `--border: #e5e7eb`.
- **Oscuro**: `--primary: #0056a0` (PRETENSA Blue), `--secondary: #d92c3a` (PRETENSA Red), `--background: #0f1117`, `--foreground: #f0f0f0`, `--card: #1a1d29`, `--border: #2a2d3a`.
- Gradientes de fondo: radial top-left con primary; bottom-right con secondary.

### Tipografía
- Fuente sans: `Geist` por defecto (cargada en `layout.tsx`).
- Tamaños base: `text-sm` para tablas, `text-base` general, títulos `text-xl`/`text-2xl`.

### Componentes base
- Botones: bordes redondeados, `transition` suave, variante primaria fondo `--primary` (PRETENSA Blue) y variante `destructive` con `--secondary` (PRETENSA Red).
- Inputs/selects: `border rounded px-3 py-2`, foco con `ring` sutil usando `--primary` (PRETENSA Blue).
- Cards/tablas: `border rounded-md`, encabezado de tabla `bg-gray-50` (oscuro: `dark:bg-neutral-900` para uniformidad en todas las tablas).
 - Cards/tablas: Card con borde más marcado (`border-gray-200` / `dark:border-white/25`), fondo sutil (`bg-white/80` y `dark:bg-black/60`), headers de tabla `bg-gray-50` (oscuro: `dark:bg-neutral-900`).

### Animaciones
- Easing: `easeInOut` en Framer Motion para compatibilidad tipada; equivalente visual a bezier suave.
- Fade-in-up: opacidad 0 → 1 y `y: 10 → 0` en 0.4s (ver `src/lib/ui/motion.tsx`).

### Accesibilidad
- Contraste mínimo WCAG AA (fondos claros/oscuro ya contemplados).
- `:focus` visible (usar `outline-ring/50`).

### Patrones UI
- Header de página: Card de título (espacio/jerarquía), luego Card de filtros/acciones, y después tabla.
- Listas con paginación y sorting en cabecera (flechas ▲/▼). Cabecera oscura: `dark:bg-neutral-900`.
 - Tabs de sección (Roles/Permisos, Parámetros/Histórico) alineadas a la izquierda dentro del header, estilo pill con blur/borde.
- Formularios con validación Zod y `react-hook-form` (errores bajo el campo).
- Navegación superior fija con selector de tema y menú de usuario (avatar + logout).

### Notas de implementación
- Tematización con `next-themes` (`ThemeProvider`) y `ThemeToggle` (iconos `lucide-react`).
- Navbar: blur + borde, glow activo PRETENSA Blue, `focus-visible:ring-primary/50`.
 - Dropdown usuario: panel translúcido con blur fuerte (`backdrop-blur-xl`) y bordes sutiles.
- Usa utilidades de Tailwind v4 (`@apply bg-background text-foreground`, `border-border`).
- Animaciones con Framer Motion (`MotionDiv`, `fadeInUp`).
- Logo corporativo: `logo.png` en login y header del dashboard.
- Favicon: `pretensa-icon.png` como `favicon.ico`.