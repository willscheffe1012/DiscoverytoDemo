import { buildDiscoveryPlan, createInitialDiscovery, type DiscoveryInput, type Phase } from './discoveryEngine.js';

const fields: Array<{ key: keyof DiscoveryInput; label: string; help: string }> = [
  { key: 'company', label: 'Account', help: 'Who is the discovery for?' },
  { key: 'segment', label: 'Segment / persona', help: 'Industry, team, or buyer profile.' },
  { key: 'goal', label: 'Primary outcome', help: 'The result the buyer wants.' },
  { key: 'pains', label: 'Pain signals', help: 'Workflow friction discovered so far.' },
  { key: 'tools', label: 'Current tools', help: 'Systems, data sources, and workarounds.' },
  { key: 'stakeholders', label: 'Stakeholders', help: 'Comma-separated roles involved.' },
  { key: 'successMetric', label: 'Success metric', help: 'How value will be measured.' },
];

let phase: Phase = 'phase-0';
let input: DiscoveryInput = loadInput();

function loadInput(): DiscoveryInput {
  const saved = window.localStorage.getItem('discovery-input');
  return saved ? JSON.parse(saved) as DiscoveryInput : createInitialDiscovery();
}

function saveInput(next: DiscoveryInput) {
  input = next;
  window.localStorage.setItem('discovery-input', JSON.stringify(next));
  render();
}

function render() {
  const app = document.querySelector<HTMLElement>('#app');
  if (!app) return;
  const plan = buildDiscoveryPlan(input, phase);
  app.innerHTML = `
    <section class="hero">
      <p class="eyebrow">Discovery Engine</p>
      <h1>Turn raw discovery into a demo narrative buyers can validate.</h1>
      <p class="lede">Phase 0 gets the app running with seeded discovery capture. Phase 1 adds scoring, signal extraction, open questions, and a generated demo plan.</p>
      <div class="phase-switch" aria-label="Phase selector">
        <button data-phase="phase-0" class="${phase === 'phase-0' ? 'active' : ''}">Phase 0</button>
        <button data-phase="phase-1" class="${phase === 'phase-1' ? 'active' : ''}">Phase 1</button>
      </div>
    </section>
    <section class="grid">
      <form class="panel form-panel">
        <div><p class="eyebrow">Input</p><h2>Discovery brief</h2></div>
        ${fields.map((field) => `
          <label>
            <span>${field.label}</span>
            <small>${field.help}</small>
            <textarea data-field="${field.key}" rows="${field.key === 'pains' ? 4 : 2}">${escapeHtml(input[field.key])}</textarea>
          </label>`).join('')}
      </form>
      <section class="panel output-panel">
        <div class="score-card"><div><p class="eyebrow">Readiness</p><h2>${plan.readinessScore}/100</h2></div><span>${plan.phase === 'phase-0' ? 'Runnable baseline' : 'Guided plan'}</span></div>
        <p class="summary">${escapeHtml(plan.summary)}</p>
        <h3>Signals</h3>
        <div class="cards">${plan.signals.map((signal) => `<article><strong>${signal.label}</strong><p>${escapeHtml(signal.value)}</p><meter min="0" max="1" value="${signal.confidence}">${signal.confidence}</meter></article>`).join('')}</div>
        <h3>Open questions</h3>
        <ol>${plan.openQuestions.map((question) => `<li>${escapeHtml(question)}</li>`).join('')}</ol>
        <h3>Demo plan</h3>
        <div class="timeline">${plan.demoSteps.map((step, index) => `<article><span>${index + 1}</span><div><strong>${step.title}</strong><p>${escapeHtml(step.talkTrack)}</p><em>${escapeHtml(step.proofPoint)}</em></div></article>`).join('')}</div>
      </section>
    </section>`;

  app.querySelectorAll<HTMLButtonElement>('[data-phase]').forEach((button: HTMLButtonElement) => {
    button.addEventListener('click', () => {
      phase = button.dataset.phase as Phase;
      render();
    });
  });
  app.querySelectorAll<HTMLTextAreaElement>('[data-field]').forEach((textarea: HTMLTextAreaElement) => {
    textarea.addEventListener('input', () => saveInput({ ...input, [textarea.dataset.field as keyof DiscoveryInput]: textarea.value }));
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character] ?? character);
}

render();
