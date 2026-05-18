// Service Worker Registration
// Detects browser support and registers the Service Worker on page load
// This enables offline functionality without modifying existing code

let updateNotificationSent = false;

function notifyUpdateAvailable() {
  if (updateNotificationSent) return;
  updateNotificationSent = true;
  window.dispatchEvent(new CustomEvent('hsc-update-available'));
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const hadController = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => {
        // trigger an update check immediately
        try { reg.update(); } catch (e) {}

        if (hadController && reg.waiting) {
          notifyUpdateAvailable();
        }

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;

          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && hadController) {
              notifyUpdateAvailable();
            }
          });
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (hadController) {
            notifyUpdateAvailable();
          }
        });
      })
      .catch(() => {});
  });
}
