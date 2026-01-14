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
  hint: string
  keyWords: string[]
  keyWordExplanations: {
    overall: string
    strategy: string
  }
  decisionFilter: {
    concepts: Array<{
      name: string
      definition: string
    }>
    testQuestion: string
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

Task: Generate ONE authentic BACB exam-style question with the Sensei Method format.

QUESTION FORMAT:
1. Write a DETAILED CLINICAL SCENARIO (3-5 sentences minimum)
   - Start with specific client details and setting
   - Describe what was done: interventions, procedures, data
   - Show what happened: client responses, outcomes, observations
   - End with the current situation or problem

2. The QUESTION comes LAST after the complete scenario
   - Use varied question types:
     * "What does this scenario demonstrate?"
     * "Which principle is illustrated?"
     * "What is the function of this behavior?"
     * "What type of reinforcement schedule is this?"
     * "What procedure is this?"
   - Must require ANALYZING the scenario, not just recalling definitions

3. ADD HINT LINE at the bottom in ${language}:
   - Label: "Hint:" / "Pista:" / "Dica:" / "Indice:" based on language
   - The hint should be a QUESTION that guides thinking
   - Point to the KEY difference between confusing options
   - Do NOT reveal the answer

REAL EXAM EXAMPLE:
"Marcos pulls his hair (trichotillomania). The BCBA designs an intervention where Marcos receives a token every 10 minutes as long as he has not pulled his hair during that interval. If he pulls his hair, the timer resets.

What procedure is this?

A) Fixed Interval (FI)
B) DRL (Differential Reinforcement of Low Rates)
C) DRO (Differential Reinforcement of Other Behavior)
D) DRI (Differential Reinforcement of Incompatible Behavior)

${language === "English" ? "Hint" : language === "Español" ? "Pista" : language === "Português" ? "Dica" : "Indice"}: What does Marcos have to 'do' to earn the token? Do something or NOT do something?"

YOUR QUESTION MUST:
- Follow this exact format with hint at the bottom
- Be in ENGLISH (exam style) with hint in ${language}
- Have 4 options that test similar concepts
- Require analyzing the scenario

KEY WORDS ANALYSIS:
Only identify key words in the ACTUAL QUESTION (not scenario):
- Temporal: "first", "next", "before", "after"
- Absolute: "always", "never", "only", "must"
- Comparative: "best", "most appropriate", "primarily"
- Negation: "except", "not", "lack of"

IF NO KEY WORDS: Return empty array []

DECISION FILTER (for feedback):
Create a teaching framework that shows HOW to differentiate the concepts in the options.
Format like this example for DRO vs DRA vs DRI vs DRL:
{
  "concepts": [
    {"name": "DRO", "definition": "Reinforcement for ABSENCE (doing NOTHING)"},
    {"name": "DRA", "definition": "Reinforcement for an ALTERNATIVE behavior (can do both physically)"},
    {"name": "DRI", "definition": "Reinforcement for an INCOMPATIBLE behavior (CANNOT do both physically)"},
    {"name": "DRL", "definition": "Reinforcement for LOW RATES (you want LESS, not ZERO)"}
  ],
  "testQuestion": "Does the person receive the reward for staying still / NOT doing the problem behavior? If YES = DRO"
}

The Decision Filter should:
- List the similar concepts being tested
- Give clear, distinguishing definitions
- Provide a "test question" that helps identify the correct concept
- Use ${language} with ABA terms in English

CRITICAL: Respond with ONLY raw JSON. No markdown, no code blocks.

Required JSON structure:
{
  "question": "Detailed scenario followed by question and hint line in format 'Hint: question?' OR 'Pista: pregunta?' OR 'Dica: pergunta?' OR 'Indice: question?'",
  "options": ["A) Concept", "B) Concept", "C) Concept", "D) Concept"],
  "correctIndex": 0,
  "hint": "The hint text only (without label) in ${language} - a question that guides reasoning",
  "keyWords": ["word1", "word2"] OR [],
  "keyWordExplanations": {
    "overall": "How to use key words OR 'No key trap words in this question. Focus on identifying the concept from the scenario description.'",
    "strategy": "Strategy for similar words OR 'Analyze the sequence of events and outcomes to determine which concept is being demonstrated.'"
  },
  "decisionFilter": {
    "concepts": [
      {"name": "Concept1", "definition": "Clear distinguishing definition in ${language} with ABA terms in English"},
      {"name": "Concept2", "definition": "Clear distinguishing definition"},
      {"name": "Concept3", "definition": "Clear distinguishing definition"},
      {"name": "Concept4", "definition": "Clear distinguishing definition"}
    ],
    "testQuestion": "A question or test that helps identify the correct concept in ${language}"
  },
  "optionExplanations": {
    "A": "Why correct/incorrect in ${language} with ABA terms in English",
    "B": "Why correct/incorrect in ${language} with ABA terms in English",
    "C": "Why correct/incorrect in ${language} with ABA terms in English",
    "D": "Why correct/incorrect in ${language} with ABA terms in English"
  }
}

Respond with ONLY the JSON object.`

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
        !questionData.hint ||
        !questionData.keyWords ||
        !Array.isArray(questionData.keyWords) ||
        !questionData.keyWordExplanations ||
        !questionData.decisionFilter ||
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
