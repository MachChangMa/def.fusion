# definitly Fusion v3.3 Win95

## GitHub Pages

The Pages ZIP contains the site at its archive root. Extract it into the root of the publishing branch (or into its /docs folder) and select that location in the repository's Settings > Pages. Include the empty .nojekyll file. Open the HTTPS URL ending in a slash. The files and service worker resolve relative to that directory, including under /repository/.

For a local static preview, run `python -m http.server 8000` in the extracted directory and open http://localhost:8000/. Atom Lab opens first. Select **Open Fusion Arcade** and use your existing password (default `hello`). Press tilde to open the console.

Pages serves the arcade, bundled games, News display and local edits, browser-local game and source imports, and the existing console. Shared comments, reports, changelog editing and ZIP installs use the Python backend. Use the Local ZIP for those features. Extract it into your existing local installation to preserve its data directory, and use the same URL and port to retain browser settings.

## Game sources and diagnostics

- Game Sources lists the 26 entries recovered from Game CDNs.docx. The Xnogsis GitHub paths resolve to jsDelivr commit URLs. The eight launcher-only upstream paths retain their original revisions as references.
- **Check source** requests headers from the pinned CDN URL. An HTTP success confirms reachability only. Browser CORS restrictions, redirects and timeouts can make checks inconclusive. The upstream fragment identifies a game within a launcher and cannot be checked directly over HTTP.
- Use `/dev` and **Import pinned game source** to add an HTML file URL from GitHub, raw.githubusercontent.com or jsDelivr at a full 40-character Git commit. For an embed, supply the HTTPS player URL at a separate origin and confirm publisher permission. The player is sandboxed and reports browser load events. A load event can occur for blank or blocked frames, so play the game to verify compatibility.
- To share vetted entries with all visitors, edit game-sources.json before deploying. A record has a title and source, plus an optional original reference. Set embed to the approved player URL and authorized to true only after confirming permission. Browser-local imports stay in the importing browser.
- **Save offline copy** caches the site, source metadata and five bundled originals. External game files and backend requests fall outside the cache allowlist. External embeds require their provider to be online and reachable.
