TRUE TRAIN V11.5 — GitHub Pages deploy package

UPLOAD ALL files/folders in this directory to the SAME repository root:
  index.html
  manifest.webmanifest
  sw.js
  .nojekyll
  reset-cache.html
  icons/
    apple-touch-icon.png
    favicon-48.png
    icon-192.png
    icon-512.png
    icon-maskable-512.png

IMPORTANT:
1. Keep all names exactly as-is.
2. Do not rename index.html.
3. Do not move sw.js or manifest.webmanifest into another folder.
4. Keep the icons folder beside index.html.
5. After GitHub Pages finishes deploying, open the site online and refresh once.
6. For mobile testing, open: your-site-url/?v=115
7. If an old service worker still causes a blank/stale page, open:
   your-site-url/reset-cache.html
   then press RESET TRUE TRAIN CACHE once.

Service worker strategy:
- HTML/navigation = network-first, so new deploys are preferred.
- Static same-origin assets = cached with background refresh.
- Old TRUE TRAIN caches = deleted on service-worker activation.

Version: V11.5
