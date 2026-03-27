export interface MCPTool {
  name: string
  description: string
  inputSchema: { type: "object"; properties: Record<string, any>; required: string[] }
}

export const ABA_SENSEI_TOOLS: MCPTool[] = [
  {
    name: "generate_question",
    description: "Generate a BCBA or RBT exam practice question with clinical scenario.",
    inputSchema: {
      type: "object",
      properties: {
        exam_level: { type: "string", enum: ["BCBA", "RBT"], default: "BCBA" },
        difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"], default: "Medium" }
      },
      required: []
    }
  },
  {
    name: "explain_concept",
    description: "Explain an ABA concept using the Socratic method.",
    inputSchema: {
      type: "object",
      properties: { topic: { type: "string" } },
      required: ["topic"]
    }
  },
  {
    name: "create_flashcards",
    description: "Create study flashcards for ABA exam prep.",
    inputSchema: {
      type: "object",
      properties: { topic: { type: "string" }, count: { type: "number", default: 5 } },
      required: ["topic"]
    }
  },
  {
    name: "chat",
    description: "ABA tutoring conversation.",
    inputSchema: {
      type: "object",
      properties: { message: { type: "string" } },
      required: ["message"]
    }
  }
]

