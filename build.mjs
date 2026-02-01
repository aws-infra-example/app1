#!/usr/bin/env node
import { cpSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, 'src');
const distDir = join(__dirname, 'dist');

const ref = process.env.APP_REF || 'local';
const sha = process.env.APP_SHA || 'local';
const buildTime = new Date().toISOString();

mkdirSync(distDir, { recursive: true });

const files = readdirSync(srcDir);
for (const file of files) {
  let content = readFileSync(join(srcDir, file), 'utf-8');
  content = content.replace(/__APP_REF__/g, ref);
  content = content.replace(/__APP_SHA__/g, sha);
  content = content.replace(/__BUILD_TIME__/g, buildTime);
  writeFileSync(join(distDir, file), content);
}

console.log(`Built app1 to ${distDir}`);
console.log(`  ref: ${ref}`);
console.log(`  sha: ${sha}`);
