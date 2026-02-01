console.log('App 1 loaded');
console.log('Ref:', '__APP_REF__');
console.log('SHA:', '__APP_SHA__');
console.log('Env:', '__APP_ENV__');

// Parse embedded config
const appConfig = __APP_CONFIG__;
console.log('Config:', appConfig);

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

if (firstSegment === 'prod' || firstSegment === 'dev' || firstSegment === 'staging' || firstSegment.startsWith('sandbox-')) {
  // Path-based routing detected
  routingMode = 'path';
  env = firstSegment;
} else if (subdomain === 'prod' || subdomain === 'dev' || subdomain === 'staging') {
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

// Display config
const configPre = document.querySelector('#config pre');
if (configPre) {
  configPre.textContent = JSON.stringify(appConfig, null, 2);
}

// Fetch and display ecosystem manifest
async function loadEcosystemManifest() {
  const manifestSection = document.getElementById('ecosystem-section');
  if (!manifestSection) return;

  // Determine manifest URL based on routing mode
  let manifestUrl;
  if (routingMode === 'path' && env !== 'unknown') {
    manifestUrl = '/' + env + '/manifest.json';
  } else if (routingMode === 'subdomain' && env !== 'unknown') {
    manifestUrl = '/manifest.json';
  } else {
    manifestSection.innerHTML = '<p><em>Manifest not available (unknown environment)</em></p>';
    return;
  }

  try {
    const response = await fetch(manifestUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const manifest = await response.json();
    displayManifest(manifest);
  } catch (err) {
    console.warn('Failed to load ecosystem manifest:', err);
    manifestSection.innerHTML = '<p><em>Manifest not available</em></p>';
  }
}

function displayManifest(manifest) {
  const section = document.getElementById('ecosystem-section');
  if (!section) return;

  const isSandbox = manifest.lifecycle === 'ephemeral';
  const deployedAt = new Date(manifest.deployedAt).toLocaleString();

  // Build apps list
  const appsList = Object.entries(manifest.apps || {})
    .map(([name, info]) => {
      const isCurrent = name === 'app1';
      const link = routingMode === 'path'
        ? `/${manifest.environment}/${name}`
        : `/${name}`;
      return `<li><a href="${link}">${name}</a>: ${info.ref}${isCurrent ? ' (current)' : ''}</li>`;
    })
    .join('');

  section.innerHTML = `
    ${isSandbox ? '<div class="sandbox-banner">This is a temporary sandbox environment</div>' : ''}
    <dl class="info">
      <dt>Lifecycle</dt>
      <dd>${manifest.lifecycle}</dd>
      <dt>Deployed At</dt>
      <dd>${deployedAt}</dd>
      <dt>Config</dt>
      <dd><a href="${manifest.configUrl}" target="_blank">View source</a></dd>
      <dt>Apps</dt>
      <dd><ul style="margin:0;padding-left:1.5em;">${appsList}</ul></dd>
    </dl>
  `;
}

// Load manifest after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadEcosystemManifest);
} else {
  loadEcosystemManifest();
}
// Test change
