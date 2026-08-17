import { GoogleGenAI } from '@google/genai';
import { SanitizedFinancialPayload } from './sanitizer';
import { AIAnalysisResponse, AIInsightItem } from '@/lib/types';

// In-memory cache for generated insights per user
interface CacheEntry {
    data: AIAnalysisResponse;
    timestamp: number;
}

const INSIGHTS_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes

export function invalidateUserAICache(userId: string) {
    INSIGHTS_CACHE.delete(userId);
}

export function clearAllAICache() {
    INSIGHTS_CACHE.clear();
}

/**
 * Executes the AI Analytical Reasoning Engine on sanitized financial data using Gemini.
 */
export async function generateAIAnalyticsInsights(params: {
    userId: string;
    payload: SanitizedFinancialPayload;
    forceRefresh?: boolean;
}): Promise<AIAnalysisResponse> {
    const { userId, payload, forceRefresh = false } = params;

    // Check cache
    if (!forceRefresh) {
        const cached = INSIGHTS_CACHE.get(userId);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
            return cached.data;
        }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in the environment.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
You are the Prospera AI Financial Analytical Agent — an elite, prudent, empathetic personal financial advisor and intelligence engine.

Your job is NOT just to summarize totals, but to perform deep, multi-dimensional reasoning on the user's spending patterns, upcoming commitments, budget allocations, and cashflow.

Analyze the provided sanitized data across these critical pillars:
1. **Cashflow & Impending Crunch Watchlist (cashflow_risk)**:
   - Cross-examine the user's current liquid cash balance against upcoming pending bill reminders in the next 14-30 days.
   - If upcoming bills exceed or take up a dangerous percentage (>70%) of current balance before expected income, issue a critical warning with exact numbers.
2. **Categorical Spikes & Spending Velocity (category_spike)**:
   - Compare current month spending run-rate (day-of-month velocity) vs previous period or healthy norms.
   - Call out specific categories that have spiked unusually (e.g. Dining, Shopping, Entertainment).
3. **Subscription & Recurring Creep (subscription_creep)**:
   - Audit recurring bills/subscriptions. Highlight multiple small recurring charges that are silently eating into savings.
4. **Budget Allocation & Burndown (budget_burndown)**:
   - Compare category spending to any defined budget caps or healthy 50/30/20 allocation principles.
5. **Actionable Recommendations & Quick Wins (general_advice)**:
   - Provide concrete, numbers-based suggestions (e.g. "Trimming Dining by ₹1,500 over the next 10 days will keep you within your surplus goal").
   - Highlight positive milestones/wins if spending in key areas is well-managed.

Output Format Requirement:
You MUST respond with a JSON object strictly matching this schema:
{
  "summary": "2-3 sentence overarching executive summary of their financial health and primary area of attention.",
  "healthScore": 78, // Number 0-100 indicating financial health
  "insights": [
    {
      "id": "unique-id-slug",
      "category": "cashflow_risk" | "category_spike" | "subscription_creep" | "budget_burndown" | "general_advice",
      "severity": "critical" | "warning" | "tip" | "positive",
      "title": "Short Punchy Title",
      "message": "Detailed explanation citing actual numbers and context.",
      "actionableTip": "Concrete step the user can take right now.",
      "metric": "e.g. '+45% velocity' or '₹4,500 due in 3 days'",
      "relatedCategory": "Dining / Bills etc."
    }
  ]
}
Generate between 3 to 6 high-value, non-redundant insights.
`;

    const userPrompt = `
Here is the current financial state:
${JSON.stringify(payload, null, 2)}

Provide your analytical evaluation in the exact JSON format specified.
`;

    const candidateModels = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastError: any = null;

    for (const modelName of candidateModels) {
        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: userPrompt,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    temperature: 0.2,
                }
            });

            const text = response.text?.trim() || "{}";
            let parsedResult: any;
            try {
                parsedResult = JSON.parse(text);
            } catch {
                const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedResult = JSON.parse(cleaned);
            }

            const validInsights: AIInsightItem[] = (parsedResult.insights || []).map((item: any, idx: number) => ({
                id: item.id || `insight-${idx}-${Date.now()}`,
                category: ['cashflow_risk', 'category_spike', 'subscription_creep', 'budget_burndown', 'general_advice'].includes(item.category)
                    ? item.category
                    : 'general_advice',
                severity: ['critical', 'warning', 'tip', 'positive'].includes(item.severity)
                    ? item.severity
                    : 'tip',
                title: item.title || 'Financial Observation',
                message: item.message || '',
                actionableTip: item.actionableTip,
                metric: item.metric,
                relatedReminderId: item.relatedReminderId,
                relatedCategory: item.relatedCategory
            }));

            const result: AIAnalysisResponse = {
                summary: parsedResult.summary || "Financial analysis complete based on current transaction history and bill schedules.",
                healthScore: typeof parsedResult.healthScore === 'number' ? Math.max(0, Math.min(100, parsedResult.healthScore)) : 75,
                insights: validInsights,
                generatedAt: new Date().toISOString(),
                isConsented: true
            };

            // Save to cache
            INSIGHTS_CACHE.set(userId, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        } catch (err: any) {
            console.warn(`Gemini model ${modelName} failed, trying next candidate:`, err.message);
            lastError = err;
        }
    }

    console.error("All Gemini AI candidate models failed:", lastError);
    throw lastError || new Error("Failed to generate AI insights with available models.");
}
