/**
 * Client for the BCBA Domain Classifier API (NeuralForge v5).
 * Graceful degradation: returns null if API is unavailable.
 */

const CLASSIFIER_URL = process.env.CLASSIFIER_API_URL

interface DomainPrediction {
  domain: string
  name: string
  confidence: number
}

interface ClassifyResult {
  predictions: DomainPrediction[]
  time_ms: number
}

interface ABCComponent {
  detected: boolean
  pattern_matches: number
}

interface ABCAnalysis {
  antecedent: ABCComponent
  behavior: ABCComponent
  consequence: ABCComponent
  complete_chain: boolean
  components_found: number
}

interface AnalyzeResult {
  classification: ClassifyResult
  abc_analysis: ABCAnalysis
  key_concepts: string[]
  suggested_tasks: string[]
}

export type { DomainPrediction, ClassifyResult, AnalyzeResult, ABCAnalysis }

/**
 * Classify text into BCBA domains.
 * Returns null if classifier API is not configured or unavailable.
 */
export async function classifyDomain(
  text: string,
  examLevel = "bcba",
  context?: string,
): Promise<ClassifyResult | null> {
  if (!CLASSIFIER_URL) return null

  try {
    const response = await fetch(`${CLASSIFIER_URL}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, exam_level: examLevel, context, top_k: 3 }),
      signal: AbortSignal.timeout(3000),
    })

    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

/**
 * Full analysis: classification + ABC + concepts + suggested tasks.
 * Returns null if classifier API is not configured or unavailable.
 */
export async function analyzeText(
  text: string,
  examLevel = "bcba",
  context?: string,
): Promise<AnalyzeResult | null> {
  if (!CLASSIFIER_URL) return null

  try {
    const response = await fetch(`${CLASSIFIER_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, exam_level: examLevel, context }),
      signal: AbortSignal.timeout(3000),
    })

    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}
