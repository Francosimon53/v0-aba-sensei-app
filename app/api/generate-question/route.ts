import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

interface GenerateQuestionRequest {
  examLevel: "RBT" | "BCBA"
  category: string
  language: "English" | "Español" | "Português" | "Français"
}

interface QuestionResponse {
  question: string
  options: string[]
  correctIndex: number
  thinkHint: string
  keyWords: string[]
  keyWordExplanations: {
    overall: string
    strategy: string
  }
  optionExplanations: {
    A: string
    B: string
    C: string
    D: string
  }
}

function extractJSON(text: string): string {
  // Remove markdown code blocks if present
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  // Try to find JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0].trim()
  }

  return text.trim()
}

export async function POST(request: NextRequest) {
  try {
    const { examLevel, category, language }: GenerateQuestionRequest = await request.json()

    const apiKey = process.env.ANTHROPIC_API_KEY

    console.log("[v0] API Key exists:", !!apiKey)
    console.log("[v0] API Key length:", apiKey?.length || 0)
    console.log("[v0] API Key prefix:", apiKey?.substring(0, 7) || "none")

    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY environment variable is not set. Please add it to your project." },
        { status: 500 },
      )
    }

    if (!apiKey.startsWith("sk-ant-")) {
      return NextResponse.json(
        {
          error:
            "ANTHROPIC_API_KEY appears to be invalid. It should start with 'sk-ant-'. Please check your API key in the Vars section.",
        },
        { status: 500 },
      )
    }

    const prompt = `You are an expert ABA (Applied Behavior Analysis) exam question generator following the "Sensei Method" and authentic BACB exam format.

[Context: ${examLevel} Level]
[Category: ${category}]
[Language for explanations: ${language}]

Task: Generate ONE authentic BACB exam-style question naturally, then analyze it.

STEP 1: GENERATE A NATURAL, AUTHENTIC QUESTION

QUESTION STRUCTURE (Real BACB exam format):
1. Write a DETAILED CLINICAL SCENARIO (3-5 sentences minimum)
   - Start with specific client details: age, target behavior, setting
   - Describe what was done: interventions, teaching procedures, data collected
   - Show what happened: client responses, data outcomes, observations
   - Include specific numbers, percentages, or frequencies when relevant
   - End with the current situation or what problem remains

2. The QUESTION comes LAST after the complete scenario
   - Use varied question types like real BACB exams:
     * "What does this scenario demonstrate?"
     * "Which principle is illustrated?"
     * "What is the function of this behavior?"
     * "What type of reinforcement schedule is this?"
     * "What does this scenario demonstrate a LACK of?"
     * "Which concept BEST describes this situation?"
     * "What should the analyst do NEXT?"
   - Question must require ANALYZING the scenario, not just recalling definitions
   - Write naturally - don't artificially insert words

3. Must test APPLICATION: Can the student connect scenario details to concepts?

REAL EXAM EXAMPLE:
"A behavior analyst is teaching a client to identify colors. The analyst holds up a red card and says 'Red'. The client repeats 'Red'. Then, the analyst holds up the red card without saying anything, and the client says 'Red'. Finally, the analyst says 'Touch Red' and the client selects the red card from a group of colors. However, when the client sees a red apple in the cafeteria later that day, he says nothing.

What does this scenario demonstrate a LACK of?"

YOUR QUESTION MUST:
- Follow this same detailed, step-by-step scenario format
- Show clear progression: what was done → what happened → current issue
- Question asks what is demonstrated, missing, needed, or best describes the situation
- Be in ENGLISH (exam style)
- Have 4 options (A, B, C, D) that are specific ABA concepts
- Be written naturally like a real exam writer would

STEP 2: ANALYZE ONLY THE ACTUAL QUESTION (NOT THE SCENARIO)

CRITICAL: Only identify key words that appear in the ACTUAL QUESTION being asked, NOT in the narrative scenario.

- Words like "first", "next", "then", "finally" in the SCENARIO are just narrative - ignore them
- Only highlight these words if they appear in the QUESTION itself like:
  * "What should the analyst do FIRST?" - highlight FIRST
  * "What is the BEST approach?" - highlight BEST
  * "What happened AFTER the intervention?" - highlight AFTER

KEY WORDS TO IDENTIFY (only if in the actual question):
- Temporal words: "first", "next", "before", "after", "initially", "following"
- Absolute words: "always", "never", "only", "must", "all"
- Comparative words: "best", "most appropriate", "primarily", "least"
- Negation words: "except", "not", "lack of", "without"
- Quantity words: "some", "any", "each", "every"

IF NO KEY WORDS EXIST IN THE QUESTION:
- Return empty keyWords array: []
- Set keyWordExplanations.overall to: "No key trap words in this question. Focus on identifying the concept from the scenario description."
- Set keyWordExplanations.strategy to: "Analyze the sequence of events and outcomes to determine which concept is being demonstrated."

FEEDBACK RULES:
- All explanations in ${language}
- Keep ABA terms in English: reinforcement, extinction, MO, SD, prompt, fading, generalization, stimulus control, shaping, chaining, etc.
- For key words (if any): explain how EACH one helps guide the answer in THIS scenario
- Teach the strategy: How should students use these words as clues?

CRITICAL: You MUST respond with ONLY raw JSON. No markdown, no code blocks, no explanations, no text before or after.

Required JSON structure:
{
  "question": "Detailed step-by-step clinical scenario (3-5 sentences) followed by analytical question in English",
  "options": ["A) Specific concept", "B) Specific concept", "C) Specific concept", "D) Specific concept"],
  "correctIndex": 0,
  "thinkHint": "Brief reasoning guide in ${language} with ABA terms in English - help analyze without revealing answer",
  "keyWords": ["word1", "word2"] OR [] if no key words in question,
  "keyWordExplanations": {
    "overall": "How to use these key words as clues in THIS scenario OR 'No key trap words in this question. Focus on identifying the concept from the scenario description.' if empty",
    "strategy": "What strategy to apply when seeing similar words in real exams OR 'Analyze the sequence of events and outcomes to determine which concept is being demonstrated.' if empty"
  },
  "optionExplanations": {
    "A": "Why A is correct/incorrect based on scenario details in ${language} with ABA terms in English",
    "B": "Why B is correct/incorrect based on scenario details in ${language} with ABA terms in English",
    "C": "Why C is correct/incorrect based on scenario details in ${language} with ABA terms in English",
    "D": "Why D is correct/incorrect based on scenario details in ${language} with ABA terms in English"
  }
}

Respond with ONLY the JSON object. No other text.`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        temperature: 0.9,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("[v0] Claude API error:", errorData)
      return NextResponse.json(
        { error: `Claude API error: ${response.status} - ${errorData}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    const content = data.content?.[0]?.text

    if (!content) {
      console.error("[v0] Claude returned empty content:", data)
      return NextResponse.json({ error: "Claude returned empty response" }, { status: 500 })
    }

    let questionData: QuestionResponse
    try {
      const jsonString = extractJSON(content)
      questionData = JSON.parse(jsonString)

      if (
        !questionData.question ||
        !questionData.options ||
        !Array.isArray(questionData.options) ||
        questionData.options.length !== 4 ||
        typeof questionData.correctIndex !== "number" ||
        !questionData.thinkHint ||
        !questionData.keyWords ||
        !Array.isArray(questionData.keyWords) ||
        !questionData.keyWordExplanations ||
        !questionData.optionExplanations
      ) {
        throw new Error("Invalid question structure returned from AI")
      }
    } catch (parseError) {
      console.error("[v0] Failed to parse Claude response:", content)
      console.error("[v0] Parse error:", parseError)
      return NextResponse.json(
        {
          error: "Failed to parse AI response. The AI returned an invalid format. Please try again.",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(questionData)
  } catch (error) {
    console.error("[v0] Error generating question:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate question" },
      { status: 500 },
    )
  }
}
