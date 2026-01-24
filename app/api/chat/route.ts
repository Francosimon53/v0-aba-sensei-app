import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateText } from "ai"

export const runtime = "nodejs"

// BCBA 6th Edition Task List (2025) - Official domains with task codes
const BCBA_TOPIC_CATEGORIES = {
  "A. Behaviorism and Philosophical Foundations": [
    "A.1 - identify the goals of behavior analysis as a science",
    "A.2 - describe the characteristics of science and distinguish from pseudoscience",
    "A.3 - describe the philosophical assumptions underlying the science of behavior analysis",
    "A.4 - distinguish among behaviorism, the philosophy of behavior analysis, and behavior analysis",
    "A.5 - describe and explain behavior from a behavior-analytic perspective",
  ],
  "B. Concepts and Principles": [
    "B.1 - define and provide examples of behavior, response, and response class",
    "B.2 - define and provide examples of stimulus and stimulus class",
    "B.3 - define and provide examples of respondent and operant conditioning",
    "B.4 - define and provide examples of positive and negative reinforcement",
    "B.5 - define and provide examples of positive and negative punishment",
    "B.6 - define and provide examples of unconditioned, conditioned, and generalized reinforcers and punishers",
    "B.7 - define and provide examples of unconditioned and conditioned motivating operations",
    "B.8 - define and provide examples of stimulus control and discrimination",
    "B.9 - define and provide examples of verbal operants (mand, tact, echoic, intraverbal, autoclitic)",
  ],
  "C. Measurement, Data Display, and Interpretation": [
    "C.1 - establish operational definitions of behavior",
    "C.2 - distinguish among direct, indirect, and product measures of behavior",
    "C.3 - measure occurrence (frequency, rate, duration, latency, IRT)",
    "C.4 - measure temporal dimensions of behavior",
    "C.5 - measure form and strength of behavior",
    "C.6 - design, plot, and interpret data using line graphs and cumulative records",
    "C.7 - design, plot, and interpret data using scatterplots",
    "C.8 - evaluate reliability and validity of measurement procedures",
  ],
  "D. Experimental Design": [
    "D.1 - distinguish between internal and external validity",
    "D.2 - describe reversal designs and evaluate their applications",
    "D.3 - describe multiple baseline designs and evaluate their applications",
    "D.4 - describe multielement/alternating treatments designs",
    "D.5 - describe changing criterion designs",
    "D.6 - describe combination designs",
  ],
  "E. Ethical and Professional Issues": [
    "E.1 - identify the core principles of the BACB Ethics Code",
    "E.2 - apply ethical codes in professional practice",
    "E.3 - maintain client dignity and protect confidentiality",
    "E.4 - establish and maintain professional boundaries",
    "E.5 - make decisions regarding discontinuation of services",
    "E.6 - identify and address conflicts of interest",
  ],
  "F. Behavior Assessment": [
    "F.1 - review records and available data at outset of case",
    "F.2 - determine the need for behavior-analytic services",
    "F.3 - identify and prioritize socially significant behavior-change goals",
    "F.4 - conduct preference assessments",
    "F.5 - describe and interpret results of indirect assessments",
    "F.6 - describe and interpret results of direct assessments",
    "F.7 - describe and interpret results of functional analyses",
    "F.8 - interpret functional assessment results to develop interventions",
  ],
  "G. Behavior-Change Procedures": [
    "G.1 - use reinforcement procedures",
    "G.2 - use token economies and other conditioned reinforcement systems",
    "G.3 - use stimulus and response prompts and prompt fading",
    "G.4 - use modeling and imitation training",
    "G.5 - use shaping procedures",
    "G.6 - use chaining procedures",
    "G.7 - use discrimination training procedures",
    "G.8 - use stimulus control transfer procedures",
    "G.9 - use differential reinforcement (DRA, DRI, DRO, DRL, DRH)",
    "G.10 - use extinction procedures",
    "G.11 - use punishment procedures",
  ],
  "H. Selecting and Implementing Interventions": [
    "H.1 - state intervention goals in observable and measurable terms",
    "H.2 - identify potential unwanted effects of reinforcement and punishment",
    "H.3 - recommend intervention intensity and treatment termination criteria",
    "H.4 - select interventions based on client preferences, supporting environments, and social validity",
    "H.5 - plan for possible unwanted effects and develop contingencies",
    "H.6 - monitor client progress and treatment fidelity",
    "H.7 - make data-based decisions about intervention effectiveness",
  ],
  "I. Personnel Supervision and Management": [
    "I.1 - establish clear performance expectations for supervisees",
    "I.2 - select supervision goals based on assessment of supervisee skills",
    "I.3 - train supervisees to competence using BST and other methods",
    "I.4 - use performance monitoring and feedback",
    "I.5 - use systems for ongoing evaluation of supervisee and staff performance",
    "I.6 - provide supervision across service-delivery settings",
  ],
}

// RBT 3rd Edition Task List (2026) - Official domains with task codes
const RBT_TOPIC_CATEGORIES = {
  "A. Data Collection and Graphing": [
    "A.1 - prepare for data collection",
    "A.2 - implement continuous measurement procedures (frequency, rate, duration, latency, IRT)",
    "A.3 - implement discontinuous measurement procedures (partial interval, whole interval, momentary time sampling)",
    "A.4 - implement permanent product measurement procedures",
    "A.5 - enter data and update graphs",
  ],
  "B. Behavior Assessment": [
    "B.1 - assist with assessments (preference, reinforcer, skills)",
    "B.2 - assist with functional behavior assessments",
    "B.3 - describe common functions of problem behavior",
    "B.4 - implement procedures to assess potential reinforcers",
  ],
  "C. Behavior Acquisition": [
    "C.1 - identify the essential components of a written skill acquisition plan",
    "C.2 - prepare for the implementation of a skill acquisition plan",
    "C.3 - implement discrete trial teaching (DTT) procedures",
    "C.4 - implement naturalistic teaching procedures (NET, incidental teaching)",
    "C.5 - implement group teaching procedures",
    "C.6 - implement task analysis and chaining procedures",
    "C.7 - implement prompting and prompt fading procedures",
    "C.8 - implement discrimination training procedures",
    "C.9 - implement generalization and maintenance procedures",
    "C.10 - implement token economy procedures",
  ],
  "D. Behavior Reduction": [
    "D.1 - identify the essential components of a written behavior reduction plan",
    "D.2 - describe common functions of problem behavior",
    "D.3 - implement interventions based on modification of antecedents",
    "D.4 - implement differential reinforcement procedures (DRA, DRO, DRI)",
    "D.5 - implement extinction procedures",
    "D.6 - implement crisis/emergency protocols",
  ],
  "E. Documentation and Reporting": [
    "E.1 - report changes in behavior and environment to the supervisor",
    "E.2 - generate objective session notes",
    "E.3 - comply with applicable legal, regulatory, and workplace requirements",
    "E.4 - comply with applicable documentation requirements",
  ],
  "F. Ethics": [
    "F.1 - describe the role of the RBT in the service delivery system",
    "F.2 - respond appropriately to feedback and maintain supervision requirements",
    "F.3 - communicate with stakeholders as authorized",
    "F.4 - maintain professional boundaries",
    "F.5 - maintain client dignity",
    "F.6 - protect confidentiality of client information",
  ],
}

// Practitioner and client names for varied scenarios - realistic ABA titles
const PRACTITIONER_NAMES = [
  // BCBAs (most common)
  "Sarah, a BCBA,", "Michael, a BCBA,", "Jennifer, a BCBA,", "David, a BCBA,",
  "Emily, a BCBA,", "James, a BCBA,", "Jessica, a BCBA,", "Robert, a BCBA,",
  "Amanda, a BCBA,", "Christopher, a BCBA,", "Ashley, a BCBA,", "Matthew, a BCBA,",
  "Lauren, a BCBA,", "Daniel, a BCBA,", "Rachel, a BCBA,", "Andrew, a BCBA,",
  // BCaBAs
  "Maria, a BCaBA,", "Kevin, a BCaBA,", "Nicole, a BCaBA,", "Brandon, a BCaBA,",
  "Stephanie, a BCaBA,", "Tyler, a BCaBA,",
  // RBTs (for RBT-level questions)
  "Carlos, an RBT,", "Brittany, an RBT,", "Marcus, an RBT,", "Samantha, an RBT,",
  "Alex, an RBT,", "Taylor, an RBT,",
  // Supervisors
  "The supervising BCBA", "The clinic supervisor", "The lead BCBA",
  // Generic but professional
  "A behavior analyst", "The behavior analyst", "A certified behavior analyst"
]

const CLIENT_NAMES = [
  "Tommy", "Sophia", "Ethan", "Olivia", "Liam", "Emma", "Noah", "Ava",
  "Maya", "Lucas", "Isabella", "Aiden", "Mia", "Jackson", "Charlotte", "Leo",
  "Benjamin", "Amelia", "Daniel", "Harper", "Michael", "Evelyn", "Jake",
  "Lily", "Ryan", "Chloe", "Nathan", "Zoe", "Connor", "Grace"
]

const SETTINGS = [
  "at a public elementary school", "in a private clinic", "during a home-based session",
  "at an autism center", "in a group home", "at a middle school",
  "during an early intervention session", "at a vocational training center",
  "in a preschool classroom", "at an inclusive daycare", "in a behavioral health clinic",
  "during a community outing", "at an after-school program"
]

const CLIENT_AGES = [
  "3-year-old", "4-year-old", "5-year-old", "6-year-old", "7-year-old",
  "8-year-old", "9-year-old", "10-year-old", "11-year-old", "12-year-old",
  "13-year-old", "15-year-old", "17-year-old", "young adult"
]

// Helper function to get a random topic from categories
function getRandomTopic(examLevel: string): { category: string; topic: string } {
  const categories = examLevel === "rbt" ? RBT_TOPIC_CATEGORIES : BCBA_TOPIC_CATEGORIES
  const categoryNames = Object.keys(categories)
  const randomCategory = categoryNames[Math.floor(Math.random() * categoryNames.length)]
  const topicsInCategory = categories[randomCategory as keyof typeof categories]
  const randomTopic = topicsInCategory[Math.floor(Math.random() * topicsInCategory.length)]
  return { category: randomCategory, topic: randomTopic }
}

// Initialize Supabase client with service role key for RAG queries
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Generate embedding for a query using OpenAI
async function generateEmbedding(text: string): Promise<number[] | null> {
  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) return null

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.data?.[0]?.embedding || null
  } catch (error) {
    console.error("[v0] Error generating embedding:", error)
    return null
  }
}

// Search knowledge_chunks using vector similarity
async function searchKnowledge(query: string, examLevel = "bcba"): Promise<string> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.log("[v0] Supabase not configured, skipping RAG")
    return ""
  }

  // Generate embedding for the query
  const embedding = await generateEmbedding(query)

  if (!embedding) {
    console.log("[v0] Could not generate embedding, falling back to keyword search")
    // Fallback: keyword-based search
    const { data, error } = await supabase
      .from("knowledge_chunks")
      .select("task_id, task_text, keywords, domain")
      .eq("exam_level", examLevel)
      .limit(5)

    if (error || !data || data.length === 0) return ""

    return data.map((chunk) => `[${chunk.task_id}] ${chunk.task_text}`).join("\n\n")
  }

  // Use RPC function for vector similarity search
  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 5,
    p_exam_level: examLevel,
  })

  if (error) {
    console.log("[v0] Vector search failed, trying direct query:", error.message)
    // Fallback to direct query
    const { data: fallbackData } = await supabase
      .from("knowledge_chunks")
      .select("task_id, task_text, keywords, domain")
      .eq("exam_level", examLevel)
      .limit(5)

    if (!fallbackData || fallbackData.length === 0) return ""

    return fallbackData.map((chunk) => `[${chunk.task_id}] ${chunk.task_text}`).join("\n\n")
  }

  if (!data || data.length === 0) return ""

  console.log(`[v0] RAG found ${data.length} relevant chunks`)

  return data.map((chunk: any) => `[${chunk.task_id}] ${chunk.task_text}`).join("\n\n")
}

interface ChatRequest {
  message: string
  action: "chat" | "practice" | "flashcards" | "studyguide" | "explain"
  topic?: string
  examLevel?: string
}

function getHighlightWords(questionText: string): string[] {
  const highlightPatterns = [
    // Contrast words
    "However",
    "Although",
    "But",
    "Despite",
    "Instead",
    // Timing words
    "Initially",
    "Subsequently",
    "Prior to",
    "After",
    "Before",
    "First",
    "Then",
    "Finally",
    // Trap words
    "FIRST",
    "BEST",
    "MOST",
    "ALWAYS",
    "NEVER",
    "ONLY",
    "PRIMARY",
    "PRIMARILY",
    "NEXT",
  ]

  const found: string[] = []
  highlightPatterns.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi")
    if (regex.test(questionText)) {
      found.push(word)
    }
  })
  return found
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { message, action, topic, examLevel = "bcba" } = body

    // Vercel AI Gateway handles API keys automatically for supported providers

    // Get RAG context only for non-practice questions (practice questions don't need external knowledge)
    let ragContext = ""
    if (action !== "practice") {
      const ragQuery = topic || message || (examLevel === "rbt" ? "RBT exam concepts" : "BCBA exam concepts")
      ragContext = await searchKnowledge(ragQuery, examLevel)
    }

    const examLevelContext =
      examLevel === "rbt"
        ? `You are preparing questions for the RBT (Registered Behavior Technician) exam.
RBT is a paraprofessional certification focused on IMPLEMENTATION of behavior plans.
RBT questions should focus on:
- Following written behavior plans
- Data collection during sessions
- Recognizing when to ask supervisor for help
- Professional conduct and scope of practice
- Direct implementation skills (DTT, prompting, reinforcement delivery)
Questions should be practical and implementation-focused, NOT analytical or design-based.
Use simpler vocabulary appropriate for paraprofessional level.`
        : `You are preparing questions for the BCBA (Board Certified Behavior Analyst) exam.
BCBA is a graduate-level certification focused on DESIGNING and ANALYZING behavior programs.
BCBA questions should focus on:
- Assessment and analysis
- Treatment design and modification
- Supervision and ethics
- Research and experimental design
- Clinical decision-making
Questions should require critical thinking and application of principles.`

    let systemPrompt = ""
    let userPrompt = ""

    // Get category and difficulty from request body
    const requestedCategory = body.category
    const requestedDifficulty = body.difficulty || "Medium"

    // Select random topic for practice questions using categorized topics
    // If a specific category is requested, filter to only that category
    let topicCategory: string
    let randomTopic: string

    if (requestedCategory && requestedCategory !== "all") {
      // User selected a specific category - filter to it
      const categories = examLevel === "rbt" ? RBT_TOPIC_CATEGORIES : BCBA_TOPIC_CATEGORIES
      const matchingCategory = Object.keys(categories).find((cat) => 
        cat.toLowerCase().includes(requestedCategory.toLowerCase()) ||
        requestedCategory.toLowerCase().includes(cat.toLowerCase())
      )
      
      if (matchingCategory) {
        topicCategory = matchingCategory
        const topicsInCategory = categories[matchingCategory as keyof typeof categories]
        randomTopic = topicsInCategory[Math.floor(Math.random() * topicsInCategory.length)]
      } else {
        // Fallback to random if category not found
        const result = getRandomTopic(examLevel)
        topicCategory = result.category
        randomTopic = result.topic
      }
    } else {
      // No specific category - pick randomly from all
      const result = getRandomTopic(examLevel)
      topicCategory = result.category
      randomTopic = result.topic
    }

    // Build prompts based on action type
    switch (action) {
      case "practice":
        systemPrompt = `CRITICAL: You MUST respond ONLY in ENGLISH. All text - questions, options, rationales, explanations, tips, feedback - must be in English. Never use Spanish, Portuguese, or any other language.

You are "ABA Sensei" 🥋, an expert AI tutor for ${examLevel.toUpperCase()} exam preparation.

═══════════════════════════════════════════════════════
📐 GOLDEN FORMATTING RULES
═══════════════════════════════════════════════════════
1. No Walls of Text: Keep rationales to 2-3 sentences MAX
2. Visual Hierarchy: Use **bold** for key terms
3. Tone: Professional, empathetic, motivating, direct

═══════════════════════════════════════════════════════
🧠 TEACHING ALGORITHM (Use for rationales)
═══════════════════════════════════════════════════════
For EACH option rationale, follow this structure:
1. Direct Answer: Why this IS or ISN'T correct (1 sentence)
2. Quick Analogy: Real-world comparison that makes it "click" (1 sentence)
3. Exam Tip: How to identify this on test day (1 sentence)

${examLevelContext}

${ragContext ? `KNOWLEDGE BASE CONTEXT:\n${ragContext}\n` : ""}

═══════════════════════════════════════════════════════
🚨 TRAP DETECTOR (Analyze each question you create)
═══════════════════════════════════════════════════════

TERMINOLOGY TRAPS - ABA words with different everyday meanings:
- "Negative" = REMOVAL (not "bad") - like subtracting in math
- "Consequence" = ANY event after behavior (not punishment)
- "Punishment" = Behavior DECREASES (can be pleasant removal)
- "Reinforcement" = Behavior INCREASES (can be unpleasant removal)
- "Discrimination" = Distinguishing stimuli (not social prejudice)
- "Extinction" = Withholding reinforcement (not disappearing)

CONCEPTUAL TRAPS - Similar concepts students confuse:
- MO vs SD: MO changes VALUE, SD signals AVAILABILITY
- DRA/DRI/DRO/DRL: Alt behavior, Incompatible, Other, Low rate
- Validity vs Reliability: Accuracy vs Consistency

STRUCTURE TRAPS - Question phrasing tricks:
- FIRST/NEXT/BEFORE = Sequence matters
- BEST/MOST/PRIMARY = Multiple correct, pick optimal
- ALWAYS/NEVER = Usually incorrect (too absolute)

═══════════════════════════════════════════════════════
📝 RESPONSE RULES
═══════════════════════════════════════════════════════
- Create questions that test APPLICATION, not just recall
- Use realistic clinical scenarios (3-4 sentences max)
- Match difficulty to ${examLevel.toUpperCase()} level
- Include ONE intuitive analogy in the correct answer's rationale
- Keep trapAnalysis brief: 1-2 lines only if genuinely tricky`

        // Generate random scenario details for variety
        const randomPractitioner = PRACTITIONER_NAMES[Math.floor(Math.random() * PRACTITIONER_NAMES.length)]
        const randomClient = CLIENT_NAMES[Math.floor(Math.random() * CLIENT_NAMES.length)]
        const randomSetting = SETTINGS[Math.floor(Math.random() * SETTINGS.length)]
        const randomAge = CLIENT_AGES[Math.floor(Math.random() * CLIENT_AGES.length)]

        userPrompt = `DIFFICULTY LEVEL: ${requestedDifficulty}

Easy = Basic definitions and simple scenarios. Test recall of key terms.
Medium = Application questions with clinical scenarios. Requires understanding concepts.
Hard = Complex multi-step scenarios, tricky wording, requires deep analysis. Exam-level difficulty.

═══════════════════════════════════════════════════════
🎯 MANDATORY TOPIC FOR THIS QUESTION
Category: ${topicCategory}
Specific Task: ${randomTopic}
═══════════════════════════════════════════════════════

═══════════════════════════════════════════════════════
👤 SCENARIO REQUIREMENTS - MANDATORY
- Start the question with: ${randomPractitioner}
- Client name: ${randomClient}
- Client age: ${randomAge}
- Setting: ${randomSetting}
═══════════════════════════════════════════════════════

BANNED - NEVER USE:
- "Dr." or "Doctor" (very rare in ABA field)
- "Dr. Martinez" (permanently banned)
- "therapist" (use "behavior analyst" or "RBT" instead)

Example good openings:
- "Sarah, a BCBA, is working with a 6-year-old client named Tommy in a private clinic..."
- "Marcus, an RBT, observes that his client Sophia..."
- "The supervising BCBA notices that during a home-based session..."

You MUST use the exact names/details provided above. Create a realistic ABA scenario.

Create ONE unique ${examLevel.toUpperCase()} practice question at ${requestedDifficulty} difficulty specifically about: ${randomTopic}
This is from the ${topicCategory} section of the ${examLevel.toUpperCase()} Task List.

⛔ DO NOT create a question about "dimensions of ABA" or "7 dimensions"
⛔ DO NOT ask "which dimension is demonstrated"
⛔ DO NOT create generic questions
✅ Focus ONLY on: ${randomTopic}

VARY THE QUESTION FORMAT - choose ONE:
1. Clinical scenario: "What should the ${examLevel.toUpperCase()} do FIRST?"
2. Definition-based: "Which term BEST describes...?"
3. Ethical dilemma: "What is the MOST appropriate action?"
4. Data interpretation: "Based on this data, what conclusion...?"
5. Procedure identification: "This technique is an example of...?"
6. Comparison: "What is the PRIMARY difference between X and Y?"

${topic ? `Additional topic context: ${topic}` : ""}

The CORRECT answer's rationale MUST include:
1. Why it's correct (1 sentence)
2. An intuitive analogy starting with "Think of it like..." (1 sentence)  
3. A quick exam tip (1 sentence)

Respond with ONLY valid JSON (QuestionData format):
{
  "question": "Clinical scenario ending with a question (3-4 sentences max)",
  "difficulty": "${requestedDifficulty}",
  "options": ["A. Option text", "B. Option text", "C. Option text", "D. Option text"],
  "correctIndex": 0,
  "hint": "One line hint to help the student",
  "keyWords": ["key term 1", "key term 2"],
  "keyWordExplanations": {
    "overall": "Brief overall explanation",
    "strategy": "How to approach this question type"
  },
  "decisionFilter": {
    "concepts": [
      {"name": "Concept name", "definition": "Brief definition", "analogy": "Simple analogy"}
    ],
    "testQuestion": "What question should I ask myself to solve this?"
  },
  "optionExplanations": {
    "A": "Why A is correct/wrong. Think of it like [analogy]. Exam tip: [tip]",
    "B": "Why B is wrong in 1-2 sentences",
    "C": "Why C is wrong in 1-2 sentences",
    "D": "Why D is wrong in 1-2 sentences"
  },
  "conclusion": "The key takeaway from this question",
  "trapAnalysis": {
    "hasTrap": true or false,
    "trapType": "terminology" | "conceptual" | "structure" | null,
    "trapWord": "The specific tricky word/concept" or null,
    "trapExplanation": "1 line: what it REALLY means in ABA" or null,
    "quickTip": "1-line memory trick for the exam",
    "commonConfusion": "What students often mix this up with" or null
  }
}`
        break

      case "flashcards":
        systemPrompt = `CRITICAL: You MUST respond ONLY in ENGLISH. All text - questions, options, rationales, explanations, tips, feedback - must be in English. Never use Spanish, Portuguese, or any other language.

You are an expert ${examLevel.toUpperCase()} tutor. Create concise flashcards for studying.

${examLevelContext}

${
  ragContext
    ? `KNOWLEDGE BASE CONTEXT:
${ragContext}

`
    : ""
}RULES:
- Create 5 flashcards maximum
- Front: Clear question or term
- Back: Concise answer (1-2 sentences)
- Match content to ${examLevel.toUpperCase()} level`

        userPrompt = `Create flashcards about: ${topic || message}

Respond with ONLY valid JSON:
{
  "flashcards": [
    {"front": "Question or term", "back": "Concise answer"},
    {"front": "Question or term", "back": "Concise answer"}
  ]
}`
        break

      case "studyguide":
        systemPrompt = `CRITICAL: You MUST respond ONLY in ENGLISH. All text - questions, options, rationales, explanations, tips, feedback - must be in English. Never use Spanish, Portuguese, or any other language.

You are an expert ${examLevel.toUpperCase()} tutor. Create brief, focused study guides.

${examLevelContext}

${
  ragContext
    ? `KNOWLEDGE BASE CONTEXT:
${ragContext}

`
    : ""
}RULES:
- Keep it SHORT (3-4 key points max)
- Use simple language appropriate for ${examLevel.toUpperCase()} level
- Include practical examples`

        userPrompt = `Create a brief study guide about: ${topic || message}

Format:
**Topic Name**

1. Key Point 1 (1-2 sentences)
2. Key Point 2 (1-2 sentences)
3. Key Point 3 (1-2 sentences)

Quick Tip: One practical application tip`
        break

      case "explain":
        systemPrompt = `CRITICAL: You MUST respond ONLY in ENGLISH. All text - questions, options, rationales, explanations, tips, feedback - must be in English. Never use Spanish, Portuguese, or any other language.

You are a friendly ${examLevel.toUpperCase()} tutor. Explain concepts simply and briefly.

${examLevelContext}

${
  ragContext
    ? `KNOWLEDGE BASE CONTEXT:
${ragContext}

`
    : ""
}RULES:
- Maximum 2-3 short paragraphs
- Use simple language and examples appropriate for ${examLevel.toUpperCase()} level
- End with ONE follow-up question to guide learning
- NO bullet point lists or headers`

        userPrompt = `Explain this topic briefly: ${topic || message}`
        break

      default: // chat
        systemPrompt = `CRITICAL: You MUST respond ONLY in ENGLISH. All text - questions, options, rationales, explanations, tips, feedback - must be in English. Never use Spanish, Portuguese, or any other language.

You are ABA Sensei, a warm and encouraging tutor who genuinely cares about helping students pass their ${examLevel.toUpperCase()} exam.

PERSONALITY:
- Friendly, supportive, like a wise mentor
- Use casual language, contractions (you're, let's, don't)
- Show enthusiasm with occasional emojis (but not too many)
- Be encouraging but honest
- Speak like a real person, not a textbook

CONVERSATION RULES:
1. Keep responses SHORT - 2-3 sentences MAX
2. NEVER use bullet points or lists in chat
3. NEVER use headers or markdown formatting
4. Ask follow-up questions to keep the conversation going
5. Reference what the student just asked or did
6. If they got a question wrong, be supportive not critical
7. Use analogies from everyday life to explain concepts

EXAMPLES OF GOOD RESPONSES:

User: "what is DRI?"
Bad (robotic): "DRI stands for Differential Reinforcement of Incompatible behavior. It is used to reduce problem behavior by reinforcing a behavior that is physically incompatible."
Good (conversational): "DRI is one of my favorites! Basically you reinforce something the student CAN'T do at the same time as the problem behavior. For example, if a kid bites their hands, you reinforce 'hands busy' by having them draw. Do you have a specific case where you want to apply it?"

User: "I got it wrong again"
Bad: "The correct answer was A. Review the concept of effectiveness."
Good: "Hey, don't worry - this one trips up a lot of people! The key is remembering that 'effective' in ABA means the change actually matters in real life, not just on paper. Want me to break down why your answer wasn't quite right?"

User: "I'm nervous about the exam"
Bad: "It's normal to feel nervous. Keep practicing."
Good: "I totally get it! Exam nerves are super normal. The good news is you're already here practicing, and that puts you ahead of a lot of people. What topic has you most worried? We can focus on that."

${examLevelContext}

${ragContext ? `Use this knowledge if relevant:\n${ragContext}\n` : ""}

Remember: You're a supportive mentor, not a textbook. Keep it real and conversational.`

        userPrompt = message
    }

    // Call Google Gemini via Vercel AI Gateway
    const { text: content } = await generateText({
      model: "google/gemini-2.0-flash-001",
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: action === "practice" ? 1000 : 1500,
      temperature: action === "practice" ? 0.8 : 0.7,
      timeout: 15000, // 15 second timeout
    })

    if (!content) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 })
    }

    // Parse response based on action type
    if (action === "practice") {
      try {
        let jsonString = content
        const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1].trim()
        } else {
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) jsonString = jsonMatch[0].trim()
        }

  const quizData = JSON.parse(jsonString)
  
  const highlightWords = getHighlightWords(quizData.question)
  
  return NextResponse.json({
    type: "quiz",
    ...quizData,
    highlightWords,
    usedRAG: !!ragContext,
    category: topicCategory,
    topic: randomTopic,
  })
      } catch (e) {
        console.error("[v0] Failed to parse quiz response:", e)
        return NextResponse.json({ error: "Failed to parse quiz" }, { status: 500 })
      }
    }

    if (action === "flashcards") {
      try {
        let jsonString = content
        const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1].trim()
        } else {
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) jsonString = jsonMatch[0].trim()
        }

        const flashcardsData = JSON.parse(jsonString)
        return NextResponse.json({ type: "flashcards", ...flashcardsData, usedRAG: !!ragContext })
      } catch (e) {
        return NextResponse.json({ type: "text", content, usedRAG: !!ragContext })
      }
    }

    // For chat, explain, studyguide - return text
    return NextResponse.json({ type: "text", content, usedRAG: !!ragContext })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
