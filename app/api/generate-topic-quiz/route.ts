import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
  rationale: string
}

interface QuizResponse {
  question: string
  difficulty: "Easy" | "Medium" | "Hard"
  options: QuizOption[]
}

export async function POST(request: NextRequest) {
  try {
    const { topic, examType } = await request.json()

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey || apiKey === "your_anthropic_api_key_here" || apiKey.length < 20) {
      return NextResponse.json(
        {
          error: "ANTHROPIC_API_KEY is not configured. Please add your API key from console.anthropic.com",
        },
        { status: 500 },
      )
    }

    const examLevel =
      examType === "RBT" ? "RBT (Registered Behavior Technician)" : "BCBA (Board Certified Behavior Analyst)"
    const prompt = `You are an expert ${examLevel} exam prep AI creating a practice question about: ${topic}

Create a realistic, application-based ${examLevel} exam question that tests understanding of this topic in a clinical context.

Requirements:
1. Write a detailed clinical scenario (3-5 sentences) that demonstrates ${topic} in action
2. Create 4 answer options (A, B, C, D) with ONLY ONE correct answer
3. Each option needs a detailed rationale explaining why it's correct or incorrect
4. Make the question test APPLICATION, not just recall
5. Use realistic clinical situations appropriate for ${examLevel} level
${examType === "RBT" ? "6. Focus on practical implementation skills and following supervision" : "6. Focus on analysis, design, and supervisory decision-making"}

Respond with ONLY valid JSON in this exact format:
{
  "question": "A behavior analyst is working with... [detailed scenario ending with a question]",
  "difficulty": "Medium",
  "options": [
    {
      "id": "A",
      "text": "First option text",
      "isCorrect": true,
      "rationale": "This is correct because... [detailed explanation]"
    },
    {
      "id": "B",
      "text": "Second option text",
      "isCorrect": false,
      "rationale": "This is incorrect because... [detailed explanation]"
    },
    {
      "id": "C",
      "text": "Third option text",
      "isCorrect": false,
      "rationale": "This is incorrect because... [detailed explanation]"
    },
    {
      "id": "D",
      "text": "Fourth option text",
      "isCorrect": false,
      "rationale": "This is incorrect because... [detailed explanation]"
    }
  ]
}`

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
        temperature: 0.8,
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
      return NextResponse.json({ error: `AI API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    const content = data.content?.[0]?.text

    if (!content) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 })
    }

    let quizData: QuizResponse
    try {
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

      quizData = JSON.parse(jsonString)

      if (
        !quizData.question ||
        !Array.isArray(quizData.options) ||
        quizData.options.length !== 4 ||
        !quizData.options.every((opt) => opt.id && opt.text && typeof opt.isCorrect === "boolean" && opt.rationale)
      ) {
        throw new Error("Invalid quiz structure")
      }

      const correctCount = quizData.options.filter((opt) => opt.isCorrect).length
      if (correctCount !== 1) {
        throw new Error("Must have exactly one correct answer")
      }
    } catch (parseError) {
      console.error("[v0] Failed to parse AI response:", content)
      return NextResponse.json(
        {
          error: "Failed to parse AI response. Please try again.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(quizData)
  } catch (error) {
    console.error("[v0] Error generating quiz:", error)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}
