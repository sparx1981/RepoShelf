# Installing RepoShelf

RepoShelf is a progressive web app served over HTTPS. No account is required to install. Existing GitHub sign-in requirements still apply to collection and external links.

- Android: tap **Install app** in RepoShelf's footer, then **Install RepoShelf** when offered. Alternatively, Chrome menu → Install app / Add to Home screen.
- iPhone/iPad: open https://reposhelf.vercel.app in Safari → Share → Add to Home Screen → Add. Keep Open as Web App enabled if offered. Installation inside another app's embedded browser may be unavailable.
- Desktop: use a supporting browser's install menu or address-bar install icon.

Icons are generated automatically by `scripts/build-app-icons.mjs` during `npm run build`: 192/512px Android icons, a 512px maskable icon with a safe inset mark, and a 180px Apple touch icon. The manifest has a stable `/` app ID, root scope and standalone display. There is no forced portrait orientation.

The service worker stores only the offline screen and four public icons. It does not cache storefront HTML, full catalogues, API responses, account data or private viewing history. OAuth callbacks bypass it. Browsing and account features require a connection; failed navigations show an offline screen with retry. Install UI stays out of the way when already running standalone. Login state in an installed iOS app may differ from Safari; sign in inside the installed app if needed.

Deployments serve `sw.js` and the manifest with no-cache headers. Changes to offline assets require incrementing the service worker's `reposhelf-install-v1` cache version; activation removes only obsolete RepoShelf install caches. Uninstall using the device's app/home-screen controls.
