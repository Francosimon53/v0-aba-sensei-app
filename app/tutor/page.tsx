"use client"

import { Suspense } from "react"
import TutorChatContent from "./tutor-chat-content"

export default function AITutorChatPage() {
  return (
    <Suspense fallback={<TutorLoadingFallback />}>
      <TutorChatContent />
    </Suspense>
  )
}

function TutorLoadingFallback() {
  return (
    <div className="flex flex-col h-screen bg-slate-950 items-center justify-center">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-slate-400 text-sm">Loading tutor...</p>
    </div>
  )
}
