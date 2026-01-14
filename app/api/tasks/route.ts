import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export interface Task {
  id: string
  task_id: string
  task_text: string
  domain: string
  exam_level: string
  keywords: string | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const examLevel = searchParams.get("examLevel")?.toLowerCase() // 'bcba' or 'rbt'
  const domain = searchParams.get("domain") // 'A', 'B', 'C', etc.

  if (!examLevel || !domain) {
    return NextResponse.json({ error: "examLevel and domain are required" }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("knowledge_chunks")
      .select("id, task_id, task_text, domain, exam_level, keywords")
      .eq("exam_level", examLevel)
      .eq("domain", domain)
      .order("task_id", { ascending: true })

    if (error) {
      console.error("[v0] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tasks: data || [] })
  } catch (error) {
    console.error("[v0] Error fetching tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}
