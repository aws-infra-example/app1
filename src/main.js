console.log('App 1 loaded');
console.log('Ref:', '__APP_REF__');
console.log('SHA:', '__APP_SHA__');

// Parse deployment topology from hostname
const host = window.location.hostname;
const subdomain = host.split('.')[0];

let env = 'unknown';
if (subdomain === 'prod') {
  env = 'prod';
} else if (subdomain === 'dev') {
  env = 'dev';
} else if (subdomain.startsWith('sandbox-')) {
  env = subdomain; // e.g., sandbox-pr-123
} else if (host === 'localhost' || host === '127.0.0.1') {
  env = 'local';
}

document.getElementById('env').textContent = env;
document.getElementById('host').textContent = host;
document.getElementById('route').textContent = window.location.pathname;
