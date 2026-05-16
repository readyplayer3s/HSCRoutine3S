// Service Worker Registration
// Detects browser support and registers the Service Worker on page load
// This enables offline functionality without modifying existing code

function notifyUpdateAvailable() {
  window.dispatchEvent(new CustomEvent('hsc-update-available'));
}

if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.register('./service-worker.js')
    .then(reg => {
      console.log('✓ Service Worker registered successfully');
      console.log('Scope:', reg.scope);

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
    .catch(err => {
      console.log('Service Worker registration failed:', err);
    });
} else {
  console.log('Service Workers not supported in this browser');
}
