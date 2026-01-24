"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"

interface Scene {
  icon: string
  title: string
  subtitle: string
  color: string
  glowColor: string
  duration: number
  animation: string
}

interface VideoLearningPlayerProps {
  onComplete?: () => void
  autoPlay?: boolean
}

export function VideoLearningPlayer({ onComplete, autoPlay = true }: VideoLearningPlayerProps) {
  const [currentScene, setCurrentScene] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [sceneProgress, setSceneProgress] = useState(0)

  const scenes: Scene[] = [
    {
      icon: "?",
      title: "Question",
      subtitle: "Clinical scenario with 4 options",
      color: "from-amber-500/30 to-amber-900/10",
      glowColor: "rgba(245,158,11,0.4)",
      duration: 8000,
      animation: "typewriter"
    },
    {
      icon: "O",
      title: "Options",
      subtitle: "4 choices appear one by one",
      color: "from-zinc-700/50 to-zinc-800/30",
      glowColor: "rgba(245,158,11,0.3)",
      duration: 6000,
      animation: "stagger"
    },
    {
      icon: "V",
      title: "Reveal",
      subtitle: "Correct answer highlighted in green",
      color: "from-green-500/30 to-green-900/10",
      glowColor: "rgba(34,197,94,0.4)",
      duration: 4000,
      animation: "reveal"
    },
    {
      icon: "!",
      title: "Explanation",
      subtitle: "Why B is correct + key takeaway",
      color: "from-amber-500/20 to-amber-900/10",
      glowColor: "rgba(245,158,11,0.3)",
      duration: 10000,
      animation: "explanation"
    },
    {
      icon: "X",
      title: "Trap Detector",
      subtitle: "ABA keywords and common traps",
      color: "from-red-500/30 to-red-900/10",
      glowColor: "rgba(239,68,68,0.4)",
      duration: 10000,
      animation: "trapDetector"
    },
    {
      icon: "T",
      title: "Progress",
      subtitle: "Track your improvement",
      color: "from-amber-500/30 to-amber-900/10",
      glowColor: "rgba(245,158,11,0.4)",
      duration: 3000,
      animation: "scale"
    }
  ]

  // Auto-cycle scenes with variable duration
  useEffect(() => {
    if (!isPlaying) return
    const currentDuration = scenes[currentScene]?.duration || 3000
    const progressInterval = 50
    let elapsed = 0

    const interval = setInterval(() => {
      elapsed += progressInterval
      setSceneProgress((elapsed / currentDuration) * 100)

      if (elapsed >= currentDuration) {
        if (currentScene === scenes.length - 1) {
          // Last scene completed
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
  }, [isPlaying, currentScene, scenes.length, onComplete])

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

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev)
  }

  // Map icon strings to actual icons
  const getSceneIcon = (animation: string) => {
    switch (animation) {
      case "typewriter": return "?"
      case "stagger": return "O"
      case "reveal": return "V"
      case "explanation": return "!"
      case "trapDetector": return "X"
      case "scale": return "T"
      default: return "?"
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Scene Carousel */}
      <div className="relative w-full max-w-sm h-48 mb-20 overflow-visible">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {/* Icon with glow effect */}
            <motion.div
              className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${scenes[currentScene].color} flex items-center justify-center mb-4 shadow-2xl border border-amber-500/20`}
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{
                scale: 1,
                rotate: 0,
                boxShadow: `0 0 50px ${scenes[currentScene].glowColor}`
              }}
              transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.05, boxShadow: `0 0 60px ${scenes[currentScene].glowColor}` }}
            >
              <motion.span
                className="text-5xl"
                animate={scenes[currentScene].animation === "trapDetector" ? {
                  rotate: [0, -5, 5, -5, 5, 0],
                  transition: { duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 2 }
                } : {}}
              >
                {scenes[currentScene].animation === "typewriter" && "?"}
                {scenes[currentScene].animation === "stagger" && "O"}
                {scenes[currentScene].animation === "reveal" && "V"}
                {scenes[currentScene].animation === "explanation" && "!"}
                {scenes[currentScene].animation === "trapDetector" && "!"}
                {scenes[currentScene].animation === "scale" && "T"}
              </motion.span>
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-2xl font-bold text-white mb-2 tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {scenes[currentScene].title}
            </motion.h2>

            {/* Scene-specific content */}
            {scenes[currentScene].animation === "stagger" ? (
              <div className="flex gap-3 mt-3">
                {["A", "B", "C", "D"].map((letter, optIdx) => (
                  <motion.div
                    key={letter}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.5 + optIdx * 1.2, duration: 0.5, type: "spring" }}
                    className="w-11 h-11 rounded-xl bg-[#1a1a24] border border-zinc-700/50 flex items-center justify-center text-amber-500 font-bold text-sm shadow-lg"
                    whileHover={{ scale: 1.1, borderColor: "rgba(245,158,11,0.5)" }}
                  >
                    {letter}
                  </motion.div>
                ))}
              </div>
            ) : scenes[currentScene].animation === "reveal" ? (
              <div className="flex gap-2 mt-2">
                {["A", "B", "C", "D"].map((letter) => {
                  const isCorrect = letter === "B"
                  return (
                    <motion.div
                      key={letter}
                      initial={{ opacity: 0.5 }}
                      animate={{
                        opacity: 1,
                        scale: isCorrect ? [1, 1.15, 1.1] : 1,
                        boxShadow: isCorrect ? ["0 0 0px rgba(34,197,94,0)", "0 0 20px rgba(34,197,94,0.5)", "0 0 15px rgba(34,197,94,0.4)"] : "none"
                      }}
                      transition={{ delay: isCorrect ? 0.5 : 0, duration: 0.6 }}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm ${
                        isCorrect
                          ? "bg-green-500 border-2 border-green-400 text-white"
                          : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-500"
                      }`}
                    >
                      {isCorrect ? "V" : letter}
                    </motion.div>
                  )
                })}
              </div>
            ) : scenes[currentScene].animation === "explanation" ? (
              <div className="flex flex-col items-center mt-2 max-w-xs">
                <motion.div
                  className="text-sm text-zinc-300 text-center mb-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <span className="text-green-400 font-semibold">B is correct</span> because it directly addresses the function of the behavior.
                </motion.div>
                <motion.div
                  className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg"
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 2, duration: 0.6, type: "spring" }}
                >
                  <p className="text-xs text-amber-300 text-center">
                    <span className="font-semibold">Key takeaway:</span> Always identify the function before selecting an intervention.
                  </p>
                </motion.div>
              </div>
            ) : scenes[currentScene].animation === "trapDetector" ? (
              <div className="flex flex-col items-center mt-2 max-w-xs">
                {/* Keywords section */}
                <div className="flex gap-2 mb-3">
                  {["MOST", "BEST", "FIRST"].map((keyword, idx) => (
                    <motion.span
                      key={keyword}
                      initial={{ opacity: 0, x: -20, scale: 0.8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ delay: 0.3 + idx * 0.6, duration: 0.4, type: "spring" }}
                      className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded text-amber-400 text-xs font-bold"
                    >
                      {keyword}
                    </motion.span>
                  ))}
                </div>
                {/* Traps section */}
                <div className="space-y-2 w-full">
                  <motion.div
                    className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 3, duration: 0.5 }}
                  >
                    <p className="text-xs text-red-300 text-center">
                      Effectiveness vs Generality
                    </p>
                  </motion.div>
                  <motion.div
                    className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 5, duration: 0.5 }}
                  >
                    <p className="text-xs text-red-300 text-center">
                      Reinforcement vs Punishment
                    </p>
                  </motion.div>
                </div>
              </div>
            ) : (
              <motion.p
                className="text-zinc-400 text-sm max-w-xs text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {scenes[currentScene].subtitle}
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Scene controls */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          {/* Progress bar */}
          <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${sceneProgress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Scene indicators */}
          <div className="flex gap-2">
            {scenes.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentScene(index)
                  setSceneProgress(0)
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentScene ? "bg-amber-500 w-6" : "bg-zinc-700 hover:bg-zinc-600 w-2"
                }`}
              />
            ))}
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={restartScenes}
              className="w-8 h-8 rounded-full bg-[#1a1a24] border border-zinc-700/50 hover:border-amber-500/50 flex items-center justify-center text-zinc-400 hover:text-amber-500 transition-all"
              title="Restart"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={prevScene}
              className="w-8 h-8 rounded-full bg-[#1a1a24] border border-zinc-700/50 hover:border-amber-500/50 flex items-center justify-center text-zinc-400 hover:text-amber-500 transition-all"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-black transition-all shadow-lg shadow-amber-500/30"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={nextScene}
              className="w-8 h-8 rounded-full bg-[#1a1a24] border border-zinc-700/50 hover:border-amber-500/50 flex items-center justify-center text-zinc-400 hover:text-amber-500 transition-all"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="text-amber-500/70 text-xs ml-2 font-medium">
              {currentScene + 1}/{scenes.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
