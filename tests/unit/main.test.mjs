import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert';

/**
 * Unit tests for main.js logic.
 *
 * These test the core algorithms used in main.js:
 * - Environment detection from URL path vs subdomain
 * - Routing mode detection
 * - Path segment parsing
 *
 * Since main.js runs in the browser, we test the algorithms directly
 * rather than importing the file (which requires DOM).
 */

// Extract the environment detection logic for testing
function detectEnvironment(hostname, pathname) {
  const pathParts = pathname.split('/').filter(p => p);
  const firstSegment = pathParts[0] || '';
  const subdomain = hostname.split('.')[0];

  let env = 'unknown';
  let routingMode = 'subdomain';

  if (firstSegment === 'prod' || firstSegment === 'dev' || firstSegment === 'staging' || firstSegment.startsWith('sandbox-')) {
    routingMode = 'path';
    env = firstSegment;
  } else if (subdomain === 'prod' || subdomain === 'dev' || subdomain === 'staging') {
    env = subdomain;
  } else if (subdomain.startsWith('sandbox-')) {
    env = subdomain;
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    env = 'local';
  }

  return { env, routingMode };
}

describe('Environment Detection', () => {
  describe('localhost detection', () => {
    it('should detect localhost', () => {
      const result = detectEnvironment('localhost', '/');
      assert.strictEqual(result.env, 'local');
    });

    it('should detect 127.0.0.1', () => {
      const result = detectEnvironment('127.0.0.1', '/app1');
      assert.strictEqual(result.env, 'local');
    });
  });

  describe('path-based routing', () => {
    it('should detect dev environment from path', () => {
      const result = detectEnvironment('example.cloudfront.net', '/dev/app1');
      assert.strictEqual(result.env, 'dev');
      assert.strictEqual(result.routingMode, 'path');
    });

    it('should detect staging environment from path', () => {
      const result = detectEnvironment('example.cloudfront.net', '/staging/app1');
      assert.strictEqual(result.env, 'staging');
      assert.strictEqual(result.routingMode, 'path');
    });

    it('should detect prod environment from path', () => {
      const result = detectEnvironment('example.cloudfront.net', '/prod/app1');
      assert.strictEqual(result.env, 'prod');
      assert.strictEqual(result.routingMode, 'path');
    });

    it('should detect sandbox environment from path', () => {
      const result = detectEnvironment('example.cloudfront.net', '/sandbox-pr-123/app1');
      assert.strictEqual(result.env, 'sandbox-pr-123');
      assert.strictEqual(result.routingMode, 'path');
    });

    it('should handle sandbox with different PR numbers', () => {
      const result = detectEnvironment('example.cloudfront.net', '/sandbox-pr-9999/app2');
      assert.strictEqual(result.env, 'sandbox-pr-9999');
      assert.strictEqual(result.routingMode, 'path');
    });
  });

  describe('subdomain-based routing', () => {
    it('should detect dev environment from subdomain', () => {
      const result = detectEnvironment('dev.example.com', '/app1');
      assert.strictEqual(result.env, 'dev');
      assert.strictEqual(result.routingMode, 'subdomain');
    });

    it('should detect staging environment from subdomain', () => {
      const result = detectEnvironment('staging.example.com', '/app1');
      assert.strictEqual(result.env, 'staging');
      assert.strictEqual(result.routingMode, 'subdomain');
    });

    it('should detect prod environment from subdomain', () => {
      const result = detectEnvironment('prod.example.com', '/app1');
      assert.strictEqual(result.env, 'prod');
      assert.strictEqual(result.routingMode, 'subdomain');
    });

    it('should detect sandbox environment from subdomain', () => {
      const result = detectEnvironment('sandbox-pr-456.example.com', '/app1');
      assert.strictEqual(result.env, 'sandbox-pr-456');
      assert.strictEqual(result.routingMode, 'subdomain');
    });
  });

  describe('unknown environment', () => {
    it('should return unknown for unrecognized hostname', () => {
      const result = detectEnvironment('www.example.com', '/app1');
      assert.strictEqual(result.env, 'unknown');
    });

    it('should return unknown for root path on unknown host', () => {
      const result = detectEnvironment('custom.domain.com', '/');
      assert.strictEqual(result.env, 'unknown');
    });
  });
});

describe('Path Parsing', () => {
  it('should correctly parse path segments', () => {
    const path = '/dev/app1';
    const parts = path.split('/').filter(p => p);
    assert.deepStrictEqual(parts, ['dev', 'app1']);
  });

  it('should handle trailing slashes', () => {
    const path = '/staging/app1/';
    const parts = path.split('/').filter(p => p);
    assert.deepStrictEqual(parts, ['staging', 'app1']);
  });

  it('should handle root path', () => {
    const path = '/';
    const parts = path.split('/').filter(p => p);
    assert.deepStrictEqual(parts, []);
  });

  it('should handle multiple path segments', () => {
    const path = '/sandbox-pr-123/app1/subpage';
    const parts = path.split('/').filter(p => p);
    assert.deepStrictEqual(parts, ['sandbox-pr-123', 'app1', 'subpage']);
  });
});
