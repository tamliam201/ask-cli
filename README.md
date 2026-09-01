# ask-cli

Ask a question from your terminal and get an answer back from Claude.

`ask-cli` is a small Node script that takes a question as a command-line
argument, sends it to the Anthropic Messages API, and prints the formatted
answer along with how many tokens the request used. It remembers the last few
exchanges, so follow-up questions work.

## Requirements

- **Node.js 18 or newer** — download the LTS installer from [nodejs.org](https://nodejs.org)
- **An Anthropic API key** — create one at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

The API key is separate from a Claude.ai subscription and requires prepaid
credit on your Anthropic account. A typical question with this script costs a
fraction of a cent.

> **Create the key from inside a workspace.** In the console, switch into a
> workspace first (top-left switcher), *then* go to API keys. Keys created at
> the account level are "identity-linked" and fail every request until you also
> send a workspace id — see Troubleshooting.

## Setup

```bash
git clone https://github.com/tamliam201/ask-cli.git
cd ask-cli
npm install
```

## Configuration

The script reads your API key from the `ANTHROPIC_API_KEY` environment
variable. The key is never stored in this repository.

**Git Bash, macOS, or Linux:**

```bash
read -rs ANTHROPIC_API_KEY && export ANTHROPIC_API_KEY
```

Press Enter, paste the key, press Enter again. Nothing is echoed, so the key
stays out of your scrollback and out of `~/.bash_history`.

**Windows PowerShell:**

```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-your-key-here"
```

> **Note:** this only lasts for the current terminal window. If you open a new
> terminal, you'll need to set it again. To make it permanent, add an `export`
> line to your `~/.bashrc` file.

## Usage

```bash
node ask.js "your question here"
```

Quote your question. Without quotes, the shell splits it into separate
arguments and punctuation like `?` can be interpreted as a wildcard. If your
prompt changes from `$` to `>`, the closing quote is missing — press Ctrl+C and
retype it.

### Conversation memory

The last **6 exchanges** are saved to `.history.json` beside the script and
sent along with each new question, so you can ask follow-ups:

```bash
node ask.js "what is the fishing like near Shaw Island?"
node ask.js "I'd be kayaking, not on a boat"
```

Older exchanges fall off automatically. To start fresh:

```bash
node ask.js --reset
```

The history file is gitignored — it holds your conversations and never leaves
your machine.

### Example

```
$ node ask.js "What is an API endpoint?"

Q: What is an API endpoint?

A specific URL where a client sends a request to interact with one resource or
function of an application. Each endpoint supports one or more HTTP methods
(GET, POST, PUT, DELETE) that determine what action is performed.

— 23 in / 144 out · 0 prior turns
```

The last line reports input tokens sent, output tokens received, and how many
prior exchanges were included. Output tokens are billed at a higher rate than
input tokens.

## Cost

Three things keep the per-question cost down:

- **A concise system prompt.** Output tokens are five times the price of input
  tokens and dominate the bill, so the script asks for direct answers without
  preamble or filler.
- **Medium reasoning effort.** Terminal questions rarely need maximum
  deliberation. This cuts internal reasoning tokens with no noticeable quality
  loss at this scale.
- **A 6-exchange history cap.** Conversation history is resent in full on every
  request, so an uncapped history would make cost grow quadratically. Capping it
  keeps cost flat no matter how long you keep talking.

Prompt caching is also enabled, which bills repeated history at a tenth of the
normal input rate once the conversation is long enough to cache. When a cache
hit occurs, the usage line reports it.

## How it works

1. Reads your question from the command-line arguments.
2. Checks that `ANTHROPIC_API_KEY` is set, and exits with a clear message if not.
3. Loads `.history.json` if it exists and trims it to the last 6 exchanges. A
   missing or corrupt file is treated as an empty history rather than an error.
4. Sends the history plus your new question to the Messages API using the
   official `@anthropic-ai/sdk` package.
5. The API returns a `content` array that can hold several block types. The
   script filters for blocks of type `"text"` and prints those — the answer is
   not always the first item in the array.
6. Writes the exchange back to `.history.json`, storing the response blocks
   unchanged so the conversation can continue correctly on the next run.

## Troubleshooting

| Problem | Cause and fix |
| --- | --- |
| `ANTHROPIC_API_KEY is not set` | The variable isn't set in this terminal window. Run the command from Configuration. |
| `400` mentioning `anthropic-workspace-id` | The key is identity-linked, meaning it was created at the account level and isn't tied to one workspace. A key's type can't be changed. Switch into a workspace in the console, create a new key from there, and delete the old one. |
| `401` / `authentication_error` | The key is wrong or incomplete. Anthropic shows a key in full only once, at creation — if you copied it from the key list afterwards you copied a masked stub. Create a new key and copy it from the creation dialog. |
| `Cannot find module '...\ask.js'` | You're in the wrong directory. `cd` into the `ask-cli` folder before running. |
| Prompt shows `>` instead of `$` | An unclosed quote. Press Ctrl+C and retype the command with both quotes. |
| `Usage: node ask.js "your question here"` | No question was passed. Put your question in quotes after the filename. |
| `400` mentioning credit balance | The API key is valid but the account has no credit. Add credit in the Anthropic console. |
| Claude doesn't remember something you said | The exchange fell outside the 6-exchange window, or history was cleared with `--reset`. |

## License

ISC
