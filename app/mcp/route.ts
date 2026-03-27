// MCP Tool Definitions for ABA Sensei
export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: "object"
    properties: Record<string, any>
    required: string[]
  }
}

export const ABA_SENSEI_TOOLS: MCPTool[] = [
  {
    name: "generate_question",
    description: "Generate a BCBA or RBT certification exam practice question with detailed explanations.",
    inputSchema: {
      type: "object",
      properties: {
        exam_level: { type: "string", enum: ["BCBA", "RBT"], default: "BCBA" },
        category: { type: "string", default: "all" },
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
      properties: {
        topic: { type: "string", description: "The ABA concept to explain" },
        exam_level: { type: "string", enum: ["BCBA", "RBT"], default: "BCBA" }
      },
      required: ["topic"]
    }
  },
  {
    name: "create_flashcards",
    description: "Create study flashcards for ABA exam preparation.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string" },
        count: { type: "number", default: 5 },
        exam_level: { type: "string", enum: ["BCBA", "RBT"], default: "BCBA" }
      },
      required: ["topic"]
    }
  },
  {
    name: "chat",
    description: "Have a tutoring conversation about ABA concepts.",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string" },
        exam_level: { type: "string", enum: ["BCBA", "RBT"], default: "BCBA" }
      },
      required: ["message"]
    }
  }
]

