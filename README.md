# IPO · Técnicas de Usabilidad (serverless)

Versión **solo HTML, CSS y JavaScript** del catálogo IPO. Sin servidor Go ni API: los datos se cargan desde `data/techniques.json`.

Derivada de la rama `accesibilidad-version` (WCAG 2.1 AA).

## Estructura

```
index.html          Catálogo (búsqueda, filtros, wizard, tour)
detail.html         Ficha de técnica (?id=heuristica)
static/
  app.js            Lógica del listado
  detail.js         Ficha dinámica
  theme.css         Estilos
  images/           Ilustraciones SVG
data/
  techniques.json   Datos del catálogo
```

## Uso local

Sirve la carpeta con cualquier servidor estático (necesario por `fetch` del JSON):

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Abre http://localhost:8080/index.html

## GitHub Pages

1. Settings → Pages → Source: rama `serverless`, carpeta `/ (root)`.
2. La URL será `https://<usuario>.github.io/testIPO/` (o el nombre del repo).
3. El archivo `.nojekyll` evita que Jekyll ignore carpetas con guión bajo.

## Despliegue en Netlify / Vercel

Publica la raíz del repo como sitio estático; no hace falta build.

## Diferencias respecto a la versión Go

| Función | Go (`accesibilidad-version`) | Serverless (`serverless`) |
|---------|------------------------------|---------------------------|
| Listado | SSR + API | `index.html` + JSON |
| Ficha | `/tecnicas/{id}` | `detail.html?id=` |
| Admin CRUD | `/admin` + API | No incluido |

Para editar técnicas, modifica `data/techniques.json` y las imágenes en `static/images/`.

## Accesibilidad

Misma base WCAG 2.1 AA que la rama de accesibilidad: skip link, foco en modales/drawer/tour, contraste en hero, `prefers-reduced-motion`, etc.

## Repositorio

https://github.com/marcosgarciaguerra/testIPO (rama `serverless`)
