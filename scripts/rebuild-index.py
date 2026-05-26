"""Rebuild index.html UTF-8 from accesibilidad-version template."""
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
content = subprocess.check_output(
    ["git", "show", "accesibilidad-version:templates/index.html"],
    cwd=ROOT,
).decode("utf-8")

head = """<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="Catálogo de técnicas de usabilidad para desarrolladores — IPO">
<title>Técnicas de Usabilidad</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          brand: { deep: '#0c4a6e', DEFAULT: '#0f766e', light: '#14b8a6', muted: '#ccfbf1' },
          accent: { DEFAULT: '#ea580c', soft: '#ffedd5' },
          surface: { DEFAULT: '#f4f1ec', card: '#ffffff' }
        },
        fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] }
      }
    }
  };
</script>
<link rel="stylesheet" href="static/theme.css?v=7">"""

footer = """<footer class="border-t border-stone-200 bg-white mt-16">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm footer-muted">
    <p class="font-medium">IPO · Técnicas de Usabilidad · versión estática</p>
  </div>
</footer>"""

content = re.sub(
    r"<head>\s*\{\{template \"head\" \.\}\}\s*</head>",
    "<head>\n" + head + "\n</head>",
    content,
    flags=re.S,
)
content = content.replace(
    '{{template "skip-link" .}}',
    '<a href="#main-content" class="skip-link">Saltar al contenido principal</a>',
)
content = content.replace('{{template "footer-public" .}}', footer)
content = content.replace('src="/static/app.js?v=3"', 'src="static/app.js?v=6"')

replacements = [
    (
        'class="relative overflow-hidden bg-gradient-to-br from-brand-deep via-brand to-teal-600 text-white"',
        'class="page-hero relative overflow-hidden text-white"',
    ),
    (
        'id="start-tour-btn" class="absolute top-4 right-4 sm:top-6 sm:right-8 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/40 text-xs font-bold flex items-center gap-1.5 transition-all backdrop-blur-sm shadow-md hover:scale-105 active:scale-95"',
        'id="start-tour-btn" class="hero-btn-secondary absolute top-4 right-4 sm:top-6 sm:right-8 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all"',
    ),
    ('class="mt-4 text-lg sm:text-xl text-teal-50/95', 'class="mt-4 text-lg sm:text-xl hero-on-dark'),
    ('hero-text-muted', 'hero-on-dark'),
    ('hero-text-subtle', 'hero-on-dark'),
    (
        'class="mt-2 text-sm text-teal-50/90 hidden sm:block">Filtra al instante · <kbd class="rounded bg-white/15 px-1.5 py-0.5 text-xs font-mono">/</kbd> enfoca · <kbd class="rounded bg-white/15 px-1.5 py-0.5 text-xs font-mono">Esc</kbd> borra</p>',
        'class="mt-2 text-sm hero-on-dark hidden sm:block">Filtra al instante &middot; <kbd class="hero-kbd">/</kbd> enfoca &middot; <kbd class="hero-kbd">Esc</kbd> borra</p>',
    ),
    (
        '<kbd class="rounded bg-white/25 px-1.5 py-0.5 text-xs font-mono text-white">',
        '<kbd class="hero-kbd">',
    ),
    ('class="h-4 w-4 text-teal-200"', 'class="h-4 w-4 text-white"'),
    (
        'class="text-sm font-medium text-stone-600 self-center font-semibold"',
        'class="text-sm result-count-meta self-center font-semibold"',
    ),
    (
        'class="mt-10 p-6 sm:p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 shadow-xl"',
        'class="hero-wizard-panel mt-10 p-6 sm:p-8 rounded-2xl shadow-xl"',
    ),
    ('id="wizard-heading" class="text-xl sm:text-2xl font-bold"', 'id="wizard-heading" class="text-xl sm:text-2xl font-bold hero-on-dark"'),
    (
        'class="text-sm font-semibold text-white mb-2 block"',
        'class="text-sm font-semibold hero-on-dark mb-2 block"',
    ),
    (
        'id="wizard-next" class="rounded-xl bg-accent hover:bg-orange-600 text-white font-bold px-5 py-2.5 text-sm shadow-md focus:ring-2 focus:ring-orange-300"',
        'id="wizard-next" class="btn-accent-solid rounded-xl font-bold px-5 py-2.5 text-sm shadow-md focus:ring-2 focus:ring-orange-300"',
    ),
    (
        'id="wizard-restart" class="hidden rounded-xl text-teal-100 text-sm font-medium underline hover:text-white"',
        'id="wizard-restart" class="hidden rounded-xl hero-on-dark text-sm font-medium underline hover:opacity-90"',
    ),
    (
        'sm:bg-surface/90 sm:backdrop-blur-md sm:border-b sm:border-stone-200/80 sm:mb-8 sm:rounded-b-2xl sm:translate-x-0 sm:p-4 sm:shadow-none',
        'sm:bg-white sm:border-b sm:border-stone-200/80 sm:mb-8 sm:rounded-b-2xl sm:translate-x-0 sm:p-4 sm:shadow-sm',
    ),
    ('class="text-sm text-stone-500 mt-0.5"', 'class="text-sm text-stone-700 mt-0.5"'),
    (
        'class="text-sm font-bold text-brand hover:text-brand-deep focus:underline py-2 text-center"',
        'class="text-sm btn-link-brand focus:underline py-2 text-center"',
    ),
    ('class="text-center py-12 text-stone-500"', 'class="text-center py-12 text-stone-700"'),
    ('class="mt-2 text-sm text-stone-500 max-w-md', 'class="mt-2 text-sm text-stone-700 max-w-md'),
    ('class="mt-4 text-lg font-bold text-brand"', 'class="mt-4 text-lg font-bold text-brand-accessible"'),
    ('class="mt-2 text-sm font-semibold text-accent"', 'class="mt-2 text-sm font-semibold text-orange-800"'),
    ('class="mt-1 text-sm text-stone-500"', 'class="mt-1 text-sm text-muted-accessible"'),
    ('class="mt-2 text-sm text-stone-600 leading-relaxed"', 'class="mt-2 text-sm text-muted-accessible leading-relaxed"'),
    ('class="mt-2 text-xs text-stone-600 leading-relaxed"', 'class="mt-2 text-xs text-muted-accessible leading-relaxed"'),
    ('class="hidden mt-2 text-xs text-stone-500 italic"', 'class="hidden mt-2 text-xs text-stone-700 italic"'),
    (
        'class="flex-1 rounded-xl border-2 border-brand/30 text-brand font-bold py-2.5 text-sm hover:bg-brand-muted"',
        'class="flex-1 rounded-xl btn-outline-brand py-2.5 text-sm"',
    ),
    (
        'class="rounded-full bg-brand-muted text-brand px-2.5 py-0.5 text-xs font-bold font-mono"',
        'class="tour-step-badge"',
    ),
    (
        'class="text-xs font-bold text-stone-400 hover:text-stone-600 p-1 transition-colors"',
        'class="text-xs font-bold text-stone-600 hover:text-stone-900 p-1 transition-colors"',
    ),
    (
        'class="sm:hidden text-stone-400 hover:text-stone-700 p-2 text-2xl',
        'class="sm:hidden text-stone-600 hover:text-stone-900 p-2 text-2xl',
    ),
    ('class="text-sm font-bold text-stone-700 mb-2"', 'class="text-sm font-bold filters-legend mb-2"'),
    (
        'id="mobile-filter-toggle" type="button" class="fixed bottom-6 right-6 z-30 sm:hidden flex items-center justify-center gap-2 rounded-full bg-brand text-white',
        'id="mobile-filter-toggle" type="button" class="btn-primary-solid fixed bottom-6 right-6 z-30 sm:hidden flex items-center justify-center gap-2 rounded-full',
    ),
    (
        'id="apply-filters-mobile" class="w-full sm:hidden py-3 rounded-xl bg-brand text-white font-bold',
        'id="apply-filters-mobile" class="btn-primary-solid w-full sm:hidden py-3 rounded-xl font-bold',
    ),
    (
        'id="empty-clear" class="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-deep text-white font-bold',
        'id="empty-clear" class="btn-primary-solid mt-6 inline-flex items-center gap-2 rounded-xl font-bold',
    ),
    (
        'id="modal-detail-link" href="#" class="flex-1 text-center rounded-xl bg-brand text-white font-bold',
        'id="modal-detail-link" href="#" class="btn-primary-solid flex-1 text-center rounded-xl font-bold',
    ),
    (
        'id="tour-next" class="rounded-xl bg-brand text-white font-bold',
        'id="tour-next" class="btn-primary-solid rounded-xl font-bold',
    ),
    ('·', '&middot;'),
    ('\ufffd', ''),
]

for old, new in replacements:
    content = content.replace(old, new)

content = content.replace("\ufffd", "")

(ROOT / "index.html").write_text(content, encoding="utf-8", newline="\n")
print("Wrote clean index.html")
