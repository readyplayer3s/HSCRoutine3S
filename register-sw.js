// Service Worker Registration
// Detects browser support and registers the Service Worker on page load
// This enables offline functionality without modifying existing code

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => {
      console.log('✓ Service Worker registered successfully');
      console.log('Scope:', reg.scope);
    })
    .catch(err => {
      console.log('Service Worker registration failed:', err);
    });
} else {
  console.log('Service Workers not supported in this browser');
}
