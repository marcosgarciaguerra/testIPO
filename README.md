# IPO-PaginaWeb — Técnicas de Usabilidad

Showcase web en **Go** (SSR + API REST) para explorar, filtrar y administrar técnicas de usabilidad orientadas a desarrolladores.

## Requisitos

- Go 1.21+

## Ejecución local

```bash
go run .
```

Abre http://localhost:8080

Puerto configurable:

```bash
set PORT=3000
go run .
```

## Variables de entorno

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `PORT` | Puerto HTTP | `8080` |
| `ADMIN_USER` | Usuario API admin | `adminipo` |
| `ADMIN_PASS` | Contraseña API admin | `adminn` |

Copia `.env.example` y exporta las variables en tu shell antes de `go run .`.

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Listado con búsqueda, filtros y cuestionario guiado |
| `/tecnicas/{id}` | Ficha detalle con pasos de ejecución |
| `/admin` | Panel CRUD (usa la API) |
| `/api/techniques` | GET listado · POST crear (auth) |
| `/api/techniques/{id}` | GET · PUT · DELETE (auth en escritura) |
| `/static/` | Imágenes y `app.js` |

## Estructura

```
main.go handlers.go api.go store.go auth.go model.go labels.go
data/techniques.json
templates/  index.html detail.html admin.html partials/
static/     app.js images/*.svg
```

## Tests

```bash
go test ./...
```

## Accesibilidad (WCAG 2.1 nivel AA)

La interfaz pública y el panel admin siguen prácticas para cumplir **WCAG 2.1 AA**. Antes de publicar cambios de UI, revisa:

### Checklist manual

- [ ] **Saltar al contenido:** con Tab, el primer foco muestra el enlace “Saltar al contenido principal” y lleva a `#main-content`.
- [ ] **Solo teclado:** recorrer `/` (buscador, filtros, tarjetas, wizard, tour manual, modal, drawer móvil) sin ratón.
- [ ] **Foco visible:** todos los controles interactivos muestran indicador de foco claro.
- [ ] **Contraste:** texto del hero y wizard legible sobre el degradado (clases `hero-text-muted` / `hero-text-subtle` en `theme.css`).
- [ ] **Tour:** no se inicia solo; solo al pulsar “¿Cómo usar la web?”.
- [ ] **Vista previa:** al enfocar una tarjeta con Tab aparece la vista previa (como con hover).
- [ ] **Movimiento reducido:** con `prefers-reduced-motion: reduce` en el SO, animaciones y scroll suave se reducen.
- [ ] **Formularios:** errores del wizard y del admin se anuncian y se asocian al campo (`aria-invalid`, `aria-describedby`).

### Verificación automatizada (opcional)

1. Abre la app (`go run .`).
2. En Chrome DevTools → **Lighthouse** → categoría *Accessibility* en `/`, `/tecnicas/heuristicas` (o cualquier id) y `/admin`. Objetivo: puntuación ≥ 90.
3. Extensión **axe DevTools:** flujos buscar → filtrar → ficha → wizard → tour; sin incidencias críticas o serias.

### Archivos relevantes

- `templates/partials/skip-link.html`, `templates/index.html`, `detail.html`, `admin.html`
- `static/app.js` — foco en modales, drawer, tour; preview por teclado; tarjetas como enlaces `<a>`
- `static/theme.css` — skip link, contraste hero, `prefers-reduced-motion`

## Autenticación API

Peticiones de escritura requieren **HTTP Basic Auth** con `ADMIN_USER` / `ADMIN_PASS`.

Ejemplo:

```bash
curl -u adminipo:adminn -X POST http://localhost:8080/api/techniques \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"demo\",\"name\":\"Demo\",...}"
```

## Despliegue

1. Define `ADMIN_USER` y `ADMIN_PASS` seguros en el hosting.
2. Asegura persistencia de `data/techniques.json` (volumen o almacenamiento).
3. Ejecuta el binario compilado: `go build -o ipo-web . && ./ipo-web`

## Repositorio

https://github.com/Megaplay20/IPO-PaginaWeb
