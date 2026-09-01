import Anthropic from "@anthropic-ai/sdk";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The whole conversation is resent on every request, so an uncapped history
// makes each question progressively more expensive. Six exchanges is enough
// for follow-ups without the cost climbing.
const MAX_TURNS = 6;

const HISTORY_FILE = join(dirname(fileURLToPath(import.meta.url)), ".history.json");

const SYSTEM_PROMPT = `You are answering questions in a terminal. Be concise and direct.

Lead with the answer. Do not restate the question and do not open with a preamble.
Prefer plain prose; use a list only when the content is genuinely a set of parallel
items. Skip the closing offer of further help unless you need a specific missing
detail in order to answer at all.`;

const args = process.argv.slice(2);

if (args[0] === "--reset") {
  if (existsSync(HISTORY_FILE)) rmSync(HISTORY_FILE);
  console.log("Conversation history cleared.");
  process.exit(0);
}

const question = args.join(" ");

if (!question) {
  console.error('Usage: node ask.js "your question here"');
  console.error("       node ask.js --reset");
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set. See the README.");
  process.exit(1);
}

// A missing, corrupt, or hand-edited history file shouldn't block the question.
function loadHistory() {
  if (!existsSync(HISTORY_FILE)) return [];
  try {
    const parsed = JSON.parse(readFileSync(HISTORY_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// The API requires the first message to be from the user, so walk forward to
// one instead of slicing blindly at the turn boundary.
function trim(messages) {
  const recent = messages.slice(-MAX_TURNS * 2);
  while (recent.length && recent[0].role !== "user") recent.shift();
  return recent;
}

const history = trim(loadHistory());

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-opus-5",
  max_tokens: 16000,
  system: SYSTEM_PROMPT,
  output_config: { effort: "high" },
  // Caches the conversation prefix, which is resent in full every turn. Reads
  // are billed at a tenth of the normal input rate.
  cache_control: { type: "ephemeral" },
  messages: [...history, { role: "user", content: question }],
});

const answer = response.content
  .filter((block) => block.type === "text")
  .map((block) => block.text)
  .join("\n");

// Store the response blocks unchanged — thinking blocks have to be replayed
// as-is when the conversation continues on the same model.
const updated = trim([
  ...history,
  { role: "user", content: question },
  { role: "assistant", content: response.content },
]);

writeFileSync(HISTORY_FILE, JSON.stringify(updated, null, 2));

console.log(`\nQ: ${question}\n`);
console.log(`${answer}\n`);

const { input_tokens, output_tokens, cache_read_input_tokens } = response.usage;
const cached = cache_read_input_tokens ? `, ${cache_read_input_tokens} cached` : "";
const priorTurns = Math.floor(history.length / 2);
console.log(`— ${input_tokens} in${cached} / ${output_tokens} out · ${priorTurns} prior turns`);
