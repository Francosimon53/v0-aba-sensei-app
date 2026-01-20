"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, CheckCircle2, XCircle, AlertTriangle, Lightbulb, BookOpen } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import type { ExamType, Mode, Language, Task } from "@/types"
import { createClient } from "@/lib/supabase/client"

// These type definitions were already present in "@/app/page" and are being redeclared here.
// It's best to remove these redeclarations to avoid linting errors and maintain a single source of truth.
// export type Language = "English" | "Español" | "Português" | "Français"
// export type ExamType = "RBT" | "BCBA"
// export type Mode = "tutor" | "exam"

// export interface Task {
//   id: string
//   task_id: string
//   task_text: string
//   domain: string
//   exam_level: string
//   keywords: string | null
// }

// BCBA 6th Edition Task List (2025) domain names
const BCBA_DOMAIN_NAMES: Record<string, string> = {
  A: "Behaviorism and Philosophical Foundations",
  B: "Concepts and Principles",
  C: "Measurement, Data Display, and Interpretation",
  D: "Experimental Design",
  E: "Ethical and Professional Issues",
  F: "Behavior Assessment",
  G: "Behavior-Change Procedures",
  H: "Selecting and Implementing Interventions",
  I: "Personnel Supervision and Management",
}

// RBT 3rd Edition Task List (2026) domain names
const RBT_DOMAIN_NAMES: Record<string, string> = {
  A: "Data Collection and Graphing",
  B: "Behavior Assessment",
  C: "Behavior Acquisition",
  D: "Behavior Reduction",
  E: "Documentation and Reporting",
  F: "Ethics",
}

// Combined mapping (defaults to BCBA for backward compatibility)
const DOMAIN_NAMES: Record<string, string> = {
  ...BCBA_DOMAIN_NAMES,
}

// Helper function to get domain letter from task_id (e.g., "C.10" -> "C")
function getDomainLetter(taskId: string): string {
  return taskId.split(".")[0].toUpperCase()
}

// Helper function to get full domain name
function getDomainName(taskId: string): string {
  const letter = getDomainLetter(taskId)
  return DOMAIN_NAMES[letter] || letter
}

function extractShortTitle(taskText: string): string {
  // The task_text may contain multiple sections with headers
  // Extract just the first meaningful line (usually "TÍTULO:" or first sentence)
  const lines = taskText.split("\n").filter((line) => line.trim())

  // Look for a title marker first
  const titleLine = lines.find(
    (line) =>
      line.startsWith("TÍTULO:") ||
      line.startsWith("TITLE:") ||
      line.startsWith("DEFINICIÓN CORTA:") ||
      line.startsWith("SHORT DEFINITION:"),
  )

  if (titleLine) {
    // Extract text after the colon
    const colonIndex = titleLine.indexOf(":")
    if (colonIndex !== -1) {
      return titleLine.substring(colonIndex + 1).trim()
    }
  }

  // If no title marker, use the first line but limit length
  const firstLine = lines[0] || ""
  // Truncate to first sentence or max 100 chars
  const endOfSentence = firstLine.search(/[.!?]/)
  if (endOfSentence !== -1 && endOfSentence < 100) {
    return firstLine.substring(0, endOfSentence + 1).trim()
  }

  // If task_text is very long, just use the task_id description
  if (firstLine.length > 100) {
    return firstLine.substring(0, 100).trim() + "..."
  }

  return firstLine.trim()
}

const translations: Record<Language, any> = {
  English: {
    loadingTasks: "Loading tasks...",
    noTasks: "No tasks available for this category. Please choose another one.",
    loading: "Loading Question...",
    error: "An error occurred while loading the question.",
    retry: "Retry",
    submit: "Submit",
    next: "Next",
    allOptions: "All Options",
    subTopic: "Subtopic",
  },
  Español: {
    loadingTasks: "Cargando tareas...",
    noTasks: "No hay tareas disponibles para esta categoría. Por favor, elige otra.",
    loading: "Cargando Pregunta...",
    error: "Ocurrió un error al cargar la pregunta.",
    retry: "Reintentar",
    submit: "Enviar",
    next: "Siguiente",
    allOptions: "Todas las Opciones",
    subTopic: "Subtema",
  },
  Português: {
    loadingTasks: "Carregando tarefas...",
    noTasks: "Nenhuma tarefa disponível para esta categoria. Por favor, escolha outra.",
    loading: "Carregando Pergunta...",
    error: "Ocorreu um erro ao carregar a pergunta.",
    retry: "Tentar Novamente",
    submit: "Enviar",
    next: "Próximo",
    allOptions: "Todas as Opções",
    subTopic: "Subtópico",
  },
  Français: {
    loadingTasks: "Chargement des tâches...",
    noTasks: "Aucune tâche disponible pour cette catégorie. Veuillez en choisir une autre.",
    loading: "Chargement de la question...",
    error: "Une erreur est survenue lors du chargement de la question.",
    retry: "Réessayer",
    submit: "Soumettre",
    next: "Suivant",
    allOptions: "Toutes les Options",
    subTopic: "Sous-thème",
  },
}

const CONTRAST_PIVOTS = {
  words: [
    "HOWEVER",
    "ALTHOUGH",
    "BUT",
    "DESPITE",
    "NEVERTHELESS",
    "YET",
    "WHILE",
    "WHEREAS",
    "EVEN THOUGH",
    "IN CONTRAST",
  ],
  translations: {
    English: {
      label: "Contrast Pivot",
      meaning: "Two things are being compared. One is being emphasized over the other.",
      strategy: "Focus on what comes AFTER the contrast word - that's the KEY information, not what came before.",
    },
    Español: {
      label: "Pivote de Contraste",
      meaning: "Se están comparando dos cosas. Una se enfatiza sobre la otra.",
      strategy: "Enfócate en lo que viene DESPUÉS de la palabra de contraste - esa es la información CLAVE, no lo anterior.",
    },
    Português: {
      label: "Pivô de Contraste",
      meaning: "Duas coisas estão sendo comparadas. Uma é enfatizada sobre a outra.",
      strategy: "Foque no que vem DEPOIS da palavra de contraste - essa é a informação CHAVE, não o que veio antes.",
    },
    Français: {
      label: "Pivot de Contraste",
      meaning: "Deux choses sont comparées. L'une est mise en avant par rapport à l'autre.",
      strategy: "Concentrez-vous sur ce qui vient APRÈS le mot de contraste - c'est l'information CLÉE, pas ce qui précède.",
    },
  },
}

const TIME_PIVOTS = {
  words: [
    "INITIALLY",
    "SUBSEQUENTLY",
    "PRIOR TO",
    "BEFORE",
    "AFTER",
    "FOLLOWING",
    "DURING",
    "EVENTUALLY",
    "PREVIOUSLY",
    "LATER",
  ],
  words_with_strategies: {
    INITIALLY: {
      meaning: {
        English: "Beginning phase. Think baseline data, first assessment, or starting point.",
        Español: "Fase inicial. Piensa en datos de línea base, primera evaluación o punto de partida.",
        Português: "Fase inicial. Pense em dados de linha de base, primeira avaliação ou ponto de partida.",
        Français: "Phase initiale. Pensez aux données de base, à la première évaluation ou au point de départ.",
      },
      strategy: {
        English: "What happens at the START before intervention begins?",
        Español: "¿Qué sucede al INICIO antes de que comience la intervención?",
        Português: "O que acontece no INÍCIO antes da intervenção começar?",
        Français: "Que se passe-t-il au DÉBUT avant le début de l'intervention?",
      },
    },
    DURING: {
      meaning: {
        English: "Ongoing implementation. Focus on what's happening IN THE MOMENT.",
        Español: "Implementación en curso. Enfócate en lo que está sucediendo EN ESTE MOMENTO.",
        Português: "Implementação em andamento. Concentre-se no que está acontecendo NESTE MOMENTO.",
        Français: "Mise en œuvre en cours. Concentrez-vous sur ce qui se passe EN CE MOMENT.",
      },
      strategy: {
        English: "What occurs WHILE the intervention is being applied?",
        Español: "¿Qué ocurre MIENTRAS se aplica la intervención?",
        Português: "O que ocorre ENQUANTO a intervenção está sendo aplicada?",
        Français: "Que se passe-t-il PENDANT que l'intervention est appliquée?",
      },
    },
    FOLLOWING: {
      meaning: {
        English: "After the event. Focus on consequences, outcomes, or results.",
        Español: "Después del evento. Enfócate en consecuencias, resultados o efectos.",
        Português: "Após o evento. Concentre-se em consequências, resultados ou efeitos.",
        Français: "Après l'événement. Concentrez-vous sur les conséquences, les résultats ou les effets.",
      },
      strategy: {
        English: "What happens AFTER? Think post-behavior consequences.",
        Español: "¿Qué sucede DESPUÉS? Piensa en consecuencias post-conducta.",
        Português: "O que acontece DEPOIS? Pense em consequências pós-comportamento.",
        Français: "Que se passe-t-il APRÈS? Pensez aux conséquences post-comportement.",
      },
    },
    SUBSEQUENTLY: {
      meaning: {
        English: "As a direct result. The next step in the causal chain.",
        Español: "Como resultado directo. El siguiente paso en la cadena causal.",
        Português: "Como resultado direto. O próximo passo na cadeia causal.",
        Français: "En tant que résultat direct. L'étape suivante de la chaîne causale.",
      },
      strategy: {
        English: "What's the OUTCOME or EFFECT of what just happened?",
        Español: "¿Cuál es el RESULTADO o EFECTO de lo que acaba de suceder?",
        Português: "Qual é o RESULTADO ou EFEITO do que acabou de acontecer?",
        Français: "Quel est le RÉSULTAT ou l'EFFET de ce qui vient de se passer?",
      },
    },
    BEFORE: {
      meaning: {
        English: "Antecedent conditions. What sets the stage for behavior.",
        Español: "Condiciones antecedentes. Qué establece el escenario para el comportamiento.",
        Português: "Condições antecedentes. O que estabelece o palco para o comportamento.",
        Français: "Conditions antécédentes. Ce qui établit le contexte du comportement.",
      },
      strategy: {
        English: "What environmental factors PRECEDE the behavior?",
        Español: "¿Qué factores ambientales PRECEDEN el comportamiento?",
        Português: "Quais fatores ambientais PRECEDEM o comportamento?",
        Français: "Quels facteurs environnementaux PRÉCÈDENT le comportement?",
      },
    },
    AFTER: {
      meaning: {
        English: "Consequence phase. What follows the behavior.",
        Español: "Fase de consecuencia. Qué sigue al comportamiento.",
        Português: "Fase de consequência. O que segue o comportamento.",
        Français: "Phase de conséquence. Ce qui suit le comportement.",
      },
      strategy: {
        English: "Focus on what happens as a RESULT of the behavior.",
        Español: "Enfócate en lo que sucede como RESULTADO del comportamiento.",
        Português: "Concentre-se no que acontece como RESULTADO do comportamento.",
        Français: "Concentrez-vous sur ce qui se passe en tant que RÉSULTAT du comportement.",
      },
    },
  },
  translations: {
    English: {
      label: "Time Pivot",
      meaning: "Identify WHEN the action occurs in the sequence.",
      strategy: "Determine if this is setup (before), concurrent (during), or consequence (after).",
    },
    Español: {
      label: "Pivote Temporal",
      meaning: "Identifica CUÁNDO ocurre la acción en la secuencia.",
      strategy: "Determina si es configuración (antes), concurrente (durante), o consecuencia (después).",
    },
    Português: {
      label: "Pivô Temporal",
      meaning: "Identifique QUANDO a ação ocorre na sequência.",
      strategy: "Determine se é configuração (antes), concorrente (durante), ou consequência (depois).",
    },
    Français: {
      label: "Pivot Temporel",
      meaning: "Identifiez QUAND l'action se produit dans la séquence.",
      strategy: "Déterminez s'il s'agit d'une configuration (avant), concurrente (pendant), ou d'une conséquence (après).",
    },
  },
}

const NON_TECHNICAL_TRAP_WORDS: Record<string, { [key in Language]: { meaning: string; context: string } }> = {
  feasible: {
    English: { meaning: "Possible/Practical", context: "Intervention selection questions" },
    Español: { meaning: "Posible/Práctico", context: "Preguntas de selección de intervención" },
    Português: { meaning: "Possível/Prático", context: "Questões de seleção de intervenção" },
    Français: { meaning: "Possible/Pratique", context: "Questions de sélection d'intervention" },
  },
  ambiguous: {
    English: { meaning: "Unclear/Vague", context: "Operational definition questions" },
    Español: { meaning: "Poco claro/Vago", context: "Preguntas de definición operacional" },
    Português: { meaning: "Incerto/Vago", context: "Questões de definição operacional" },
    Français: { meaning: "Flou/Vague", context: "Questions de définition opérationnelle" },
  },
  omit: {
    English: { meaning: "Leave out/Skip", context: "Changes instruction meaning" },
    Español: { meaning: "Omitir/Saltar", context: "Cambia el significado de la instrucción" },
    Português: { meaning: "Omitir/Pular", context: "Muda o significado da instrução" },
    Français: { meaning: "Omettre/Sauter", context: "Change le sens de l'instruction" },
  },
  discrepancy: {
    English: { meaning: "Difference/Mismatch", context: "IOA and data questions" },
    Español: { meaning: "Diferencia/Discrepancia", context: "Preguntas de IOA y datos" },
    Português: { meaning: "Diferença/Discrepância", context: "Questões de IOA e dados" },
    Français: { meaning: "Différence/Écart", context: "Questions IOA et données" },
  },
  predominantly: {
    English: { meaning: "Mostly/Mainly", context: "Function identification" },
    Español: { meaning: "Principalmente/Mayormente", context: "Identificación de función" },
    Português: { meaning: "Predominantemente/Principalmente", context: "Identificação de função" },
    Français: { meaning: "Principalement/Surtout", context: "Identification de fonction" },
  },
  intermittently: {
    English: { meaning: "Sometimes/On and off", context: "Schedule questions" },
    Español: { meaning: "A veces/Intermitentemente", context: "Preguntas de esquemas" },
    Português: { meaning: "Às vezes/Intermitentemente", context: "Questões de esquemas" },
    Français: { meaning: "Parfois/Par intermittence", context: "Questions de calendrier" },
  },
  cease: {
    English: { meaning: "Stop", context: "Extinction questions" },
    Español: { meaning: "Cesar/Parar", context: "Preguntas de extinction" },
    Português: { meaning: "Cessar/Parar", context: "Questões de extinction" },
    Français: { meaning: "Cesser/Arrêter", context: "Questions d'extinction" },
  },
  subsequent: {
    English: { meaning: "After/Following", context: "Consequence identification" },
    Español: { meaning: "Posterior/Siguiente", context: "Identificación de consequence" },
    Português: { meaning: "Subsequente/Seguinte", context: "Identificação de consequence" },
    Français: { meaning: "Subséquent/Suivant", context: "Identification de conséquence" },
  },
  prerequisite: {
    English: { meaning: "Required before", context: "Skill assessment" },
    Español: { meaning: "Requisito previo", context: "Evaluación de habilidades" },
    Português: { meaning: "Pré-requisito", context: "Avaliação de habilidades" },
    Français: { meaning: "Prérequis", context: "Évaluation des compétences" },
  },
  salient: {
    English: { meaning: "Important/Noticeable", context: "Stimulus discrimination" },
    Español: { meaning: "Importante/Notable", context: "Discriminación de estímulos" },
    Português: { meaning: "Importante/Notável", context: "Discriminação de estímulos" },
    Français: { meaning: "Important/Notable", context: "Discrimination de stimulus" },
  },
  concurrent: {
    English: { meaning: "At the same time", context: "Schedule questions" },
    Español: { meaning: "Al mismo tiempo", context: "Preguntas de esquemas" },
    Português: { meaning: "Ao mesmo tempo", context: "Questões de esquemas" },
    Français: { meaning: "En même temps", context: "Questions de calendrier" },
  },
  arbitrary: {
    English: { meaning: "Random/No reason", context: "Stimulus control" },
    Español: { meaning: "Arbitrario/Sin razón", context: "Control de estímulos" },
    Português: { meaning: "Arbitrário/Sem razão", context: "Controle de estímulos" },
    Français: { meaning: "Arbitraire/Sans raison", context: "Contrôle de stimulus" },
  },
}

const PIVOT_WORDS = {
  sequence: {
    words: ["FIRST", "NEXT", "BEFORE", "AFTER", "THEN"],
    category: "Sequence/Priority",
    meaning: {
      English: "This question asks about ORDER or PRIORITY. What to do IMMEDIATELY, not eventually.",
      Español: "Esta pregunta pregunta sobre ORDEN o PRIORIDAD. Qué hacer INMEDIATAMENTE, no eventualmente.",
      Português: "Esta questão pergunta sobre ORDEM ou PRIORIDADE. O que fazer IMEDIATAMENTE, não eventualmente.",
      Français: "Cette question porte sur l'ORDRE ou la PRIORITÉ. Que faire IMMÉDIATEMENT, pas éventuellement.",
    },
    strategy: {
      English: "Think about the logical sequence. What must happen BEFORE anything else?",
      Español: "Piensa en la secuencia lógica. ¿Qué debe suceder ANTES que cualquier otra cosa?",
      Português: "Pense na sequência lógica. O que deve acontecer ANTES de qualquer outra coisa?",
      Français: "Pensez à la séquence logique. Que doit-il se passer AVANT toute autre chose?",
    },
  },
  comparison: {
    words: ["BEST", "PRIMARY", "PRIMARILY"],
    category: "Comparison",
    meaning: {
      English: "Multiple options may be CORRECT, but one is BETTER than others.",
      Español: "Múltiples opciones pueden ser CORRECTAS, pero una es MEJOR que las otras.",
      Português: "Múltiplas opções podem ser CORRETAS, mas uma é MELHOR que as outras.",
      Français: "Plusieurs options peuvent être CORRECTES, mais une est MEILLEURE que les autres.",
    },
    strategy: {
      English: "Compare ALL options. Don't stop at the first 'good' answer - find the SUPERIOR one.",
      Español: "Compara TODAS las opciones. No te detengas en la primera respuesta 'buena' - encuentra la SUPERIOR.",
      Português: "Compare TODAS as opções. Não pare na primeira resposta 'boa' - encontre a SUPERIOR.",
      Français:
        "Comparez TOUTES les options. Ne vous arrêtez pas à la première 'bonne' réponse - trouvez la SUPÉRIEURE.",
    },
  },
  most: {
    words: ["MOST", "LIKELY"],
    category: "Probability/Frequency",
    meaning: {
      English: "Look for the BEST answer, not just a correct one. Often implies statistical likelihood or frequency.",
      Español: "Busca la respuesta MEJOR, no solo una correcta. A menudo implica probabilidad o frecuencia estadística.",
      Português: "Procure a resposta MELHOR, não apenas uma correta. Muitas vezes implica probabilidade ou frequência.",
      Français: "Cherchez la meilleure réponse, pas seulement une correcte. Implique souvent une probabilité ou une fréquence.",
    },
    strategy: {
      English: "Think about what happens MOST of the time in real practice. Eliminate less common outcomes.",
      Español: "Piensa en lo que sucede LA MAYORÍA del tiempo en la práctica real. Elimina resultados menos comunes.",
      Português: "Pense no que acontece NA MAIORIA das vezes na prática real. Elimine resultados menos comuns.",
      Français: "Pensez à ce qui se passe LA PLUPART du temps dans la pratique réelle. Éliminez les résultats moins courants.",
    },
  },
  appropriate: {
    words: ["APPROPRIATE"],
    category: "Context/Suitability",
    meaning: {
      English: "Context matters. Consider the specific situation described - what fits THIS scenario best?",
      Español: "El contexto importa. Considera la situación específica descrita - ¿qué se ajusta mejor a ESTE escenario?",
      Português: "O contexto importa. Considere a situação específica descrita - o que se encaixa melhor NESTE cenário?",
      Français: "Le contexte compte. Considérez la situation spécifique décrite - ce qui convient le mieux À CE scénario?",
    },
    strategy: {
      English: "Re-read the specific details. What makes sense for THIS client, setting, or situation? Not what's always right.",
      Español: "Vuelve a leer los detalles específicos. ¿Qué tiene sentido para ESTE cliente, entorno o situación? No lo que siempre es correcto.",
      Português: "Releia os detalhes específicos. O que faz sentido para ESTE cliente, ambiente ou situação? Não o que é sempre correto.",
      Français: "Relisez les détails spécifiques. Qu'est-ce qui a du sens pour CE client, CE cadre ou CETTE situation? Pas ce qui est toujours juste.",
    },
  },
  absolute: {
    words: ["ALWAYS", "NEVER", "ONLY", "ALL", "NONE", "SOLELY", "REGARDLESS", "EVERY"],
    category: "Absolute",
    meaning: {
      English: "Absolute statements are usually WRONG in ABA. Behavior depends on context.",
      Español: "Las declaraciones absolutas suelen ser INCORRECTAS en ABA. La conducta depende del contexto.",
      Português: "Declarações absolutas geralmente são ERRADAS em ABA. O comportamento depende do contexto.",
      Français: "Les déclarations absolues sont généralement FAUSSES en ABA. Le comportement dépend du contexte.",
    },
    strategy: {
      English: "Be skeptical of answer options containing ALWAYS, NEVER, ONLY. They're usually incorrect.",
      Español: "Desconfía de las opciones que contienen SIEMPRE, NUNCA, SOLO. Suelen ser incorrectas.",
      Português: "Desconfie das opções que contêm SEMPRE, NUNCA, APENAS. Geralmente estão incorretas.",
      Français: "Méfiez-vous des options contenant TOUJOURS, JAMAIS, SEULEMENT. Elles sont généralement incorrectes.",
    },
  },
  negation: {
    words: ["EXCEPT", "NOT", "LEAST", "EXCLUDING", "WITHOUT"],
    category: "Negation",
    meaning: {
      English: "REVERSE your thinking! You're looking for the WRONG answer or the EXCEPTION.",
      Español: "¡INVIERTE tu pensamiento! Buscas la respuesta INCORRECTA o la EXCEPCIÓN.",
      Português: "INVERTA seu pensamiento! Você está procurando a resposta ERRADA ou a EXCEÇÃO.",
      Français: "INVERSEZ votre réflexion! Vous cherchez la MAUVAISE réponse ou l'EXCEPTION.",
    },
    strategy: {
      English: "Find the 3 correct answers and eliminate them. The remaining option is your answer.",
      Español: "Encuentra las 3 respuestas correctas y elimínalas. La opción restante es tu respuesta.",
      Português: "Encontre as 3 respostas corretas e elimine-as. A opção restante é sua resposta.",
      Français: "Trouvez les 3 bonnes réponses et éliminez-les. L'option restante est votre réponse.",
    },
  },
}

const ABA_TRAP_WORDS: Record<
  string,
  {
    common: { [key in Language]: string }
    aba: { [key in Language]: string }
    confusion: { [key in Language]: string }
  }
> = {
  negative: {
    common: {
      English: "Bad, harmful, unpleasant",
      Español: "Malo, dañino, desagradable",
      Português: "Ruim, prejudicial, desagradável",
      Français: "Mauvais, nuisible, désagréable",
    },
    aba: {
      English: "SUBTRACT/Remove something (like a minus sign in math)",
      Español: "RESTAR/Eliminar algo (como un signo menos en matemáticas)",
      Português: "SUBTRAIR/Remover algo (como um sinal de menos na matemática)",
      Français: "SOUSTRAIRE/Retirer quelque chose (comme un signe moins en maths)",
    },
    confusion: {
      English:
        "Students think 'negative reinforcement' means punishment. It actually means REMOVING something to INCREASE behavior.",
      Español:
        "Los estudiantes piensan que 'negative reinforcement' significa castigo. En realidad significa REMOVER algo para AUMENTAR la conducta.",
      Português:
        "Estudantes pensam que 'negative reinforcement' significa punição. Na verdade significa REMOVER algo para AUMENTAR o comportamento.",
      Français:
        "Les étudiants pensent que 'negative reinforcement' signifie punition. Cela signifie en fait RETIRER quelque chose pour AUGMENTER le comportement.",
    },
  },
  positive: {
    common: {
      English: "Good, pleasant, desirable",
      Español: "Bueno, agradable, deseable",
      Português: "Bom, agradável, desejável",
      Français: "Bon, agréable, souhaitable",
    },
    aba: {
      English: "ADD/Present something (like a plus sign in math)",
      Español: "AGREGAR/Presentar algo (como un signo más en matemáticas)",
      Português: "ADICIONAR/Apresentar algo (como um sinal de mais na matemática)",
      Français: "AJOUTER/Présenter quelque chose (comme un signe plus en maths)",
    },
    confusion: {
      English:
        "Students think 'positive punishment' means good punishment. It actually means ADDING something that DECREASES behavior.",
      Español:
        "Los estudiantes piensan que 'positive punishment' significa castigo bueno. En realidad significa AGREGAR algo que DISMINUYE la conducta.",
      Português:
        "Estudantes pensam que 'positive punishment' significa punição boa. Na verdade significa ADICIONAR algo que DIMINUI o comportamento.",
      Français:
        "Les étudiants pensent que 'positive punishment' signifie bonne punition. Cela signifie en fait AJOUTER quelque chose qui DIMINUE le comportement.",
    },
  },
  consequence: {
    common: {
      English: "Punishment, negative outcome, bad result",
      Español: "Castigo, resultado negativo, mal resultado",
      Português: "Punição, resultado negativo, mau resultado",
      Français: "Punition, résultat négatif, mauvais résultat",
    },
    aba: {
      English: "ANY event that follows a behavior (can be good OR bad)",
      Español: "CUALQUIER evento que sigue a una conducta (puede ser bueno O malo)",
      Português: "QUALQUER evento que segue um comportamento (pode ser bom OU ruim)",
      Français: "TOUT événement qui suit un comportement (peut être bon OU mauvais)",
    },
    confusion: {
      English:
        "Students think consequences are always bad. In ABA, consequence simply means what happens AFTER a behavior.",
      Español:
        "Los estudiantes piensan que las consecuencias siempre son malas. En ABA, consequence simplemente significa lo que sucede DESPUÉS de una conducta.",
      Português:
        "Estudantes pensam que consequências são sempre ruins. Em ABA, consequence simplesmente significa o que acontece DEPOIS de um comportamento.",
      Français:
        "Les étudiants pensent que les conséquences sont toujours mauvaises. En ABA, consequence signifie simplement ce qui se passe APRÈS un comportement.",
    },
  },
  discrimination: {
    common: {
      English: "Prejudice, unfair treatment, bias",
      Español: "Prejuicio, trato injusto, sesgo",
      Português: "Preconceito, tratamento injusto, viés",
      Français: "Préjugé, traitement injuste, biais",
    },
    aba: {
      English: "Ability to DISTINGUISH between different stimuli and respond differently",
      Español: "Capacidad de DISTINGUIR entre diferentes estímulos y responder de manera diferente",
      Português: "Capacidade de DISTINGUIR entre diferentes estímulos e responder de forma diferente",
      Français: "Capacité à DISTINGUER différents stimuli et à répondre différemment",
    },
    confusion: {
      English:
        "Students avoid this word due to negative connotations. In ABA, discrimination is a GOOD skill - knowing when to respond!",
      Español:
        "Los estudiantes evitan esta palabra por sus connotaciones negativas. ¡En ABA, discrimination es una BUENA habilidad - saber cuándo responder!",
      Português:
        "Estudantes evitam esta palavra por suas conotações negativas. Em ABA, discrimination é uma ÓTIMA habilidade - saber quando responder!",
      Français:
        "Les étudiants évitent ce mot en raison de connotations négatives. En ABA, discrimination est une BONNE compétence - savoir quand répondre!",
    },
  },
  extinction: {
    common: {
      English: "Disappear forever, die out, eliminate completely",
      Español: "Desaparecer para siempre, extinguirse, eliminar completamente",
      Português: "Desaparecer para sempre, extinguir-se, eliminar completamente",
      Français: "Disparaître à jamais, mourir, éliminer complètement",
    },
    aba: {
      English: "STOP providing reinforcement for a previously reinforced behavior",
      Español: "DEJAR de proporcionar refuerzo para una conducta previamente reforzada",
      Português: "PARAR de fornecer reforço para um comportamento previously reforçado",
      Français: "ARRÊTER de fournir du renforcement pour un comportement previously renforcé",
    },
    confusion: {
      English:
        "Students think extinction eliminates behavior instantly. It actually often causes an extinction BURST first (temporary increase).",
      Español:
        "Los estudiantes piensan que extinction elimina la conducta instantáneamente. En realidad, a menudo causa primero un extinction BURST (aumento temporal).",
      Português:
        "Estudantes pensam que extinction elimina o comportamento instantaneamente. Na verdade, frequentemente causa primeiro um extinction BURST (aumento temporário).",
      Français:
        "Les étudiants pensent que extinction élimine le comportement instantanément. En fait, cela provoque souvent d'abord un extinction BURST (augmentation temporaire).",
    },
  },
  contingent: {
    common: {
      English: "Emergency plan, backup option, conditional",
      Español: "Plan de emergencia, opción de respaldo, condicional",
      Português: "Plano de emergência, opção de backup, condicional",
      Français: "Plan d'urgence, option de secours, conditionnel",
    },
    aba: {
      English: "DEPENDENT on behavior (if-then relationship)",
      Español: "DEPENDIENTE de la conducta (relación si-entonces)",
      Português: "DEPENDENTE do comportamento (relação se-então)",
      Français: "DÉPENDANT du comportement (relation si-alors)",
    },
    confusion: {
      English:
        "Students confuse 'contingent' with 'contingency plan'. In ABA, contingent means the consequence DEPENDS on the behavior occurring.",
      Español:
        "Los estudiantes confunden 'contingent' con 'plan de contingencia'. En ABA, contingent significa que la consecuencia DEPENDE de que ocurra la conducta.",
      Português:
        "Estudantes confundem 'contingent' com 'plano de contingência'. Em ABA, contingent significa que a consequência DEPENDE da ocorrência do comportamento.",
      Français:
        "Les étudiants confondent 'contingent' avec 'plan de contingence'. En ABA, contingent signifie que la conséquence DÉPEND de l'occurrence du comportement.",
    },
  },
  punishment: {
    common: {
      English: "Pain, suffering, harsh discipline",
      Español: "Dolor, sufrimiento, disciplina severa",
      Português: "Dor, sofrimento, disciplina severa",
      Français: "Douleur, souffrance, discipline sévère",
    },
    aba: {
      English: "ANY consequence that DECREASES the future probability of a behavior",
      Español: "CUALQUIER consecuencia que DISMINUYE la probabilidad futura de una conducta",
      Português: "QUALQUER consequência que DIMINUI a probabilidade futura de um comportamento",
      Français: "TOUTE conséquence qui DIMINUE la probabilité future d'un comportement",
    },
    confusion: {
      English:
        "Students think punishment must be painful. In ABA, even a gentle 'no' is punishment if it DECREASES behavior.",
      Español:
        "Los estudiantes piensan que punishment debe ser doloroso. En ABA, incluso un suave 'no' es punishment si DISMINUYE la conducta.",
      Português:
        "Estudantes pensam que punishment deve ser doloroso. Em ABA, até um gentil 'não' é punishment se DIMINUIR o comportamento.",
      Français:
        "Les étudiants pensent que punishment doit être douloureux. En ABA, même un doux 'non' est punishment s'il DIMINUE le comportement.",
    },
  },
  reinforcement: {
    common: {
      English: "Support, strengthen, help",
      Español: "Apoyar, fortalecer, ayudar",
      Português: "Apoiar, fortalecer, ajudar",
      Français: "Soutenir, renforcer, aider",
    },
    aba: {
      English: "ANY consequence that INCREASES the future probability of a behavior",
      Español: "CUALQUIER consecuencia que AUMENTA la probabilidad futura de una conducta",
      Português: "QUALQUER consequência que AUMENTA a probabilidade futura de um comportamento",
      Français: "TOUTE conséquence qui AUGMENTE la probabilité future d'un comportement",
    },
    confusion: {
      English:
        "Students think reinforcement means reward or praise. In ABA, it's defined by its EFFECT on behavior, not what it looks like.",
      Español:
        "Los estudiantes piensan que reinforcement significa recompensa o elogio. En ABA, se define por su EFECTO en la conducta, no por cómo se ve.",
      Português:
        "Estudantes pensam que reinforcement significa recompensa ou elogio. Em ABA, é definido pelo seu EFEITO no comportamento, não pela aparência.",
      Français:
        "Les étudiants pensent que reinforcement signifie récompense ou éloge. En ABA, c'est défini par son EFFET sur le comportement, pas par son apparence.",
    },
  },
  elicit: {
    common: {
      English: "Get, obtain, bring out",
      Español: "Obtener, conseguir, provocar",
      Português: "Obter, conseguir, provocar",
      Français: "Obtenir, provoquer, susciter",
    },
    aba: {
      English: "AUTOMATICALLY trigger a reflex (ONLY for respondent/involuntary behaviors)",
      Español: "Desencadenar AUTOMÁTICAMENTE un reflejo (SOLO para conductas respondientes/involuntarias)",
      Português: "Desencadear AUTOMATICAMENTE um reflexo (APENAS para comportamentos respondentes/involuntários)",
      Français: "Déclencher AUTOMATIQUEMENT un réflexe (UNIQUEMENT pour les comportements répondants/involontaires)",
    },
    confusion: {
      English:
        "Students use 'elicit' for any behavior. In ABA, ONLY reflexes are elicited. Voluntary behaviors are EMITTED or EVOKED.",
      Español:
        "Los estudiantes usan 'elicit' para cualquier conducta. En ABA, SOLO los reflejos son elicited. Las conductas voluntarias son EMITTED o EVOKED.",
      Português:
        "Estudantes usam 'elicit' para qualquer comportamento. Em ABA, APENAS reflexos são elicited. Comportamentos voluntários são EMITTED ou EVOKED.",
      Français:
        "Les étudiants utilisent 'elicit' pour tout comportement. En ABA, SEULS les réflexes sont elicited. Les comportements volontaires sont EMITTED ou EVOKED.",
    },
  },
  variable: {
    common: {
      English: "Changeable, flexible, adjustable",
      Español: "Cambiable, flexible, ajustable",
      Português: "Variável, flexível, ajustável",
      Français: "Modifiable, flexible, ajustable",
    },
    aba: {
      English: "UNPREDICTABLE schedule (reinforcement after varying number of responses or time)",
      Español: "Horario IMPREDECIBLE (refuerzo después de un número variable de respuestas o tiempo)",
      Português: "Esquema IMPREVISÍVEL (reforço após número variável de respostas ou tempo)",
      Français: "Horaire IMPRÉVISIBLE (renforcement après un nombre variable de réponses ou de temps)",
    },
    confusion: {
      English:
        "Students think variable means 'can change'. In ABA, variable schedules mean the exact requirement is UNPREDICTABLE.",
      Español:
        "Los estudiantes piensan que variable significa 'puede cambiar'. En ABA, los horarios variable significan que el requisito exacto es IMPREDECIBLE.",
      Português:
        "Estudantes pensam que variable significa 'pode mudar'. Em ABA, esquemas variable significam que o requisito exato é IMPREVISÍVEL.",
      Français:
        "Les étudiants pensent que variable signifie 'peut changer'. En ABA, les horaires variable signifient que l'exigence exacte est IMPRÉVISIBLE.",
    },
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
}

interface QuestionScreenProps {
  examType: ExamType
  category: string
  mode: Mode
  onBack: () => void
  language: Language
  tasks: Task[]
  currentTaskIndex: number
  onTaskComplete: () => void
  loadingTasks?: boolean
  onQuestionAnswered?: (selectedOption: string, isCorrect: boolean, timeSpentSeconds: number) => void
}

export default function QuestionScreen({
  examType,
  category,
  mode,
  onBack,
  language,
  tasks,
  currentTaskIndex,
  onTaskComplete,
  loadingTasks = false,
  onQuestionAnswered,
}: QuestionScreenProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [questionData, setQuestionData] = useState<QuestionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    trapDetector: true,
    decisionFilter: false,
    allOptions: false,
  })

  const t = translations[language]
  const currentTask = tasks[currentTaskIndex]

  const trapAnalysis = useMemo(() => {
    if (!questionData) {
      return {
        detectedPivotWords: [],
        detectedAbaTraps: [],
        detectedContrastPivots: [],
        detectedTimePivots: [],
        detectedNonTechnicalTraps: [],
        questionSkeleton: null,
      }
    }

    const questionText = questionData.question
    const optionsText = questionData.options.join(" ")
    const fullText = questionText + " " + optionsText
    const upperFullText = fullText.toUpperCase()

    // Find the actual question sentence (usually starts with "What", "Which", "How", etc.)
    const questionSentenceMatch = questionText.match(/(?:What|Which|How|Why|When|Where|Who|According)[^?]*\?/i)
    const questionSentence = questionSentenceMatch ? questionSentenceMatch[0] : ""
    const upperQuestionSentence = questionSentence.toUpperCase()

    // Detect pivot words (only in question sentence)
    const detectedPivotWords: Array<{ word: string; category: string; meaning: string; strategy: string }> = []
    Object.entries(PIVOT_WORDS).forEach(([, data]) => {
      data.words.forEach((word) => {
        if (upperQuestionSentence.includes(word)) {
          detectedPivotWords.push({
            word,
            category: data.category,
            meaning: data.meaning[language],
            strategy: data.strategy[language],
          })
        }
      })
    })

    const detectedContrastPivots: Array<{ word: string; meaning: string; strategy: string }> = []
    const contrastWordsFound: Set<string> = new Set()
    CONTRAST_PIVOTS.words.forEach((word) => {
      if (upperFullText.includes(word) && !contrastWordsFound.has(word)) {
        detectedContrastPivots.push({
          word,
          meaning: CONTRAST_PIVOTS.translations[language].meaning,
          strategy: CONTRAST_PIVOTS.translations[language].strategy,
        })
        contrastWordsFound.add(word)
      }
    })
    // Limit to max 2 contrast words to avoid repetition
    const limitedContrastPivots = detectedContrastPivots.slice(0, 2)

    const detectedTimePivots: Array<{ word: string; meaning: string; strategy: string }> = []
    const timeWordsFound: Set<string> = new Set()
    TIME_PIVOTS.words.forEach((word) => {
      if (upperFullText.includes(word) && !timeWordsFound.has(word)) {
        const specificStrategy = TIME_PIVOTS.words_with_strategies[word as keyof typeof TIME_PIVOTS.words_with_strategies]
        detectedTimePivots.push({
          word,
          meaning: specificStrategy ? specificStrategy.meaning[language] : TIME_PIVOTS.translations[language].meaning,
          strategy: specificStrategy ? specificStrategy.strategy[language] : TIME_PIVOTS.translations[language].strategy,
        })
        timeWordsFound.add(word)
      }
    })
    // Limit to max 2 time words to avoid repetition
    const limitedTimePivots = detectedTimePivots.slice(0, 2)

    // Detect ABA trap words (in full text)
    const detectedAbaTraps: Array<{ word: string; common: string; aba: string; confusion: string }> = []
    Object.entries(ABA_TRAP_WORDS).forEach(([word, data]) => {
      if (upperFullText.includes(word.toUpperCase())) {
        detectedAbaTraps.push({
          word: word.charAt(0).toUpperCase() + word.slice(1),
          common: data.common[language],
          aba: data.aba[language],
          confusion: data.confusion[language],
        })
      }
    })

    const detectedNonTechnicalTraps: Array<{ word: string; meaning: string; context: string }> = []
    Object.entries(NON_TECHNICAL_TRAP_WORDS).forEach(([word, data]) => {
      if (fullText.toLowerCase().includes(word.toLowerCase())) {
        detectedNonTechnicalTraps.push({
          word: word.charAt(0).toUpperCase() + word.slice(1),
          meaning: data[language].meaning,
          context: data[language].context,
        })
      }
    })

    let questionSkeleton: { subject: string; verb: string; object: string } | null = null
    // Try to extract a simplified skeleton from the question
    const skeletonLabels = {
      English: { subject: "WHO", verb: "DOES WHAT", object: "TO WHOM/WHAT" },
      Español: { subject: "QUIÉN", verb: "HACE QUÉ", object: "A QUIÉN/QUÉ" },
      Português: { subject: "QUEM", verb: "FAZ O QUÊ", object: "A QUEM/O QUÊ" },
      Français: { subject: "QUI", verb: "FAIT QUOI", object: "À QUI/QUOI" },
    }

    // Simple heuristic: look for common subjects
    const subjectMatch = questionText.match(
      /(?:The |A |An )?(BCBA|RBT|behavior analyst|client|parent|teacher|therapist|supervisor)/i,
    )
    const verbMatch = questionText.match(
      /\b(implemented|observed|recorded|reinforced|collected|measured|assessed|taught|trained|provided|delivered|conducted|demonstrated|modeled|shaped|prompted|faded)\b/i,
    )

    if (subjectMatch && verbMatch) {
      questionSkeleton = {
        subject: subjectMatch[1] || subjectMatch[0],
        verb: verbMatch[1],
        object: skeletonLabels[language].object,
      }
    }

    // Combine all trap words and limit to 4 maximum
    const allDetectedTraps = [
      ...detectedPivotWords.slice(0, 1),
      ...limitedTimePivots.slice(0, 1),
      ...limitedContrastPivots.slice(0, 1),
      ...detectedAbaTraps.slice(0, 1),
    ]

    return {
      detectedPivotWords: detectedPivotWords.slice(0, 3), // Max 3 pivot words
      detectedAbaTraps: detectedAbaTraps.slice(0, 3), // Max 3 ABA traps
      detectedContrastPivots: limitedContrastPivots,
      detectedTimePivots: limitedTimePivots,
      detectedNonTechnicalTraps: detectedNonTechnicalTraps.slice(0, 2), // Max 2 non-technical
      questionSkeleton,
    }
  }, [questionData, language])

  const loadQuestion = async () => {
    setIsLoading(true)
    setError(null)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setShowHint(false)
    // Reset timer when loading a new question
    setQuestionStartTime(Date.now())

    try {
      const response = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examLevel: examType,
          category,
          language,
          taskId: currentTask?.task_id,
          taskText: currentTask?.task_text,
          keywords: currentTask?.keywords,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate question")
      }

      const data = await response.json()
      setQuestionData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading question")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentTask) {
      loadQuestion()
    }
  }, [currentTask])

  const handleSubmit = async () => {
    if (selectedAnswer === null || !questionData) return

    // Calculate time spent and call onQuestionAnswered
    const timeSpentSeconds = Math.floor((Date.now() - questionStartTime) / 1000)
    const isCorrect = selectedAnswer === questionData.correctIndex
    const selectedOptionText = questionData.options[selectedAnswer]

    if (onQuestionAnswered) {
      onQuestionAnswered(selectedOptionText, isCorrect, timeSpentSeconds)
    }

    setShowFeedback(true)
    setExpandedSections({ trapDetector: true, decisionFilter: false, allOptions: false })

    // Save progress to Supabase
    const supabase = createClient()
    if (supabase) {
      try {
        await supabase.from("user_progress").insert({
          category_id: category,
          exam_type: examType,
          questions_attempted: 1,
          questions_correct: selectedAnswer === questionData.correctIndex ? 1 : 0,
          last_practiced_at: new Date().toISOString(),
        })
      } catch (err) {
        console.error("Failed to save progress:", err)
      }
    }
  }

  const handleNext = () => {
    onTaskComplete()
    setSelectedAnswer(null)
    setShowFeedback(false)
    setShowHint(false)
    // Reset timer for the next question
    setQuestionStartTime(Date.now())
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const isCorrect = selectedAnswer === questionData?.correctIndex

  const languageSupportLabels = {
    English: {
      trapDetector: "TRAP DETECTOR",
      pivotWords: "Exam Strategy Words",
      contrastPivots: "Contrast Signals",
      timePivots: "Time Signals",
      abaTerms: "ABA Terminology",
      vocabularyHelp: "Vocabulary Help",
      skeleton: "Question Skeleton",
      commonMeaning: "Common meaning",
      abaMeaning: "ABA meaning",
      thisMayConfuse: "This may have confused you because",
      strategy: "Strategy",
      noTrapsMessage: "No specific traps detected. Focus on analyzing the scenario carefully.",
    },
    Español: {
      trapDetector: "DETECTOR DE TRAMPAS",
      pivotWords: "Palabras Clave del Examen",
      contrastPivots: "Señales de Contraste",
      timePivots: "Señales Temporales",
      abaTerms: "Terminología ABA",
      vocabularyHelp: "Ayuda de Vocabulario",
      skeleton: "Esqueleto de la Pregunta",
      commonMeaning: "Significado común",
      abaMeaning: "Significado en ABA",
      thisMayConfuse: "Esto puede haberte confundido porque",
      strategy: "Estrategia",
      noTrapsMessage: "No se detectaron trampas específicas. Enfócate en analizar el escenario cuidadosamente.",
    },
    Português: {
      trapDetector: "DETECTOR DE ARMADILHAS",
      pivotWords: "Palavras-Chave do Exame",
      contrastPivots: "Sinais de Contraste",
      timePivots: "Sinais Temporais",
      abaTerms: "Terminologia ABA",
      vocabularyHelp: "Ajuda de Vocabulário",
      skeleton: "Esqueleto da Questão",
      commonMeaning: "Significado comum",
      abaMeaning: "Significado em ABA",
      thisMayConfuse: "Isso pode ter te confundido porque",
      strategy: "Estratégia",
      noTrapsMessage: "Nenhuma armadilha específica detectada. Foque em analisar o cenário cuidadosamente.",
    },
    Français: {
      trapDetector: "DÉTECTEUR DE PIÈGES",
      pivotWords: "Mots-Clés d'Examen",
      contrastPivots: "Signaux de Contraste",
      timePivots: "Signaux Temporels",
      abaTerms: "Terminologie ABA",
      vocabularyHelp: "Aide Vocabulaire",
      skeleton: "Squelette de la Question",
      commonMeaning: "Sens commun",
      abaMeaning: "Sens ABA",
      thisMayConfuse: "Cela a pu vous confondre parce que",
      strategy: "Stratégie",
      noTrapsMessage: "Aucun piège spécifique détecté. Concentrez-vous sur l'analyse du scénario.",
    },
  }

  const labels = languageSupportLabels[language]

  const celebrationText = {
    English: "You nailed it!",
    Español: "¡Le diste al clavo!",
    Português: "Você acertou em cheio!",
    Français: "Vous avez réussi!",
  }

  const incorrectText = {
    English: "Not quite. Let's learn the difference.",
    Español: "No exactamente. Aprendamos la diferencia.",
    Português: "Não exatamente. Vamos aprender a diferença.",
    Français: "Pas tout à fait. Apprenons la différence.",
  }

  const hintLabel = {
    English: "Hint",
    Español: "Pista",
    Português: "Dica",
    Français: "Indice",
  }

  if (!currentTask) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-zinc-400">{t.noTasks}</p>
          <Button onClick={onBack} variant="outline" className="mt-4 bg-transparent">
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t.retry}
          </Button>
        </div>
      </div>
    )
  }

  // Use loadingTasks prop for initial loading state
  if (isLoading || loadingTasks) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">{t.loading}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-zinc-400 mb-4">{error}</p>
          <Button onClick={loadQuestion} className="bg-amber-500 hover:bg-amber-600 text-black">
            {t.retry}
          </Button>
        </div>
      </div>
    )
  }

  if (!questionData) return null

  const hasAnyTraps =
    trapAnalysis.detectedPivotWords.length > 0 ||
    trapAnalysis.detectedAbaTraps.length > 0 ||
    trapAnalysis.detectedContrastPivots.length > 0 ||
    trapAnalysis.detectedTimePivots.length > 0 ||
    trapAnalysis.detectedNonTechnicalTraps.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-zinc-800/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 mx-4 min-w-0">
              <div className="text-base text-zinc-200 font-medium">
                {currentTask.task_id} - {getDomainName(currentTask.task_id)}
              </div>
            </div>
            <div className="flex gap-1">
              {tasks.slice(0, 10).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < currentTaskIndex ? "bg-amber-500" : i === currentTaskIndex ? "bg-amber-500/50" : "bg-zinc-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Question Card */}
        <div className="bg-zinc-900/50 rounded-2xl p-3 sm:p-4 lg:p-5 border border-zinc-800/50">
          {/* Category/Task Badge */}
          {currentTask && (
            <div className="mb-2 sm:mb-3">
              <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-zinc-700 text-zinc-300">
                Task {currentTask.task_id} &bull; <span className="hidden sm:inline">{getDomainName(currentTask.task_id)}</span><span className="sm:hidden">{currentTask.task_id.charAt(0)}</span>
              </span>
            </div>
          )}
          <p className="text-sm sm:text-base lg:text-[16px] leading-relaxed text-zinc-200">{questionData.question}</p>

          {/* Hint Button */}
          {!showFeedback && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="mt-3 sm:mt-4 flex items-center gap-2 text-amber-500 hover:text-amber-400 transition-colors text-xs sm:text-sm"
            >
              <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {showHint ? questionData.hint : `${hintLabel[language]}?`}
            </button>
          )}
        </div>

        {/* Answer Options */}
        <div className="space-y-2 sm:space-y-3">
          {questionData.options.map((option, index) => {
            const isSelected = selectedAnswer === index
            const isCorrectOption = index === questionData.correctIndex
            const showResult = showFeedback

            let optionStyle = "bg-zinc-900/30 border-zinc-800/50 hover:border-amber-500/50"
            if (isSelected && !showResult) {
              optionStyle = "bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
            } else if (showResult) {
              if (isCorrectOption) {
                optionStyle = "bg-green-500/10 border-green-500"
              } else if (isSelected && !isCorrectOption) {
                optionStyle = "bg-red-500/10 border-red-500"
              }
            }

            return (
              <button
                key={index}
                onClick={() => !showFeedback && setSelectedAnswer(index)}
                disabled={showFeedback}
                className={`w-full text-left p-3 sm:p-4 rounded-xl border transition-all duration-300 ${optionStyle}`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm lg:text-[14px] text-zinc-300">{option}</span>
                  {showResult && isCorrectOption && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5 sm:mt-0" />}
                  {showResult && isSelected && !isCorrectOption && (
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Submit / Next Button */}
        {!showFeedback ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            className="w-full py-3 sm:py-4 lg:py-6 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-base sm:text-lg disabled:opacity-50"
          >
            {t.submit}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="w-full py-3 sm:py-4 lg:py-6 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-base sm:text-lg"
          >
            {t.next}
          </Button>
        )}

        {/* Feedback Panel */}
        {showFeedback && (
          <div className="space-y-3 sm:space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            {/* Result Banner */}
            <div
              className={`p-3 sm:p-4 rounded-xl flex items-center gap-2 sm:gap-3 ${
                isCorrect ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"
              }`}
            >
              {isCorrect ? (
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0" />
              )}
              <span className={`font-medium text-xs sm:text-sm ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                {isCorrect ? celebrationText[language] : incorrectText[language]}
              </span>
            </div>

            {!isCorrect && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection("trapDetector")}
                  className="w-full p-2.5 sm:p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
                    <span className="font-semibold text-xs sm:text-sm text-amber-400">{labels.trapDetector}</span>
                  </div>
                  <span className="text-amber-500 text-sm sm:text-base">{expandedSections.trapDetector ? "−" : "+"}</span>
                </button>

                {expandedSections.trapDetector && (
                  <div className="px-2.5 sm:px-4 pb-2.5 sm:pb-4 space-y-2.5 sm:space-y-4">
                    {/* Pivot Words in Question */}
                    {trapAnalysis.detectedPivotWords.length > 0 && (
                      <div className="bg-amber-500/5 rounded-lg p-2.5 sm:p-3">
                        <div className="text-xs font-semibold text-amber-400 uppercase mb-1.5 sm:mb-2">{labels.pivotWords}</div>
                        {trapAnalysis.detectedPivotWords.map((pivot, i) => (
                          <div key={i} className="mb-2 sm:mb-3 last:mb-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="bg-amber-500 text-black px-2 py-0.5 rounded text-xs sm:text-sm font-bold flex-shrink-0">
                                {pivot.word}
                              </span>
                              <span className="text-xs text-zinc-500">({pivot.category})</span>
                            </div>
                            <p className="text-xs sm:text-sm text-zinc-300 mb-1">{pivot.meaning}</p>
                            <p className="text-xs text-amber-400">
                              <strong>{labels.strategy}:</strong> {pivot.strategy}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Contrast Pivots */}
                    {trapAnalysis.detectedContrastPivots.length > 0 && (
                      <div className="bg-blue-500/5 rounded-lg p-2.5 sm:p-3 border border-blue-500/20">
                        <div className="text-xs font-semibold text-blue-400 uppercase mb-2">
                          {labels.contrastPivots}
                        </div>
                        {trapAnalysis.detectedContrastPivots.map((pivot, i) => (
                          <div key={i} className="mb-2 last:mb-0">
                            <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-sm font-medium mr-2">
                              {pivot.word}
                            </span>
                            <p className="text-sm text-zinc-300 mt-1">{pivot.meaning}</p>
                            <p className="text-xs text-blue-400 mt-1">
                              <strong>{labels.strategy}:</strong> {pivot.strategy}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Time Pivots */}
                    {trapAnalysis.detectedTimePivots.length > 0 && (
                      <div className="bg-purple-500/5 rounded-lg p-3 border border-purple-500/20">
                        <div className="text-xs font-semibold text-purple-400 uppercase mb-2">{labels.timePivots}</div>
                        {trapAnalysis.detectedTimePivots.map((pivot, i) => (
                          <div key={i} className="mb-2 last:mb-0">
                            <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-sm font-medium mr-2">
                              {pivot.word}
                            </span>
                            <p className="text-sm text-zinc-300 mt-1">{pivot.meaning}</p>
                            <p className="text-xs text-purple-400 mt-1">
                              <strong>{labels.strategy}:</strong> {pivot.strategy}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ABA Terminology Traps */}
                    {trapAnalysis.detectedAbaTraps.length > 0 && (
                      <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/20">
                        <div className="text-xs font-semibold text-red-400 uppercase mb-2">{labels.abaTerms}</div>
                        {trapAnalysis.detectedAbaTraps.map((trap, i) => (
                          <div key={i} className="mb-3 last:mb-0">
                            <div className="font-medium text-red-300">
                              <span className="font-bold">{trap.word}:</span>{" "}
                            </div>
                            <p className="text-sm text-zinc-300 mb-1">
                              <span className="font-medium text-red-400">{labels.commonMeaning}:</span> {trap.common}
                            </p>
                            <p className="text-sm text-zinc-300 mb-1">
                              <span className="font-medium text-red-400">{labels.abaMeaning}:</span> {trap.aba}
                            </p>
                            <p className="text-xs text-red-400">
                              <strong>{labels.thisMayConfuse}:</strong> {trap.confusion}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Non-Technical Trap Words */}
                    {trapAnalysis.detectedNonTechnicalTraps.length > 0 && (
                      <div className="bg-yellow-500/5 rounded-lg p-3 border border-yellow-500/20">
                        <div className="text-xs font-semibold text-yellow-400 uppercase mb-2">
                          {labels.vocabularyHelp}
                        </div>
                        {trapAnalysis.detectedNonTechnicalTraps.map((trap, i) => (
                          <div key={i} className="mb-2 last:mb-0">
                            <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded text-sm font-medium mr-2">
                              {trap.word}
                            </span>
                            <p className="text-sm text-zinc-300 inline">
                              - {trap.meaning} <span className="text-zinc-500">({trap.context})</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Question Skeleton */}
                    {trapAnalysis.questionSkeleton && (
                      <div className="bg-cyan-500/5 rounded-lg p-3 border border-cyan-500/20">
                        <div className="text-xs font-semibold text-cyan-400 uppercase mb-2">{labels.skeleton}</div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-bold text-cyan-300">{trapAnalysis.questionSkeleton.subject}</span>
                          <span className="text-zinc-400">{trapAnalysis.questionSkeleton.verb}</span>
                          <span className="font-bold text-cyan-300">{trapAnalysis.questionSkeleton.object}</span>
                        </div>
                      </div>
                    )}

                    {!hasAnyTraps && <p className="text-sm text-zinc-500">{labels.noTrapsMessage}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Decision Filter */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection("decisionFilter")}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-blue-400">DECISION FILTER</span>
                </div>
                <span className="text-blue-500">{expandedSections.decisionFilter ? "−" : "+"}</span>
              </button>
              {expandedSections.decisionFilter && questionData.decisionFilter && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-zinc-300 mb-3">{questionData.decisionFilter.testQuestion}</p>
                  {questionData.decisionFilter.concepts.map((concept, i) => (
                    <div key={i} className="mb-2 last:mb-0">
                      <p className="text-sm font-medium text-zinc-200">
                        {concept.name}
                        {concept.analogy && (
                          <span className="text-xs font-normal text-zinc-500 ml-2">({concept.analogy})</span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-400">{concept.definition}</p>
                      {concept.rule && <p className="text-[11px] text-blue-400 italic">Rule: {concept.rule}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Options Explained */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection("allOptions")}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-500" />
                  <span className="font-semibold text-green-400">{labels.allOptions}</span>
                </div>
                <span className="text-green-500">{expandedSections.allOptions ? "−" : "+"}</span>
              </button>
              {expandedSections.allOptions && questionData.optionExplanations && (
                <div className="px-4 pb-4 space-y-3">
                  {Object.entries(questionData.optionExplanations).map(([key, explanation]) => (
                    <div key={key} className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-zinc-200">
                        {key}.{" "}
                        <span className="text-zinc-400">
                          {
                            questionData.options[
                              Number.parseInt(key === "A" ? "0" : key === "B" ? "1" : key === "C" ? "2" : "3")
                            ]
                          }
                        </span>
                      </p>
                      <p className="text-xs text-zinc-300">{explanation}</p>
                    </div>
                  ))}
                  {questionData.conclusion && (
                    <div className="mt-3 pt-3 border-t border-zinc-700">
                      <p className="text-sm font-medium text-zinc-200">Conclusion:</p>
                      <p className="text-xs text-zinc-300">{questionData.conclusion}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
