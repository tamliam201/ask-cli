import Anthropic from "@anthropic-ai/sdk";

const question = process.argv.slice(2).join(" ");

if (!question) {
  console.error('Usage: node ask.js "your question here"');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set. See the README.");
  process.exit(1);
}

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-opus-5",
  max_tokens: 16000,
  messages: [{ role: "user", content: question }],
});

const answer = response.content
  .filter((block) => block.type === "text")
  .map((block) => block.text)
  .join("\n");

console.log(`\nQ: ${question}\n`);
console.log(`${answer}\n`);
console.log(`— ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`);
