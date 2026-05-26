(function () {
  'use strict';

  var LABELS = {
    people: { '1': '1', '2-3': '2-3', '5+': '5+' },
    modality: { presencial: 'Presencial', online: 'Online' },
    tipo: { insight: 'Insight', inquiry: 'Inquiry', testing: 'Testing' },
    duration: { '30min': '30 min', '1h': '1h', '1h+': '1h+' },
    results: { cuantitativos: 'Cuantitativos', cualitativos: 'Cualitativos' }
  };

  function assetPath(path) {
    if (!path) return '';
    if (path.indexOf('/static/') === 0) return path.substring(1);
    if (path.charAt(0) === '/') return path.substring(1);
    return path;
  }

  function label(map, key) {
    return (map && map[key]) || key;
  }

  function labelCSV(map, csv) {
    return (csv || '').split(',').map(function (s) {
      return label(map, s.trim());
    }).filter(Boolean).join(', ');
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function getTechniqueId() {
    var params = new URLSearchParams(window.location.search);
    return (params.get('id') || '').trim();
  }

  function showError() {
    document.getElementById('detail-loading').classList.add('hidden');
    document.getElementById('detail-error').classList.remove('hidden');
    document.title = 'Técnica no encontrada · IPO';
  }

  function renderTechnique(t) {
    document.title = t.name + ' · Técnicas de Usabilidad';
    document.getElementById('detail-name').textContent = t.name;

    var img = document.getElementById('detail-image');
    img.src = assetPath(t.imageURL || 'static/images/' + t.id + '.svg');
    img.alt = t.imageAlt || t.name;

    document.getElementById('detail-introduction').textContent = t.introduction || '';
    document.getElementById('detail-objective').textContent = t.objective || '';
    document.getElementById('detail-lifecycle').textContent = t.lifecycle || '';
    document.getElementById('detail-method').textContent =
      (t.methodType || '') + (t.qualQuant ? ' · ' + t.qualQuant : '');
    document.getElementById('detail-requirements').textContent = t.requirements || '';

    var howToWrap = document.getElementById('detail-howto-wrap');
    var howToList = document.getElementById('detail-howto');
    if (t.howTo && t.howTo.length) {
      howToWrap.classList.remove('hidden');
      howToList.innerHTML = t.howTo.map(function (step) {
        return '<li class="pl-2 leading-relaxed">' + escapeHtml(step) + '</li>';
      }).join('');
    } else {
      howToWrap.classList.add('hidden');
    }

    var badges = document.getElementById('detail-badges');
    badges.innerHTML =
      '<span class="rounded-full bg-brand-muted text-brand px-3 py-1.5 font-semibold">N. personas: ' + escapeHtml(label(LABELS.people, t.people)) + '</span>' +
      '<span class="rounded-full bg-stone-100 text-stone-700 px-3 py-1.5 font-semibold">Modalidad: ' + escapeHtml(labelCSV(LABELS.modality, t.modality)) + '</span>' +
      '<span class="rounded-full bg-accent-soft text-accent px-3 py-1.5 font-semibold">Tipo: ' + escapeHtml(label(LABELS.tipo, t.tipo)) + '</span>' +
      '<span class="rounded-full bg-stone-100 text-stone-700 px-3 py-1.5 font-semibold">Duración: ' + escapeHtml(label(LABELS.duration, t.duration)) + '</span>' +
      '<span class="rounded-full bg-stone-100 text-stone-700 px-3 py-1.5 font-semibold">Resultados: ' + escapeHtml(labelCSV(LABELS.results, t.results)) + '</span>';

    document.getElementById('detail-loading').classList.add('hidden');
    document.getElementById('detail-content').classList.remove('hidden');
  }

  async function init() {
    var id = getTechniqueId();
    if (!id) {
      showError();
      return;
    }
    try {
      var res = await fetch('data/techniques.json');
      if (!res.ok) throw new Error('fetch failed');
      var techniques = await res.json();
      var t = null;
      for (var i = 0; i < techniques.length; i++) {
        if (techniques[i].id === id) {
          t = techniques[i];
          break;
        }
      }
      if (!t) {
        showError();
        return;
      }
      renderTechnique(t);
    } catch (e) {
      showError();
    }
  }

  init();
})();
