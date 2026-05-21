const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.OPENAI_MODEL || "gpt-5";
const API_KEY = process.env.OPENAI_API_KEY;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
    const size = chunks.reduce((total, item) => total + item.length, 0);
    if (size > 32_000) {
      throw new Error("Request is too large.");
    }
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function buildMentorInput(body) {
  const lesson = body.lesson || {};
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  const completedGoals = Array.isArray(body.completedGoals) ? body.completedGoals : [];

  return [
    ...history.map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: String(item.content || "").slice(0, 1200),
    })),
    {
      role: "user",
      content: [
        `Student question: ${String(body.question || "").trim()}`,
        `Current topic: ${String(body.topic || "General")}`,
        `Current lesson: ${String(lesson.title || "Not selected")}`,
        `Mini-project: ${String(lesson.projectTitle || "Not selected")}`,
        `Completed daily goals: ${completedGoals.join(", ") || "none yet"}`,
      ].join("\n"),
    },
  ];
}

function extractAnswer(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const pieces = [];

  for (const item of data.output || []) {
    for (const content of item.content || []) {

      if (content.type === "output_text") {

        if (typeof content.text === "string") {
          pieces.push(content.text);
        }

        else if (content.text && typeof content.text.value === "string") {
          pieces.push(content.text.value);
        }

      }

    }
  }

  return pieces.join(" ").trim();
}
async function handleMentor(request, response) {
  if (!API_KEY) {
    sendJson(response, 500, {
      error: "OPENAI_API_KEY is not set. Add it to your terminal environment, then restart the server.",
    });
    return;
  }

  let body;
  try {
    body = await readJson(request);
  } catch {
    sendJson(response, 400, { error: "Send a valid JSON request." });
    return;
  }

  const question = String(body.question || "").trim();
  if (!question) {
    sendJson(response, 400, { error: "Ask a question before sending." });
    return;
  }

  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      instructions: [
        "You are a practical AI mentor and productivity coach for a beginner.",
        "Teach AI, web development, freelancing, prompt engineering, automation, and Pinterest affiliate marketing step by step.",
        "Answer clearly and directly. Avoid motivational fluff.",
        "Use this structure when useful: concept, example, exercise, correction or next action.",
        "Push the student toward finishing projects instead of consuming content.",
        "Keep answers concise: 4 to 8 short sentences unless the student asks for depth.",
      ].join(" "),
      input: buildMentorInput(body),
      

    }),
  });

  const data = await apiResponse.json().catch(() => ({}));
  if (!apiResponse.ok) {
    sendJson(response, apiResponse.status, {
      error: data.error?.message || "OpenAI API request failed.",
    });
    return;
  }

  const answer = extractAnswer(data);
console.log(JSON.stringify(data, null, 2));

sendJson(response, 200, {
  message: answer || "I could not produce an answer.",
  model: MODEL,
});
 
  });
}

async function serveStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = decodeURIComponent(requestUrl.pathname);
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(ROOT, `.${safePath}`);

  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": type });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/api/health") {
      sendJson(response, 200, { ok: true, model: MODEL, hasApiKey: Boolean(API_KEY) });
      return;
    }

    if (request.method === "POST" && request.url === "/api/mentor") {
      await handleMentor(request, response);
      return;
    }

    if (request.method === "GET" || request.method === "HEAD") {
      await serveStatic(request, response);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error." });
  }
});

server.listen(PORT, () => {
  console.log(`AI mentor dashboard running at http://localhost:${PORT}`);
  console.log(`OpenAI model: ${MODEL}`);
  console.log(API_KEY ? "OPENAI_API_KEY detected." : "OPENAI_API_KEY is not set yet.");
});
