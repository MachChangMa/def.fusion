(() => {
  const byId = id => document.getElementById(id);
  const catalog = byId('sourceList');
  const search = byId('sourceSearch');
  const state = byId('sourceStatus');
  const importForm = byId('sourceImport');
  const player = byId('sourcePlayer');
  const key = 'fusion-source-catalog-v1:' + FusionCache.base.pathname;
  let release = [];
  let selected = null;
  let local = [];
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(saved)) local = saved.map(normalize).filter(Boolean);
  } catch {}

  function https(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? url : null;
    } catch { return null; }
  }

  function pinned(value) {
    const url = https(value);
    if (!url || url.search || url.hash) return null;
    const part = '([a-z0-9_.-]+)';
    const sha = '([0-9a-f]{40})';
    const adapters = {
      'https://cdn.jsdelivr.net': new RegExp('^/gh/' + part + '/' + part + '@' + sha + '/(.+)$','i'),
      'https://github.com': new RegExp('^/' + part + '/' + part + '/blob/' + sha + '/(.+)$','i'),
      'https://raw.githubusercontent.com': new RegExp('^/' + part + '/' + part + '/' + sha + '/(.+)$','i')
    };
    const match = adapters[url.origin]?.exec(url.pathname);
    if (!match || !/^[a-z0-9_./-]+\.html?$/i.test(match[4])) return null;
    const [, owner, repo, commit, path] = match;
    return {commit: commit.toLowerCase(),
      url: 'https://cdn.jsdelivr.net/gh/' + owner + '/' + repo + '@' + commit.toLowerCase() + '/' + path};
  }

  function normalize(record) {
    if (!record || typeof record.title !== 'string' || !record.title.trim()) return null;
    const upstream = https(record.source);
    const revision = upstream?.origin === 'https://laaarp.com' && upstream.pathname === '/play.svg' &&
      /^#\/_upstream\/html\/([a-f0-9]{40})\/[a-z0-9_.-]+\.html$/i.exec(upstream.hash);
    const pin = pinned(record.source) || (revision && {commit: revision[1], url: upstream.href});

    if (!pin) return null;
    const embed = record.authorized === true ? https(record.embed) : null;
    if (embed && embed.origin === location.origin) return null;
    return {title: record.title.trim().slice(0,120), source: pin.url, commit: pin.commit,
      reference: https(record.reference)?.href || pin.url, embed: embed?.href || '',
      authorized: Boolean(embed)};
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    const entries = [...release, ...local].filter(item =>
      (item.title + ' ' + item.source).toLowerCase().includes(query));
    catalog.replaceChildren();
    for (const item of entries) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = item.title + (item.authorized ? ' · EMBED UNTESTED' : ' · REFERENCE ONLY');
      button.addEventListener('click', () => select(item));
      const row = document.createElement('li');
      row.append(button);
      catalog.append(row);
    }
    byId('sourceCount').textContent = entries.length + ' source(s)';
  }

  let frameTimer;
  function stop() {
    clearTimeout(frameTimer);
    player.replaceChildren();
  }

  function select(item) {
    activeCheck = null;
    selected = item;
    stop();
    byId('sourceDetail').hidden = false;
    byId('sourceTitle').textContent = item.title;
    byId('sourceReference').textContent = item.reference;
    byId('sourcePin').textContent = item.source;
    byId('sourcePlay').hidden = !item.authorized;
    state.textContent = item.authorized ? 'Embed permission recorded. Playback unverified.' :
      'Reference only. Embed permission and gameplay are unverified.';
  }

  byId('sourceCheck').addEventListener('click', async () => {
    const item = selected;
    if (!item) return;
    const check = Symbol();
    activeCheck = check;
    if (item.source.includes('#')) {
      state.textContent = 'The revision is inside a launcher fragment. HTTP cannot check that game directly.';
      return;
    }
    state.textContent = 'Checking pinned source headers…';
    try {
      const response = await fetch(item.source, {method:'HEAD', cache:'no-store',
        credentials:'omit', redirect:'error', signal:AbortSignal.timeout(7000)});
      if (item !== selected || check !== activeCheck) return;
      const type = response.headers.get('content-type') || 'unknown MIME type';
      state.textContent = response.ok ? 'Source reachable (HTTP ' + response.status + ', ' + type +
        '). Launcher and gameplay remain unverified.' :
        'Pinned source returned HTTP ' + response.status + '.';
    } catch {
      if (item === selected && check === activeCheck) state.textContent =
        'Source check inconclusive. The network, timeout, redirect policy, or CORS blocked inspection.';
    }
  });
  let activeCheck;
  byId('sourcePlay').addEventListener('click', () => {
    if (!selected?.authorized) return;
    activeCheck = null;
    stop();
    const frame = document.createElement('iframe');
    frame.sandbox = 'allow-scripts allow-forms allow-pointer-lock';
    frame.allow = 'fullscreen; gamepad';
    frame.referrerPolicy = 'no-referrer';
    frame.title = selected.title;
    frame.src = selected.embed;
    state.textContent = 'Opening authorized embed. Provider restrictions may apply.';
    frameTimer = setTimeout(() => {
      if (frame.isConnected) state.textContent = 'No frame load event after 12 seconds. Playback is unverified.';
    }, 12000);
    frame.addEventListener('load', () => {
      clearTimeout(frameTimer);
      if (frame.isConnected) state.textContent = 'Frame load event received. Verify gameplay in the player.';
    });
    frame.addEventListener('error', () => {
      clearTimeout(frameTimer);
      if (frame.isConnected) state.textContent = 'The browser reported a frame error.';
    });
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Close embed';
    close.addEventListener('click', () => {
      clearTimeout(frameTimer);
      stop();
      state.textContent = 'Embed closed. Playback remains unverified.';
    });
    player.append(close, frame);
  });

  importForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!byId('studio').classList.contains('open')) return;
    const form = new FormData(importForm);
    const embed = form.get('embed').trim();
    const item = normalize({title:form.get('title'), source:form.get('source'),
      embed, authorized:form.has('permission')});
    const result = byId('sourceImportResult');
    if (!item || !pinned(form.get('source')) || (embed && !item.authorized)) {
      result.textContent = 'Use a full commit SHA on a supported GitHub/CDN HTML URL. Embeds require a separate HTTPS origin and publisher permission.';
      return;
    }
    const entries = [...local.filter(old => old.source !== item.source), item];
    try {
      localStorage.setItem(key, JSON.stringify(entries));
    } catch {
      result.textContent = 'Browser storage could not save the entry.';
      return;
    }
    local = entries;
    importForm.reset();
    result.textContent = item.title + ' saved in this browser.';
    render();
  });
  search.addEventListener('input', render);
  render();
  fetch(FusionCache.url('game-sources.json')).then(response => {
    if (!response.ok) throw Error('Catalog unavailable');
    return response.json();
  }).then(records => {
    release = records.map(normalize).filter(Boolean);
    render();
  }).catch(() => { byId('sourceCatalogStatus').textContent = 'The release catalog could not be loaded.'; });
  globalThis.FusionSources = {stop};
})();
