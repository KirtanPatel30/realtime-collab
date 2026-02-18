import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const safeText = text.slice(0, 12000);

    const prompt = `
You are an AI assistant inside a realtime collaborative editor.

Return:
1) Summary (5 bullets)
2) Action items (checkbox bullets)
3) Key decisions (if any)

DOCUMENT:
${safeText}
`.trim();

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 60000); // ✅ 60s

    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "llama3",
        prompt,
        stream: false,
        options: {
          num_predict: 220,
          temperature: 0.2,
        },
      }),
    });

    clearTimeout(t);

    if (!response.ok) {
      const msg = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `Ollama error: ${response.status} ${msg}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ summary: data?.response ?? "" });
  } catch (err: any) {
    const isTimeout = String(err?.name).includes("AbortError");
    return NextResponse.json(
      { error: isTimeout ? "Ollama timed out (60s)" : "AI error" },
      { status: 500 }
    );
  }
}
