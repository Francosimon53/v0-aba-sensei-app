import { type NextRequest, NextResponse } from "next/server"
import { ABA_SENSEI_TOOLS } from "./tools"

export const runtime = "nodejs"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET() {
  return NextResponse.json({ status: "ok", server: "aba-sensei", version: "1.0.0" }, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  const { jsonrpc, id, method, params } = await request.json()

  if (jsonrpc !== "2.0") {
    return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid Request" } }, { status: 400, headers: corsHeaders })
  }

  if (method === "initialize") {
    return NextResponse.json({ jsonrpc: "2.0", id, result: { protocolVersion: "2024-11-05", serverInfo: { name: "aba-sensei", version: "1.0.0" }, capabilities: { tools: {} } } }, { headers: corsHeaders })
  }

  if (method === "tools/list") {
    return NextResponse.json({ jsonrpc: "2.0", id, result: { tools: ABA_SENSEI_TOOLS } }, { headers: corsHeaders })
  }

  if (method === "tools/call") {
    const { name, arguments: args = {} } = params
    const baseUrl = "https://abasensei.app"
    
    let action = "chat", body: any = { message: args.message || args.topic, examLevel: args.exam_level?.toLowerCase() || "bcba" }
    
    if (name === "generate_question") { action = "practice"; body.category = args.category; body.difficulty = args.difficulty }
    else if (name === "explain_concept") { action = "explain"; body.topic = args.topic }
    else if (name === "create_flashcards") { action = "flashcards"; body.topic = args.topic }

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body })
    })

    const result = await response.json()
    return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] } }, { headers: corsHeaders })
  }

  return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } }, { status: 404, headers: corsHeaders })
}

