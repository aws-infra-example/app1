#!/usr/bin/env node
import { cpSync, mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, 'src');
const distDir = join(__dirname, 'dist');
const configDir = join(__dirname, 'config');

const ref = process.env.APP_REF || 'local';
const sha = process.env.APP_SHA || 'local';
const buildTime = new Date().toISOString();
const appEnv = process.env.APP_ENV || 'dev';

// For sandbox environments, use sandbox.json config
const configName = appEnv.startsWith('sandbox-') ? 'sandbox' : appEnv;
const configPath = join(configDir, `${configName}.json`);

let appConfig = '{}';
if (existsSync(configPath)) {
  appConfig = readFileSync(configPath, 'utf-8').trim();
} else {
  console.warn(`Warning: Config file ${configPath} not found, using empty config`);
}

mkdirSync(distDir, { recursive: true });

const files = readdirSync(srcDir);
for (const file of files) {
  let content = readFileSync(join(srcDir, file), 'utf-8');
  content = content.replace(/__APP_REF__/g, ref);
  content = content.replace(/__APP_SHA__/g, sha);
  content = content.replace(/__BUILD_TIME__/g, buildTime);
  content = content.replace(/__APP_ENV__/g, appEnv);
  content = content.replace(/__APP_CONFIG__/g, appConfig);
  writeFileSync(join(distDir, file), content);
}

console.log(`Built app1 to ${distDir}`);
console.log(`  ref: ${ref}`);
console.log(`  sha: ${sha}`);
console.log(`  env: ${appEnv}`);
console.log(`  config: ${configName}.json`);
