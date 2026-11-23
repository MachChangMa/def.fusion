globalThis.FusionCache = (() => {
  const base = new URL('./', globalThis.registration?.scope || location.href);
  const games = ['snake','brick','pong','skyaces','meteor'].map(id => 'offline-games/' + id + '.html');
  const files = ['index.html','atom-lab.js','win95.css','news-reporter.jpg','gnome.gif','manifest.webmanifest',
    'icons/icon-192.png','icons/icon-512.png','fusion-cache.js','game-sources.js','game-sources.json', ...games];
  const prefix = 'fusion-shell:' + base.pathname + ':';
  return {base, games, files, prefix, name: prefix + '3.3.0',
    url: path => new URL(path, base).href};
})();
