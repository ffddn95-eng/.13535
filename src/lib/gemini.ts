export interface IdeaAnalysis {
  oneLineConclusion: string;
  overallScore: number;
  verdict: 'GO' | 'PIVOT' | 'STOP';
  
  scores: {
    marketDemand: { score: number; explanation: string; };
    executionFeasibility: { score: number; explanation: string; };
    firstRevenuePotential: { level: string; explanation: string; };
    operationalRisk: { level: string; explanation: string; };
    competitionLevel: { level: string; explanation: string; };
    differentiationPotential: { score: number; explanation: string; };
    scalability: { score: number; explanation: string; };
    retentionPotential: { score: number; explanation: string; };
  };

  failureReasons: string[];
  userCompatibility: string;
  firstActionSteps: string[];
  executionTimeline?: {
    day1: string;
    day3: string;
    day7: string;
  };

  hookAnalysis?: {
    trigger: string;
    action: string;
    variableReward: string;
    investment: string;
  };
  conversionStrategy?: {
    anchoring: string;
    charmPricing: string;
    scarcity: string;
  };
}

export async function analyzeIdea(idea: string): Promise<IdeaAnalysis> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ idea })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to analyze idea.");
  }

  return await response.json();
}
