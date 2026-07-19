import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const outDir = join(tmpdir(), `discovery-engine-${Date.now()}`);
execFileSync('npx', ['tsc', '--ignoreConfig', 'src/discoveryEngine.ts', '--target', 'ES2020', '--module', 'ES2020', '--outDir', outDir, '--skipLibCheck'], { stdio: 'inherit' });
const mod = await import(`file://${outDir}/discoveryEngine.js`);

test('builds a phase 0 runnable baseline with a shorter plan', () => {
  const plan = mod.buildDiscoveryPlan(mod.createInitialDiscovery(), 'phase-0');
  assert.equal(plan.phase, 'phase-0');
  assert.equal(plan.demoSteps.length, 2);
  assert.ok(plan.readinessScore > 70);
});

test('builds phase 1 guidance with scoring, questions, and demo steps', () => {
  const input = mod.createInitialDiscovery();
  const plan = mod.buildDiscoveryPlan(input, 'phase-1');
  assert.equal(plan.phase, 'phase-1');
  assert.equal(plan.signals.length, 3);
  assert.equal(plan.openQuestions.length, 3);
  assert.equal(plan.demoSteps.length, 3);
  assert.match(plan.summary, /Acme Health/);
});

test('source does not wrap imports in try catch', () => {
  const source = readFileSync('src/main.ts', 'utf8') + readFileSync('src/discoveryEngine.ts', 'utf8');
  assert.doesNotMatch(source, /try\s*{[\s\S]*import/m);
});
