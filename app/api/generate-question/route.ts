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
  trapWord: string
  trapExplanations: {
    whyTrap: string
    confusion: string
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

Task: Generate ONE exam-style question following these STRICT rules:

QUESTION STRUCTURE (Critical - BACB exam format):
1. Write a DETAILED CLINICAL SCENARIO (3-5 sentences minimum)
   - Start with specific client details: age, target behavior, setting
   - Describe what was done: interventions, teaching procedures, data collected
   - Show what happened: client responses, data outcomes, observations
   - Include specific numbers, percentages, or frequencies when relevant
   - End with what is currently happening or what problem remains

2. The QUESTION comes LAST after the complete scenario
   - Ask what the scenario "demonstrates", "shows", or "indicates"
   - OR ask what is "MISSING" or "needed NEXT"
   - Question must require ANALYZING the scenario, not just recalling definitions

3. Must test APPLICATION: Can the student connect the scenario details to the correct concept?

REAL EXAM EXAMPLE:
"A behavior analyst is teaching a client to identify colors. The analyst holds up a red card and says 'Red'. The client repeats 'Red'. Then, the analyst holds up the red card without saying anything, and the client says 'Red'. Finally, the analyst says 'Touch Red' and the client selects the red card from a group of colors. However, when the client sees a red apple in the cafeteria later that day, he says nothing.

What does this scenario demonstrate a LACK of?"

YOUR QUESTION MUST:
- Follow this same detailed, step-by-step scenario format
- Show a clear progression: what was done → what happened → current issue
- Question asks what is demonstrated, missing, or needed
- Be in ENGLISH (exam style)
- Have 4 options (A, B, C, D) that are specific concepts, not vague
- Include ONE trap word naturally: "FIRST", "NEXT", "BEST", "ALWAYS", "NEVER", "MOST", "LEAST", "IMMEDIATELY"
- Add a "thinkHint" that guides reasoning WITHOUT revealing the answer

FEEDBACK RULES:
- All explanations in ${language}
- Keep ABA terms in English: reinforcement, extinction, MO, SD, prompt, fading, generalization, stimulus control, shaping, chaining, etc.
- Trap explanation must show why the trap word matters for THIS scenario in ${language} with ABA terms in English
- What students commonly confuse in THIS scenario in ${language} with ABA terms in English

CRITICAL: You MUST respond with ONLY raw JSON. No markdown, no code blocks, no explanations, no text before or after. Just the JSON object.

Required JSON structure:
{
  "question": "Detailed step-by-step clinical scenario (3-5 sentences) followed by analytical question in English",
  "options": ["A) Specific concept", "B) Specific concept", "C) Specific concept", "D) Specific concept"],
  "correctIndex": 0,
  "thinkHint": "Brief reasoning guide in ${language} with ABA terms in English - help them analyze the scenario without revealing answer",
  "trapWord": "NEXT",
  "trapExplanations": {
    "whyTrap": "Why this trap word is critical for THIS scenario in ${language} with ABA terms in English",
    "confusion": "What students commonly confuse in THIS scenario in ${language} with ABA terms in English"
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
        !questionData.trapWord ||
        !questionData.trapExplanations ||
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
