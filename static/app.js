(function () {
  'use strict';

  var LABELS = {
    people: { '1': '1', '2-3': '2-3', '5+': '5+' },
    modality: { presencial: 'Presencial', online: 'Online' },
    tipo: { insight: 'Insight', inquiry: 'Inquiry', testing: 'Testing' },
    duration: { '30min': '30 min', '1h': '1h', '1h+': '1h+' },
    results: { cuantitativos: 'Cuantitativos', cualitativos: 'Cualitativos' }
  };

  var FILTER_NAMES = ['people', 'modality', 'tipo', 'duration', 'results'];
  var techniques = [];
  var cards = [];
  var previewHideTimer = null;

  var searchInput = document.getElementById('search');
  var resultCount = document.getElementById('result-count');
  var emptyState = document.getElementById('empty-state');
  var cardsGrid = document.getElementById('cards-grid');
  var cardsLoading = document.getElementById('cards-loading');
  var activeFiltersEl = document.getElementById('active-filters');
  var wizardBanner = document.getElementById('wizard-banner');
  var previewFloat = document.getElementById('technique-preview-float');
  var previewFloatBody = document.getElementById('preview-float-body');
  var cardsArea = document.getElementById('cards-area');
  var hoveredCard = null;

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function label(map, key) {
    return (map && map[key]) || key;
  }

  function matchesCSV(datasetVal, filterVal) {
    if (!filterVal) return true;
    return (datasetVal || '').split(',').map(function (s) { return s.trim(); }).indexOf(filterVal) >= 0;
  }

  function getTechnique(id) {
    for (var i = 0; i < techniques.length; i++) {
      if (techniques[i].id === id) return techniques[i];
    }
    return null;
  }

  function buildPreviewHTML(t) {
    if (!t) return '';
    return '<p class="text-stone-700 font-medium leading-relaxed">' + escapeHtml(t.introduction) + '</p>';
  }

  function positionPreview(card) {
    if (!previewFloat || !card) return;
    var rect = card.getBoundingClientRect();
    var gap = 12;
    var pw = previewFloat.offsetWidth || 320;
    var ph = previewFloat.offsetHeight || 320;

    var left = rect.right + gap;
    var top = rect.top;

    if (left + pw > window.innerWidth - gap) {
      left = rect.left - pw - gap;
    }
    if (left < gap) {
      left = Math.min(Math.max(gap, rect.left), window.innerWidth - pw - gap);
      top = rect.bottom + gap;
    }
    if (top + ph > window.innerHeight - gap) {
      top = Math.max(gap, window.innerHeight - ph - gap);
    }

    previewFloat.style.left = Math.round(left) + 'px';
    previewFloat.style.top = Math.round(top) + 'px';
  }

  function showPreviewForCard(card) {
    var t = getTechnique(card.dataset.id);
    if (!t || !previewFloat || !previewFloatBody) return;

    if (hoveredCard && hoveredCard !== card) {
      hoveredCard.classList.remove('relative', 'z-40', 'is-highlighted');
      hoveredCard.style.zIndex = '';
    }
    hoveredCard = card;
    card.classList.add('relative', 'z-40', 'is-highlighted');
    card.style.zIndex = '40';

    previewFloatBody.innerHTML = buildPreviewHTML(t);
    previewFloat.classList.remove('hidden');
    requestAnimationFrame(function () {
      positionPreview(card);
    });
  }

  function hidePreview() {
    if (hoveredCard) {
      hoveredCard.classList.remove('relative', 'z-40', 'is-highlighted');
      hoveredCard.style.zIndex = '';
      hoveredCard = null;
    }
    if (previewFloat) previewFloat.classList.add('hidden');
  }

  function scheduleHidePreview() {
    clearTimeout(previewHideTimer);
    previewHideTimer = setTimeout(function () {
      if (previewFloat && previewFloat.matches(':hover')) return;
      hidePreview();
    }, 120);
  }

  function buildCard(t) {
    var img = t.imageURL || '/static/images/' + t.id + '.svg';
    var searchText = [t.name, t.objective, t.introduction, t.lifecycle, t.methodType, t.qualQuant, t.tipo, t.people]
      .concat(t.howTo || [])
      .join(' ');
    var article = document.createElement('article');
    article.id = 'card-' + t.id;
    article.className = 'technique-card flex flex-col overflow-hidden cursor-pointer';
    article.dataset.id = t.id;
    article.dataset.people = t.people || '';
    article.dataset.modality = t.modality || '';
    article.dataset.tipo = t.tipo || '';
    article.dataset.duration = t.duration || '';
    article.dataset.results = t.results || '';
    article.dataset.introduction = t.introduction || '';
    article.dataset.search = searchText;
    article.setAttribute('aria-label', 'Técnica: ' + t.name);
    var filtersHtml = '<div class="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold" data-role="card-filters">';
    if (t.tipo) filtersHtml += '<span class="rounded px-2.5 py-1 transition-all duration-200" data-filter-name="tipo" data-filter-value="' + escapeHtml(t.tipo) + '" title="Tipo">' + escapeHtml(label(LABELS.tipo, t.tipo)) + '</span>';
    if (t.duration) filtersHtml += '<span class="rounded px-2.5 py-1 transition-all duration-200" data-filter-name="duration" data-filter-value="' + escapeHtml(t.duration) + '" title="Duración">' + escapeHtml(label(LABELS.duration, t.duration)) + '</span>';
    if (t.modality) {
      var modLabels = t.modality.split(',').map(function (m) { return label(LABELS.modality, m.trim()); }).join(', ');
      filtersHtml += '<span class="rounded px-2.5 py-1 transition-all duration-200" data-filter-name="modality" data-filter-value="' + escapeHtml(t.modality) + '" title="Modalidad">' + escapeHtml(modLabels) + '</span>';
    }
    if (t.people) filtersHtml += '<span class="rounded px-2.5 py-1 transition-all duration-200" data-filter-name="people" data-filter-value="' + escapeHtml(t.people) + '" title="Personas">' + escapeHtml(label(LABELS.people, t.people)) + ' Pers</span>';
    if (t.results) {
      var resLabels = t.results.split(',').map(function (r) { return label(LABELS.results, r.trim()); }).join(', ');
      filtersHtml += '<span class="rounded px-2.5 py-1 transition-all duration-200" data-filter-name="results" data-filter-value="' + escapeHtml(t.results) + '" title="Resultados">' + escapeHtml(resLabels) + '</span>';
    }
    filtersHtml += '</div>';

    article.innerHTML =
      '<div class="aspect-[5/3] bg-stone-100 overflow-hidden">' +
        '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(t.imageAlt || t.name) + '" class="w-full h-full object-cover" loading="lazy">' +
      '</div>' +
      '<div class="flex flex-col flex-1 p-5">' +
        '<h3 class="text-lg font-bold text-stone-900">' + escapeHtml(t.name) + '</h3>' +
        '<p class="mt-3 text-sm text-stone-600 line-clamp-3 flex-1">' + escapeHtml(t.introduction) + '</p>' +
        '<div class="mt-4 pt-3 border-t border-stone-100">' +
          '<p class="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 mb-2">Filtros coincidentes:</p>' +
          filtersHtml +
        '</div>' +
        '<span class="mt-4 w-full text-center rounded-xl bg-brand-muted text-brand font-bold text-sm py-2.5 group-hover:bg-brand group-hover:text-white transition-colors">Ver ficha</span>' +
      '</div>';

    article.addEventListener('click', function () {
      window.location.href = '/tecnicas/' + t.id;
    });

    return article;
  }

  function bindCardPreview() {
    cards.forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        clearTimeout(previewHideTimer);
        showPreviewForCard(card);
      });
      card.addEventListener('mouseleave', function () {
        scheduleHidePreview();
      });
    });

    if (previewFloat) {
      previewFloat.addEventListener('mouseenter', function () {
        clearTimeout(previewHideTimer);
      });
      previewFloat.addEventListener('mouseleave', function () {
        scheduleHidePreview();
      });
    }
  }

  window.addEventListener('scroll', function () {
    if (hoveredCard && previewFloat && !previewFloat.classList.contains('hidden')) {
      positionPreview(hoveredCard);
    }
  }, true);

  window.addEventListener('resize', function () {
    if (hoveredCard && previewFloat && !previewFloat.classList.contains('hidden')) {
      positionPreview(hoveredCard);
    }
  });

  function renderCards(list) {
    cardsGrid.innerHTML = '';
    list.forEach(function (t) {
      cardsGrid.appendChild(buildCard(t));
    });
    cards = Array.from(document.querySelectorAll('.technique-card'));
    bindCardPreview();
    applyFilters();
  }

  async function loadTechniques() {
    if (cardsLoading) cardsLoading.classList.remove('hidden');
    try {
      var res = await fetch('/api/techniques');
      if (!res.ok) throw new Error('fetch failed');
      techniques = await res.json();
      renderCards(techniques);
    } catch (e) {
      cardsGrid.innerHTML = '<p class="col-span-full text-center text-red-600 py-8">No se pudieron cargar las técnicas.</p>';
    } finally {
      if (cardsLoading) cardsLoading.classList.add('hidden');
    }
  }

  function getFilter(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function cardVisible(card) {
    var q = (searchInput.value || '').trim().toLowerCase();
    if (getFilter('people') && card.dataset.people !== getFilter('people')) return false;
    if (!matchesCSV(card.dataset.modality, getFilter('modality'))) return false;
    if (getFilter('tipo') && card.dataset.tipo !== getFilter('tipo')) return false;
    if (getFilter('duration') && card.dataset.duration !== getFilter('duration')) return false;
    if (!matchesCSV(card.dataset.results, getFilter('results'))) return false;
    if (q && !(card.dataset.search || '').toLowerCase().includes(q)) return false;
    return true;
  }

  function updateActiveFilterChips() {
    if (!activeFiltersEl) return;
    var chips = [];
    var fieldLabels = { people: 'N. personas', modality: 'Modalidad', tipo: 'Tipo', duration: 'Duración', results: 'Resultados' };
    FILTER_NAMES.forEach(function (name) {
      var v = getFilter(name);
      if (v) chips.push({ text: fieldLabels[name] + ': ' + label(LABELS[name], v), name: name });
    });
    var q = (searchInput.value || '').trim();
    if (q) chips.push({ text: 'Búsqueda: “' + escapeHtml(q) + '”', name: 'search' });
    if (!chips.length) {
      activeFiltersEl.classList.add('hidden');
      activeFiltersEl.innerHTML = '';
      return;
    }
    activeFiltersEl.classList.remove('hidden');
    activeFiltersEl.innerHTML = chips.map(function (chip) {
      var bgCol = chip.name === 'people' ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : chip.name === 'modality' ? 'bg-[#10b981]/20 text-[#10b981]' : chip.name === 'tipo' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : chip.name === 'duration' ? 'bg-[#8b5cf6]/20 text-[#8b5cf6]' : chip.name === 'results' ? 'bg-[#ec4899]/20 text-[#ec4899]' : 'bg-brand-muted text-brand';
      return '<span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold ' + bgCol + '">' + chip.text + '</span>';
    }).join('');
  }

  function syncURLFromFilters() {
    var params = new URLSearchParams();
    FILTER_NAMES.forEach(function (name) {
      var v = getFilter(name);
      if (v) params.set(name, v);
    });
    var q = (searchInput.value || '').trim();
    if (q) params.set('q', q);
    var qs = params.toString();
    history.replaceState(null, '', qs ? '?' + qs : window.location.pathname);
  }

  function applyFiltersFromURL() {
    var params = new URLSearchParams(window.location.search);
    FILTER_NAMES.forEach(function (name) {
      var v = params.get(name) || '';
      document.querySelectorAll('input[name="' + name + '"]').forEach(function (input) {
        input.checked = input.value === v;
      });
    });
    var q = params.get('q');
    if (q) searchInput.value = q;
    applyFilters();
  }

  function updateCardFilters(card) {
    var container = card.querySelector('[data-role="card-filters"]');
    if (!container) return;
    var activeFilters = {
      people: getFilter('people'),
      modality: getFilter('modality'),
      tipo: getFilter('tipo'),
      duration: getFilter('duration'),
      results: getFilter('results')
    };
    var anyActive = activeFilters.people || activeFilters.modality || activeFilters.tipo || activeFilters.duration || activeFilters.results;
    var spans = container.querySelectorAll('[data-filter-name]');
    spans.forEach(function (span) {
      var name = span.getAttribute('data-filter-name');
      var val = span.getAttribute('data-filter-value');
      var sel = activeFilters[name];
      var isMatch = false;
      if (sel) {
        if (name === 'modality' || name === 'results') {
          isMatch = val.split(',').map(function (x) { return x.trim(); }).indexOf(sel) >= 0;
        } else {
          isMatch = (val === sel);
        }
      }
      if (isMatch) {
        var bgCol = name === 'people' ? 'bg-[#3b82f6]' : name === 'modality' ? 'bg-[#10b981]' : name === 'tipo' ? 'bg-[#f59e0b]' : name === 'duration' ? 'bg-[#8b5cf6]' : 'bg-[#ec4899]';
        span.className = 'rounded ' + bgCol + ' text-white px-2.5 py-1 shadow-sm font-bold scale-105 transition-all duration-200';
      } else if (anyActive) {
        span.className = 'rounded bg-stone-100 text-stone-400 border border-stone-200/50 opacity-40 px-2.5 py-1 scale-95 transition-all duration-200';
      } else {
        var textCol = name === 'people' ? 'text-[#3b82f6]' : name === 'modality' ? 'text-[#10b981]' : name === 'tipo' ? 'text-[#f59e0b]' : name === 'duration' ? 'text-[#8b5cf6]' : 'text-[#ec4899]';
        span.className = 'rounded bg-stone-100 ' + textCol + ' font-medium px-2.5 py-1 transition-all duration-200';
      }
    });
  }

  function applyFilters() {
    var visible = 0;
    cards.forEach(function (card) {
      var show = cardVisible(card);
      card.classList.toggle('hidden', !show);
      if (show) {
        visible++;
        updateCardFilters(card);
      }
    });
    emptyState.classList.toggle('hidden', visible > 0);
    cardsGrid.classList.toggle('hidden', visible === 0);
    resultCount.textContent = 'Mostrando ' + visible + ' de ' + techniques.length + ' técnicas';
    updateActiveFilterChips();
    syncURLFromFilters();
  }

  function clearAllFilters() {
    searchInput.value = '';
    FILTER_NAMES.forEach(function (name) {
      document.querySelectorAll('input[name="' + name + '"]').forEach(function (input) {
        input.checked = input.value === '';
      });
    });
    applyFilters();
    closeFiltersDrawer();
  }

  FILTER_NAMES.forEach(function (name) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (el) {
      el.addEventListener('change', applyFilters);
    });
  });
  searchInput.addEventListener('input', applyFilters);
  document.getElementById('clear-filters').addEventListener('click', clearAllFilters);
  var emptyClear = document.getElementById('empty-clear');
  if (emptyClear) emptyClear.addEventListener('click', clearAllFilters);

  if (searchInput) {
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        searchInput.value = '';
        applyFilters();
        searchInput.blur();
      }
    });
  }

  /* Drawer de Filtros Móviles */
  var filtersSection = document.getElementById('filters-section');
  var mobileFilterToggle = document.getElementById('mobile-filter-toggle');
  var filterDrawerBackdrop = document.getElementById('filter-drawer-backdrop');
  var closeFiltersMobile = document.getElementById('close-filters-mobile');
  var applyFiltersMobile = document.getElementById('apply-filters-mobile');

  function openFiltersDrawer() {
    if (!filtersSection) return;
    document.body.classList.add('overflow-hidden');
    filtersSection.classList.remove('translate-x-full');
    filtersSection.classList.add('translate-x-0');
    if (filterDrawerBackdrop) {
      filterDrawerBackdrop.classList.remove('hidden');
      filterDrawerBackdrop.classList.add('block');
      requestAnimationFrame(function () {
        filterDrawerBackdrop.classList.remove('opacity-0', 'pointer-events-none');
        filterDrawerBackdrop.classList.add('opacity-100', 'pointer-events-auto');
      });
    }
  }

  function closeFiltersDrawer() {
    if (!filtersSection) return;
    document.body.classList.remove('overflow-hidden');
    filtersSection.classList.add('translate-x-full');
    filtersSection.classList.remove('translate-x-0');
    if (filterDrawerBackdrop) {
      filterDrawerBackdrop.classList.remove('opacity-100', 'pointer-events-auto');
      filterDrawerBackdrop.classList.add('opacity-0', 'pointer-events-none');
      setTimeout(function () {
        filterDrawerBackdrop.classList.add('hidden');
        filterDrawerBackdrop.classList.remove('block');
      }, 300);
    }
  }

  if (mobileFilterToggle) mobileFilterToggle.addEventListener('click', openFiltersDrawer);
  if (closeFiltersMobile) closeFiltersMobile.addEventListener('click', closeFiltersDrawer);
  if (filterDrawerBackdrop) filterDrawerBackdrop.addEventListener('click', closeFiltersDrawer);
  if (applyFiltersMobile) applyFiltersMobile.addEventListener('click', closeFiltersDrawer);

  /* Wizard Microcopy / Acompañamiento en Directo */
  var wizardTipoSelect = document.getElementById('wizard-tipo');
  var wizardDurationSelect = document.getElementById('wizard-duration');
  var wizardResultsSelect = document.getElementById('wizard-results');

  var wizardTipoHelp = document.getElementById('wizard-tipo-help');
  var wizardDurationHelp = document.getElementById('wizard-duration-help');
  var wizardResultsHelp = document.getElementById('wizard-results-help');

  var tipoExpls = {
    '': 'Selecciona un tipo para ver su definición y entender qué hace.',
    'insight': '💡 <strong>Insight (Descubrimiento y Diseño)</strong>: Métodos para descubrir problemas latentes y diseñar soluciones visualizando detalladamente el comportamiento (ej. Heurísticas, Personas).',
    'inquiry': '💬 <strong>Inquiry (Indagación)</strong>: Técnicas de investigación para hablar con usuarios y profundizar en sus opiniones y deseos (ej. Entrevistas, Encuestas).',
    'testing': '🧪 <strong>Testing (Pruebas)</strong>: Métodos prácticos para evaluar la usabilidad del producto de forma empírica con usuarios reales (ej. Test de Usabilidad, Pensamiento en Voz Alta).'
  };

  var durationExpls = {
    '': 'Selecciona el tiempo estimado del que dispones para ejecutar la técnica.',
    '30min': '⏱️ <strong>30 minutos</strong>: Técnicas exprés e inmediatas de muy bajo coste temporal y sencillas de realizar.',
    '1h': '🕐 <strong>1 hora</strong>: Métodos estructurados de duración estándar por sesión de trabajo.',
    '1h+': '⏳ <strong>Más de 1 hora</strong>: Técnicas de análisis profundo que requieren sesiones más extensas o múltiples fases.'
  };

  var resultsExpls = {
    '': 'Selecciona el tipo de datos que necesitas recolectar del usuario.',
    'cuantitativos': '📊 <strong>Cuantitativos</strong>: Datos numéricos, porcentajes y métricas estadísticas que responden a "¿Cuántos?" o "¿Cuánto tiempo tarda?" (ej. Cuestionario SUS, Analítica).',
    'cualitativos': '📝 <strong>Cualitativos</strong>: Información descriptiva, opiniones subjetivas e interpretaciones que responden a "¿Por qué ocurre?" (ej. Entrevistas, Test de Usabilidad).'
  };

  if (wizardTipoSelect && wizardTipoHelp) {
    wizardTipoSelect.addEventListener('change', function () {
      wizardTipoHelp.innerHTML = tipoExpls[wizardTipoSelect.value] || tipoExpls[''];
    });
  }
  if (wizardDurationSelect && wizardDurationHelp) {
    wizardDurationSelect.addEventListener('change', function () {
      wizardDurationHelp.innerHTML = durationExpls[wizardDurationSelect.value] || durationExpls[''];
    });
  }
  if (wizardResultsSelect && wizardResultsHelp) {
    wizardResultsSelect.addEventListener('change', function () {
      wizardResultsHelp.innerHTML = resultsExpls[wizardResultsSelect.value] || resultsExpls[''];
    });
  }

  /* Wizard Logic */
  var wizStep = 1;
  var wizSteps = document.querySelectorAll('.wizard-step');
  var wizPrev = document.getElementById('wizard-prev');
  var wizNext = document.getElementById('wizard-next');
  var wizSubmit = document.getElementById('wizard-submit');
  var wizRestart = document.getElementById('wizard-restart');
  var wizDots = [1, 2, 3].map(function (n) { return document.getElementById('wiz-dot-' + n); });

  function showWizardBanner(msg, type) {
    if (!wizardBanner) return;
    wizardBanner.textContent = msg;
    wizardBanner.className = 'mt-4 rounded-lg px-4 py-3 text-sm ' +
      (type === 'error' ? 'bg-red-500/20 text-red-100 border border-red-300/40' : 'bg-teal-500/20 text-teal-50 border border-teal-300/40');
    wizardBanner.classList.remove('hidden');
  }

  function hideWizardBanner() {
    if (wizardBanner) wizardBanner.classList.add('hidden');
  }

  function wizSelectForStep(step) {
    if (step === 1) return document.getElementById('wizard-tipo');
    if (step === 2) return document.getElementById('wizard-duration');
    return document.getElementById('wizard-results');
  }

  function updateWizardUI() {
    wizSteps.forEach(function (s) {
      s.classList.toggle('hidden', parseInt(s.dataset.step, 10) !== wizStep);
    });
    wizDots.forEach(function (d, i) {
      d.classList.toggle('bg-accent', i + 1 <= wizStep);
      d.classList.toggle('bg-white/25', i + 1 > wizStep);
    });
    wizPrev.classList.toggle('hidden', wizStep === 1);
    wizNext.classList.toggle('hidden', wizStep === 3);
    wizSubmit.classList.toggle('hidden', wizStep !== 3);
    if (wizRestart) wizRestart.classList.toggle('hidden', wizStep === 1);
    hideWizardBanner();
  }

  wizNext.addEventListener('click', function () {
    var sel = wizSelectForStep(wizStep);
    if (!sel.value) {
      showWizardBanner('Selecciona una opción antes de continuar.', 'error');
      sel.focus();
      return;
    }
    if (wizStep < 3) { wizStep++; updateWizardUI(); }
  });
  wizPrev.addEventListener('click', function () {
    if (wizStep > 1) { wizStep--; updateWizardUI(); }
  });
  if (wizRestart) {
    wizRestart.addEventListener('click', function () {
      wizStep = 1;
      document.getElementById('wizard-tipo').value = '';
      document.getElementById('wizard-duration').value = '';
      document.getElementById('wizard-results').value = '';
      if (wizardTipoSelect) wizardTipoSelect.dispatchEvent(new Event('change'));
      if (wizardDurationSelect) wizardDurationSelect.dispatchEvent(new Event('change'));
      if (wizardResultsSelect) wizardResultsSelect.dispatchEvent(new Event('change'));
      updateWizardUI();
    });
  }

  function scoreCard(card, tipo, duration, results) {
    var score = 0;
    var reasons = [];
    if (tipo && card.dataset.tipo === tipo) { score += 3; reasons.push('tipo'); }
    if (duration && card.dataset.duration === duration) { score += 2; reasons.push('duración'); }
    if (results && matchesCSV(card.dataset.results, results)) { score += 2; reasons.push('resultados'); }
    return { score: score, reasons: reasons };
  }

  function rankMatches(tipo, duration, results) {
    return cards.map(function (card) {
      var r = scoreCard(card, tipo, duration, results);
      return { card: card, score: r.score, reasons: r.reasons };
    }).filter(function (x) { return x.score > 0; }).sort(function (a, b) { return b.score - a.score; });
  }

  var modal = document.getElementById('wizard-modal');
  var modalName = document.getElementById('modal-technique-name');
  var modalIntro = document.getElementById('modal-technique-intro');
  var modalReasons = document.getElementById('modal-match-reasons');
  var modalSecond = document.getElementById('modal-second-choice');
  var modalDetailLink = document.getElementById('modal-detail-link');
  var recommendedId = null;

  function openModal(best, second, reasons) {
    recommendedId = best.dataset.id;
    modalName.textContent = best.querySelector('h3').textContent;
    modalIntro.textContent = best.dataset.introduction || '';
    if (modalReasons) {
      modalReasons.textContent = reasons.length ? 'Coincide en: ' + reasons.join(', ') + '.' : 'Mejor aproximación.';
    }
    if (modalSecond && second) {
      modalSecond.classList.remove('hidden');
      modalSecond.textContent = 'Alternativa: ' + second.card.querySelector('h3').textContent;
    } else if (modalSecond) modalSecond.classList.add('hidden');
    modalDetailLink.href = '/tecnicas/' + recommendedId;
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  function closeModal() {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  document.querySelectorAll('[data-close-modal]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });

  wizSubmit.addEventListener('click', function () {
    var tipo = document.getElementById('wizard-tipo').value;
    var duration = document.getElementById('wizard-duration').value;
    var results = document.getElementById('wizard-results').value;
    if (!tipo || !duration || !results) {
      showWizardBanner('Completa las tres preguntas.', 'error');
      return;
    }
    var ranked = rankMatches(tipo, duration, results);
    if (!ranked.length) {
      showWizardBanner('Sin coincidencia exacta. Prueba otros filtros en el listado.', 'error');
      return;
    }
    if (ranked[0].score < 4) showWizardBanner('Coincidencia parcial — mostramos la más cercana.', 'info');
    openModal(ranked[0].card, ranked[1] || null, ranked[0].reasons);
  });

  document.getElementById('modal-go-card').addEventListener('click', function () {
    if (!recommendedId) return;
    document.querySelectorAll('input[name="tipo"]').forEach(function (i) { i.checked = i.value === document.getElementById('wizard-tipo').value; });
    document.querySelectorAll('input[name="duration"]').forEach(function (i) { i.checked = i.value === document.getElementById('wizard-duration').value; });
    document.querySelectorAll('input[name="results"]').forEach(function (i) { i.checked = i.value === document.getElementById('wizard-results').value; });
    applyFilters();
    closeModal();
    var card = document.getElementById('card-' + recommendedId);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* Sistema de Onboarding Interactivo (Tour de 3 pasos) */
  var onboardingOverlay = document.getElementById('onboarding-overlay');
  var onboardingSpotlight = document.getElementById('onboarding-spotlight');
  var onboardingCard = document.getElementById('onboarding-card');
  var tourTitle = document.getElementById('tour-title');
  var tourBody = document.getElementById('tour-body');
  var tourStepBadge = document.getElementById('tour-step-badge');
  var tourPrev = document.getElementById('tour-prev');
  var tourNext = document.getElementById('tour-next');
  var tourSkip = document.getElementById('tour-skip');
  var startTourBtn = document.getElementById('start-tour-btn');

  var currentTourStep = 0;
  var isTourActive = false;

  function getTourSteps() {
    var isMobile = window.innerWidth < 640;
    return [
      {
        title: "1. Buscador de Técnicas",
        body: "Encuentra métodos al instante escribiendo palabras clave como 'heurística', 'card sorting' o 'cuestionario' en esta barra.",
        targetId: "search",
        placement: "bottom"
      },
      {
        title: "2. Filtros de Catálogo",
        body: isMobile 
          ? "Usa este botón flotante para desplegar los filtros y refinar tu búsqueda según el número de personas, modalidad, tipo o duración en móviles de manera ordenada."
          : "Refina la lista de técnicas según tus necesidades exactas: número de personas, modalidad, tipo o duración del ejercicio.",
        targetId: isMobile ? "mobile-filter-toggle" : "filters-heading",
        placement: isMobile ? "top" : "bottom"
      },
      {
        title: "3. Recomendador de Usabilidad",
        body: "¿Tienes dudas? Responde tres preguntas sencillas en este panel inteligente y te recomendaremos el método idóneo para tu caso.",
        targetId: "wizard-heading",
        placement: "bottom"
      }
    ];
  }

  function startTour() {
    isTourActive = true;
    currentTourStep = 0;
    
    if (onboardingOverlay) {
      onboardingOverlay.classList.remove('hidden');
      setTimeout(function () {
        onboardingOverlay.classList.remove('opacity-0', 'pointer-events-none');
        onboardingOverlay.classList.add('opacity-100', 'pointer-events-auto');
      }, 10);
    }
    if (onboardingSpotlight) onboardingSpotlight.classList.remove('hidden');
    if (onboardingCard) onboardingCard.classList.remove('hidden');

    renderTourStep();
  }

  function endTour(completed) {
    isTourActive = false;
    if (onboardingOverlay) {
      onboardingOverlay.classList.remove('opacity-100', 'pointer-events-auto');
      onboardingOverlay.classList.add('opacity-0', 'pointer-events-none');
      setTimeout(function () { onboardingOverlay.classList.add('hidden'); }, 300);
    }
    if (onboardingSpotlight) onboardingSpotlight.classList.add('hidden');
    if (onboardingCard) onboardingCard.classList.add('hidden');

    if (completed) {
      localStorage.setItem('ipo_onboarding_completed', 'true');
    }
  }

  function renderTourStep() {
    if (!isTourActive) return;
    var steps = getTourSteps();
    var step = steps[currentTourStep];
    if (!step) return;

    // Update texts
    if (tourTitle) tourTitle.textContent = step.title;
    if (tourBody) tourBody.textContent = step.body;
    if (tourStepBadge) tourStepBadge.textContent = "Paso " + (currentTourStep + 1) + " de " + steps.length;

    // Update Dots
    [1, 2, 3].forEach(function (n) {
      var dot = document.getElementById('tour-dot-' + n);
      if (dot) {
        dot.classList.toggle('bg-brand', n === (currentTourStep + 1));
        dot.classList.toggle('bg-stone-200', n !== (currentTourStep + 1));
      }
    });

    // Update Buttons
    if (tourPrev) {
      tourPrev.classList.toggle('invisible', currentTourStep === 0);
    }
    if (tourNext) {
      tourNext.textContent = currentTourStep === (steps.length - 1) ? "Finalizar" : "Siguiente";
    }

    // Target Element spotlight
    var targetEl = document.getElementById(step.targetId);
    if (targetEl) {
      // For mobile drawer toggle target, make sure drawer is CLOSED so target is visible
      if (step.targetId === 'mobile-filter-toggle') {
        closeFiltersDrawer();
      }
      
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Give browser time to finish scrolling
      setTimeout(function () {
        positionTourSpotlight(targetEl, step.placement);
      }, 350);
    } else {
      endTour(false);
    }
  }

  function positionTourSpotlight(targetEl, placement) {
    if (!isTourActive || !onboardingSpotlight || !onboardingCard || !targetEl) return;

    var rect = targetEl.getBoundingClientRect();
    var padding = 8;

    // Spotlight layout
    onboardingSpotlight.style.left = Math.round(rect.left - padding) + 'px';
    onboardingSpotlight.style.top = Math.round(rect.top - padding) + 'px';
    onboardingSpotlight.style.width = Math.round(rect.width + padding * 2) + 'px';
    onboardingSpotlight.style.height = Math.round(rect.height + padding * 2) + 'px';

    // Position Card
    var cardWidth = onboardingCard.offsetWidth || 352;
    var cardHeight = onboardingCard.offsetHeight || 190;
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;

    var left = rect.left + (rect.width - cardWidth) / 2;
    var top = 0;

    if (placement === 'bottom') {
      top = rect.bottom + 16;
    } else if (placement === 'top') {
      top = rect.top - cardHeight - 16;
    }

    // Boundaries check
    if (left < 12) left = 12;
    if (left + cardWidth > viewportWidth - 12) left = viewportWidth - cardWidth - 12;

    if (top < 12) top = 12;
    if (top + cardHeight > viewportHeight - 12) {
      // Flip placement if overflows bottom
      top = rect.top - cardHeight - 16;
      if (top < 12) top = rect.bottom + 16;
    }

    onboardingCard.style.left = Math.round(left) + 'px';
    onboardingCard.style.top = Math.round(top) + 'px';
  }

  // Hook up onboarding event listeners
  if (tourNext) {
    tourNext.addEventListener('click', function () {
      var steps = getTourSteps();
      if (currentTourStep < steps.length - 1) {
        currentTourStep++;
        renderTourStep();
      } else {
        endTour(true);
      }
    });
  }

  if (tourPrev) {
    tourPrev.addEventListener('click', function () {
      if (currentTourStep > 0) {
        currentTourStep--;
        renderTourStep();
      }
    });
  }

  if (tourSkip) {
    tourSkip.addEventListener('click', function () {
      endTour(true);
    });
  }

  if (startTourBtn) {
    startTourBtn.addEventListener('click', function () {
      startTour();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (modal && !modal.classList.contains('hidden')) closeModal();
      if (isTourActive) endTour(false);
      closeFiltersDrawer();
      hidePreview();
    }
    if (e.key === '/' && document.activeElement !== searchInput && searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  window.addEventListener('resize', function () {
    if (hoveredCard && previewFloat && !previewFloat.classList.contains('hidden')) {
      positionPreview(hoveredCard);
    }
    if (isTourActive) {
      var steps = getTourSteps();
      var targetEl = document.getElementById(steps[currentTourStep].targetId);
      if (targetEl) positionTourSpotlight(targetEl, steps[currentTourStep].placement);
    }
  });

  window.addEventListener('scroll', function () {
    if (hoveredCard && previewFloat && !previewFloat.classList.contains('hidden')) {
      positionPreview(hoveredCard);
    }
    if (isTourActive) {
      var steps = getTourSteps();
      var targetEl = document.getElementById(steps[currentTourStep].targetId);
      if (targetEl) positionTourSpotlight(targetEl, steps[currentTourStep].placement);
    }
  }, true);

  loadTechniques().then(applyFiltersFromURL).then(function () {
    // Check if onboarding needs to auto-run
    if (!localStorage.getItem('ipo_onboarding_completed')) {
      setTimeout(startTour, 1200);
    }
  });
})();
