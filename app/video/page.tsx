"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { VideoLearningPlayer } from "@/components/video-learning-player"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react"

export default function VideoModePage() {
  const router = useRouter()
  const [examLevel, setExamLevel] = useState<"rbt" | "bcba">("rbt")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.3)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Sample questions data - in production this would come from API
  const questions = {
    rbt: [
      {
        question: "A client engages in hand-flapping when presented with a difficult task. The RBT should FIRST:",
        options: [
          "A. Implement a punishment procedure to reduce the behavior",
          "B. Collect data on the antecedents and consequences of the behavior",
          "C. Ignore the behavior and continue with the task",
          "D. Immediately provide reinforcement to redirect attention"
        ],
        correctIndex: 1,
        explanation: "Before implementing any intervention, it's essential to understand the function of the behavior. Collecting ABC data (Antecedent-Behavior-Consequence) helps identify why the behavior is occurring, which guides appropriate intervention selection.",
        trapWord: "FIRST",
        commonMeaning: "The initial action to take",
        abaMeaning: "The most appropriate priority action based on ABA principles - data collection precedes intervention",
        howItConfuses: "Many answers seem correct, but ABA always prioritizes assessment before intervention"
      },
      {
        question: "When implementing a token economy, which of the following is MOST important to ensure effectiveness?",
        options: [
          "A. Using the most expensive backup reinforcers available",
          "B. Pairing tokens with established reinforcers initially",
          "C. Requiring many tokens before exchange",
          "D. Changing token values frequently"
        ],
        correctIndex: 1,
        explanation: "For a token economy to be effective, tokens must acquire conditioned reinforcing properties. This is achieved by consistently pairing tokens with known effective reinforcers (backup reinforcers) so that the tokens themselves become valuable to the client.",
        trapWord: "MOST",
        commonMeaning: "The primary or main consideration",
        abaMeaning: "The factor that has the greatest impact on treatment outcomes based on behavioral principles",
        howItConfuses: "All options may seem beneficial, but only one addresses the fundamental mechanism of conditioned reinforcement"
      }
    ],
    bcba: [
      {
        question: "When conducting a functional analysis, the BEST way to demonstrate experimental control is to:",
        options: [
          "A. Use a reversal design with multiple phases",
          "B. Collect data across multiple settings",
          "C. Interview caregivers about behavior patterns",
          "D. Observe the client in natural environment"
        ],
        correctIndex: 0,
        explanation: "A reversal (ABAB) design demonstrates experimental control by showing that behavior changes systematically with the introduction and removal of conditions. This provides the strongest evidence of a functional relationship between variables.",
        trapWord: "BEST",
        commonMeaning: "The superior or ideal option",
        abaMeaning: "The approach that provides the strongest experimental evidence based on research methodology",
        howItConfuses: "Other options are valuable assessment methods, but only experimental manipulation demonstrates causation"
      },
      {
        question: "A behavior analyst notices that a client's aggressive behavior has increased despite implementing a DRA procedure. The FIRST step should be to:",
        options: [
          "A. Add a punishment component to the intervention",
          "B. Evaluate the effectiveness of the alternative reinforcer",
          "C. Discontinue DRA and try a different procedure",
          "D. Increase the magnitude of timeout"
        ],
        correctIndex: 1,
        explanation: "When DRA is ineffective, the first step is to evaluate whether the alternative behavior is producing reinforcement that competes with the reinforcement maintaining the problem behavior. The reinforcer for the alternative behavior must be more valuable than what maintains aggression.",
        trapWord: "FIRST",
        commonMeaning: "The initial action chronologically",
        abaMeaning: "The priority step that addresses the most likely cause of treatment failure before adding components",
        howItConfuses: "Jumping to add punishment or change procedures ignores troubleshooting the existing intervention"
      }
    ]
  }

  const currentQuestions = questions[examLevel]
  const currentQuestion = currentQuestions[currentQuestionIndex]

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.muted = isMuted
    }
  }, [volume, isMuted])

  const handlePreviousQuestion = () => {
    setCurrentQuestionIndex((prev) => 
      prev > 0 ? prev - 1 : currentQuestions.length - 1
    )
  }

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => 
      prev < currentQuestions.length - 1 ? prev + 1 : 0
    )
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]">
      {/* Background Music */}
      <audio
        ref={audioRef}
        src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3"
        autoPlay
        loop
      />

      {/* Header */}
      <header className="px-4 sm:px-6 py-4 border-b border-zinc-800/50 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🥋</span>
          <span className="text-white font-semibold">ABA Sensei</span>
        </div>
        
        {/* Center: Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-500 text-sm font-medium">
            Video Learning Mode
          </span>
        </div>
        
        {/* Right: Exit button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 rounded-lg text-zinc-300 hover:text-white text-sm transition-all"
        >
          <span>Exit</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center px-6 py-8">
        {/* Exam Type Selector */}
        <div className="flex bg-[#1a1a24] rounded-full p-1 mb-8 border border-zinc-800/50">
          <button
            onClick={() => {
              setExamLevel("rbt")
              setCurrentQuestionIndex(0)
            }}
            className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-150 ${
              examLevel === "rbt" 
                ? "bg-amber-500 text-black" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            RBT
          </button>
          <button
            onClick={() => {
              setExamLevel("bcba")
              setCurrentQuestionIndex(0)
            }}
            className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-150 ${
              examLevel === "bcba" 
                ? "bg-amber-500 text-black" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            BCBA
          </button>
        </div>

        {/* Video Player Container */}
        <div className="w-full max-w-5xl" style={{ width: "80%" }}>
          <div className="aspect-video relative">
            <VideoLearningPlayer 
              autoPlay={true}
              questionData={currentQuestion}
            />
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-4 mt-6 px-4 py-3 bg-zinc-900/80 border border-zinc-800/50 rounded-xl">
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-zinc-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-amber-500" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:rounded-full"
          />
          <span className="text-xs text-zinc-500">Background Music</span>
        </div>

        {/* Question Navigation */}
        <div className="flex items-center gap-4 mt-8">
          <Button
            onClick={handlePreviousQuestion}
            variant="outline"
            className="flex items-center gap-2 px-6 py-3 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Question
          </Button>
          
          <span className="text-zinc-500 text-sm">
            Question {currentQuestionIndex + 1} of {currentQuestions.length}
          </span>
          
          <Button
            onClick={handleNextQuestion}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl"
          >
            Next Question
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
