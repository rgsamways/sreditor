export const INDEX_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Sreditor</title>
<style>
  :root { color-scheme: light dark; }
  :root[data-theme="light"] { color-scheme: light; }
  :root[data-theme="dark"] { color-scheme: dark; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    margin: 0;
    padding: 1.5rem 2rem 3rem;
    max-width: 1100px;
    margin-inline: auto;
    line-height: 1.4;
  }
  header { margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: start; gap: 1rem; }
  header h1 { margin: 0 0 0.25rem; font-size: 1.4rem; }
  header p { margin: 0; opacity: 0.7; font-size: 0.9rem; }
  #theme-toggle { font: inherit; font-size: 0.85rem; padding: 0.35rem 0.75rem; cursor: pointer; flex: 0 0 auto; white-space: nowrap; }
  nav.tabs { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 1px solid currentColor; }
  nav.tabs button {
    background: none; border: none; padding: 0.5rem 1rem; font-size: 1rem; cursor: pointer;
    opacity: 0.6; border-bottom: 2px solid transparent;
  }
  nav.tabs button.active { opacity: 1; border-bottom-color: currentColor; font-weight: 600; }
  section.view { display: none; }
  section.view.active { display: block; }
  .filters { display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
  .filters label { font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.25rem; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 1.5rem; }
  th, td { text-align: left; padding: 0.4rem 0.6rem; border-bottom: 1px solid rgba(128,128,128,0.3); font-size: 0.9rem; }
  th { cursor: pointer; user-select: none; white-space: nowrap; }
  th.sorted::after { content: " \\25BE"; }
  tr.row { cursor: pointer; }
  tr.row:hover { background: rgba(128,128,128,0.12); }
  .badge { display: inline-block; padding: 0.1rem 0.5rem; border-radius: 999px; font-size: 0.78rem; }
  .badge.true { background: rgba(40,160,80,0.18); }
  .badge.false { background: rgba(160,60,60,0.18); }
  .empty-state { opacity: 0.7; padding: 2rem 0; font-size: 0.95rem; }
  .detail {
    border: 1px solid rgba(128,128,128,0.35); border-radius: 8px; padding: 1rem 1.25rem;
    margin-top: 1rem;
  }
  .detail h3 { margin-top: 0; }
  .detail dt { font-weight: 600; margin-top: 0.75rem; }
  .detail dd { margin: 0.15rem 0 0; white-space: pre-wrap; }
  .project { border: 1px solid rgba(128,128,128,0.35); border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; }
  .project.excluded { border-style: dashed; opacity: 0.9; }
  .project h3 { margin-top: 0; }
  .meta { font-size: 0.85rem; opacity: 0.75; margin-bottom: 0.75rem; }
  .field-block { margin-bottom: 0.9rem; }
  .field-block h4 { margin: 0 0 0.2rem; font-size: 0.85rem; }
  .field-block .count { font-weight: normal; opacity: 0.75; }
  .field-block .count.over { color: #c0392b; opacity: 1; font-weight: 600; }
  .field-block p { margin: 0; white-space: pre-wrap; }
  .excluded-banner {
    background: rgba(200,150,40,0.15); border: 1px solid rgba(200,150,40,0.4); border-radius: 6px;
    padding: 0.6rem 0.9rem; margin-bottom: 1rem; font-size: 0.88rem;
  }
  .excluded-change { border-top: 1px solid rgba(128,128,128,0.25); padding-top: 0.6rem; margin-top: 0.6rem; }
  .excluded-change:first-child { border-top: none; margin-top: 0; padding-top: 0; }
  .collapsible-header { cursor: pointer; display: flex; align-items: baseline; gap: 0.5rem; user-select: none; }
  .collapsible-header .toggle { font-size: 0.75rem; opacity: 0.6; width: 0.9rem; display: inline-block; }
  .collapsible-header h3 { margin: 0; }
  .excluded-change .cid { font-weight: 600; }
  .excluded-change .proximity { font-style: italic; font-size: 0.85rem; opacity: 0.8; }
  .collapsible-body { display: none; margin-top: 0.4rem; }
  .expanded .collapsible-body { display: block; }
  .pager { display: flex; align-items: center; gap: 0.75rem; margin: -0.5rem 0 1.5rem; font-size: 0.85rem; }
  .pager button { font: inherit; padding: 0.25rem 0.7rem; cursor: pointer; }
  .pager button:disabled { opacity: 0.4; cursor: default; }
  .timeline-heading { font-size: 0.85rem; margin: 0 0 0.5rem; opacity: 0.8; }
  .timeline { display: flex; align-items: stretch; gap: 0; margin-bottom: 1.25rem; overflow-x: auto; }
  .timeline-node { flex: 0 0 auto; width: 13rem; }
  .timeline-node .card {
    border: 1px solid rgba(128,128,128,0.35); border-radius: 6px; padding: 0.5rem 0.6rem;
    cursor: pointer; font-size: 0.8rem;
  }
  .timeline-node .card:hover { background: rgba(128,128,128,0.1); }
  .timeline-node .date { opacity: 0.65; font-size: 0.75rem; }
  .timeline-node .cid { font-weight: 600; word-break: break-word; margin-top: 0.15rem; }
  .timeline-arrow { flex: 0 0 auto; display: flex; align-items: center; padding: 0 0.4rem; opacity: 0.5; }
  .timeline-detail { font-size: 0.82rem; margin-top: 0.4rem; padding: 0.5rem 0.6rem; border-top: 1px dashed rgba(128,128,128,0.35); white-space: pre-wrap; }
  .timeline-detail.loading { opacity: 0.6; font-style: italic; }
  .coverage { font-size: 0.8rem; opacity: 0.85; margin-top: 0.4rem; }
  .coverage-bar { display: flex; height: 0.5rem; border-radius: 999px; overflow: hidden; margin-top: 0.25rem; background: rgba(128,128,128,0.2); width: 14rem; }
  .coverage-bar .judged { background: rgba(70,130,180,0.85); }
  .coverage-bar .unjudged { background: transparent; }
  .proximity-chart { display: flex; gap: 1.25rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
  .proximity-chip { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
  .proximity-chip .swatch { width: 0.9rem; height: 0.9rem; border-radius: 3px; flex: 0 0 auto; }
  .swatch.eligible, .dot.eligible { background: rgba(40,160,80,0.75); }
  .swatch.close, .dot.close { background: rgba(70,130,180,0.75); }
  .swatch.some_signal, .dot.some_signal { background: rgba(200,150,40,0.8); }
  .swatch.not_close, .dot.not_close { background: rgba(160,60,60,0.55); }
  .word-count-bar { display: block; height: 0.4rem; border-radius: 999px; background: rgba(128,128,128,0.2); margin: 0.2rem 0 0.35rem; overflow: hidden; max-width: 20rem; }
  .word-count-bar .fill { display: block; height: 100%; background: rgba(70,130,180,0.75); }
  .word-count-bar .fill.over { background: #c0392b; }
  .history-row { display: flex; align-items: baseline; gap: 0.6rem; padding: 0.35rem 0; border-bottom: 1px solid rgba(128,128,128,0.2); cursor: pointer; }
  .history-row:hover { background: rgba(128,128,128,0.08); }
  .history-row .dot { width: 0.6rem; height: 0.6rem; border-radius: 999px; flex: 0 0 auto; }
  .history-row .date { font-size: 0.8rem; opacity: 0.65; width: 5.5rem; flex: 0 0 auto; }
  .history-row .cid { font-size: 0.88rem; flex: 1 1 auto; }
  .history-row .badges { font-size: 0.75rem; opacity: 0.7; flex: 0 0 auto; white-space: nowrap; }
  .history-detail { font-size: 0.85rem; padding: 0.5rem 0.75rem 0.75rem 2.2rem; white-space: pre-wrap; border-bottom: 1px solid rgba(128,128,128,0.2); }
  .history-detail h4 { margin: 0.5rem 0 0.15rem; font-size: 0.8rem; opacity: 0.75; }
  .history-detail h4:first-child { margin-top: 0; }
  .project-badge {
    display: inline-block; background: rgba(40,160,80,0.16); color: inherit; border: 1px solid rgba(40,160,80,0.4);
    border-radius: 999px; padding: 0.1rem 0.55rem; font-size: 0.72rem; font-weight: 600; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis; max-width: 12rem;
  }
  .project-callout {
    background: rgba(40,160,80,0.12); border: 1px solid rgba(40,160,80,0.4); border-radius: 6px;
    padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; font-size: 0.88rem; font-weight: 600;
  }
</style>
</head>
<body>
<header>
  <div>
    <h1>Sreditor</h1>
    <p>Local-only, read-only view of .sreditor data. Nothing here is uploaded anywhere.</p>
    <div class="coverage" id="coverage"></div>
  </div>
  <button type="button" id="theme-toggle"></button>
</header>

<nav class="tabs">
  <button type="button" data-view="judgments" class="active">Judgments</button>
  <button type="button" data-view="history">History</button>
  <button type="button" data-view="rollup">Rollup</button>
</nav>

<section class="view active" id="view-judgments">
  <div class="proximity-chart" id="proximity-chart"></div>
  <div class="filters">
    <label>Eligible
      <select id="filter-eligible">
        <option value="all">All</option>
        <option value="true">Eligible</option>
        <option value="false">Ineligible</option>
      </select>
    </label>
    <label>Confidence
      <select id="filter-confidence">
        <option value="all">All</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </label>
    <label>Proximity
      <select id="filter-proximity">
        <option value="all">All</option>
        <option value="close">Close</option>
        <option value="some_signal">Some signal</option>
        <option value="not_close">Not close</option>
      </select>
    </label>
  </div>
  <div id="judgments-container"></div>
  <div id="judgments-pager"></div>
  <div id="judgment-detail"></div>
</section>

<section class="view" id="view-history">
  <p class="timeline-heading">Every judged change, in date order — click a row for its full reasoning and drift note (if any).</p>
  <div id="history-container"></div>
</section>

<section class="view" id="view-rollup">
  <div id="rollup-container"></div>
</section>

<script>
(function () {
  var PAGE_SIZE = 10;
  var state = { judgments: [], sortKey: 'changeId', sortDir: 1, selected: null, page: 1 };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (key) {
      if (key === 'class') node.className = attrs[key];
      else if (key === 'text') node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) { node.appendChild(child); });
    return node;
  }

  function fetchJson(path) {
    return fetch(path).then(function (res) { return res.json(); });
  }

  // Theme toggle: cycles Auto (follow OS) -> Light -> Dark, persisted locally.
  var THEME_STORAGE_KEY = 'sreditor-theme';
  var THEME_CYCLE = [null, 'light', 'dark'];
  var THEME_LABELS = { null: 'Theme: Auto', light: 'Theme: Light', dark: 'Theme: Dark' };

  function applyTheme(theme) {
    if (theme) document.documentElement.setAttribute('data-theme', theme);
    else document.documentElement.removeAttribute('data-theme');
    document.getElementById('theme-toggle').textContent = THEME_LABELS[theme];
  }

  (function initTheme() {
    var stored = localStorage.getItem(THEME_STORAGE_KEY);
    var theme = stored === 'light' || stored === 'dark' ? stored : null;
    applyTheme(theme);
    document.getElementById('theme-toggle').addEventListener('click', function () {
      var current = localStorage.getItem(THEME_STORAGE_KEY);
      var currentIndex = THEME_CYCLE.indexOf(current === 'light' || current === 'dark' ? current : null);
      var next = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length];
      if (next) localStorage.setItem(THEME_STORAGE_KEY, next);
      else localStorage.removeItem(THEME_STORAGE_KEY);
      applyTheme(next);
    });
  })();

  // Tabs
  document.querySelectorAll('nav.tabs button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('nav.tabs button').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('section.view').forEach(function (s) { s.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('view-' + btn.dataset.view).classList.add('active');
    });
  });

  // Judgments
  function applyFilters(records) {
    var eligible = document.getElementById('filter-eligible').value;
    var confidence = document.getElementById('filter-confidence').value;
    var proximity = document.getElementById('filter-proximity').value;
    return records.filter(function (r) {
      if (eligible !== 'all' && String(r.eligible) !== eligible) return false;
      if (confidence !== 'all' && r.confidence !== confidence) return false;
      if (proximity !== 'all' && r.proximity !== proximity) return false;
      return true;
    });
  }

  function renderPager(container, totalRows) {
    container.innerHTML = '';
    var totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
    if (totalPages <= 1) return;

    var prev = el('button', { type: 'button', text: '‹ Prev' });
    prev.disabled = state.page <= 1;
    prev.addEventListener('click', function () { state.page -= 1; renderJudgmentsTable(); });

    var next = el('button', { type: 'button', text: 'Next ›' });
    next.disabled = state.page >= totalPages;
    next.addEventListener('click', function () { state.page += 1; renderJudgmentsTable(); });

    var label = el('span', { text: 'Page ' + state.page + ' of ' + totalPages });

    container.appendChild(el('div', { class: 'pager' }, [prev, label, next]));
  }

  function renderJudgmentsTable() {
    var container = document.getElementById('judgments-container');
    var pagerContainer = document.getElementById('judgments-pager');
    container.innerHTML = '';
    pagerContainer.innerHTML = '';

    if (state.judgments.length === 0) {
      container.appendChild(el('p', { class: 'empty-state', text: 'No judgments yet. Run \`sreditor judge\` first.' }));
      return;
    }

    var rows = applyFilters(state.judgments);
    rows.sort(function (a, b) {
      var av = a[state.sortKey], bv = b[state.sortKey];
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * state.sortDir;
    });

    if (rows.length === 0) {
      container.appendChild(el('p', { class: 'empty-state', text: 'No judgments match the current filters.' }));
      return;
    }

    var totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
    var pageRows = rows.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    var columns = [
      { key: 'changeId', label: 'Change' },
      { key: 'eligible', label: 'Eligible' },
      { key: 'confidence', label: 'Confidence' },
      { key: 'proximity', label: 'Proximity' },
      { key: 'judgedAt', label: 'Judged at' },
      { key: 'filingReadyProjectName', label: 'Project' },
    ];

    var thead = el('thead', {}, [el('tr', {}, columns.map(function (col) {
      var th = el('th', { text: col.label });
      if (col.key === state.sortKey) th.classList.add('sorted');
      th.addEventListener('click', function () {
        if (state.sortKey === col.key) state.sortDir *= -1;
        else { state.sortKey = col.key; state.sortDir = 1; }
        renderJudgmentsTable();
      });
      return th;
    }))]);

    var tbody = el('tbody', {}, pageRows.map(function (r) {
      var projectCell = r.filingReadyProjectName
        ? el('span', { class: 'project-badge', title: r.filingReadyProjectName, text: r.filingReadyProjectName })
        : el('span', { text: '—' });
      var tr = el('tr', { class: 'row' }, [
        el('td', { text: r.changeId }),
        el('td', {}, [el('span', { class: 'badge ' + String(r.eligible), text: String(r.eligible) })]),
        el('td', { text: r.confidence }),
        el('td', { text: r.proximity || '—' }),
        el('td', { text: (r.judgedAt || '').slice(0, 10) }),
        el('td', {}, [projectCell]),
      ]);
      tr.addEventListener('click', function () { renderJudgmentDetail(r); });
      return tr;
    }));

    container.appendChild(el('table', {}, [thead, tbody]));
    renderPager(pagerContainer, rows.length);
  }

  function renderJudgmentDetail(record) {
    var container = document.getElementById('judgment-detail');
    container.innerHTML = '';
    var dl = el('dl', {}, [
      el('dt', { text: 'Uncertainty' }), el('dd', { text: record.uncertaintyStatement }),
      el('dt', { text: 'Investigation' }), el('dd', { text: record.investigationSteps }),
      el('dt', { text: 'Advancement' }), el('dd', { text: record.advancement }),
      el('dt', { text: 'Reasoning' }), el('dd', { text: record.reasoning }),
      el('dt', { text: 'Proximity' }), el('dd', { text: record.proximity || 'not available' }),
      el('dt', { text: 'Path to eligibility' }), el('dd', { text: record.pathToEligibility || 'not available' }),
      el('dt', { text: 'Drift' }), el('dd', { text: record.drift || 'not available' }),
    ]);
    var children = [el('h3', { text: record.changeId })];
    if (record.filingReadyProjectName) {
      var calloutText = record.eligible
        ? 'Contributes to the filing-ready project: ' + record.filingReadyProjectName
        : 'Ineligible on its own, but contributes to the filing-ready project: ' + record.filingReadyProjectName;
      children.push(el('div', { class: 'project-callout', text: calloutText }));
    }
    children.push(dl);
    container.appendChild(el('div', { class: 'detail' }, children));
  }

  ['filter-eligible', 'filter-confidence', 'filter-proximity'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', function () {
      state.page = 1;
      renderJudgmentsTable();
    });
  });

  var PROXIMITY_CHART_LABELS = { eligible: 'Eligible', close: 'Close', some_signal: 'Some signal', not_close: 'Not close' };

  function renderProximityChart(judgments) {
    var container = document.getElementById('proximity-chart');
    container.innerHTML = '';
    if (judgments.length === 0) return;

    var counts = { eligible: 0, close: 0, some_signal: 0, not_close: 0 };
    judgments.forEach(function (r) {
      if (r.eligible) counts.eligible += 1;
      else if (r.proximity === 'close') counts.close += 1;
      else if (r.proximity === 'some_signal') counts.some_signal += 1;
      else counts.not_close += 1;
    });

    Object.keys(counts).forEach(function (key) {
      container.appendChild(el('div', { class: 'proximity-chip' }, [
        el('span', { class: 'swatch ' + key }),
        el('span', { text: PROXIMITY_CHART_LABELS[key] + ': ' + counts[key] + ' / ' + judgments.length }),
      ]));
    });
  }

  function renderCoverage() {
    fetchJson('/api/coverage').then(function (c) {
      var container = document.getElementById('coverage');
      var pct = c.archivedCount === 0 ? 0 : Math.round((c.judgedCount / c.archivedCount) * 100);
      container.innerHTML = '';
      container.appendChild(el('span', {
        text: c.judgedCount + ' / ' + c.archivedCount + ' archived changes judged (' + c.unjudgedCount + ' unjudged)'
          + (c.rollupExists ? ', ' + c.rolledUpCount + ' rolled up' : ', no rollup yet'),
      }));
      var bar = el('div', { class: 'coverage-bar' }, [
        el('div', { class: 'judged', style: 'width:' + pct + '%' }),
      ]);
      container.appendChild(bar);
    });
  }
  renderCoverage();

  fetchJson('/api/judgments').then(function (data) {
    state.judgments = data;
    renderJudgmentsTable();
    renderProximityChart(data);
    renderHistory(data);
  });

  // Rollup
  function renderWordCount(check) {
    var cls = check.overLimit ? 'count over' : 'count';
    var warn = check.overLimit ? ' \\u26A0 over limit, trim before filing' : '';
    return el('span', { class: cls, text: '(' + check.count + '/' + check.limit + ' words' + warn + ')' });
  }

  function renderWordCountBar(check) {
    var pct = Math.min(100, Math.round((check.count / check.limit) * 100));
    var fill = el('span', { class: 'fill' + (check.overLimit ? ' over' : ''), style: 'width:' + pct + '%' });
    return el('span', { class: 'word-count-bar' }, [fill]);
  }

  // Change ids are conventionally date-prefixed (YYYY-MM-DD-slug); that's the
  // change's own date, distinct from judgedAt (when Sreditor evaluated it).
  function changeIdDate(changeId) {
    var m = /^(\\d{4}-\\d{2}-\\d{2})/.exec(changeId);
    return m ? m[1] : null;
  }

  var judgmentDetailCache = {};
  function fetchJudgmentDetail(changeId) {
    if (!judgmentDetailCache[changeId]) {
      judgmentDetailCache[changeId] = fetchJson('/api/judgments/' + encodeURIComponent(changeId));
    }
    return judgmentDetailCache[changeId];
  }

  function proximityKey(record) {
    if (record.eligible) return 'eligible';
    return record.proximity || 'not_close';
  }

  function renderHistory(judgments) {
    var container = document.getElementById('history-container');
    container.innerHTML = '';

    if (judgments.length === 0) {
      container.appendChild(el('p', { class: 'empty-state', text: 'No judgments yet. Run \`sreditor judge\` first.' }));
      return;
    }

    var ordered = judgments.slice().sort(function (a, b) {
      var da = changeIdDate(a.changeId), db = changeIdDate(b.changeId);
      if (!da || !db) return 0;
      return da < db ? -1 : da > db ? 1 : 0;
    });

    ordered.forEach(function (record) {
      var rowChildren = [
        el('span', { class: 'dot ' + proximityKey(record) }),
        el('span', { class: 'date', text: changeIdDate(record.changeId) || 'undated' }),
        el('span', { class: 'cid', text: record.changeId }),
        el('span', { class: 'badges', text: (record.eligible ? 'eligible' : (record.proximity || 'not_close')) + ' · ' + record.confidence }),
      ];
      if (record.filingReadyProjectName) {
        rowChildren.push(el('span', { class: 'project-badge', title: record.filingReadyProjectName, text: record.filingReadyProjectName }));
      }
      var row = el('div', { class: 'history-row' }, rowChildren);

      var detail = null;
      row.addEventListener('click', function () {
        if (detail) {
          detail.remove();
          detail = null;
          return;
        }
        var detailChildren = [];
        if (record.filingReadyProjectName) {
          detailChildren.push(el('p', {
            class: 'project-callout',
            text: 'Contributes to the filing-ready project: ' + record.filingReadyProjectName,
          }));
        }
        detailChildren.push(el('h4', { text: 'Reasoning' }), el('p', { text: record.reasoning }));
        if (record.drift) detailChildren.push(el('h4', { text: 'Drift' }), el('p', { text: record.drift }));
        detail = el('div', { class: 'history-detail' }, detailChildren);
        row.insertAdjacentElement('afterend', detail);
      });

      container.appendChild(row);
    });
  }

  function renderTimeline(changeIds) {
    var ordered = changeIds.slice().sort(function (a, b) {
      var da = changeIdDate(a), db = changeIdDate(b);
      if (!da || !db) return 0;
      return da < db ? -1 : da > db ? 1 : 0;
    });

    var nodes = [];
    ordered.forEach(function (changeId, index) {
      if (index > 0) nodes.push(el('div', { class: 'timeline-arrow', text: '→' }));

      var card = el('div', { class: 'card' }, [
        el('div', { class: 'date', text: changeIdDate(changeId) || 'undated' }),
        el('div', { class: 'cid', text: changeId }),
      ]);
      var detail = el('div', { class: 'timeline-detail' });
      var node = el('div', { class: 'timeline-node' }, [card, detail]);

      card.addEventListener('click', function () {
        if (detail.dataset.open === 'true') {
          detail.dataset.open = 'false';
          detail.innerHTML = '';
          return;
        }
        detail.dataset.open = 'true';
        detail.className = 'timeline-detail loading';
        detail.textContent = 'Loading…';
        fetchJudgmentDetail(changeId).then(function (record) {
          detail.className = 'timeline-detail';
          if (!record) {
            detail.textContent = 'No judgment record found for this change id.';
            return;
          }
          detail.textContent = record.reasoning;
        });
      });

      nodes.push(node);
    });

    return el('div', {}, [
      el('p', { class: 'timeline-heading', text: 'Timeline (click a step for its own reasoning)' }),
      el('div', { class: 'timeline' }, nodes),
    ]);
  }

  function renderFilingReadyProject(project) {
    var fields = [
      ['uncertainty', project.uncertainty],
      ['investigation', project.investigation],
      ['advancement', project.advancement],
    ];
    var blocks = fields.map(function (pair) {
      var check = project.wordLimitChecks.find(function (c) { return c.field === pair[0]; });
      var h4 = el('h4', { text: (check ? check.label : pair[0]) + ' ' });
      if (check) h4.appendChild(renderWordCount(check));
      var children = [h4];
      if (check) children.push(renderWordCountBar(check));
      children.push(el('p', { text: pair[1] }));
      return el('div', { class: 'field-block' }, children);
    });

    var toggle = el('span', { class: 'toggle', text: '▸' });
    var header = el('div', { class: 'collapsible-header' }, [
      toggle,
      el('h3', { text: project.name }),
    ]);
    var body = el('div', { class: 'collapsible-body' }, [
      el('div', { class: 'meta', text: 'Date range: ' + project.dateRange + ' | Confidence: ' + project.confidence + ' | Changes: ' + project.contributingChangeIds.join(', ') }),
      renderTimeline(project.contributingChangeIds),
    ].concat(blocks));

    var wrapper = el('div', { class: 'project' }, [header, body]);
    header.addEventListener('click', function () {
      var expanded = wrapper.classList.toggle('expanded');
      toggle.textContent = expanded ? '▾' : '▸';
    });
    return wrapper;
  }

  function renderExcludedProject(project) {
    var changes = project.changes.map(function (c) {
      var toggle = el('span', { class: 'toggle', text: '▸' });
      var header = el('div', { class: 'collapsible-header' }, [
        toggle,
        el('div', { class: 'cid', text: c.changeId }),
        el('div', { class: 'proximity', text: c.found ? (c.proximityLabel || 'Proximity not available') : 'No judgment record found for this change id.' }),
      ]);

      var bodyLines = [];
      if (c.found) {
        bodyLines.push(el('p', { text: c.reasoning }));
        bodyLines.push(el('p', { text: 'Path to eligibility: ' + (c.pathToEligibility || 'not available') }));
      }
      var body = el('div', { class: 'collapsible-body' }, bodyLines);

      var wrapper = el('div', { class: 'excluded-change' }, [header, body]);
      header.addEventListener('click', function () {
        var expanded = wrapper.classList.toggle('expanded');
        toggle.textContent = expanded ? '▾' : '▸';
      });
      return wrapper;
    });

    return el('div', { class: 'project excluded' }, [
      el('h3', { text: project.name }),
      el('div', { class: 'meta', text: 'Date range: ' + project.dateRange }),
    ].concat(changes));
  }

  function renderRollup(view) {
    var container = document.getElementById('rollup-container');
    container.innerHTML = '';

    if (!view.rollupExists) {
      container.appendChild(el('p', { class: 'empty-state', text: 'No rollup generated yet. Run \`sreditor rollup\` first.' }));
      return;
    }

    container.appendChild(el('p', { class: 'meta', text: 'Generated ' + view.generatedAt }));

    if (view.filingReady.length === 0) {
      container.appendChild(el('p', { class: 'empty-state', text: 'No filing-ready projects yet.' }));
    } else {
      view.filingReady.forEach(function (project) { container.appendChild(renderFilingReadyProject(project)); });
    }

    if (view.excluded.length > 0) {
      container.appendChild(el('div', { class: 'excluded-banner', text: 'Excluded — not for filing. These groupings exist only to account for judged changes with no genuine SR&ED narrative. Do not copy into a CRA submission.' }));
      view.excluded.forEach(function (project) { container.appendChild(renderExcludedProject(project)); });
    }
  }

  fetchJson('/api/rollup').then(renderRollup);
})();
</script>
</body>
</html>
`;
