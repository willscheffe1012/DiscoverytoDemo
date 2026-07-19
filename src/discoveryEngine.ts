export type Phase = 'phase-0' | 'phase-1';

export type DiscoveryInput = {
  company: string;
  segment: string;
  goal: string;
  pains: string;
  tools: string;
  stakeholders: string;
  successMetric: string;
};

export type DiscoverySignal = {
  label: string;
  value: string;
  confidence: number;
};

export type DemoStep = {
  title: string;
  talkTrack: string;
  proofPoint: string;
};

export type DiscoveryPlan = {
  phase: Phase;
  readinessScore: number;
  summary: string;
  signals: DiscoverySignal[];
  openQuestions: string[];
  demoSteps: DemoStep[];
};

const defaults: DiscoveryInput = {
  company: 'Acme Health',
  segment: 'Mid-market healthcare operations',
  goal: 'Reduce manual intake work before quarter end',
  pains: 'Slow handoffs, duplicate data entry, poor visibility into bottlenecks',
  tools: 'Salesforce, spreadsheets, shared inboxes',
  stakeholders: 'VP Operations, Revenue Operations, frontline intake managers',
  successMetric: 'Cut intake cycle time by 30%',
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const hasSpecificity = (value: string) => /\d|%|quarter|month|week|day|before|after/i.test(value);

export function createInitialDiscovery(): DiscoveryInput {
  return { ...defaults };
}

export function buildDiscoveryPlan(input: DiscoveryInput, phase: Phase = 'phase-1'): DiscoveryPlan {
  const fields = Object.values(input).map((value) => value.trim());
  const completedFields = fields.filter(Boolean).length;
  const specificityBonus = fields.filter(hasSpecificity).length * 4;
  const stakeholderBonus = input.stakeholders.split(',').filter((item) => item.trim()).length * 3;
  const readinessScore = clamp(Math.round(completedFields * 10 + specificityBonus + stakeholderBonus), 0, 100);
  const company = input.company || 'the prospect';
  const successMetric = input.successMetric || 'a measurable business outcome';

  const signals: DiscoverySignal[] = [
    {
      label: 'Business outcome',
      value: input.goal || 'Clarify the executive outcome before demoing product depth.',
      confidence: input.goal ? 0.86 : 0.35,
    },
    {
      label: 'Current friction',
      value: input.pains || 'Capture workflow pains, handoff gaps, and cost of inaction.',
      confidence: input.pains ? 0.82 : 0.3,
    },
    {
      label: 'Existing stack',
      value: input.tools || 'Map integrations and data sources needed for a credible demo.',
      confidence: input.tools ? 0.74 : 0.28,
    },
  ];

  const openQuestions = [
    `What happens if ${company} misses ${successMetric}?`,
    'Which stakeholder owns budget and which team owns day-to-day adoption?',
    'What data source must be live in the demo to make the story believable?',
  ];

  const demoSteps: DemoStep[] = [
    {
      title: 'Anchor the current-state pain',
      talkTrack: `Start with ${input.segment || 'the target team'} and mirror the pains: ${input.pains || 'the top operational blockers'}.`,
      proofPoint: 'Show a before view that exposes delays, rework, or blind spots.',
    },
    {
      title: 'Show the workflow transformation',
      talkTrack: `Demonstrate how the team moves from discovery insight to the desired outcome: ${input.goal || successMetric}.`,
      proofPoint: `Use ${input.tools || 'their core system'} context so the path feels native, not generic.`,
    },
    {
      title: 'Close on measurable value',
      talkTrack: `Tie the demo back to ${successMetric} and confirm next-step validation criteria.`,
      proofPoint: 'Present a mutual action plan with owners, dates, and success metrics.',
    },
  ];

  return {
    phase,
    readinessScore,
    summary: `${company} is targeting ${successMetric}. The recommended demo should prioritize business impact, current friction, and stakeholder-specific proof.`,
    signals,
    openQuestions: phase === 'phase-0' ? openQuestions.slice(0, 2) : openQuestions,
    demoSteps: phase === 'phase-0' ? demoSteps.slice(0, 2) : demoSteps,
  };
}
