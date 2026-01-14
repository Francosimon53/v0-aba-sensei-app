import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

interface GenerateQuestionRequest {
  examLevel: "RBT" | "BCBA"
  category: string
  language: "English" | "Español" | "Português" | "Français"
  taskId?: string
  taskText?: string
  keywords?: string
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
  trapDetector?: {
    trapWord: string
    commonMeaning: string
    abaMeaning: string
    howItConfuses: string
  }
  decisionFilter: {
    concepts: Array<{
      name: string
      definition: string
      analogy?: string
      rule?: string
    }>
    testQuestion: string
  }
  optionExplanations: {
    A: string
    B: string
    C: string
    D: string
  }
  conclusion: string
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
    const { examLevel, category, language, taskId, taskText, keywords }: GenerateQuestionRequest = await request.json()

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey || apiKey === "your_anthropic_api_key_here" || apiKey.length < 20) {
      return NextResponse.json(
        {
          error:
            "ANTHROPIC_API_KEY is not configured. Please add your actual Anthropic API key in the Vars section (left sidebar). Get your API key from console.anthropic.com",
        },
        { status: 500 },
      )
    }

    let taskInstruction = ""
    if (taskId && taskText) {
      taskInstruction = `

## REQUIRED TASK FOR THIS QUESTION (from official BACB Test Content Outline):
Task ID: ${taskId}
Task Description: ${taskText}
${keywords ? `Related Keywords: ${keywords}` : ""}

You MUST create a question that directly assesses this specific task competency.
The question MUST test the student's ability to: ${taskText}
Do NOT deviate from this task. This is the official BACB requirement.`
    }

    const prompt = `You are "ABA Sensei", an expert AI tutor specializing in Applied Behavior Analysis (ABA) exam preparation. Your mission is to help students pass their RBT or BCBA certification exams by developing their "Clinical Eye" and avoiding linguistic traps.

[Context: ${examLevel} Level]
[Category: ${category}]
[Language for explanations: ${language}]${taskInstruction}

## CORE PRINCIPLES
- Questions ALWAYS in English (simulating real exam)
- Explanations in ${language} but KEEP ABA terms in English (reinforcement, punishment, antecedent, consequence, MO, SD, extinction, baseline, shaping, chaining)
- Test APPLICATION of concepts, not just recall
- Identify linguistic traps that confuse students

## CRITICAL ABA TRAP WORDS (ABA English vs Everyday English):
These words have DIFFERENT meanings in ABA vs everyday language. ALWAYS check if your question contains any of these and include trapDetector:

- "Negative" = SUBTRACT/Remove (math operation), NOT bad/harmful
- "Positive" = ADD/Present (math operation), NOT good/pleasant  
- "Consequence" = ANY event after behavior (can be good or bad), NOT punishment
- "Discrimination" = DISTINGUISH between stimuli, NOT prejudice
- "Elicit" = AUTOMATICALLY trigger (reflexes ONLY). If voluntary, NEVER elicit
- "Emit" = YOU produce the behavior (voluntary) → Operant
- "Evoke" = Stimulus INVITES behavior → Operant
- "Variable" = UNPREDICTABLE schedule, NOT "changeable"
- "Contingent" = DEPENDENT on behavior, NOT "backup plan"
- "Extinction" = STOP reinforcement, NOT "eliminate forever"
- "Punishment" = DECREASES behavior, NOT necessarily painful/bad
- "Reinforce" = INCREASES behavior, NOT "to support/help"

## OTHER CRITICAL DISTINCTIONS TO TEST:

### MO vs SD (Critical Distinction)
- SD (Gas station sign) = Signals AVAILABILITY → "Can I get it?"
- MO (Empty tank) = Creates VALUE → "Do I want it?"

### Validity vs Accuracy vs Reliability
- Validity: Did you measure the RIGHT thing? (Correct target?)
- Accuracy: Is the number TRUE? (Hitting bullseye?)
- Reliability: Is it CONSISTENT? (Shots clustered together?)

### Interval Recording
- Whole Interval: UNDERESTIMATES → Use for behaviors to INCREASE
- Partial Interval: OVERESTIMATES → Use for behaviors to DECREASE

### BST (Behavioral Skills Training) - Sacred Sequence
1. Instruction (Explain)
2. Modeling (Demonstrate)
3. Rehearsal (Practice/Role-play)
4. Feedback (Correct)

### Experimental Design Decision Tree
- Dangerous or IRREVERSIBLE? → Multiple Baseline (never reversal)
- COMPARE two treatments? → Alternating Treatments
- Goal changes GRADUALLY? → Changing Criterion
- Otherwise? → Reversal (A-B-A-B)

### Functional Analysis Conditions
| Condition | MO | If Behavior | Tests |
|-----------|-----|-------------|-------|
| ATTENTION | Attention deprivation | Give attention | Social Positive |
| DEMAND | Aversive task | Remove task | Negative Reinforcement |
| ALONE | Boredom | Nothing | Automatic |
| PLAY/CONTROL | None | Ignore/redirect | Baseline |

## QUESTION GENERATION TASK:

1. CREATE DETAILED CLINICAL SCENARIO (3-5 sentences):
   - Specific client details and setting
   - What was done: interventions, procedures, data collected
   - What happened: client responses, outcomes, observations
   - Current situation or problem

2. QUESTION (comes LAST after scenario):
   Use varied types:
   - "What does this scenario demonstrate?"
   - "What is the function of this behavior?"
   - "Which principle is illustrated?"
   - "What type of reinforcement schedule is this?"
   - "What procedure is being used?"
   - "What does this scenario demonstrate a LACK of?"
   
   AVOID always using "What should the analyst do FIRST/NEXT?"
   
   IMPORTANT: The "question" field should ONLY contain the scenario and question. DO NOT include the hint in this field.

3. ADD HINT (SEPARATE FIELD):
   - Write a QUESTION that guides thinking
   - Point to KEY difference between confusing options
   - DO NOT reveal the answer
   - Write in ${language}
   - This goes in the separate "hint" field, NOT in the question text

4. KEY WORDS ANALYSIS:
   Only identify words in the ACTUAL QUESTION (not scenario):
   - Temporal: "first", "next", "before", "after"
   - Absolute: "always", "never", "only", "must"
   - Comparative: "best", "most appropriate", "primarily"
   - Negation: "except", "not", "lack of"
   
   If NO key words: Return empty array []

5. TRAP DETECTOR (IMPORTANT - Check for ABA trap words):
   SCAN your question and scenario for ANY of these ABA trap words:
   Negative, Positive, Consequence, Discrimination, Elicit, Emit, Evoke, Variable, Contingent, Extinction, Punishment, Reinforce
   
   If ANY of these words appear in the question or options, you MUST include trapDetector:
   {
     "trapWord": "The exact trap word used",
     "commonMeaning": "What most people think it means in everyday English",
     "abaMeaning": "What it ACTUALLY means in ABA context",
     "howItConfuses": "Explanation in ${language} of how this linguistic trap might confuse students"
   }
   
   If NONE of these specific trap words appear, set trapDetector to null.

6. DECISION FILTER (Most Important):
   Create comparison showing HOW to differentiate similar concepts:
   - Use MEMORABLE ANALOGIES
   - Provide SIMPLE RULES
   - Include sub-categories when relevant

7. OPTION EXPLANATIONS:
   For each option, explain in ${language} (keep ABA terms in English):
   - Why it's correct (for the right answer)
   - Why it's incorrect (for wrong answers)
   - What common confusion it represents

8. CONCLUSION:
   ONE sentence connecting scenario to correct answer in ${language}.

## RESPONSE FORMAT:
CRITICAL: Respond with ONLY raw JSON. No markdown, no code blocks, no extra text.

{
  "question": "Detailed scenario followed by question. STOP HERE. Do not include hint.",
  "options": ["A) Option1", "B) Option2", "C) Option3", "D) Option4"],
  "correctIndex": 0,
  "hint": "Hint text in ${language} - separate from question",
  "keyWords": ["word1", "word2"] OR [],
  "keyWordExplanations": {
    "overall": "How to use key words OR 'No key trap words in this question. Focus on identifying the concept from the scenario description.'",
    "strategy": "Strategy for similar words OR 'Analyze the sequence of events and outcomes to determine which concept is being demonstrated.'"
  },
  "trapDetector": {
    "trapWord": "Word",
    "commonMeaning": "Everyday meaning",
    "abaMeaning": "ABA technical meaning",
    "howItConfuses": "Explanation in ${language}"
  } OR null,
  "decisionFilter": {
    "concepts": [
      {
        "name": "Concept1",
        "definition": "Clear definition in ${language}",
        "analogy": "Memorable analogy in ${language}",
        "rule": "Simple rule in ${language}"
      }
    ],
    "testQuestion": "Test question in ${language}"
  },
  "optionExplanations": {
    "A": "Why correct/incorrect in ${language}",
    "B": "Why correct/incorrect in ${language}",
    "C": "Why correct/incorrect in ${language}",
    "D": "Why correct/incorrect in ${language}"
  },
  "conclusion": "One sentence connecting scenario to answer in ${language}"
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
        max_tokens: 2500,
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

    let questionData
    try {
      // Extract JSON from potential markdown code blocks
      let jsonString = content
      const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim()
      } else {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          jsonString = jsonMatch[0].trim()
        }
      }

      questionData = JSON.parse(jsonString)

      if (
        !questionData.question ||
        !questionData.options ||
        !Array.isArray(questionData.options) ||
        questionData.options.length !== 4 ||
        typeof questionData.correctIndex !== "number" ||
        !questionData.hint ||
        !questionData.decisionFilter ||
        !questionData.optionExplanations ||
        !questionData.conclusion
      ) {
        throw new Error("Invalid question structure returned from AI")
      }

      // Ensure keyWords is an array
      if (!questionData.keyWords || !Array.isArray(questionData.keyWords)) {
        questionData.keyWords = []
      }

      // Ensure keyWordExplanations exists
      if (!questionData.keyWordExplanations) {
        questionData.keyWordExplanations = {
          overall:
            "No key trap words in this question. Focus on identifying the concept from the scenario description.",
          strategy: "Analyze the sequence of events and outcomes to determine which concept is being demonstrated.",
        }
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
