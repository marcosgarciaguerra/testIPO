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
    var img = t.imageURL || '/static/images/' + t.id + '.svg';
    var steps = (t.howTo || []).slice(0, 3).map(function (s, i) {
      return '<li>' + escapeHtml(s) + '</li>';
    }).join('');
    return (
      '<img src="' + escapeHtml(img) + '" alt="" class="w-full h-36 object-cover rounded-lg mb-4">' +
      '<h3 class="text-lg font-bold text-slate-900">' + escapeHtml(t.name) + '</h3>' +
      '<p class="mt-2 text-xs font-bold uppercase tracking-wide text-brand">Introducción</p>' +
      '<p class="mt-1">' + escapeHtml(t.introduction) + '</p>' +
      '<p class="mt-3 text-xs font-bold uppercase tracking-wide text-brand">Objetivo</p>' +
      '<p class="mt-1">' + escapeHtml(t.objective) + '</p>' +
      (steps ? '<p class="mt-3 text-xs font-bold uppercase tracking-wide text-brand">Cómo ejecutarla</p><ol class="mt-1 list-decimal list-inside space-y-1">' + steps + '</ol>' : '') +
      '<div class="mt-4 flex flex-wrap gap-1 text-xs">' +
        '<span class="rounded-full bg-brand-muted text-brand px-2 py-0.5 font-semibold">' + escapeHtml(label(LABELS.tipo, t.tipo)) + '</span>' +
        '<span class="rounded-full bg-stone-100 text-stone-600 px-2 py-0.5 font-semibold">' + escapeHtml(label(LABELS.duration, t.duration)) + '</span>' +
      '</div>' +
      '<a href="/tecnicas/' + escapeHtml(t.id) + '" class="mt-4 block w-full text-center rounded-xl bg-brand text-white font-bold py-2.5 text-sm hover:bg-brand-deep pointer-events-auto">Abrir ficha completa</a>'
    );
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

    article.innerHTML =
      '<div class="aspect-[5/3] bg-stone-100 overflow-hidden">' +
        '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(t.imageAlt || t.name) + '" class="w-full h-full object-cover" loading="lazy">' +
      '</div>' +
      '<div class="flex flex-col flex-1 p-5">' +
        '<h3 class="text-lg font-bold text-stone-900">' + escapeHtml(t.name) + '</h3>' +
        '<p class="mt-2 text-sm text-stone-600 line-clamp-3 flex-1">' + escapeHtml(t.objective) + '</p>' +
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
      if (v) chips.push(fieldLabels[name] + ': ' + label(LABELS[name], v));
    });
    var q = (searchInput.value || '').trim();
    if (q) chips.push('Búsqueda: “' + escapeHtml(q) + '”');
    if (!chips.length) {
      activeFiltersEl.classList.add('hidden');
      activeFiltersEl.innerHTML = '';
      return;
    }
    activeFiltersEl.classList.remove('hidden');
    activeFiltersEl.innerHTML = chips.map(function (text) {
      return '<span class="inline-flex rounded-full bg-brand-muted text-brand px-3 py-1 text-xs font-semibold">' + text + '</span>';
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

  function applyFilters() {
    var visible = 0;
    cards.forEach(function (card) {
      var show = cardVisible(card);
      card.classList.toggle('hidden', !show);
      if (show) visible++;
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

  /* Wizard */
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

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (modal && !modal.classList.contains('hidden')) closeModal();
      hidePreview();
    }
    if (e.key === '/' && document.activeElement !== searchInput && searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  loadTechniques().then(applyFiltersFromURL);
})();
