import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const distDir = join(projectRoot, 'dist');

describe('Build Process', () => {
  before(() => {
    // Clean dist directory before tests
    if (existsSync(distDir)) {
      rmSync(distDir, { recursive: true });
    }
  });

  describe('build.mjs execution', () => {
    it('should run build without errors', () => {
      const result = execSync('node build.mjs', {
        cwd: projectRoot,
        encoding: 'utf-8',
        env: {
          ...process.env,
          APP_REF: 'test-ref',
          APP_SHA: 'abc1234',
          APP_ENV: 'dev'
        }
      });
      assert.ok(result.includes('Built app1'), 'Build should output success message');
    });

    it('should create dist directory', () => {
      assert.ok(existsSync(distDir), 'dist directory should exist');
    });

    it('should create dist/index.html', () => {
      const indexPath = join(distDir, 'index.html');
      assert.ok(existsSync(indexPath), 'dist/index.html should exist');
    });

    it('should create dist/main.js', () => {
      const mainPath = join(distDir, 'main.js');
      assert.ok(existsSync(mainPath), 'dist/main.js should exist');
    });
  });

  describe('token replacement', () => {
    it('should replace __APP_REF__ token in index.html', () => {
      const indexPath = join(distDir, 'index.html');
      const content = readFileSync(indexPath, 'utf-8');
      assert.ok(!content.includes('__APP_REF__'), 'index.html should not contain __APP_REF__ placeholder');
      assert.ok(content.includes('test-ref'), 'index.html should contain the replaced ref value');
    });

    it('should replace __APP_SHA__ token', () => {
      const indexPath = join(distDir, 'index.html');
      const content = readFileSync(indexPath, 'utf-8');
      assert.ok(!content.includes('__APP_SHA__'), 'Should not contain __APP_SHA__ placeholder');
    });

    it('should replace __BUILD_TIME__ token', () => {
      const indexPath = join(distDir, 'index.html');
      const content = readFileSync(indexPath, 'utf-8');
      assert.ok(!content.includes('__BUILD_TIME__'), 'Should not contain __BUILD_TIME__ placeholder');
    });

    it('should replace __APP_ENV__ token', () => {
      const indexPath = join(distDir, 'index.html');
      const content = readFileSync(indexPath, 'utf-8');
      assert.ok(!content.includes('__APP_ENV__'), 'Should not contain __APP_ENV__ placeholder');
    });

    it('should replace __APP_CONFIG__ token in main.js', () => {
      const mainPath = join(distDir, 'main.js');
      const content = readFileSync(mainPath, 'utf-8');
      assert.ok(!content.includes('__APP_CONFIG__'), 'main.js should not contain __APP_CONFIG__ placeholder');
    });
  });

  describe('config loading', () => {
    it('should embed config from dev.json when APP_ENV=dev', () => {
      const mainPath = join(distDir, 'main.js');
      const content = readFileSync(mainPath, 'utf-8');
      // The config should be embedded as JSON object
      // dev.json contains {"apiUrl":...}
      assert.ok(content.includes('"apiUrl"'), 'main.js should contain embedded config');
    });

    it('should use sandbox.json for sandbox environments', () => {
      // Rebuild with sandbox env
      execSync('node build.mjs', {
        cwd: projectRoot,
        encoding: 'utf-8',
        env: {
          ...process.env,
          APP_REF: 'pr-123',
          APP_SHA: 'def5678',
          APP_ENV: 'sandbox-pr-123'
        }
      });

      const mainPath = join(distDir, 'main.js');
      const content = readFileSync(mainPath, 'utf-8');
      // sandbox.json should be used
      assert.ok(!content.includes('__APP_CONFIG__'), 'Config placeholder should be replaced');
    });
  });
});
