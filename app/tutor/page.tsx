"use client"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { VideoLearningPlayer } from "@/components/video-learning-player"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation" // Import router
import {
  Zap,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Flame,
  Trophy,
  Target,
  Check,
  X,
  Send,
  MessageSquare,
  Menu,
  BookOpen,
  Share2,
  Linkedin,
  RotateCcw,
  Pause,
  Play,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { isForeverFreeUser } from "@/lib/constants"
import { UpgradeModal } from "@/components/upgrade-modal"

const FREE_DAILY_LIMIT = 5

// Helper functions for localStorage question tracking
function getTodayKey(): string {
  return `aba_questions_${new Date().toISOString().split('T')[0]}`
}

function getQuestionsUsedToday(): number {
  if (typeof window === 'undefined') return 0
  const count = localStorage.getItem(getTodayKey())
  return count ? parseInt(count, 10) : 0
}

function incrementQuestionsUsed(): void {
  if (typeof window === 'undefined') return
  const current = getQuestionsUsedToday()
  localStorage.setItem(getTodayKey(), String(current + 1))
}

interface TrapWord {
  word: string
  type: "sequence" | "comparison" | "absolute" | "aba_terminology"
  explanation?: string
  commonMeaning?: string
  abaMeaning?: string
}

// Added TrapAnalysis interface
interface TrapAnalysis {
  hasTrap: boolean
  trapType: "terminology" | "conceptual" | "structure" | null
  trapWord: string | null
  trapExplanation: string | null
  quickTip: string
  commonConfusion: string | null
}

interface ChatHistoryMessage {
  id: number
  role: "user" | "assistant"
  content: string
}

interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
  rationale: string
}

interface Flashcard {
  front: string
  back: string
}

interface FollowUpCard {
  id: string
  title: string
  description: string
  iconType: "flashcards_purple" | "guide_green" | "quiz_blue" | "more_orange"
}

interface FollowUpActions {
  title: string
  cards: FollowUpCard[]
  buttons: Array<{ id: string; text: string; primary?: boolean }>
}

interface ChatMessage {
  id: number
  sender: "ai" | "user"
  type: "text" | "quiz_question" | "flashcards" | "topic_input"
  content: string
  options?: QuizOption[]
  flashcards?: Flashcard[]
  userSelectedOptionId?: string | null
  isAnswered?: boolean
  difficulty?: "Easy" | "Medium" | "Hard"
  followUpActions?: FollowUpActions
  flippedCards?: number[]
  trapWords?: TrapWord[]
  highlightWords?: string[]
  trapAnalysis?: TrapAnalysis
}

interface GameStats {
  streak: number
  xp: number
  questionsAnswered: number
  correctToday: number
  dailyGoal: number
}

interface QuestionHistory {
  questionNumber: number
  isCorrect: boolean | null // null = unanswered
}

// RBT 3rd Edition Task List (2026)
const RBT_CATEGORIES = [
  "A. Data Collection and Graphing",
  "B. Behavior Assessment",
  "C. Behavior Acquisition",
  "D. Behavior Reduction",
  "E. Documentation and Reporting",
  "F. Ethics",
]

// BCBA 6th Edition Task List (2025)
const BCBA_CATEGORIES = [
  "A. Behaviorism and Philosophical Foundations",
  "B. Concepts and Principles",
  "C. Measurement, Data Display, and Interpretation",
  "D. Experimental Design",
  "E. Ethical and Professional Issues",
  "F. Behavior Assessment",
  "G. Behavior-Change Procedures",
  "H. Selecting and Implementing Interventions",
  "I. Personnel Supervision and Management",
]

interface TrapInfo {
  word: string
  type: "sequence" | "comparison" | "absolute" | string
  explanation: string
}

// Removed CollapsibleSection function as it is no longer used.

// Removed HighlightedQuestion function as it is no longer used.

function generateDetailedTrapExplanation(word: string, type: string, explanation: string, question: string): string {
  // Placeholder implementation for demonstration purposes
  return `The word "${word}" in the question "${question}" is a trap of type "${type}". ${explanation}`;
}

export default function AITutorPage() {
  const [examLevel, setExamLevel] = useState<"bcba" | "rbt">("bcba")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium")
  const [gameStats, setGameStats] = useState<GameStats>({
    streak: 3,
    xp: 150,
    questionsAnswered: 0,
    correctToday: 0,
    dailyGoal: 10, // Increased daily goal
  })
  // QuestionData type aligned with question-screen.tsx
interface QuestionData {
  question: string
  options: string[]
  correctIndex: number
  hint: string
  keyWords: string[]
  keyWordExplanations: {
    overall: string
    strategy: string
  }
  pivotWords?: Array<{
    word: string
    meaning: string
    strategy: string
  }>
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
  // Additional fields for tutor page
  difficulty?: string
  trapAnalysis?: TrapAnalysis
  category?: string
  topic?: string
}

const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showXPAnimation, setShowXPAnimation] = useState(false)
  const [currentTopic, setCurrentTopic] = useState<string>("") // This state is no longer used
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free")
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [questionsUsedToday, setQuestionsUsedToday] = useState(0)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true)
  const [chatHistory, setChatHistory] = useState<ChatHistoryMessage[]>([])
  const [sessionStarted, setSessionStarted] = useState(false)
  const [senseiQuestion, setSenseiQuestion] = useState("")
  const [isAskingSensei, setIsAskingSensei] = useState(false)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [questionHistory, setQuestionHistory] = useState<QuestionHistory[]>([])
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1)
  const [detectedTraps, setDetectedTraps] = useState<TrapInfo[]>([])
  const [errorDiagnosis, setErrorDiagnosis] = useState<string>("")
  const [quickTip, setQuickTip] = useState<string>("") // Declare setQuickTip variable
  const [senseiResponse, setSenseiResponse] = useState<string | null>(null) // Declare setSenseiResponse variable
  const inputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const progressPercent = 80 // Declare progressPercent variable
  const router = useRouter() // Declare router variable

  const handleShareTrapTip = () => {
    // Placeholder implementation for demonstration purposes
    console.log("Share Trap Tip");
  }

  const handleShareAbaTerm = () => {
    // Placeholder implementation for demonstration purposes
    console.log("Share ABA Term");
  }

  const handleShareChallenge = () => {
    // Placeholder implementation for demonstration purposes
    console.log("Share Challenge");
  }

  // Check subscription tier and questions used on mount
  useEffect(() => {
    const checkSubscription = async () => {
      setIsCheckingSubscription(true)
      setQuestionsUsedToday(getQuestionsUsedToday())
      
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUserEmail(user.email || null)
        
        // Check if user is forever free
        if (isForeverFreeUser(user.email)) {
          setSubscriptionTier("pro") // Treat forever free users as pro
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("subscription_tier")
            .eq("id", user.id)
            .single()
          
          if (profile?.subscription_tier) {
            setSubscriptionTier(profile.subscription_tier)
          }
        }
      }
      
      setIsCheckingSubscription(false)
    }
    
    checkSubscription()
  }, [])

  // Check if user can load more questions (free plan restriction)
  const canLoadQuestion = (): boolean => {
    // Pro, annual, and team users have unlimited access
    if (subscriptionTier === "pro" || subscriptionTier === "annual" || subscriptionTier === "team") {
      return true
    }
    // Free users are limited to FREE_DAILY_LIMIT questions per day
    return questionsUsedToday < FREE_DAILY_LIMIT
  }

  const getRemainingQuestions = (): number => {
    if (subscriptionTier === "pro" || subscriptionTier === "annual" || subscriptionTier === "team") {
      return -1 // Unlimited
    }
    return Math.max(0, FREE_DAILY_LIMIT - questionsUsedToday)
  }

  function generateQuickTip(trapAnalysis?: TrapAnalysis, correctOption?: QuizOption): string {
    // Prefer AI-generated tip if available
    if (trapAnalysis?.quickTip) return trapAnalysis.quickTip

    if (!correctOption) return ""
    const text = correctOption.text.toLowerCase()

    // Fallback to simple heuristics
    if (text.includes("generality")) return "Generality = behavior transfers across time, settings, and people"
    if (text.includes("effectiveness")) return "Effectiveness = Does it actually WORK to change behavior?"
    if (text.includes("applied")) return "Applied = Is it socially significant to the client?"
    if (text.includes("technological")) return "Technological = Can another person replicate it exactly?"
    if (text.includes("extinction")) return "Extinction = Stop the reinforcement, behavior decreases"
    if (text.includes("reinforcement")) return "Reinforcement = Behavior INCREASES after consequence"
    if (text.includes("punishment")) return "Punishment = Behavior DECREASES after consequence"

    return correctOption.rationale?.split(".")[0] || "Review this concept in your study materials"
  }

  function generateDetailedTrapExplanation(
    trapWord: string,
    trapType: string,
    shortExplanation: string,
    questionContext: string,
  ): string {
    // Generate detailed paragraph explanations for trap words
    const trapWordLower = trapWord.toLowerCase()

    // EXAM TRAP explanations - why these words trick students
    const trapExplanations: Record<string, string> = {
      stimulus_control: `"${trapWord}" is a COMMON EXAM TRAP. Stimulus control means the behavior ONLY happens when the correct stimulus is present. This tricks students because it SOUNDS like the behavior is controlled, but the key is that without the stimulus, the behavior doesn't occur. Test makers use this because students often confuse it with other control procedures. Remember: stimulus control requires DISCRIMINATIVE control - the presence/absence of a specific stimulus determines the behavior.`,

      generalization: `"${trapWord}" is a COMMON EXAM TRAP. Stimulus generalization occurs when a response learned to ONE stimulus occurs to SIMILAR stimuli without direct training. Test makers trap you here because students often think generalization means the behavior spreads to all contexts (it doesn't). In reality, generalization is LIMITED to similar stimuli. This is why stimulus discrimination training is needed for precise behavioral control.`,

      discrimination: `"${trapWord}" is a COMMON EXAM TRAP. Stimulus discrimination means the organism learns to respond DIFFERENTLY to similar but distinct stimuli. This tricks students because it requires EXPLICIT differential reinforcement - you must reinforce in the presence of one stimulus and not reinforce in the presence of another. Without this differential training, stimulus generalization occurs instead.`,

      extinction: `"${trapWord}" is a COMMON EXAM TRAP. Extinction ONLY involves WITHHOLDING the reinforcer that was maintaining the behavior - it is NOT adding a punisher. This is a critical distinction exam makers test. Students get trapped thinking any removal of reinforcement is extinction, but extinction specifically means stopping the delivery of the REINFORCER that was maintaining behavior. If you add a punisher, that's punishment, not extinction.`,

      reinforcement: `"${trapWord}" is a COMMON EXAM TRAP. Reinforcement means the behavior INCREASES in frequency after the consequence. The trick here is that BOTH positive (adding something desired) and negative (removing something unpleasant) reinforcement INCREASE behavior. Students get confused and think negative reinforcement is punishment. The KEY distinguishing feature is the direction of behavior change: if behavior increases, it's reinforcement; if it decreases, it's punishment.`,

      punishment: `"${trapWord}" is a COMMON EXAM TRAP. Punishment means the behavior DECREASES in frequency after the consequence. The trap is that BOTH positive punishment (adding something unpleasant) and negative punishment (removing something desired) DECREASE behavior. Students often confuse punishment with reinforcement. Remember the KEY: if behavior decreases, it's punishment (regardless of whether you add or remove something).`,

      shaping: `"${trapWord}" is a COMMON EXAM TRAP. Shaping involves reinforcing successive approximations to the target behavior. The exam trick is that students often confuse shaping with chaining (sequencing behaviors) or prompting. Shaping REQUIRES: (1) starting with current repertoire, (2) reinforcing closer and closer approximations, and (3) gradually withdrawing reinforcement for less accurate responses.`,

      chaining: `"${trapWord}" is a COMMON EXAM TRAP. Chaining is connecting a sequence of discriminative stimuli and responses into a functional sequence. The trick is distinguishing between forward chaining (teaching links in order) and backward chaining (teaching the last link first). Students get trapped because they think it's just teaching multiple behaviors, but the KEY is the SEQUENTIAL dependency - each response produces the discriminative stimulus for the next response.`,

      prompt: `"${trapWord}" is a COMMON EXAM TRAP. A prompt is an additional stimulus that increases the probability of the correct response BEFORE the SD (discriminative stimulus). The exam trick is understanding that prompts MUST be faded - you gradually reduce the prompt until the behavior occurs in response to just the SD. Without fading, the student becomes prompt-dependent.`,
    }

    // Check for known trap words
    for (const [key, explanation] of Object.entries(trapExplanations)) {
      if (trapWordLower.includes(key.replace(/_/g, " "))) {
        return explanation
      }
    }

    // If not in predefined list, generate a detailed explanation
    return `"${trapWord}" appears in this question and may be serving as an exam trap. The exam is testing whether you understand exactly what this term means in ABA. In this context: ${shortExplanation}. Be careful not to confuse this concept with similar-sounding terms when taking the actual exam.`
  }

  function diagnoseError(
    selectedOption: QuizOption | undefined,
    correctOption: QuizOption | undefined,
    trapAnalysis?: TrapAnalysis,
  ): string {
    // Prefer the complete rationale from the correct answer
    if (correctOption?.rationale) {
      return correctOption.rationale
    }

    // Use AI-generated confusion analysis if available
    if (trapAnalysis?.commonConfusion) {
      return trapAnalysis.commonConfusion
    }

    if (!selectedOption || !correctOption) return ""

    const selectedText = selectedOption.text.toLowerCase()
    const correctText = correctOption.text.toLowerCase()

    // Detailed educational explanations for common ABA concept confusions
    if (
      (selectedText.includes("positive") && correctText.includes("negative")) ||
      (selectedText.includes("negative") && correctText.includes("positive"))
    ) {
      return "You confused the valence of reinforcement or punishment. Positive means you ADD something desired/undesired, while negative means you REMOVE something unpleasant/desired. The CRITICAL distinction is that both positive AND negative reinforcement increase behavior, while both positive AND negative punishment decrease behavior. The key is the direction of behavior change, not whether you add or remove."
    }
    if (
      (selectedText.includes("reinforcement") && correctText.includes("punishment")) ||
      (selectedText.includes("punishment") && correctText.includes("reinforcement"))
    ) {
      return "This is a fundamental confusion between reinforcement and punishment. Reinforcement (positive or negative) INCREASES the likelihood of behavior recurring. Punishment (positive or negative) DECREASES the likelihood of behavior recurring. This distinction is so critical to ABA that you must distinguish it on the exam - it's one of the most common test questions."
    }
    if (selectedText.includes("extinction") && !correctText.includes("extinction")) {
      return "Extinction is NOT the same as removing a behavior through punishment or restraint. Extinction specifically means WITHHOLDING the reinforcer that was maintaining the behavior. The behavior will gradually decrease through extinction because the reinforcing consequence no longer follows it. This is different from punishment, which adds an unpleasant consequence."
    }
    if (selectedText.includes("generalization") && !correctText.includes("generalization")) {
      return "Stimulus generalization occurs when a learned response transfers to similar stimuli WITHOUT direct training on those stimuli. This is NOT about learning broadly - it's about untrained transfer to similar contexts. The key exam trap here is confusing generalization (which DOES occur without training) with discrimination (which requires EXPLICIT differential reinforcement training)."
    }
    if (selectedText.includes("discrimination") && !correctText.includes("discrimination")) {
      return "Stimulus discrimination is NOT the same as stimulus generalization. Discrimination means the organism responds DIFFERENTLY to distinct stimuli, requiring EXPLICIT differential reinforcement - reinforcing in the presence of one stimulus (S+) and not reinforcing in the presence of another (S-). Without this differential training, generalization will occur instead of discrimination."
    }
    if (selectedText.includes("shaping") && !correctText.includes("shaping")) {
      return "Shaping involves reinforcing successive approximations toward a target behavior, starting with the client's current behavioral repertoire. This is different from prompting (adding an extra stimulus) or chaining (connecting a sequence of behaviors). The key to shaping is that you gradually change the criterion for reinforcement as the behavior gets closer to the target."
    }
    if (selectedText.includes("prompt") && !correctText.includes("prompt")) {
      return "A prompt is an additional stimulus that increases the likelihood of the desired response when presented with the discriminative stimulus. However, prompts MUST be faded - gradually reduced - as the behavior comes under control of the S+. If you don't fade prompts, the client becomes prompt-dependent and won't respond without the prompt."
    }
    if (selectedText.includes("chaining") && !correctText.includes("chaining")) {
      return "Chaining connects a sequence of discriminative stimuli and responses into a functional unit where each response produces the S+ for the next response. This is different from teaching multiple independent behaviors. In forward chaining, you teach the first link first; in backward chaining, you teach the last link first and work backward."
    }

    // Final educational fallback explanation
    return `The correct answer is: "${correctOption.text}". Your selection of "${selectedOption.text}" suggests a misunderstanding of this ABA concept. Study the distinction between these concepts to avoid this error on the actual exam - test makers specifically target this confusion.`
  }

  const loadQuestion = async () => {
    // Check free plan limits before loading
    if (!canLoadQuestion()) {
      setShowUpgradeModal(true)
      return
    }
    
    setIsLoading(true)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setSenseiResponse(null) // Clear previous sensei response
    setDetectedTraps([]) // Clear previous traps
    setQuickTip("") // Clear previous quick tip
    setErrorDiagnosis("") // Clear previous error diagnosis
    setChatHistory([])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "practice",
          topic: examLevel === "rbt" ? "RBT exam concepts" : "BCBA exam concepts",
          examLevel,
          category: selectedCategory !== "all" ? selectedCategory : null,
          difficulty: difficulty,
        }),
      })

      const data = await response.json()

      if (data.type === "quiz" && data.question) {
        // Convert API response to QuestionData format
        // Handle both old format (options as array of objects) and new format (options as string array)
        let options: string[] = []
        let correctIndex = 0
        
        if (Array.isArray(data.options)) {
          if (typeof data.options[0] === 'string') {
            // New format: options is already string array
            options = data.options
            correctIndex = data.correctIndex ?? 0
          } else {
            // Old format: options is array of {id, text, isCorrect}
            options = data.options.map((opt: any, idx: number) => {
              const letter = ['A', 'B', 'C', 'D'][idx]
              return `${letter}. ${opt.text || opt.answer || opt.content || 'Option'}`
            })
            correctIndex = data.options.findIndex((opt: any) => opt.isCorrect === true || opt.correct === true)
            if (correctIndex === -1) correctIndex = 0
          }
        }

        const questionData: QuestionData = {
          question: data.question,
          options,
          correctIndex,
          hint: data.hint || "Think about the key ABA concepts involved.",
          keyWords: data.keyWords || [],
          keyWordExplanations: data.keyWordExplanations || { overall: "", strategy: "" },
          decisionFilter: data.decisionFilter || { concepts: [], testQuestion: "" },
          optionExplanations: data.optionExplanations || { A: "", B: "", C: "", D: "" },
          conclusion: data.conclusion || "",
          difficulty: data.difficulty || "Medium",
          trapAnalysis: data.trapAnalysis || undefined,
          category: data.category || undefined,
          topic: data.topic || undefined,
        }

        setCurrentQuestion(questionData)
      }
    } catch (error) {
      console.error("Error loading question:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswer = (optionIndex: number) => {
    if (isAnswered || !currentQuestion) return
    
    setSelectedAnswer(optionIndex.toString())
    setIsAnswered(true)
    
    // Increment questions used for free plan tracking
    incrementQuestionsUsed()
    setQuestionsUsedToday(prev => prev + 1)
    
    const isCorrect = optionIndex === currentQuestion.correctIndex
    const selectedOptionText = currentQuestion.options[optionIndex] || ""
    const correctOptionText = currentQuestion.options[currentQuestion.correctIndex] || ""

    if (currentQuestion) {
      const trapAnalysis = currentQuestion.trapAnalysis
      
      // Build detailed trap explanations
      const trapExplanations: TrapInfo[] = []
      
      if (trapAnalysis?.trapWord) {
        const explanation = generateDetailedTrapExplanation(
          trapAnalysis.trapWord,
          trapAnalysis.trapType,
          trapAnalysis.trapExplanation,
          currentQuestion.question,
        )
        trapExplanations.push({
          word: trapAnalysis.trapWord,
          type: trapAnalysis.trapType || "unknown",
          explanation: explanation,
        })
      }
      
      // Create QuizOption-like objects for helper functions
      const selectedOption: QuizOption | undefined = currentQuestion.options[optionIndex] ? {
        id: String.fromCharCode(65 + optionIndex),
        text: currentQuestion.options[optionIndex],
        isCorrect: optionIndex === currentQuestion.correctIndex,
        rationale: currentQuestion.optionExplanations?.[String.fromCharCode(65 + optionIndex) as keyof typeof currentQuestion.optionExplanations] || ""
      } : undefined
      
      const correctOption: QuizOption | undefined = currentQuestion.options[currentQuestion.correctIndex] ? {
        id: String.fromCharCode(65 + currentQuestion.correctIndex),
        text: currentQuestion.options[currentQuestion.correctIndex],
        isCorrect: true,
        rationale: currentQuestion.optionExplanations?.[String.fromCharCode(65 + currentQuestion.correctIndex) as keyof typeof currentQuestion.optionExplanations] || ""
      } : undefined
      
      setDetectedTraps(trapExplanations)
      setQuickTip(generateQuickTip(trapAnalysis, correctOption))
      if (!isCorrect) {
        setErrorDiagnosis(diagnoseError(selectedOption, correctOption, trapAnalysis))
      }
    }

    // Update question history
    setQuestionHistory((prev) => [...prev, { questionNumber: currentQuestionNumber, isCorrect: isCorrect || false }])

    setGameStats((prev) => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
      correctToday: isCorrect ? prev.correctToday + 1 : prev.correctToday,
      xp: isCorrect ? prev.xp + 10 : prev.xp,
      streak: isCorrect ? prev.streak + 1 : 0,
    }))

    if (isCorrect) {
      setShowXPAnimation(true)
      setTimeout(() => setShowXPAnimation(false), 1500)
    }
  }

  const handleNextQuestion = () => {
    setCurrentQuestionNumber((prev) => prev + 1)
    loadQuestion()
  }

  const handlePreviousQuestion = () => {
    // For now, just go back to welcome screen
    setSessionStarted(false)
  }

  const shareToTwitter = () => {
    if (!currentQuestion) return
    const questionText = currentQuestion?.question?.substring(0, 180) || "Check out this BCBA/RBT exam question"
    const text = `🧠 Can you answer this BCBA exam question?\n\n"${questionText}..."\n\nTest yourself at ABA Sensei! #BCBA #RBT #ABA`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://abasensei.app")}`
    window.open(twitterUrl, "_blank", "width=550,height=420")
    setShowShareModal(false)
  }

  const shareToLinkedIn = () => {
    if (!currentQuestion) return
    const questionText = currentQuestion?.question?.substring(0, 200) || "Check out this BCBA/RBT exam question"
    const shareText = `🧠 BCBA Exam Practice Question:\n\n"${questionText}..."\n\nPreparing for your BCBA or RBT exam? Try ABA Sensei for AI-powered practice!`
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://abasensei.app")}&summary=${encodeURIComponent(shareText)}`
    window.open(linkedInUrl, "_blank", "width=550,height=420")
    setShowShareModal(false)
  }

  const copyShareLink = () => {
    if (!currentQuestion) return
    const questionText = currentQuestion?.question?.substring(0, 200) || "Check out this BCBA/RBT exam question"
    const shareText = `🧠 BCBA Exam Question:\n\n"${questionText}..."\n\nPractice at: https://abasensei.app`
    navigator.clipboard.writeText(shareText).then(() => {
      // Show a brief toast notification
      const toast = document.createElement('div')
      toast.textContent = 'Copied to clipboard!'
      toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg text-sm'
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 2000)
      setShowShareModal(false)
    })
  }

  const handleAskSensei = async () => {
    if (!senseiQuestion.trim()) return

    const userMessage = senseiQuestion.trim()
    setSenseiQuestion("")
    setIsAskingSensei(true)

    // Add user message to chat history
    const userChatMessage: ChatHistoryMessage = {
      id: Date.now(),
      role: "user",
      content: userMessage,
    }
    setChatHistory((prev) => [...prev, userChatMessage])

    // Scroll to bottom
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)

    try {
      // Build context-aware message
      let contextMessage = userMessage

      // If there's a current question, add context
      if (currentQuestion) {
        const selectedIndex = selectedAnswer ? parseInt(selectedAnswer) : -1
        const selectedOptionText = selectedIndex >= 0 ? currentQuestion.options[selectedIndex] : ""
        const correctOptionText = currentQuestion.options[currentQuestion.correctIndex] || ""
        const isCorrectAnswer = selectedIndex === currentQuestion.correctIndex

        if (isAnswered && !isCorrectAnswer) {
          // User answered wrong - they might be asking why
          contextMessage = `Context: The student just answered a question incorrectly.
Question: "${currentQuestion.question}"
Their answer: "${selectedOptionText}" (incorrect)
Correct answer: "${correctOptionText}"

Student's follow-up question: ${userMessage}

Respond in 2-3 sentences max, conversationally. Reference the specific question if relevant.`
        } else if (isAnswered) {
          // User answered correctly
          contextMessage = `Context: The student just answered a question correctly.
Question: "${currentQuestion.question}"
Correct answer: "${correctOptionText}"

Student's follow-up question: ${userMessage}

Respond in 2-3 sentences max, conversationally.`
        } else {
          // Question is showing but not yet answered
          contextMessage = `Context: The student is viewing this question but hasn't answered yet.
Question: "${currentQuestion.question}"

Student's question: ${userMessage}

Give a helpful hint without revealing the answer. Keep it to 2-3 sentences max.`
        }
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          message: contextMessage,
          examLevel,
        }),
      })

      const data = await response.json()
      const aiResponse = data.content || "I couldn't process that question. Please try again."

      // Add AI response to chat history
      const aiChatMessage: ChatHistoryMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: aiResponse,
      }
      setChatHistory((prev) => [...prev, aiChatMessage])

      // Scroll to bottom
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch (error) {
      const errorMessage: ChatHistoryMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Sorry, I had trouble answering. Please try again.",
      }
      setChatHistory((prev) => [...prev, errorMessage])
    } finally {
      setIsAskingSensei(false)
    }
  }

  const startSession = () => {
    setSessionStarted(true)
    setQuestionHistory([]) // Reset question history
    setCurrentQuestionNumber(1) // Reset question number
    loadQuestion() // Load first question when session starts
  }

  // Welcome screen mode toggle
  const [welcomeMode, setWelcomeMode] = useState<"video" | "quiz">("video")
  
  // Auto-start session when switching to quiz mode
  useEffect(() => {
    if (welcomeMode === "quiz" && !sessionStarted && !currentQuestion) {
      setSessionStarted(true)
      loadQuestion()
    }
  }, [welcomeMode])

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500/10 text-green-400/90 border-green-500/20"
      case "Hard":
        return "bg-red-500/10 text-red-400/90 border-red-500/20"
      default: // Medium
        return "bg-amber-500/10 text-amber-400/90 border-amber-500/20"
    }
  }

// Welcome screen - only show when video mode or not started
  if (!sessionStarted && welcomeMode === "video") {
  return (
  <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]">
        {/* Header */}
        <header className="px-3 sm:px-4 py-3 sm:py-4 border-b border-zinc-800/50 flex items-center justify-between gap-3">
          {/* Left: Back button */}
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white/60 hover:text-white/80 text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          
          {/* Center: Quiz | Video Toggle */}
          <div className="flex bg-[#0d0d12] rounded-full p-1 border border-zinc-800/70 shadow-lg shadow-black/20">
            <button
              onClick={() => setWelcomeMode("quiz")}
              className={`relative px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                welcomeMode === "quiz"
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/30"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {welcomeMode === "quiz" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-amber-500 rounded-full"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              <span className="relative z-10">Quiz</span>
            </button>
            <button
              onClick={() => setWelcomeMode("video")}
              className={`relative px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                welcomeMode === "video"
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/30"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {welcomeMode === "video" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-amber-500 rounded-full"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              <span className="relative z-10">Video</span>
            </button>
          </div>
          
          {/* Right: Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-zinc-400 text-xs sm:text-sm">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{questionsUsedToday}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400/80 text-xs sm:text-sm">
              <Target className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{gameStats.correct}/{currentQuestionNumber}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          {/* Level toggle */}
          <div className="flex bg-[#1a1a24] rounded-full p-1 mb-8 border border-zinc-800/50">
            <button
              onClick={() => {
                setExamLevel("rbt")
                setSelectedCategory("all")
              }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                examLevel === "rbt" ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              RBT
            </button>
            <button
              onClick={() => {
                setExamLevel("bcba")
                setSelectedCategory("all")
              }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                examLevel === "bcba" ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              BCBA
            </button>
          </div>

          {welcomeMode === "video" ? (
            <VideoLearningPlayer autoPlay={true} />
          ) : (
            /* Quiz mode - Simple ready state */
            <motion.div 
              className="flex flex-col items-center justify-center mb-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div 
                className="w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-500/30 to-amber-900/10 flex items-center justify-center mb-6 border border-amber-500/20"
                animate={{ 
                  boxShadow: ["0 0 30px rgba(245,158,11,0.2)", "0 0 50px rgba(245,158,11,0.4)", "0 0 30px rgba(245,158,11,0.2)"]
                }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                <span className="text-6xl">🥋</span>
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Ready to Practice?</h2>
              <p className="text-zinc-400 text-sm text-center max-w-xs">
                {examLevel === "rbt" ? "RBT" : "BCBA"} exam questions powered by AI
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1.5 text-amber-500/80">
                  <Zap className="w-4 h-4" />
                  <span>{questionsUsedToday} today</span>
                </div>
                <div className="flex items-center gap-1.5 text-green-500/80">
                  <Target className="w-4 h-4" />
                  <span>{gameStats.correctToday}/{gameStats.dailyGoal} goal</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Logo and title - only show in video mode */}
          {welcomeMode === "video" && (
            <>
          <div className="text-4xl mb-3 opacity-90">🥋</div>
          <h1 className="text-xl font-semibold text-white mb-1 tracking-tight">ABA Sensei</h1>
          <p className="text-zinc-500 text-center text-sm mb-6">
            {gameStats.correctToday}/{gameStats.dailyGoal} questions today
          </p>
            </>
          )}

          {/* Category selection */}
          <div className="w-full max-w-md mb-8">
            <p className="text-zinc-400 text-sm text-center mb-3">Select Category</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                  selectedCategory === "all"
                    ? "bg-amber-500 text-black"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                All Categories
              </button>
              {(examLevel === "bcba" ? BCBA_CATEGORIES : RBT_CATEGORIES).map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                    selectedCategory === cat
                      ? "bg-amber-500 text-black"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty selector */}
          <div className="mt-6 w-full max-w-md mb-8">
            <p className="text-zinc-400 text-sm mb-3 text-center">Difficulty Level</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {/* Easy */}
              <button
                onClick={() => setDifficulty("Easy")}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  difficulty === "Easy"
                    ? "border-green-500 bg-green-500/10"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <div className="text-2xl mb-1">🌱</div>
                <div className={`font-semibold ${difficulty === "Easy" ? "text-green-400" : "text-white"}`}>
                  Easy
                </div>
                <div className="text-xs text-zinc-500">Fundamentals</div>
                {difficulty === "Easy" && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                )}
              </button>

              {/* Medium */}
              <button
                onClick={() => setDifficulty("Medium")}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  difficulty === "Medium"
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <div className="text-2xl mb-1">🔥</div>
                <div className={`font-semibold ${difficulty === "Medium" ? "text-amber-400" : "text-white"}`}>
                  Medium
                </div>
                <div className="text-xs text-zinc-500">Application</div>
                {difficulty === "Medium" && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                )}
              </button>

              {/* Hard */}
              <button
                onClick={() => setDifficulty("Hard")}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  difficulty === "Hard"
                    ? "border-red-500 bg-red-500/10"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <div className="text-2xl mb-1">💀</div>
                <div className={`font-semibold ${difficulty === "Hard" ? "text-red-400" : "text-white"}`}>
                  Hard
                </div>
                <div className="text-xs text-zinc-500">Exam-level</div>
                {difficulty === "Hard" && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Progress ring */}
          <div className="relative w-32 h-32 mb-8">
            <svg className="w-full h-full -rotate-90">
              <circle cx="64" cy="64" r="56" fill="none" stroke="#1f1f1f" strokeWidth="6" />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${progressPercent * 3.52} 352`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Target className="w-7 h-7 text-amber-500/80 mb-1" />
              <span className="text-white font-medium">{Math.round(progressPercent)}%</span>
            </div>
          </div>

          {/* Start button */}
          <Button
            onClick={startSession}
            className="w-full max-w-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold py-6 text-base rounded-xl transition-all duration-150"
          >
            Start Practice
          </Button>

          {/* Daily goal card */}
          <div className="mt-8 bg-zinc-900/80 rounded-xl p-4 w-full max-w-xs border border-zinc-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-500/80" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Daily Goal</p>
                  <p className="text-zinc-500 text-xs">
                    {gameStats.correctToday}/{gameStats.dailyGoal} correct
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]">
      {/* Header */}
      <header className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSessionStarted(false)
              setWelcomeMode("video")
            }}
            className="p-2 -ml-2 hover:bg-zinc-900 rounded-full transition-all duration-150"
          >
            <X className="w-5 h-5 text-zinc-600" />
          </button>
          
          {/* Quiz | Video Toggle */}
          <div className="flex bg-[#0d0d12] rounded-full p-1 border border-zinc-800/70">
            <button
              onClick={() => setWelcomeMode("quiz")}
              className={`relative px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                welcomeMode === "quiz"
                  ? "bg-amber-500 text-black"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Quiz
            </button>
            <button
              onClick={() => {
                setWelcomeMode("video")
                setSessionStarted(false)
              }}
              className={`relative px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                welcomeMode === "video"
                  ? "bg-amber-500 text-black"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Video
            </button>
          </div>
          
          <span className="text-zinc-500 text-sm hidden sm:inline">{examLevel.toUpperCase()} Practice</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Remaining questions for free users */}
          {subscriptionTier === "free" && (
            <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
              <span>{getRemainingQuestions()}/{FREE_DAILY_LIMIT}</span>
              <span className="text-zinc-600">today</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-amber-500/90">
            <Flame className="w-4 h-4" />
            <span className="font-medium text-sm">{gameStats.streak}</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400/80 relative">
            <Zap className="w-4 h-4" />
            <span className="font-medium text-sm">{gameStats.xp}</span>
            {showXPAnimation && (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-green-400 font-medium text-sm animate-bounce">
                +10
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Two-panel layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-[280px] bg-black/50 backdrop-blur-sm border-b md:border-b-0 md:border-r border-zinc-800/30 flex flex-col shrink-0 overflow-y-auto">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className="flex items-center gap-2 text-zinc-200 hover:text-white transition-all duration-150 px-3 sm:px-4 py-2 sm:py-3 md:hidden"
          >
            <Menu className="w-4 h-4" />
            <span>Categories</span>
          </button>

          <div className="hidden md:flex flex-col px-3 sm:px-4 py-3 border-b border-zinc-800/20">
            <p className="text-amber-400/90 font-medium text-xs mb-2 flex items-center gap-2 uppercase tracking-wide">
              <BookOpen className="w-3 h-3" />
              Topic
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2">
            {isAnswered ? (
              <>
                {/* Trap Alert */}
                {detectedTraps.length > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-amber-400/90 font-medium text-xs mb-2 flex items-center gap-2 uppercase tracking-wide">
                      <span>⚠</span> Trap Detected
                    </p>
                    {detectedTraps.map((trap, i) => (
                      <p key={i} className="text-zinc-400 text-sm leading-relaxed">
                        <span className="text-amber-300/80 font-medium">&quot;{trap.word}&quot;</span> -{" "}
                        {trap.explanation}
                      </p>
                    ))}
                  </div>
                )}

                {/* Why wrong */}
                {currentQuestion && !currentQuestion.options.find((o) => o.id === selectedAnswer)?.isCorrect && errorDiagnosis && (
                  <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/30">
                    <p className="text-red-400/80 font-medium text-xs mb-2 uppercase tracking-wide">Why it's wrong</p>
                    <p className="text-zinc-400 text-sm leading-relaxed italic">{errorDiagnosis}</p>
                  </div>
                )}

                {chatHistory.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800/30">
                    {chatHistory.slice(-4).map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl text-sm ${
                          msg.role === "user"
                            ? "bg-zinc-800/50 text-zinc-300 ml-4"
                            : "bg-zinc-900/50 text-zinc-400 border border-zinc-800/30"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <p className="text-amber-500 text-xs mb-1 font-medium">Sensei</p>
                        )}
                        <p className="leading-relaxed">{msg.content}</p>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </>
            ) : !isAnswered && currentQuestion ? (
              <div className="space-y-3">
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <MessageSquare className="w-8 h-8 text-zinc-800 mb-2" />
                  <p className="text-zinc-600 text-sm">Answer to see full reasoning</p>
                  <p className="text-zinc-700 text-xs mt-1">Or ask a question below</p>
                </div>

                {/* Chat history display (before answering) */}
                {chatHistory.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800/30">
                    {chatHistory.slice(-4).map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl text-sm ${
                          msg.role === "user"
                            ? "bg-zinc-800/50 text-zinc-300 ml-4"
                            : "bg-zinc-900/50 text-zinc-400 border border-zinc-800/30"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <p className="text-amber-500 text-xs mb-1 font-medium">Sensei</p>
                        )}
                        <p className="leading-relaxed">{msg.content}</p>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="w-10 h-10 text-zinc-800 mb-3" />
                <p className="text-zinc-600 text-sm">Answer the question to see reasoning</p>
              </div>
            )}
          </div>

          {/* Ask Sensei input - Now always enabled when there's a question */}
          <div className="p-3 border-t border-zinc-800/30 mt-auto">
            <div className="flex items-center gap-2 bg-zinc-900 rounded-xl px-3 py-2 border border-zinc-800/50">
              <input
                ref={inputRef}
                type="text"
                value={senseiQuestion}
                onChange={(e) => setSenseiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAskSensei()}
                placeholder={isAnswered ? "Ask a follow-up..." : "Ask the Sensei..."}
                className="flex-1 bg-transparent text-zinc-200 text-sm placeholder:text-zinc-600 outline-none"
                disabled={!currentQuestion || isAskingSensei}
              />
              <button
                onClick={handleAskSensei}
                disabled={!currentQuestion || isAskingSensei || !senseiQuestion.trim()}
                className="p-1.5 text-zinc-500 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                {isAskingSensei ? (
                  <div className="w-4 h-4 border-2 border-amber-500/60 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            {!currentQuestion && <p className="text-zinc-700 text-xs mt-1 text-center">Load a question first</p>}
          </div>
        </div>

        {/* RIGHT PANEL - Quiz Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#0a0a0f] to-[#12121a]">
          {/* Progress bar */}
          <div className="p-3 border-b border-zinc-800/30 shrink-0">
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: gameStats.dailyGoal }).map((_, i) => {
                const historyItem = questionHistory[i]
                let bgColor = "bg-zinc-800"
                if (historyItem) {
                  bgColor = historyItem.isCorrect ? "bg-green-500/60" : "bg-red-500/60"
                } else if (i === currentQuestionNumber - 1) {
                  bgColor = "bg-zinc-500"
                }
                return <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${bgColor}`} />
              })}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">
                {currentQuestionNumber} of {gameStats.dailyGoal}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-red-400/70 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {gameStats.questionsAnswered - gameStats.correctToday}
                </span>
                <span className="text-green-400/70 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {gameStats.correctToday}
                </span>
              </div>
            </div>
          </div>

          {/* Question content */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-10 h-10 border-2 border-zinc-700 border-t-amber-500/60 rounded-full animate-spin mb-4" />
                <p className="text-zinc-600 text-sm">Loading question...</p>
              </div>
            ) : currentQuestion ? (
              <div className="max-w-[800px] mx-auto relative">
                {/* Share Button */}
                {isAnswered && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10"
                    onClick={() => setShowShareModal(true)}
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                )}

                {/* Difficulty badge */}
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getDifficultyStyles(currentQuestion.difficulty)}`}
                  >
                    {currentQuestion.difficulty === "Easy"
                      ? "Easy"
                      : currentQuestion.difficulty === "Hard"
                        ? "Hard"
                        : "Medium"}
                  </span>
                </div>

                {/* Category/Domain Badge */}
                {(currentQuestion.topic || currentQuestion.category) && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-700 text-zinc-300">
                      {currentQuestion.topic ? (
                        <>Task {currentQuestion.topic.split(" - ")[0]} &bull; {currentQuestion.category}</>
                      ) : (
                        currentQuestion.category
                      )}
                    </span>
                  </div>
                )}

                {/* Question text */}
                <div className="mb-4">
                  <p className="text-zinc-600 text-xs mb-1">{currentQuestionNumber}.</p>
                  <p className="text-white text-base leading-relaxed">{currentQuestion.question}</p>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {currentQuestion.options.map((optionText, index) => {
                    const letter = String.fromCharCode(65 + index) as 'A' | 'B' | 'C' | 'D'
                    const isSelected = selectedAnswer === index.toString()
                    const isCorrectOption = index === currentQuestion.correctIndex
                    const showResult = isAnswered

                    let cardStyles = "bg-zinc-900 border-zinc-800 hover:brightness-110"
                    if (showResult) {
                      if (isCorrectOption) {
                        cardStyles = "bg-green-500/10 border-green-500/40"
                      } else if (isSelected && !isCorrectOption) {
                        cardStyles = "bg-red-500/10 border-red-500/40"
                      } else {
                        cardStyles = "bg-zinc-900/30 border-zinc-800/30 opacity-40"
                      }
                    } else if (isSelected) {
                      cardStyles = "bg-zinc-900 border-amber-500"
                    }

                    // Extract display text (remove "A. " prefix if present)
                    const displayText = optionText.replace(/^[A-D]\.\s*/, '')
                    const rationale = currentQuestion.optionExplanations?.[letter] || ""

                    return (
                      <div key={index}>
                        <button
                          onClick={() => handleAnswer(index)}
                          disabled={isAnswered}
                          className={`w-full py-3 px-4 rounded-xl border text-left transition-all duration-150 hover:shadow-lg hover:shadow-black/20 ${cardStyles}`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all duration-150 ${
                                showResult && isCorrectOption
                                  ? "bg-green-500 text-black"
                                  : showResult && isSelected && !isCorrectOption
                                    ? "bg-red-500 text-white"
                                    : isSelected
                                      ? "bg-amber-500 text-black"
                                      : "bg-zinc-800 text-zinc-400"
                              }`}
                            >
                              {showResult && isCorrectOption ? (
                                <Check className="w-3 h-3" />
                              ) : showResult && isSelected && !isCorrectOption ? (
                                <X className="w-3 h-3" />
                              ) : (
                                letter
                              )}
                            </span>
                            <span className="text-zinc-200 text-sm leading-relaxed">{displayText}</span>
                          </div>
                        </button>

                        {/* Inline feedback for wrong answer */}
                        {showResult && isSelected && !isCorrectOption && (
                          <div className="mt-2 ml-10 text-xs text-red-400/70">
                            <span className="font-medium">Not quite</span> - {rationale || errorDiagnosis}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-zinc-500 text-sm">Could not load question</p>
                <Button onClick={loadQuestion} className="mt-4 bg-amber-500 hover:bg-amber-400 text-black text-sm">
                  Retry
                </Button>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="p-3 border-t border-zinc-800/30 shrink-0">
            <div className="flex items-center justify-between max-w-[800px] mx-auto gap-4">
              <Button
                onClick={handlePreviousQuestion}
                variant="ghost"
                className="px-4 py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 bg-transparent transition-all duration-150"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNextQuestion}
                disabled={!isAnswered}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upgrade Modal for Free Plan Limit */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        questionsUsed={questionsUsedToday}
        maxQuestions={FREE_DAILY_LIMIT}
      />

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" 
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-zinc-900 rounded-2xl p-6 w-80 border border-white/10" 
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-center mb-4 text-white">Share to</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={shareToTwitter}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/10 transition"
              >
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                  <X className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-zinc-400">X</span>
              </button>
              
              <button 
                onClick={shareToLinkedIn}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/10 transition"
              >
                <div className="w-12 h-12 bg-[#0077B5] rounded-full flex items-center justify-center">
                  <Linkedin className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-zinc-400">LinkedIn</span>
              </button>
              
              <button 
                onClick={copyShareLink}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/10 transition"
              >
                <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-zinc-400">Copy Link</span>
              </button>
            </div>
            
            <button 
              onClick={() => setShowShareModal(false)}
              className="w-full mt-4 py-2 text-zinc-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
