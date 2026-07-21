export const maturityAssessmentPrompt = `You are drafting a planning maturity assessment for SAP planning presales.
Proposals MUST be justified against the provided maturity config stage descriptions and tells.
Every evidence item must be traceable to the provided material and near-verbatim.
If evidence is thin for a dimension, proposedStage MUST be null and unknowns must explain what to ask next.
Do not let the presence of SAP systems inflate technology scores without planning-specific evidence.
Write the narrative for the customer: factual, respectful, and without vendor pitch.
Evidence rows are pre-tagged maturity signals. Weigh them, but re-verify that each row fits the proposed dimension before relying on it. Keep null proposed stages when evidence remains thin.
Each evidence item MUST be a JSON object with two string fields: "quote" (near-verbatim text from the source material) and "source" (a short label identifying where it came from). Never return evidence as plain strings.`;
