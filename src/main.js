console.log('App 1 loaded');
console.log('Ref:', '__APP_REF__');
console.log('SHA:', '__APP_SHA__');

// Detect routing mode and parse environment
const host = window.location.hostname;
const path = window.location.pathname;
const subdomain = host.split('.')[0];

let env = 'unknown';
let routingMode = 'subdomain';

// Check if using path-based routing (env is first path segment)
// Path mode: /prod/app1, /sandbox-123/app2
// Subdomain mode: prod.example.com/app1
const pathParts = path.split('/').filter(p => p);
const firstSegment = pathParts[0] || '';

if (firstSegment === 'prod' || firstSegment === 'dev' || firstSegment.startsWith('sandbox-')) {
  // Path-based routing detected
  routingMode = 'path';
  env = firstSegment;
} else if (subdomain === 'prod' || subdomain === 'dev') {
  env = subdomain;
} else if (subdomain.startsWith('sandbox-')) {
  env = subdomain;
} else if (host === 'localhost' || host === '127.0.0.1') {
  env = 'local';
}

// Rewrite nav links for path-based routing
if (routingMode === 'path' && env !== 'unknown') {
  document.querySelectorAll('nav a[data-app]').forEach(link => {
    const app = link.getAttribute('data-app');
    link.href = '/' + env + '/' + app;
  });
}

document.getElementById('env').textContent = env;
document.getElementById('host').textContent = host;
document.getElementById('route').textContent = path;
