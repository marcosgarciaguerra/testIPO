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
