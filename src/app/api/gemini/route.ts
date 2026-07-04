import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize the Gemini client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function POST(req: NextRequest) {
  try {
    const { action, prompt, currentFile, fileTree, selectedCode, chatHistory } = await req.json();

    if (!action) {
      return NextResponse.json({ error: "Missing 'action' parameter" }, { status: 400 });
    }

    let systemInstruction = "You are NEXUS AI, an expert software engineering assistant integrated directly into NEXUS IDE, a professional browser-based development environment. Keep your responses concise, accurate, and direct.";
    let contents: any[] = [];

    // Construct the context of the workspace
    const workspaceContext = fileTree 
      ? `Virtual Workspace Files:\n${JSON.stringify(fileTree, null, 2)}`
      : "";

    const activeFileContext = currentFile
      ? `Active File: ${currentFile.path}\nLanguage: ${currentFile.language || "text"}\nContent:\n\`\`\`${currentFile.language || ""}\n${currentFile.content}\n\`\`\``
      : "";

    if (action === "chat") {
      systemInstruction = `You are NEXUS AI, a cutting-edge software engineer and AI coding assistant.
You are embedded in NEXUS IDE. Provide highly accurate, production-ready code blocks and explanation.
Use clean markdown formatting. If generating code, explain the changes briefly.
Context of the virtual workspace:
${workspaceContext}

${activeFileContext}
`;
      
      // If there is chat history, parse it into Gemini's contents format
      if (chatHistory && Array.isArray(chatHistory)) {
        chatHistory.forEach((msg: { role: string; content: string }) => {
          contents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
          });
        });
      }
      contents.push({
        role: "user",
        parts: [{ text: prompt }],
      });

    } else if (action === "complete") {
      systemInstruction = `You are an inline code autocompletion engine. Your goal is to continue writing the code at the cursor.
Do NOT explain the code. Do NOT output markdown formatting (like triple backticks).
Only output the EXACT text/code that should be inserted directly at the cursor to complete the line or block.
Be extremely precise. 

Active File Context:
${activeFileContext}

Cursor position context or instruction:
${prompt}
`;
      contents = [{ role: "user", parts: [{ text: "Provide the code continuation." }] }];

    } else if (action === "explain") {
      systemInstruction = `You are NEXUS AI inside NEXUS IDE. Explain the following code snippet simply and concisely in a few bullet points.
Active File Context:
${activeFileContext}
`;
      contents = [{ role: "user", parts: [{ text: `Explain this highlighted code:\n\`\`\`\n${selectedCode}\n\`\`\`` }] }];

    } else if (action === "fix") {
      systemInstruction = `You are NEXUS AI inside NEXUS IDE. Analyze the selected code for any syntax errors, logical bugs, security flaws, or bad practices.
Return your explanation and then provide the corrected code wrapped in a clean code block.
Active File Context:
${activeFileContext}
`;
      contents = [{ role: "user", parts: [{ text: `Identify and fix bugs in this highlighted code:\n\`\`\`\n${selectedCode}\n\`\`\`` }] }];

    } else if (action === "terminal") {
      systemInstruction = `You are the terminal shell helper inside NEXUS IDE. The user is asking a terminal-specific question or running an AI command.
Keep your answer extremely brief and shell-oriented.
Context of files in workspace:
${workspaceContext}
`;
      contents = [{ role: "user", parts: [{ text: prompt }] }];

    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    let response;
    let lastError: any = null;
    const modelsToTry = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-1.5-flash"];

    for (const model of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: action === "complete" ? 0.1 : 0.4, // lower temperature for precise autocompletion
          },
        });
        if (response) {
          lastError = null;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${model} failed, trying fallback...`, err);
        lastError = err;
      }
    }

    if (lastError) {
      const errMessage = lastError.message || String(lastError);
      if (
        errMessage.includes("429") || 
        errMessage.includes("quota") || 
        errMessage.includes("limit") || 
        errMessage.includes("RESOURCE_EXHAUSTED") || 
        errMessage.includes("Quota exceeded")
      ) {
        return NextResponse.json({
          error: "⚠️ API Quota Exceeded (429): The default free-tier API quota for Gemini 3.5 Flash is temporarily exhausted. Please wait 10-15 seconds and try again, or configure your own premium API key inside Google AI Studio's Secrets panel to experience continuous, uninterrupted, professional coding!"
        }, { status: 429 });
      }
      throw lastError;
    }

    return NextResponse.json({ result: response?.text || "" });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during content generation" },
      { status: 500 }
    );
  }
}
