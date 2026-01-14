"use client"

import { useState } from "react"
import { LanguageSelection } from "@/components/language-selection"
import { ExamTypeSelection } from "@/components/exam-type-selection"
import { CategoryMenu } from "@/components/category-menu"
import { QuestionScreen } from "@/components/question-screen"

export type Language = "English" | "Español" | "Português" | "Français"
export type ExamType = "RBT" | "BCBA"
export type Mode = "tutor" | "exam"

export const bcbaSubTopics: Record<string, string[]> = {
  "B. Concepts & Principles": [
    "B-1: Identify and distinguish among behavior, response, and response class",
    "B-2: Identify and distinguish between stimulus and stimulus class",
    "B-3: Identify and distinguish between respondent and operant conditioning",
    "B-4: Identify and distinguish between positive and negative reinforcement",
    "B-5: Identify and distinguish between positive and negative punishment",
    "B-6: Identify and distinguish between automatic and socially mediated contingencies",
    "B-7: Identify and distinguish among unconditioned, conditioned, and generalized reinforcers",
    "B-8: Identify and distinguish among unconditioned, conditioned, and generalized punishers",
    "B-9: Identify and distinguish between SD and MO",
    "B-10: Identify and distinguish among stimulus control procedures",
  ],
  "C. Measurement & Data Display": [
    "C-1: Establish operational definitions of behavior",
    "C-2: Distinguish among continuous, discontinuous, and derivative measures",
    "C-3: Select data display that effectively communicates relationships",
    "C-4: Graph data to communicate relevant characteristics",
    "C-5: Interpret data based on its visual representation",
  ],
  "D. Experimental Design": [
    "D-1: Distinguish between internal and external validity",
    "D-2: Distinguish among experimental and quasi-experimental designs",
    "D-3: Apply single-case experimental designs",
  ],
  "E. Ethics Code": [
    "E-1: Apply BACB ethics requirements",
    "E-2: Identify potential ethics violations",
    "E-3: Apply professional guidelines in service delivery",
  ],
  "F. Behavior Assessment": [
    "F-1: Review records and available data",
    "F-2: Determine the need for behavior-analytic services",
    "F-3: Identify and prioritize socially significant behavior-change goals",
    "F-4: Conduct assessments of relevant repertoires",
    "F-5: Conduct preference assessments",
    "F-6: Describe and explain behavior, including private events",
    "F-7: Define environmental variables that may contribute to problem behavior",
    "F-8: Conduct functional assessments and analysis",
  ],
  "G. Behavior-Change Procedures": [
    "G-1: Use positive and negative reinforcement procedures",
    "G-2: Use positive and negative punishment procedures",
    "G-3: Use stimulus control procedures",
    "G-4: Use prompting and prompt fading",
    "G-5: Use shaping and chaining",
    "G-6: Use discrimination and generalization training",
    "G-7: Use behavior momentum and motivating operations",
    "G-8: Use extinction procedures",
  ],
  "H. Selecting Interventions": [
    "H-1: State intervention goals in measurable terms",
    "H-2: Identify potential interventions based on assessment results",
    "H-3: Consider scientific evidence and client values when recommending interventions",
    "H-4: Obtain stakeholder approval for behavior-change interventions",
  ],
  "I. Personnel Supervision": [
    "I-1: Identify the features of effective supervision",
    "I-2: Conduct initial and ongoing supervision of supervisees",
    "I-3: Provide performance feedback to supervisees",
    "I-4: Maintain supervision documentation",
  ],
}

export const rbtSubTopics: Record<string, string[]> = {
  Measurement: [
    "A-1: Prepare for data collection",
    "A-2: Implement continuous measurement procedures",
    "A-3: Implement discontinuous measurement procedures",
    "A-4: Implement permanent product recording procedures",
    "A-5: Enter data and update graphs",
  ],
  Assessment: [
    "B-1: Conduct preference assessments",
    "B-2: Assist with functional assessment procedures",
    "B-3: Assist with individual assessment procedures",
  ],
  "Skill Acquisition": [
    "C-1: Identify the essential components of a written skill acquisition plan",
    "C-2: Prepare for sessions as required by skill acquisition plans",
    "C-3: Use contingencies of reinforcement",
    "C-4: Implement discrete-trial teaching procedures",
    "C-5: Implement naturalistic teaching procedures",
    "C-6: Implement task analyzed chaining procedures",
    "C-7: Implement discrimination training",
    "C-8: Implement stimulus control transfer procedures",
    "C-9: Implement prompt and prompt fading procedures",
    "C-10: Implement generalization and maintenance procedures",
  ],
  "Behavior Reduction": [
    "D-1: Identify the essential components of a written behavior reduction plan",
    "D-2: Describe common functions of behavior",
    "D-3: Implement interventions based on modification of antecedents",
    "D-4: Implement differential reinforcement procedures",
    "D-5: Implement extinction procedures",
    "D-6: Implement crisis/emergency procedures according to protocol",
  ],
  Documentation: [
    "E-1: Effectively communicate with supervisors",
    "E-2: Actively seek clinical direction from supervisor",
    "E-3: Report other variables that might affect client",
    "E-4: Comply with requirements for data collection",
    "E-5: Comply with supervisory requirements",
  ],
  "Professional Scope": [
    "F-1: Describe the BACB's RBT supervision requirements",
    "F-2: Respond appropriately to feedback and maintain supervision",
    "F-3: Communicate with stakeholders about skill acquisition",
    "F-4: Maintain professional boundaries",
    "F-5: Maintain client dignity",
  ],
}

export default function Page() {
  const [step, setStep] = useState(1)
  const [language, setLanguage] = useState<Language>("English")
  const [examType, setExamType] = useState<ExamType>("RBT")
  const [mode, setMode] = useState<Mode>("tutor")
  const [category, setCategory] = useState("")
  const [subTopicIndex, setSubTopicIndex] = useState(0)

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang)
    setStep(2)
  }

  const handleExamTypeSelect = (type: ExamType) => {
    setExamType(type)
    setStep(3)
  }

  const handleCategorySelect = (cat: string, selectedMode: Mode) => {
    setCategory(cat)
    setMode(selectedMode)
    setSubTopicIndex(0)
    setStep(4)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const getCurrentSubTopics = () => {
    if (examType === "BCBA") {
      return bcbaSubTopics[category] || []
    } else {
      return rbtSubTopics[category] || []
    }
  }

  const advanceSubTopic = () => {
    const subTopics = getCurrentSubTopics()
    if (subTopicIndex < subTopics.length - 1) {
      setSubTopicIndex(subTopicIndex + 1)
    } else {
      // Loop back to beginning when all sub-topics completed
      setSubTopicIndex(0)
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
      {step === 1 && <LanguageSelection onSelect={handleLanguageSelect} />}
      {step === 2 && <ExamTypeSelection onSelect={handleExamTypeSelect} onBack={handleBack} language={language} />}
      {step === 3 && (
        <CategoryMenu examType={examType} onSelect={handleCategorySelect} onBack={handleBack} language={language} />
      )}
      {step === 4 && (
        <QuestionScreen
          examType={examType}
          category={category}
          mode={mode}
          onBack={handleBack}
          language={language}
          subTopics={getCurrentSubTopics()}
          currentSubTopicIndex={subTopicIndex}
          onNextSubTopic={advanceSubTopic}
        />
      )}
    </div>
  )
}
