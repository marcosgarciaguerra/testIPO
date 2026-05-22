(function () {
  'use strict';

  var LABELS = {
    duration: { poco: 'Poco (<1 día)', medio: 'Medio (varios días)', mucho: 'Mucho (semanas)' },
    phase: { idea: 'Idea inicial', 'diseño': 'Diseño (prototipo)', producto: 'Producto ya desarrollado' },
    category: { cuestionarios: 'Cuestionarios', observacion: 'Observación directa', opiniones: 'Opiniones / entrevistas' }
  };

  var techniques = [];
  var cards = [];

  var searchInput = document.getElementById('search');
  var resultCount = document.getElementById('result-count');
  var emptyState = document.getElementById('empty-state');
  var cardsGrid = document.getElementById('cards-grid');
  var cardsLoading = document.getElementById('cards-loading');
  var activeFiltersEl = document.getElementById('active-filters');
  var wizardBanner = document.getElementById('wizard-banner');

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function label(map, key) {
    return (map && map[key]) || key;
  }

  function showWizardBanner(msg, type) {
    if (!wizardBanner) return;
    wizardBanner.textContent = msg;
    wizardBanner.className = 'mt-4 rounded-lg px-4 py-3 text-sm ' +
      (type === 'error' ? 'bg-red-500/20 text-red-100 border border-red-300/40' : 'bg-teal-500/20 text-teal-50 border border-teal-300/40');
    wizardBanner.classList.remove('hidden');
    wizardBanner.setAttribute('role', 'alert');
  }

  function hideWizardBanner() {
    if (wizardBanner) wizardBanner.classList.add('hidden');
  }

  function buildCard(t) {
    var img = t.imageURL || '/static/images/' + t.id + '.svg';
    var searchText = [t.name, t.objective, t.introduction, t.lifecycle, t.methodType, t.qualQuant].join(' ');
    var article = document.createElement('article');
    article.id = 'card-' + t.id;
    article.className = 'technique-card flex flex-col rounded-xl bg-white shadow-md border border-slate-200 overflow-hidden transition hover:shadow-lg hover:-translate-y-0.5';
    article.dataset.id = t.id;
    article.dataset.duration = t.duration;
    article.dataset.phase = t.phase;
    article.dataset.category = t.category;
    article.dataset.introduction = t.introduction || '';
    article.dataset.search = searchText;

    article.innerHTML =
      '<div class="aspect-[5/3] bg-slate-100 overflow-hidden">' +
        '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(t.imageAlt || t.name) + '" class="w-full h-full object-cover" loading="lazy">' +
      '</div>' +
      '<div class="relative flex flex-col flex-1 p-5">' +
        '<h3 class="text-lg font-bold text-slate-900">' + escapeHtml(t.name) + '</h3>' +
        '<p class="objective-focus mt-2 text-sm text-slate-600 line-clamp-3 flex-1 rounded-md outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-indigo-50/50 cursor-help" tabindex="0" role="button" aria-describedby="intro-' + escapeHtml(t.id) + '" data-intro-target="intro-' + escapeHtml(t.id) + '">' + escapeHtml(t.objective) + '</p>' +
        '<div id="intro-' + escapeHtml(t.id) + '" class="intro-popover hidden absolute left-5 right-5 top-full z-30 mt-1 rounded-lg border border-indigo-200 bg-white p-4 text-sm text-slate-700 shadow-xl" role="tooltip">' +
          '<p class="font-semibold text-indigo-800 text-xs uppercase tracking-wide mb-1">Introducción</p>' +
          '<p>' + escapeHtml(t.introduction) + '</p>' +
        '</div>' +
        '<a href="/tecnicas/' + escapeHtml(t.id) + '" class="mt-4 w-full text-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold text-sm py-2.5 hover:bg-indigo-100 transition focus:outline-none focus:ring-2 focus:ring-indigo-500">Ver más</a>' +
      '</div>';

    return article;
  }

  function renderCards(list) {
    cardsGrid.innerHTML = '';
    list.forEach(function (t) {
      cardsGrid.appendChild(buildCard(t));
    });
    cards = Array.from(document.querySelectorAll('.technique-card'));
    bindPopovers();
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
      cardsGrid.innerHTML = '<p class="col-span-full text-center text-red-600 py-8">No se pudieron cargar las técnicas. Recarga la página.</p>';
    } finally {
      if (cardsLoading) cardsLoading.classList.add('hidden');
    }
  }

  function getFilter(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function cardMatchesPhase(card, phaseFilter) {
    if (!phaseFilter) return true;
    return (card.dataset.phase || '').split(',').includes(phaseFilter);
  }

  function cardVisible(card) {
    var q = (searchInput.value || '').trim().toLowerCase();
    var duration = getFilter('duration');
    var phase = getFilter('phase');
    var category = getFilter('category');
    if (duration && card.dataset.duration !== duration) return false;
    if (!cardMatchesPhase(card, phase)) return false;
    if (category && card.dataset.category !== category) return false;
    if (q && !(card.dataset.search || '').toLowerCase().includes(q)) return false;
    return true;
  }

  function updateActiveFilterChips() {
    if (!activeFiltersEl) return;
    var chips = [];
    var d = getFilter('duration');
    var p = getFilter('phase');
    var c = getFilter('category');
    var q = (searchInput.value || '').trim();
    if (d) chips.push('Duración: ' + label(LABELS.duration, d));
    if (p) chips.push('Fase: ' + label(LABELS.phase, p));
    if (c) chips.push('Tipo: ' + label(LABELS.category, c));
    if (q) chips.push('Búsqueda: “' + q + '”');
    if (chips.length === 0) {
      activeFiltersEl.classList.add('hidden');
      activeFiltersEl.innerHTML = '';
      return;
    }
    activeFiltersEl.classList.remove('hidden');
    activeFiltersEl.innerHTML = chips.map(function (text) {
      return '<span class="inline-flex items-center rounded-full bg-indigo-100 text-indigo-800 px-3 py-1 text-xs font-medium">' + escapeHtml(text) + '</span>';
    }).join('');
  }

  function syncURLFromFilters() {
    var params = new URLSearchParams();
    var d = getFilter('duration');
    var p = getFilter('phase');
    var c = getFilter('category');
    var q = (searchInput.value || '').trim();
    if (d) params.set('duracion', d);
    if (p) params.set('fase', p);
    if (c) params.set('tipo', c);
    if (q) params.set('q', q);
    var qs = params.toString();
    var url = qs ? '?' + qs : window.location.pathname;
    history.replaceState(null, '', url);
  }

  function applyFiltersFromURL() {
    var params = new URLSearchParams(window.location.search);
    var d = params.get('duracion') || '';
    var p = params.get('fase') || '';
    var c = params.get('tipo') || '';
    var q = params.get('q') || '';
    ['duration', 'phase', 'category'].forEach(function (name) {
      var val = name === 'duration' ? d : name === 'phase' ? p : c;
      document.querySelectorAll('input[name="' + name + '"]').forEach(function (input) {
        input.checked = input.value === val;
      });
    });
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

  function setFilters(duration, phase, category) {
    document.querySelectorAll('input[name="duration"]').forEach(function (input) {
      input.checked = input.value === (duration || '');
    });
    document.querySelectorAll('input[name="phase"]').forEach(function (input) {
      input.checked = input.value === (phase || '');
    });
    document.querySelectorAll('input[name="category"]').forEach(function (input) {
      input.checked = input.value === (category || '');
    });
    applyFilters();
  }

  function bindPopovers() {
    function hideAll() {
      document.querySelectorAll('.intro-popover').forEach(function (p) { p.classList.add('hidden'); });
    }
    document.querySelectorAll('.objective-focus').forEach(function (el) {
      el.addEventListener('focus', function () {
        hideAll();
        var pop = document.getElementById(el.getAttribute('data-intro-target'));
        if (pop) pop.classList.remove('hidden');
      });
      el.addEventListener('blur', function () {
        setTimeout(function () {
          var pop = document.getElementById(el.getAttribute('data-intro-target'));
          if (pop && !pop.contains(document.activeElement)) pop.classList.add('hidden');
        }, 200);
      });
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var pop = document.getElementById(el.getAttribute('data-intro-target'));
        if (!pop) return;
        var open = !pop.classList.contains('hidden');
        hideAll();
        if (!open) pop.classList.remove('hidden');
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.objective-focus') && !e.target.closest('.intro-popover')) hideAll();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideAll();
    });
  }

  document.querySelectorAll('input[name="duration"], input[name="phase"], input[name="category"]').forEach(function (el) {
    el.addEventListener('change', applyFilters);
  });
  searchInput.addEventListener('input', applyFilters);
  document.getElementById('clear-filters').addEventListener('click', function () {
    searchInput.value = '';
    setFilters('', '', '');
  });

  /* Wizard */
  var wizStep = 1;
  var wizSteps = document.querySelectorAll('.wizard-step');
  var wizPrev = document.getElementById('wizard-prev');
  var wizNext = document.getElementById('wizard-next');
  var wizSubmit = document.getElementById('wizard-submit');
  var wizRestart = document.getElementById('wizard-restart');
  var wizDots = [1, 2, 3].map(function (n) { return document.getElementById('wiz-dot-' + n); });

  function wizSelectForStep(step) {
    if (step === 1) return document.getElementById('wizard-phase');
    if (step === 2) return document.getElementById('wizard-duration');
    return document.getElementById('wizard-category');
  }

  function updateWizardUI() {
    wizSteps.forEach(function (s) {
      s.classList.toggle('hidden', parseInt(s.dataset.step, 10) !== wizStep);
    });
    wizDots.forEach(function (d, i) {
      d.classList.toggle('bg-teal-400', i + 1 <= wizStep);
      d.classList.toggle('bg-white/30', i + 1 > wizStep);
    });
    wizPrev.classList.toggle('hidden', wizStep === 1);
    wizNext.classList.toggle('hidden', wizStep === 3);
    wizSubmit.classList.toggle('hidden', wizStep !== 3);
    if (wizRestart) wizRestart.classList.toggle('hidden', wizStep === 1);
    hideWizardBanner();
  }

  function validateCurrentStep() {
    var sel = wizSelectForStep(wizStep);
    if (!sel.value) {
      showWizardBanner('Selecciona una opción antes de continuar.', 'error');
      sel.focus();
      return false;
    }
    return true;
  }

  wizNext.addEventListener('click', function () {
    if (!validateCurrentStep()) return;
    if (wizStep < 3) { wizStep++; updateWizardUI(); }
  });
  wizPrev.addEventListener('click', function () {
    if (wizStep > 1) { wizStep--; updateWizardUI(); }
  });
  if (wizRestart) {
    wizRestart.addEventListener('click', function () {
      wizStep = 1;
      document.getElementById('wizard-phase').value = '';
      document.getElementById('wizard-duration').value = '';
      document.getElementById('wizard-category').value = '';
      updateWizardUI();
    });
  }

  function scoreCard(card, phase, duration, category) {
    var score = 0;
    var reasons = [];
    if (phase && cardMatchesPhase(card, phase)) {
      score += 3;
      reasons.push('fase del proyecto');
    }
    if (duration && card.dataset.duration === duration) {
      score += 2;
      reasons.push('tiempo disponible');
    }
    if (category && card.dataset.category === category) {
      score += 2;
      reasons.push('tipo de técnica');
    }
    return { score: score, reasons: reasons };
  }

  function rankMatches(phase, duration, category) {
    var ranked = cards.map(function (card) {
      var r = scoreCard(card, phase, duration, category);
      return { card: card, score: r.score, reasons: r.reasons };
    }).filter(function (x) { return x.score > 0; });
    ranked.sort(function (a, b) { return b.score - a.score; });
    return ranked;
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
      modalReasons.textContent = reasons.length
        ? 'Coincide en: ' + reasons.join(', ') + '.'
        : 'Mejor aproximación según tus respuestas.';
    }
    if (modalSecond && second && second.card !== best) {
      modalSecond.classList.remove('hidden');
      modalSecond.textContent = 'Alternativa: ' + second.card.querySelector('h3').textContent;
    } else if (modalSecond) {
      modalSecond.classList.add('hidden');
    }
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
    if (!validateCurrentStep()) return;
    var phase = document.getElementById('wizard-phase').value;
    var duration = document.getElementById('wizard-duration').value;
    var category = document.getElementById('wizard-category').value;
    var ranked = rankMatches(phase, duration, category);
    if (ranked.length === 0) {
      showWizardBanner('Ninguna técnica encaja del todo. Prueba otra combinación o explora el listado con filtros.', 'error');
      return;
    }
    var best = ranked[0];
    var second = ranked.length > 1 ? ranked[1] : null;
    if (best.score < 4) {
      showWizardBanner('Coincidencia parcial — te mostramos la más cercana. Puedes ajustar filtros en el listado.', 'info');
    }
    openModal(best.card, second, best.reasons);
  });

  document.getElementById('modal-go-card').addEventListener('click', function () {
    if (!recommendedId) return;
    setFilters(
      document.getElementById('wizard-duration').value,
      document.getElementById('wizard-phase').value,
      document.getElementById('wizard-category').value
    );
    closeModal();
    var card = document.getElementById('card-' + recommendedId);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('ring-2', 'ring-teal-500', 'ring-offset-2');
      setTimeout(function () { card.classList.remove('ring-2', 'ring-teal-500', 'ring-offset-2'); }, 2500);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });

  loadTechniques().then(applyFiltersFromURL);
})();
