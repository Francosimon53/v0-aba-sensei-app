"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, CheckCircle2, XCircle, AlertTriangle, Lightbulb } from "lucide-react"
import { useState, useEffect } from "react"
import type { ExamType, Mode, Language, Task } from "@/app/page"
import { createClient } from "@/lib/supabase/client"

interface QuestionScreenProps {
  examType: ExamType
  category: string
  mode: Mode
  onBack: () => void
  language: Language
  tasks: Task[]
  currentTaskIndex: number
  onNextTask: () => void
  loadingTasks: boolean
}

const translations = {
  English: {
    submit: "Submit Answer",
    next: "Next Question",
    correct: "Correct!",
    incorrect: "Incorrect",
    keyWordsTitle: "KEY WORDS IDENTIFIED",
    keyWords: "Key words:",
    howToUse: "How to use these clues:",
    strategy: "Test-taking strategy:",
    allOptions: "Analysis of all options:",
    loading: "Generating your question...",
    loadingTasks: "Loading tasks...",
    error: "Failed to generate question. Please try again.",
    retry: "Try Again",
    hint: "Quick Hint",
    hintText: "Think about the sequence of steps and what comes after modeling...",
    subTopic: "Task",
    progress: "Progress",
    noTasks: "No tasks found for this category.",
  },
  Español: {
    submit: "Enviar respuesta",
    next: "Siguiente pregunta",
    correct: "¡Correcto!",
    incorrect: "Incorrecto",
    keyWordsTitle: "PALABRAS CLAVE IDENTIFICADAS",
    keyWords: "Palabras clave:",
    howToUse: "Cómo usar estas pistas:",
    strategy: "Estrategia para el examen:",
    allOptions: "Análisis de todas las opciones:",
    loading: "Generando su pregunta...",
    loadingTasks: "Cargando tareas...",
    error: "Error al generar la pregunta. Por favor, intente de nuevo.",
    retry: "Intentar de nuevo",
    hint: "Pista rápida",
    hintText: "Piense en la secuencia de pasos y lo que viene después del modelado...",
    subTopic: "Tarea",
    progress: "Progreso",
    noTasks: "No se encontraron tareas para esta categoría.",
  },
  Português: {
    submit: "Enviar resposta",
    next: "Próxima questão",
    correct: "Correto!",
    incorrect: "Incorreto",
    keyWordsTitle: "PALAVRAS-CHAVE IDENTIFICADAS",
    keyWords: "Palavras-chave:",
    howToUse: "Como usar essas pistas:",
    strategy: "Estratégia para o exame:",
    allOptions: "Análise de todas as opções:",
    loading: "Gerando sua questão...",
    loadingTasks: "Carregando tarefas...",
    error: "Falha ao gerar questão. Por favor, tente novamente.",
    retry: "Tentar novamente",
    hint: "Dica rápida",
    hintText: "Pense na sequência de etapas e o que vem após a modelagem...",
    subTopic: "Tarefa",
    progress: "Progresso",
    noTasks: "Nenhuma tarefa encontrada para esta categoria.",
  },
  Français: {
    submit: "Soumettre la réponse",
    next: "Question suivante",
    correct: "Correct!",
    incorrect: "Incorrect",
    keyWordsTitle: "MOTS-CLÉS IDENTIFIÉS",
    keyWords: "Mots-clés:",
    howToUse: "Comment utiliser ces indices:",
    strategy: "Stratégie pour l'examen:",
    allOptions: "Analyse de toutes les options:",
    loading: "Génération de votre question...",
    loadingTasks: "Chargement des tâches...",
    error: "Échec de la génération de la question. Veuillez réessayer.",
    retry: "Réessayer",
    hint: "Indice rapide",
    hintText: "Pensez à la séquence d'étapes et ce qui vient après la modélisation...",
    subTopic: "Tâche",
    progress: "Progrès",
    noTasks: "Aucune tâche trouvée pour cette catégorie.",
  },
}

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

export function QuestionScreen({
  examType,
  category,
  mode,
  onBack,
  language,
  tasks,
  currentTaskIndex,
  onNextTask,
  loadingTasks,
}: QuestionScreenProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questionData, setQuestionData] = useState<QuestionData | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showAllOptions, setShowAllOptions] = useState(false)
  const [showDecisionFilter, setShowDecisionFilter] = useState(false)
  const t = translations[language]

  const currentTask = tasks[currentTaskIndex]

  useEffect(() => {
    if (currentTask && !loadingTasks) {
      loadQuestion()
    }
  }, [currentTaskIndex, currentTask, loadingTasks])

  const loadQuestion = async () => {
    if (!currentTask) return

    setLoading(true)
    setError(null)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setShowHint(false)
    setShowAllOptions(false)
    setShowDecisionFilter(false)

    try {
      const response = await fetch("/api/generate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examLevel: examType,
          category: category,
          language: language,
          taskId: currentTask.task_id,
          taskText: currentTask.task_text,
          keywords: currentTask.keywords,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate question")
      }

      const data = await response.json()
      setQuestionData(data)
    } catch (err) {
      console.error("Error loading question:", err)
      setError(err instanceof Error ? err.message : "Failed to load question")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (selectedAnswer !== null && questionData) {
      setShowFeedback(true)

      try {
        const supabase = createClient()
        await supabase.from("user_progress").insert([
          {
            category_id: category,
            last_practiced_at: new Date().toISOString(),
          },
        ])
      } catch (err) {
        console.error("Error saving progress:", err)
      }
    }
  }

  const handleNext = () => {
    onNextTask()
  }

  const highlightTrapWords = (text: string) => {
    if (!questionData?.keyWords || questionData.keyWords.length === 0) return text

    let highlightedText = text

    questionData.keyWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi")
      highlightedText = highlightedText.replace(regex, `<span class="text-yellow-400 font-semibold">${word}</span>`)
    })

    return highlightedText
  }

  if (loadingTasks) {
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <div className="flex items-center justify-between px-6 py-5 bg-black/20 backdrop-blur-xl border-b border-white/5">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-yellow-400/20 border-t-yellow-400 animate-spin" />
            </div>
            <p className="text-lg text-gray-300 font-medium">{t.loadingTasks}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentTask && tasks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <div className="flex items-center justify-between px-6 py-5 bg-black/20 backdrop-blur-xl border-b border-white/5">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-6">
            <XCircle className="h-16 w-16 text-yellow-400" />
            <p className="text-lg text-gray-200 text-center max-w-md">{t.noTasks}</p>
            <Button
              onClick={onBack}
              className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 h-12 rounded-xl"
            >
              {language === "English" && "Choose Another Category"}
              {language === "Español" && "Elegir otra categoría"}
              {language === "Português" && "Escolher outra categoria"}
              {language === "Français" && "Choisir une autre catégorie"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <div className="flex items-center justify-between px-6 py-5 bg-black/20 backdrop-blur-xl border-b border-white/5">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="text-sm">
            <span className="text-yellow-400 font-semibold">{examType}</span>
            <span className="text-gray-600 mx-2">•</span>
            <span className="text-gray-400">{category}</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-yellow-400/20 border-t-yellow-400 animate-spin" />
              <div className="absolute inset-0 w-20 h-20 rounded-full bg-yellow-400/10 blur-xl" />
            </div>
            <p className="text-lg text-gray-300 font-medium">{t.loading}</p>
            {currentTask && (
              <p className="text-sm text-gray-500 text-center max-w-xs">
                {currentTask.task_id}: {currentTask.task_text}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (error || !questionData) {
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <div className="flex items-center justify-between px-6 py-5 bg-black/20 backdrop-blur-xl border-b border-white/5">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="text-sm">
            <span className="text-yellow-400 font-semibold">{examType}</span>
            <span className="text-gray-600 mx-2">•</span>
            <span className="text-gray-400">{category}</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-6">
            <XCircle className="h-16 w-16 text-red-400" />
            <p className="text-lg text-gray-200 text-center max-w-md">{error || t.error}</p>
            <Button
              onClick={loadQuestion}
              className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 h-12 rounded-xl transition-all duration-300"
            >
              {t.retry}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isCorrect = selectedAnswer === questionData.correctIndex

  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <div className="flex items-center justify-between px-6 py-5 bg-black/20 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white transition-colors duration-300"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
        </Button>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {tasks.slice(0, 10).map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx < currentTaskIndex ? "bg-green-400" : idx === currentTaskIndex ? "bg-yellow-400" : "bg-gray-600"
              }`}
            />
          ))}
          {tasks.length > 10 && <span className="text-xs text-gray-500 ml-1">+{tasks.length - 10}</span>}
        </div>

        <div className="text-xs font-medium">
          <span className="text-yellow-400">{examType}</span>
          <span className="text-gray-600 mx-1.5">•</span>
          <span className="text-gray-400">{category}</span>
        </div>
      </div>

      {currentTask && (
        <div className="px-6 py-3 bg-yellow-400/10 border-b border-yellow-400/20">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <p className="text-sm text-yellow-400 font-medium">
              <span className="font-bold">{currentTask.task_id}:</span> {currentTask.task_text}
            </p>
            <span className="text-xs text-gray-500">
              {currentTaskIndex + 1}/{tasks.length}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col p-6 pb-32 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {currentTask?.task_id || `${t.subTopic} ${currentTaskIndex + 1}`}
              </span>
              <span className="text-2xl">🥋</span>
            </div>

            <div
              className="text-base leading-relaxed text-gray-100"
              dangerouslySetInnerHTML={{ __html: highlightTrapWords(questionData.question) }}
            />

            {!showFeedback && questionData.hint && (
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-400 italic leading-relaxed">{questionData.hint}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {questionData.options.map((option, index) => {
              const letter = ["A", "B", "C", "D"][index]
              const isSelected = selectedAnswer === index
              const showCorrect = showFeedback && index === questionData.correctIndex
              const showIncorrect = showFeedback && isSelected && !isCorrect

              return (
                <button
                  key={index}
                  onClick={() => !showFeedback && setSelectedAnswer(index)}
                  disabled={showFeedback}
                  className={`w-full glass-card rounded-xl p-4 transition-all duration-300 ${
                    showCorrect
                      ? "border-green-400/50 bg-green-400/10"
                      : showIncorrect
                        ? "border-red-400/50 bg-red-400/10"
                        : isSelected
                          ? "border-yellow-400 gold-glow bg-yellow-400/5"
                          : "hover:border-white/20 hover:bg-white/5"
                  } ${!showFeedback ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 transition-all duration-300 ${
                        showCorrect
                          ? "bg-green-400 text-black"
                          : showIncorrect
                            ? "bg-red-400 text-black"
                            : isSelected
                              ? "bg-yellow-400 text-black"
                              : "bg-white/10 text-gray-400"
                      }`}
                    >
                      {letter}
                    </div>
                    <p className="text-left text-sm leading-relaxed text-gray-200 pt-0.5">{option}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {showFeedback && mode === "tutor" && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  {isCorrect ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-green-400/20 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xl font-semibold text-green-400">
                          {language === "English" &&
                            `Correct! ${questionData.options[questionData.correctIndex].substring(0, 1)} is right! 🎉`}
                          {language === "Español" &&
                            `¡Respuesta ${questionData.options[questionData.correctIndex].substring(0, 1)} Correcta! 🎉`}
                          {language === "Português" &&
                            `Resposta ${questionData.options[questionData.correctIndex].substring(0, 1)} Correta! 🎉`}
                          {language === "Français" &&
                            `Réponse ${questionData.options[questionData.correctIndex].substring(0, 1)} Correcte! 🎉`}
                        </p>
                        <p className="text-sm text-gray-300 mt-1">
                          {language === "English" && "You nailed it."}
                          {language === "Español" && "Le diste al clavo."}
                          {language === "Português" && "Você acertou em cheio."}
                          {language === "Français" && "Vous avez réussi."}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-gray-200">
                          {language === "English" &&
                            `Not quite. The correct answer is ${questionData.options[questionData.correctIndex].substring(0, 1)}.`}
                          {language === "Español" &&
                            `No es exacto. La respuesta correcta es ${questionData.options[questionData.correctIndex].substring(0, 1)}.`}
                          {language === "Português" &&
                            `Não exatamente. A resposta correta é ${questionData.options[questionData.correctIndex].substring(0, 1)}.`}
                          {language === "Français" &&
                            `Pas tout à fait. La bonne réponse est ${questionData.options[questionData.correctIndex].substring(0, 1)}.`}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {language === "English" && "Let's learn the difference."}
                          {language === "Español" && "Aprendamos la diferencia."}
                          {language === "Português" && "Vamos aprender a diferença."}
                          {language === "Français" && "Apprenons la différence."}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Trap Detector - only show for incorrect answers */}
              {!isCorrect && (
                <div className="glass-card rounded-2xl p-6 bg-yellow-400/10 border-yellow-400/30 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚨</span>
                    <h3 className="font-bold text-yellow-400 text-lg">
                      {language === "English" && "TRAP DETECTOR"}
                      {language === "Español" && "DETECTOR DE TRAMPAS"}
                      {language === "Português" && "DETECTOR DE ARMADILHAS"}
                      {language === "Français" && "DÉTECTEUR DE PIÈGES"}
                    </h3>
                  </div>

                  {questionData.trapDetector ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-black/40 border border-yellow-400/20">
                        <p className="text-sm font-semibold text-yellow-400 mb-2">
                          {language === "English" && `Trap word: "${questionData.trapDetector.trapWord}"`}
                          {language === "Español" && `Palabra trampa: "${questionData.trapDetector.trapWord}"`}
                          {language === "Português" && `Palavra armadilha: "${questionData.trapDetector.trapWord}"`}
                          {language === "Français" && `Mot piège: "${questionData.trapDetector.trapWord}"`}
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="text-red-400 font-semibold flex-shrink-0">
                              {language === "English" && "Common meaning:"}
                              {language === "Español" && "Significado común:"}
                              {language === "Português" && "Significado comum:"}
                              {language === "Français" && "Signification courante:"}
                            </span>
                            <span className="text-gray-300">{questionData.trapDetector.commonMeaning}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-green-400 font-semibold flex-shrink-0">
                              {language === "English" && "ABA meaning:"}
                              {language === "Español" && "Significado ABA:"}
                              {language === "Português" && "Significado ABA:"}
                              {language === "Français" && "Signification ABA:"}
                            </span>
                            <span className="text-gray-300">{questionData.trapDetector.abaMeaning}</span>
                          </div>
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-gray-400 italic">{questionData.trapDetector.howItConfuses}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-black/40 border border-yellow-400/20">
                      <p className="text-sm text-gray-300">
                        {language === "English" &&
                          "No specific ABA trap words detected. Review the Decision Filter below to understand the key distinctions between similar concepts."}
                        {language === "Español" &&
                          "No se detectaron palabras trampa ABA específicas. Revisa el Filtro de Decisión abajo para entender las distinciones clave entre conceptos similares."}
                        {language === "Português" &&
                          "Nenhuma palavra armadilha ABA específica detectada. Revise o Filtro de Decisão abaixo para entender as distinções-chave entre conceitos semelhantes."}
                        {language === "Français" &&
                          "Aucun mot piège ABA spécifique détecté. Consultez le Filtre de Décision ci-dessous pour comprendre les distinctions clés entre concepts similaires."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Decision Filter */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowDecisionFilter(!showDecisionFilter)}
                  className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <h3 className="font-bold text-white text-lg">
                      {language === "English" && "Decision Filter"}
                      {language === "Español" && "Filtro de Decisión"}
                      {language === "Português" && "Filtro de Decisão"}
                      {language === "Français" && "Filtre de Décision"}
                    </h3>
                  </div>
                  <ChevronLeft
                    className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${showDecisionFilter ? "-rotate-90" : "rotate-180"}`}
                  />
                </button>

                {showDecisionFilter && (
                  <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-3">
                      {questionData.decisionFilter.concepts.map((concept, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <h4 className="font-semibold text-yellow-400 mb-2">{concept.name}</h4>
                          <p className="text-sm text-gray-300 mb-2">{concept.definition}</p>
                          {concept.analogy && (
                            <p className="text-sm text-gray-400 italic">
                              <span className="text-yellow-400">💡</span> {concept.analogy}
                            </p>
                          )}
                          {concept.rule && (
                            <p className="text-sm text-green-400 mt-2">
                              <span className="font-semibold">Rule:</span> {concept.rule}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
                      <p className="text-sm font-medium text-yellow-400">
                        {language === "English" && "Ask yourself:"}
                        {language === "Español" && "Pregúntate:"}
                        {language === "Português" && "Pergunte-se:"}
                        {language === "Français" && "Demandez-vous:"}
                      </p>
                      <p className="text-sm text-gray-200 mt-1">{questionData.decisionFilter.testQuestion}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* All Options Analysis */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowAllOptions(!showAllOptions)}
                  className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <h3 className="font-bold text-white text-lg">{t.allOptions}</h3>
                  <ChevronLeft
                    className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${showAllOptions ? "-rotate-90" : "rotate-180"}`}
                  />
                </button>

                {showAllOptions && (
                  <div className="px-6 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-300">
                    {(["A", "B", "C", "D"] as const).map((letter, idx) => (
                      <div
                        key={letter}
                        className={`p-4 rounded-xl border ${
                          idx === questionData.correctIndex
                            ? "bg-green-400/10 border-green-400/30"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`font-bold ${idx === questionData.correctIndex ? "text-green-400" : "text-gray-400"}`}
                          >
                            {letter})
                          </span>
                          <p className="text-sm text-gray-300">{questionData.optionExplanations[letter]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conclusion */}
              <div className="glass-card rounded-2xl p-6">
                <p className="text-sm text-gray-300 leading-relaxed">
                  <span className="text-yellow-400 font-semibold">
                    {language === "English" && "Remember: "}
                    {language === "Español" && "Recuerda: "}
                    {language === "Português" && "Lembre-se: "}
                    {language === "Français" && "Rappelez-vous: "}
                  </span>
                  {questionData.conclusion}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent">
        <div className="max-w-3xl mx-auto">
          {!showFeedback ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              className="w-full h-14 rounded-xl text-lg font-semibold transition-all duration-300 bg-yellow-400 hover:bg-yellow-500 text-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.submit}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="w-full h-14 rounded-xl text-lg font-semibold transition-all duration-300 bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              {t.next}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
