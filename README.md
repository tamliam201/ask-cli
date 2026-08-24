# ask-cli

Ask a question from your terminal and get an answer back from Claude.

`ask-cli` is a small Node script that takes a question as a command-line
argument, sends it to the Anthropic Messages API, and prints the formatted
answer along with how many tokens the request used.

## Requirements

- **Node.js 18 or newer** — download the LTS installer from [nodejs.org](https://nodejs.org)
- **An Anthropic API key** — create one at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

The API key is separate from a Claude.ai subscription and requires prepaid
credit on your Anthropic account. A typical question with this script costs a
fraction of a cent.

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
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

**Windows PowerShell:**

```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-your-key-here"
```

> **Note:** this only lasts for the current terminal window. If you open a new
> terminal, you'll need to set it again. To make it permanent, add the `export`
> line to your `~/.bashrc` file.

## Usage

```bash
node ask.js "your question here"
```

Quote your question. Without quotes, the shell splits it into separate
arguments and punctuation like `?` can be interpreted as a wildcard.

### Example

```
$ node ask.js "What is an API endpoint?"

Q: What is an API endpoint?

An API endpoint is a specific URL where a client can send a request to
interact with a particular resource or function of an application. Each
endpoint typically supports one or more HTTP methods (like GET, POST, PUT,
or DELETE) that determine what action is performed on that resource.

— 23 in / 144 out
```

The last line reports token usage: input tokens sent, output tokens received.
Output tokens are billed at a higher rate than input tokens.

## How it works

1. Reads your question from the command-line arguments.
2. Checks that `ANTHROPIC_API_KEY` is set, and exits with a clear message if not.
3. Sends a single message to the Messages API using the official
   `@anthropic-ai/sdk` package.
4. The API returns a `content` array that can hold several block types. The
   script filters for blocks of type `"text"` and prints those — the answer is
   not always the first item in the array.

## Troubleshooting

| Problem | Cause and fix |
| --- | --- |
| `ANTHROPIC_API_KEY is not set` | The variable isn't set in this terminal window. Run the `export` command from Configuration. |
| `401` / `authentication_error` | The key is wrong or incomplete. Anthropic shows a key in full only once, at creation — if you copied it from the key list afterwards you copied a masked stub. Create a new key and copy it from the creation dialog. |
| `Usage: node ask.js "your question here"` | No question was passed. Put your question in quotes after the filename. |
| `400` mentioning credit balance | The API key is valid but the account has no credit. Add credit in the Anthropic console. |

## License

ISC
