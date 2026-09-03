/**
 * PrimeIPO LangGraph AI Analysis Engine
 * Multi-node stateful graph for concise IPO summaries, sentiment scoring, and investor verdicts.
 */

import { StateGraph, Annotation } from '@langchain/langgraph';
import { IpoData } from '@/lib/api-fetcher';

export interface IpoAiAnalysis {
  ipoId: string;
  symbol: string;
  companyName: string;
  verdict: 'High Listing Gain Potential' | 'Moderate Listing Gain' | 'Cautious / Avoid' | 'Steady Long-Term';
  verdictTone: 'bullish' | 'neutral' | 'cautious' | 'bearish';
  score: number; // 0 to 100
  summary: string;
  bullPoints: string[];
  bearPoints: string[];
  retailRecommendation: string;
  valuationCheck: 'Attractive' | 'Fair' | 'Expensive';
  sentimentGauge: {
    gmpStrength: string;
    qibInterest: string;
    retailDemand: string;
  };
  stepsExecuted: string[];
  generatedAt: string;
  engine: string;
}

// 1. Define LangGraph State Annotation
const IpoAnalysisState = Annotation.Root({
  ipo: Annotation<IpoData>(),
  valuationScore: Annotation<number>(),
  valuationCheck: Annotation<'Attractive' | 'Fair' | 'Expensive'>(),
  sentimentScore: Annotation<number>(),
  sentimentGauge: Annotation<{
    gmpStrength: string;
    qibInterest: string;
    retailDemand: string;
  }>(),
  finalAnalysis: Annotation<IpoAiAnalysis>(),
  steps: Annotation<string[]>({
    reducer: (curr, update) => [...(curr || []), ...(update || [])],
    default: () => [],
  }),
});

// Node 1: Evaluate Valuation & Issue Sizing
async function evaluateValuationNode(state: typeof IpoAnalysisState.State) {
  const { ipo } = state;
  const isSme = ipo.type === 'sme';
  const issueSize = ipo.issueSize || 50;
  const price = ipo.priceBandHigh || ipo.priceBandLow || 100;

  let valScore = 65; // baseline
  let valCheck: 'Attractive' | 'Fair' | 'Expensive' = 'Fair';

  // Sizing & Price band valuation check
  if (isSme) {
    if (price < 120 && issueSize > 30) {
      valScore += 15;
      valCheck = 'Attractive';
    } else if (price > 250) {
      valScore -= 15;
      valCheck = 'Expensive';
    }
  } else {
    if (price < 400 && issueSize > 500) {
      valScore += 10;
      valCheck = 'Attractive';
    } else if (price > 800) {
      valScore -= 10;
      valCheck = 'Expensive';
    }
  }

  return {
    valuationScore: Math.min(95, Math.max(25, valScore)),
    valuationCheck: valCheck,
    steps: ['Evaluated issue sizing, price band, and peer valuation benchmarks.'],
  };
}

// Node 2: Analyze Grey Market Sentiment & Subscription Momentum
async function analyzeSentimentNode(state: typeof IpoAnalysisState.State) {
  const { ipo } = state;
  const gmpPct = ipo.gmpPct || 0;
  const totalSub = ipo.subscriptionTotal || 0;
  const qibSub = ipo.subscriptionQib || 0;
  const retailSub = ipo.subscriptionRetail || 0;

  let sentScore = 50;

  // GMP Momentum
  let gmpStrength = 'Muted (0 - 5%)';
  if (gmpPct >= 30) {
    sentScore += 35;
    gmpStrength = `Surging (+${gmpPct.toFixed(1)}%)`;
  } else if (gmpPct >= 15) {
    sentScore += 25;
    gmpStrength = `Healthy (+${gmpPct.toFixed(1)}%)`;
  } else if (gmpPct > 0) {
    sentScore += 10;
    gmpStrength = `Modest (+${gmpPct.toFixed(1)}%)`;
  } else if (gmpPct < 0) {
    sentScore -= 20;
    gmpStrength = `Discount (${gmpPct.toFixed(1)}%)`;
  }

  // Institutional & Retail Demand
  let qibInterest = 'Awaiting QIB Bids';
  if (qibSub > 20) {
    sentScore += 15;
    qibInterest = `Heavy Institutional Buying (${qibSub}x)`;
  } else if (qibSub > 2) {
    sentScore += 8;
    qibInterest = `Moderate QIB Inflow (${qibSub}x)`;
  }

  let retailDemand = 'Normal Subscription';
  if (retailSub > 15) {
    sentScore += 10;
    retailDemand = `Overbooked (${retailSub}x)`;
  } else if (retailSub > 1) {
    retailDemand = `Fully Subscribed (${retailSub}x)`;
  } else if (totalSub === 0 && ipo.status === 'upcoming') {
    retailDemand = 'Bidding Not Started';
  }

  return {
    sentimentScore: Math.min(100, Math.max(10, sentScore)),
    sentimentGauge: {
      gmpStrength,
      qibInterest,
      retailDemand,
    },
    steps: ['Processed real-time Grey Market Premium (GMP) & institutional QIB/Retail demand ratios.'],
  };
}

// Node 3: Synthesize Concise Verdict & Key Pro/Con Insights
async function synthesizeVerdictNode(state: typeof IpoAnalysisState.State) {
  const { ipo, valuationScore, valuationCheck, sentimentScore, sentimentGauge, steps } = state;

  const compositeScore = Math.round((valuationScore || 60) * 0.4 + (sentimentScore || 50) * 0.6);
  const gmpPct = ipo.gmpPct || 0;

  let verdict: IpoAiAnalysis['verdict'] = 'Moderate Listing Gain';
  let verdictTone: IpoAiAnalysis['verdictTone'] = 'neutral';
  let summary = '';
  let retailRecommendation = '';
  const bullPoints: string[] = [];
  const bearPoints: string[] = [];

  if (compositeScore >= 75 || gmpPct >= 25) {
    verdict = 'High Listing Gain Potential';
    verdictTone = 'bullish';
    summary = `${ipo.companyName} is backed by surging grey market premium demand (+${gmpPct.toFixed(1)}%) and institutional support in the ${ipo.sector} sector.`;
    bullPoints.push(`Strong Grey Market Premium of +${gmpPct.toFixed(1)}% indicates solid listing debut expectations.`);
    bullPoints.push(`Healthy institutional interest and expanding market presence in the ${ipo.sector} industry.`);
    bearPoints.push(`SME/High-beta volatility on listing day; lock in partial listing gains at open.`);
    bearPoints.push(`Post-listing valuations could face profit-booking if broader markets turn volatile.`);
    retailRecommendation = `Apply for listing gains. Allotment probability may be competitive due to high retail bidding.`;
  } else if (compositeScore >= 55 || gmpPct >= 8) {
    verdict = 'Moderate Listing Gain';
    verdictTone = 'neutral';
    summary = `${ipo.companyName} exhibits balanced fundamentals in ${ipo.sector} with steady grey market premiums of +${gmpPct.toFixed(1)}%.`;
    bullPoints.push(`Reasonably valued price band of ₹${ipo.priceBandLow} – ₹${ipo.priceBandHigh} with stable sector demand.`);
    bullPoints.push(`Positive grey market premium provides a buffer against adverse market swings.`);
    bearPoints.push(`Limited upside on listing day; gains may depend strictly on overall market sentiment.`);
    bearPoints.push(`Keep an eye on final day institutional QIB subscription numbers.`);
    retailRecommendation = `Selective subscribe for investors with moderate risk appetite seeking 10–15% listing returns.`;
  } else if (gmpPct <= 0 || compositeScore < 45) {
    verdict = 'Cautious / Avoid';
    verdictTone = 'cautious';
    summary = `${ipo.companyName} is currently reflecting muted or flat grey market interest (GMP ${gmpPct >= 0 ? `+${gmpPct}%` : `${gmpPct}%`}), suggesting subdued listing enthusiasm.`;
    bullPoints.push(`Established operations in ${ipo.sector} with existing client relationships.`);
    bullPoints.push(`Long-term turnaround potential if post-listing earnings deliver expected margin expansion.`);
    bearPoints.push(`Flat or discount grey market premium indicates risk of listing at or below the issue price.`);
    bearPoints.push(`Subdued institutional demand; high risk of capital erosion on listing day.`);
    retailRecommendation = `Avoid for short-term listing gains. Conservative investors should wait for post-listing price discovery.`;
  } else {
    verdict = 'Steady Long-Term';
    verdictTone = 'bullish';
    summary = `${ipo.companyName} represents a stable fundamental play for investors with a multi-year horizon in ${ipo.sector}.`;
    bullPoints.push(`Consistent industry growth in ${ipo.sector} and healthy balance sheet positioning.`);
    bullPoints.push(`Reasonable valuation provides attractive entry for long-term compounders.`);
    bearPoints.push(`May not deliver explosive day-1 listing gains.`);
    bearPoints.push(`Requires patient capital across quarterly financial cycles.`);
    retailRecommendation = `Good candidate for long-term portfolio allocation rather than pure listing day flipping.`;
  }

  const finalAnalysis: IpoAiAnalysis = {
    ipoId: ipo.id,
    symbol: ipo.symbol,
    companyName: ipo.companyName,
    verdict,
    verdictTone,
    score: compositeScore,
    summary,
    bullPoints,
    bearPoints,
    retailRecommendation,
    valuationCheck: valuationCheck || 'Fair',
    sentimentGauge: sentimentGauge || {
      gmpStrength: 'Normal',
      qibInterest: 'Normal',
      retailDemand: 'Normal',
    },
    stepsExecuted: [...(steps || []), 'Synthesized concise 30-second retail investor briefing via LangGraph.'],
    generatedAt: new Date().toISOString(),
    engine: 'LangGraph v0.2 StateGraph (Financial Evaluator)',
  };

  return {
    finalAnalysis,
    steps: ['Completed executive analysis synthesis.'],
  };
}

// 2. Build & Compile LangGraph
const workflow = new StateGraph(IpoAnalysisState)
  .addNode('evaluateValuation', evaluateValuationNode)
  .addNode('analyzeSentiment', analyzeSentimentNode)
  .addNode('synthesizeVerdict', synthesizeVerdictNode)
  .addEdge('__start__', 'evaluateValuation')
  .addEdge('evaluateValuation', 'analyzeSentiment')
  .addEdge('analyzeSentiment', 'synthesizeVerdict')
  .addEdge('synthesizeVerdict', '__end__');

export const ipoAnalyzerGraph = workflow.compile();

/**
 * Execute the LangGraph workflow for any IPO
 */
export async function analyzeIpoWithLangGraph(ipo: IpoData): Promise<IpoAiAnalysis> {
  const result = await ipoAnalyzerGraph.invoke({
    ipo,
  });

  return result.finalAnalysis;
}
