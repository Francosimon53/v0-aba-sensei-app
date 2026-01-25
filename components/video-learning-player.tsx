"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"

interface QuestionData {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  trapWord: string
  commonMeaning: string
  abaMeaning: string
  howItConfuses: string
}

interface VideoLearningPlayerProps {
  onComplete?: () => void
  autoPlay?: boolean
  questionData?: QuestionData
}

export function VideoLearningPlayer({ onComplete, autoPlay = true, questionData }: VideoLearningPlayerProps) {
  const [currentScene, setCurrentScene] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [sceneProgress, setSceneProgress] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // Default question data if none provided
  const defaultQuestion: QuestionData = {
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
  }

  const question = questionData || defaultQuestion

  const scenes = [
    {
      id: "question",
      title: "Question",
      duration: 8000,
    },
    {
      id: "options",
      title: "Options",
      duration: 6000,
    },
    {
      id: "reveal",
      title: "Answer Reveal",
      duration: 4000,
    },
    {
      id: "explanation",
      title: "Explanation",
      duration: 10000,
    },
    {
      id: "trap",
      title: "Trap Detector",
      duration: 10000,
    },
  ]

  // Auto-cycle scenes with variable duration
  useEffect(() => {
    if (!isPlaying) return
    const currentDuration = (scenes[currentScene]?.duration || 3000) / playbackSpeed
    const progressInterval = 50

    let elapsed = 0

    const interval = setInterval(() => {
      elapsed += progressInterval
      setSceneProgress((elapsed / currentDuration) * 100)

      if (elapsed >= currentDuration) {
        if (currentScene === scenes.length - 1) {
          onComplete?.()
          setCurrentScene(0)
        } else {
          setCurrentScene((prev) => prev + 1)
        }
        setSceneProgress(0)
        elapsed = 0
      }
    }, progressInterval)

    return () => clearInterval(interval)
  }, [isPlaying, currentScene, scenes.length, onComplete, playbackSpeed])

  // Reset scene when question changes
  useEffect(() => {
    setCurrentScene(0)
    setSceneProgress(0)
  }, [questionData])

  const nextScene = () => {
    setCurrentScene((prev) => (prev + 1) % scenes.length)
    setSceneProgress(0)
  }

  const prevScene = () => {
    setCurrentScene((prev) => (prev - 1 + scenes.length) % scenes.length)
    setSceneProgress(0)
  }

  const restartScenes = () => {
    setCurrentScene(0)
    setSceneProgress(0)
    setIsPlaying(true)
  }

  const goToScene = (index: number) => {
    setCurrentScene(index)
    setSceneProgress(0)
  }

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev)
  }

  const renderSceneContent = () => {
    switch (scenes[currentScene].id) {
      case "question":
        return (
          <motion.div
            key="question"
            className="flex flex-col items-center justify-center h-full px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-amber-500/70 text-sm font-semibold mb-4 tracking-wider"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              QUESTION
            </motion.div>
            <motion.p
              className="text-white text-xl md:text-2xl text-center leading-relaxed max-w-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {question.question.split(question.trapWord).map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="text-amber-500 font-bold">{question.trapWord}</span>
                  )}
                </span>
              ))}
            </motion.p>
          </motion.div>
        )

      case "options":
        return (
          <motion.div
            key="options"
            className="flex flex-col items-center justify-center h-full px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-zinc-500 text-sm font-semibold mb-6 tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              SELECT YOUR ANSWER
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
              {question.options.map((option, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -30, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: 0.3 + idx * 0.4, duration: 0.5, type: "spring" }}
                  className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl hover:border-amber-500/30 transition-colors"
                >
                  <span className="text-white text-sm md:text-base">{option}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )

      case "reveal":
        return (
          <motion.div
            key="reveal"
            className="flex flex-col items-center justify-center h-full px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-green-500 text-sm font-semibold mb-6 tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              CORRECT ANSWER
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
              {question.options.map((option, idx) => {
                const isCorrect = idx === question.correctIndex
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0.5 }}
                    animate={{
                      opacity: isCorrect ? 1 : 0.3,
                      scale: isCorrect ? 1.02 : 1,
                      boxShadow: isCorrect ? "0 0 30px rgba(34, 197, 94, 0.3)" : "none"
                    }}
                    transition={{ delay: isCorrect ? 0.5 : 0, duration: 0.6 }}
                    className={`p-4 rounded-xl transition-all ${
                      isCorrect
                        ? "bg-green-500/20 border-2 border-green-500"
                        : "bg-zinc-800/30 border border-zinc-700/30"
                    }`}
                  >
                    <span className={`text-sm md:text-base ${isCorrect ? "text-green-400 font-semibold" : "text-zinc-500"}`}>
                      {option}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )

      case "explanation":
        const correctLetter = ["A", "B", "C", "D"][question.correctIndex]
        return (
          <motion.div
            key="explanation"
            className="flex flex-col items-center justify-center h-full px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Correct Answer Banner */}
            <motion.div
              className="mb-6 px-6 py-3 bg-green-500/20 border border-green-500/40 rounded-full"
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <span className="text-green-400 font-bold text-lg">
                Correct Answer: {correctLetter}
              </span>
            </motion.div>

            <motion.div
              className="text-amber-500/70 text-sm font-semibold mb-4 tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              EXPLANATION
            </motion.div>
            
            <motion.div
              className="max-w-2xl text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <p className="text-zinc-300 text-base md:text-lg leading-relaxed">
                {question.explanation}
              </p>
            </motion.div>
          </motion.div>
        )

      case "trap":
        return (
          <motion.div
            key="trap"
            className="flex flex-col items-center justify-center h-full px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-red-500 text-sm font-semibold mb-6 tracking-wider flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-xl">🚨</span>
              TRAP DETECTOR
            </motion.div>

            <div className="max-w-2xl w-full space-y-4">
              {/* Trap Word */}
              <motion.div
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded">
                    {question.trapWord}
                  </span>
                  <span className="text-red-400 text-sm font-semibold">ABA Trap Word</span>
                </div>
              </motion.div>

              {/* Key Concepts */}
              <motion.div
                className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="text-blue-400 text-sm font-semibold mb-2">Common Meaning:</div>
                <p className="text-zinc-300 text-sm">{question.commonMeaning}</p>
              </motion.div>

              <motion.div
                className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div className="text-blue-400 text-sm font-semibold mb-2">ABA Meaning:</div>
                <p className="text-zinc-300 text-sm">{question.abaMeaning}</p>
              </motion.div>

              <motion.div
                className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
              >
                <div className="text-amber-400 text-sm font-semibold mb-2">How It Confuses:</div>
                <p className="text-zinc-300 text-sm">{question.howItConfuses}</p>
              </motion.div>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {/* Video Player Container */}
      <div className="relative w-full h-full bg-gradient-to-br from-zinc-900 via-[#0d0d14] to-zinc-900 rounded-2xl border border-zinc-800/50 overflow-hidden">
        {/* Scene Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {renderSceneContent()}
          </AnimatePresence>
        </div>

        {/* Bottom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
          {/* Progress Bar */}
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${sceneProgress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Scene Buttons */}
            <div className="flex gap-2">
              {scenes.map((scene, index) => (
                <button
                  key={scene.id}
                  onClick={() => goToScene(index)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    index === currentScene
                      ? "bg-amber-500 text-black"
                      : "bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                  }`}
                >
                  {index + 1}. {scene.title}
                </button>
              ))}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-3">
              {/* Speed Selector */}
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1.5 rounded-lg border border-zinc-700 focus:outline-none focus:border-amber-500"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
              </select>

              <button
                onClick={restartScenes}
                className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-amber-500 transition-all"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={prevScene}
                className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-amber-500 transition-all"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-lg shadow-amber-500/30"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <button
                onClick={nextScene}
                className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-amber-500 transition-all"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
