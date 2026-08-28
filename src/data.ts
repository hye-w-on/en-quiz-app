export type QuizItem = {
  sentence: string;
  translation: string;
  source: string;
};

export type QuizSection = {
  id: string;
  title: string;
  items: QuizItem[];
};

const source = "Production-Grade Prompting, Agents & Tool Use - Prompting Craft";

const item = (sentence: string, translation: string): QuizItem => ({
  sentence,
  translation,
  source
});

export const sourceText = `2. Production-Grade Prompting, Agents & Tool Use

2-1. Prompting Craft
System prompts, XML, few-shot, and output constraints

2-1-1. Four techniques that give Claude a reliable output shape

When a first-pass response misses, the instinct is often to add more words to the prompt and run it again. However, that instinct can make the problem harder to isolate and rarely fixes it. Rewording changes how you say something but does not add to the structural piece of the prompt that's missing. For example, if Claude is crossing the boundary between your instructions and your input data, clearer phrasing will not fix it, and if the output format keeps drifting, "please format this correctly" will not fix it either.
The failure mode tells you which of the four techniques is absent. Diagnose how your prompt is failing first, then add the specific technique that addresses that failure. The four techniques themselves are defined in full further down this screen.

What you observed: The result comes back in the wrong shape: a sentence where you expected a label, prose where you expected JSON.
What the prompt is missing: An output constraint. The prompt never specified the form, field names, or stopping point of the response.
Why this technique is the fix: An output constraint controls the form of the response independent of its content. Without one, Claude returns plausible text that the downstream parser was not built to accept.

What you observed: The content is off: scope drifts, tone shifts, or Claude answers a wider question than you asked, and it gets worse deeper into the conversation.
What the prompt is missing: A system prompt, or a more specific one. The behavioral contract was too vague to hold across turns.
Why this technique is the fix: The system prompt sets the rules that apply to every response regardless of the user turn. When it is underspecified, there is nothing holding role, scope, and format steady as the conversation runs on.

What you observed: The task is right, but the structure is invented: Claude understood what to do and produced output in a shape you never asked for.
What the prompt is missing: Few-shot examples. Claude cannot infer an exact structure from a description alone.
Why this technique is the fix: Few-shot examples show the pattern rather than describe it. One correct input-output pair gives Claude the exact shape to match, which a written instruction often fails to pin down.

What you observed: Output is clean on the inputs you tested but breaks on a variant: an edge case, an unusual field, an input you did not anticipate.
What the prompt is missing: A constraint covering the variant. The prompt handles the happy path and has no rule for the case the parser breaks on.
Why this technique is the fix: The prompt was validated against a narrow set of inputs. Naming the variant in the constraint, or adding an example that covers it, closes the gap the test inputs never exposed.

2-1-2. Diagnosing a classification prompt that returns the wrong output shape

The rule is simple: name the failure, add the one technique that matches it, and re-run it. If it still fails, diagnose again. When a prompt keeps getting longer with every pass, that's the sign you're skipping the diagnosis step and just adding words.
The pattern below is the first row of the table in action: a prompt that produces the right content in a shape the downstream code cannot accept. The classifier understands the task and returns the correct category, but the form of that answer varies from run to run, so the router that consumes it fails. The missing piece is an output constraint, and the fix pulls in two of the other techniques to lock the label set and show the format. The walkthrough moves from the bare prompt that causes the problem to the constrained version that resolves it.

Worked example: a classification prompt before and after

A developer needs Claude to classify support tickets into three categories: billing, technical, and escalation. The first prompt is a bare instruction with no constraint on the output:

System: "You are a support classifier. Classify the ticket." User: <ticket>I was charged twice for the same month.</ticket>"

Claude returns "Billing" on some runs, "billing" on others, and occasionally a full sentence like "This looks like a billing issue." The downstream router expects one of a fixed set of labels and breaks on the inconsistency.
Read this against the table above, this situation matches what is described in the first row: the output comes back in a shape the parser cannot accept, so the missing piece is an output constraint. Adding that constraint pulls in two more techniques, because locking the label set and showing the format are jobs those techniques do better than a written instruction can. Few-shot examples show Claude the exact label and casing to return, and XML tags keep those examples separate from the instruction so Claude does not read them as part of the task:

System: "You are a support classifier. Classify each ticket into exactly one of: BILLING, TECHNICAL, ESCALATION. Return only the label. No other text."

<sample_input>My account shows two charges for April.</sample_input>
<ideal_output>BILLING</ideal_output>

<sample_input>The API keeps returning a 429 error.</sample_input>
<ideal_output>TECHNICAL</ideal_output>

User: <ticket>I was charged twice for the same month.</ticket>

Three techniques are doing distinct work here. The system prompt sets the output contract: exactly one label from a fixed set, nothing else. The XML tags mark where each example ends and the next begins, so Claude does not read the examples as part of the instruction. The few-shot pairs show the exact casing and format rather than describing it. Together they produce a result consistent enough to route programmatically.
The table below shows how we can stack all the four techniques together, where the prompt should be simplified, and where we should diagnose before adding more before too many iterations.

Stack all four techniques: Stacking all four techniques against a clearly defined output contract. Tasks with well-specified formats and edge cases that can be covered by examples.
Simplify the prompt: Adding all four techniques to a simple task that only needs one. A "summarize this paragraph" prompt does not need few-shot examples and an output schema.
Diagnose before adding more: Prompts that are growing longer with each iteration rather than more precise. If you have re-prompted five times and the output is still wrong, diagnose the failure type before adding more text.

2-1-3. When to reach for each technique
Now, let's understand more about each of these techniques and when each one applies:

1. System prompts : System prompts carry the behavioral contract for the whole session. Write them once and treat them as your persistent instruction layer. They define Claude's role, the output format, and any rules that must not change between conversations.
2. XML tags : XML tags are used when the prompt mixes inputs with instructions. A prompt that asks Claude to debug code using provided documentation is a good example; without tags, the code and the documentation look the same to Claude. Wrap them with descriptive tag names like <my_code> and <docs> and the boundary becomes unambiguous. You do not need to use official XML tag names; descriptive names that match your content work best.
3. Few-shot examples : Few-shot examples are considered useful because they show rather than just tell. Instead of trying to describe the exact format you want, you provide one correct input-output pair and let Claude infer the pattern. To use this, wrap examples using consistent XML structure, for instance <sample_input> and <ideal_output>, so the boundary between example and prompt is clear. You can use some examples from your highest-scoring evaluation outputs rather than writing them from scratch.
4. Output constraints : Output constraints are the last line of defense before Claude's response reaches your parser. You should specify exactly what you need, including field names, types, length limits, whether to include preamble, and what to do when data is absent. Use structured output features in cases when the format must be machine-readable.

2-1-4. The iteration loop: Diagnosing before re-prompting

When a first-pass response misses the mark, the instinct is to add more words to the prompt and try again. That instinct almost always makes the problem harder to diagnose and rarely fixes it.
Instead, diagnose the problem first, and then re-prompt based on your findings. The failure type tells you which technique is missing:

* Wrong format: This is caused due to a missing output constraint. The prompt never specified what shape the result should take.
* Wrong content or scope drift: This is caused due to an underspecified system prompt; the behavioral contract was too vague to hold across conversations.
* Correct task but hallucinated structure: This happens when few-shot examples are needed. Claude cannot infer the exact structure from a description alone.
* Good output on simple inputs but breaks on edge cases: The prompt handles the happy path but has no constraint covering the variant the parser breaks on.

The fix is structural, not a matter of phrasing. For example, if Claude is ignoring a boundary between your instructions and your content, clearer wording will not fix it, and if the output format keeps drifting, saying "please format this correctly" will not fix it either. In each case, identify which of the four techniques is absent and add it.

2-1-5. Moving output control from the prompt into the API with structured outputs

Everything up to this point shapes the output by writing instructions into the prompt and hoping Claude follows them. That works most of the time, but the prompt is a request, so a model can still return a stray sentence, a wrong field name, or malformed JSON that breaks the parser downstream.
The Claude API has a separate mechanism that removes that gap for production code. It is called structured outputs, and instead of asking for a shape in words, you hand the API a JSON schema, and the model is constrained at generation time to produce output that matches it. This technique is constrained decoding: as Claude generates each token, the API only allows tokens that keep the output valid against your schema, so a response that violates the schema cannot be produced in the first place.
Structured outputs cover two situations that show up in real pipelines. Each one constrains a different part of what the model returns, and you can use them on their own or together in the same request.

* JSON outputs constrain the final response. You set the output_config.format parameter with type json_schema and your schema, and Claude returns valid JSON in the response text that matches that schema every time. Reach for this when the model itself is producing the structured payload your code consumes, like extracting fields from a support ticket or formatting an API response, because it removes the parse-and-retry code you would otherwise write around every call.
* Strict tool use constrains the inputs Claude passes to your tools. You set strict to true on a tool definition, and the arguments Claude sends to that tool are validated against the input schema before your code runs. Reach for this in agentic loops where a malformed tool argument would crash the function or trigger a wrong action; this helps guarantee the call your code receives already conforms to the contract you defined.

The reason this belongs in the production code and not just in the prompt is because of reliability under inputs you did not test. A prompt-level instruction to return only JSON holds on the cases you tried and then slips on an edge case you did not, which is the exact failure the earlier classification example walked through. A schema constraint does not slip, because the API enforces it on every token rather than trusting the model to remember the instruction. That moves output correctness from something you verify after the fact to something the API rules out before it happens.
Constraining generation has costs, and a developer choosing this in production needs to weigh them rather than enabling it everywhere by default. Below are some of those costs you must consider:

* The first request on a new schema is slower. The API compiles your schema into a grammar before it can constrain output, and that compilation adds latency on the first call. Compiled grammars are cached for 24 hours from last use, so steady traffic on a stable schema pays the cost once, but a workload that changes schemas constantly pays it repeatedly.
* Your input token count rises. When structured outputs are on, the API adds a system prompt describing the expected format, and that injected prompt is billed like any other input token. The increase is small per call, but it is worth knowing when you are estimating cost at volume.
* A guaranteed schema is not a guaranteed success. Two cases still return output that does not match: a refusal, where the model declines for safety reasons and the response carries stop_reason refusal, and a truncation, where the response hits the max_tokens limit and stops mid-structure with stop_reason max_tokens. Your code still checks stop_reason rather than assuming every response parses.
* It does not combine with message prefilling. JSON outputs and prefilling the assistant message are incompatible, so a pattern that starts the response for Claude and a pattern that constrains the whole response to a schema cannot run on the same request. Pick the one that fits the task.

2-2. Extended Thinking

Extended Thinking: Turning reasoning on, calibrating effort, and reading it back correctly

The prompting techniques shape what Claude produces. Extended thinking shapes how much work Claude does before it answers. Turn it on, and the model writes out its step-by-step reasoning first, then gives you the final answer. Your job is to decide when that extra work is worth the cost and to handle the reasoning it sends back.

2-2-1. What extended thinking does

When you turn on extended thinking, the model "thinks out loud" before it responds. You'll see this reasoning come back as its own thinking block in the API response, positioned just ahead of the block that holds the actual answer. On the newest models, the thinking block's content is omitted by default; you must request a readable summary through the display setting to see it.
On current models reasoning is adaptive: you enable it with the thinking parameter where it is not already on by default, and the model decides how much reasoning each request needs. You tune depth with the effort setting rather than a fixed token budget. The older budget_tokens control is deprecated and, on the newest model generations, returns a 400 error.
That reasoning isn't free; thinking tokens cost the same as output tokens, so running a simple task at high effort means paying for accuracy you don't need. The choice here mirrors the one you have already made: match the tool to the task. Don't reach for extended thinking by default, apply it strategically where needed.

2-2-2. When to use extended thinking
Task shape: Multi-step reasoning where the model has to hold several constraints at once: a math derivation, a multi-hop logic problem, planning a sequence of dependent actions.
Extended thinking call: Enable it, with the effort level matched to the depth of the problem.
Reason: The reasoning pass is where the model works through dependencies it would otherwise skip.
Task shape: Mechanical or lookup tasks: classification, format conversion, extracting a field, short factual answers.
Extended thinking call: Leave it off.
Reason: Extended thinking will not improve the answer, and you will be paying more tokens for something you didn't need. A bare prompt with an output constraint is the right tool.
Task shape: Agentic loops where the model plans across several tool calls.
Extended thinking call: Enable it and budget for the planning step rather than per call.
Reason: Reasoning before a plan reduces wrong-tool selection downstream. Note the carry-back rule below, which applies in every tool-use loop.

2-2-3. The carry-back rule: thinking blocks must return to the API unchanged

When extended thinking is on and your conversation uses tools, there's one rule you can't skip: every thinking block you get back has to go back to the API exactly as it arrived on the next turn. Each block comes with a signature that confirms the reasoning wasn't tampered with. If you edit it, summarize it, or drop it, the signature stops matching and the API rejects the request.
Redacted thinking blocks work the same way. Their contents are encrypted and not meant to be read by humans, but they still have to be returned untouched.
This is a structural requirement, not a prompting choice you get to make. The most common slip-up is stripping out the thinking block to save context, which ends up breaking your next request. If the real worry is how much context piles up from accumulated reasoning, the fix is the context-engineering work we'll cover in this module.
- Forward pointer
This lesson enables reasoning and calibrates its effort setting; it does not cover model selection. Choosing which model to run, as distinct from whether to enable reasoning, is taught in the MSO Foundations module that precedes this one.

Handles well
Hard reasoning and planning tasks where a wrong answer is expensive and the extra tokens buy accuracy.

Adds cost or complexity
The carry-back requirement in tool-use loops, and an effort setting you now must calibrate.

Use a different approach
For classification, extraction, and format tasks, a well-constrained prompt is cheaper and just as accurate.

2-3. Tool-use and Schema Design
Tool Schemas Claude Selects Correctly: Definition, Loop, and Calling Patterns

2-3-1. How the tool-use loop works
The most common misconception about tool-use is that Claude runs the tools. Instead, Claude reads your tool definitions, decides which one fits the situation, and tells your application what to call it along with the required inputs. Your application executes the tool, gets the result, and sends it back; then Claude uses that result to continue.

This back-and-forth shouldn’t be ignored in production: if your application does not handle the return correctly, Claude never gets the data it asked for, and the loop breaks. The boundary between what Claude owns and what your code owns is where most tool-use bugs live. Here is the sequence to ensure proper implementation of tool-use.

Click each step to see what happens.
1. Define schema : You define a schema with a name, a description, and an input schema. Claude reads this to decide whether and when to call the tool.
2. Send message : Your code sends a message to Claude including the tool definitions and the user's input.
3. tool_use block : Claude issues a tool-use block containing the tool name, a unique ID, and the input arguments it wants to pass. The API response comes back with stop_reason: tool_use.
4. Execute tool : Your code executes the tool using those arguments. Note that the assistant turn has already ended (Claude is not holding a connection open or waiting on your server). The model is stateless between calls. To continue, your code makes a fresh API request containing the prior messages plus the tool result.
5. Return result : You return the result in a tool-result block that references the original tool-use ID.
6. Claude continues : Claude continues using the tool result as context for its next response, either another tool-use block or a final end turn.
It’s important to note that the loop is not automatic and you need to complete the fourth step. If the miss is systematic, the fix is in the schema definition step.

2-3-2. Message block structure in a tool-use conversation
A tool-use conversation is built out of structured blocks, not plain text. Each assistant turn and user turn is a list of blocks, and four block types do the work in a tool-use session. A text block carries Claude’s prose response. A tool_use block carries a tool call, including the tool name, a unique ID, and the input arguments. A tool_result block carries what your code returned after running the tool. A thinking block carries Claude’s internal reasoning, and it only appears when extended thinking is enabled.

The API enforces a specific pairing between these blocks. Every tool_use block in an assistant turn must be answered by a tool_result block with a matching ID in the user turn that immediately follows. If the IDs don’t match, if the result is missing, or if the turns are out of order, the request fails validation. This is not something you can fix by adjusting your prompt; it’s structural, and your code has to produce the sequence correctly on every request.

The table below summarizes each block type, what it contains, and the rule that governs how your code must handle it.

Block type: text block
Role: Assistant/Claude
Contains: Claude’s prose output
Critical rule: Claude may return a text block alongside a tool_use block in the same turn. When it does, your code must preserve the full content array, including the text block, when appending that turn to conversation history. Dropping the text block corrupts the context Claude relies on for follow-up turns.

Block type: tool_use block
Role: Assistant/Claude
Contains: The tool name, a unique ID, and the input arguments Claude wants passed to your function
Critical rule: Every tool_use block must be answered by a tool_result block in the immediately following user turn. The tool_result must carry the same ID. Without that pairing, the API rejects the next request.

Block type: tool_result block
Role: User
Contains: Matching tool_use ID, the result content, and an optional is_error flag set to true when the tool call fails
Critical rule: The tool_use_id value must match the original tool_use block exactly. Claude uses this ID to connect each result back to the call that produced it, which matters when a single assistant turn issues multiple tool calls and the results arrive in a different order.

Block type: thinking block
Role: Assistant (extended thinking only)/Claude
Contains: Claude’s internal reasoning, visible only when extended thinking is enabled
Critical rule: The block must be passed back to the API unchanged in subsequent turns. The signature verifies the reasoning hasn’t been modified, so any edit or summary breaks the signature and the API rejects the message. Redacted thinking blocks follow the same rule: pass them back as received, even though the content is encrypted and not human-readable.

The critical invariant is that every tool_use block from an assistant turn must have a corresponding tool_result block in the immediately following user turn. Missing tool_result blocks, or tool_result blocks that appear in a later turn rather than the immediately following user turn, cause an API validation error.

2-3-3. Schema anatomy: What Claude reads to make a tool selection decision
A tool schema has three parts, including name, description, and input_schema. The description determines whether Claude selects the tool correctly or not.

Name: A short identifier that should be specific. For example, get_account_balance is more useful to Claude than get_data.
Description: A critical part that Claude reads to decide whether a tool is required or not. You should always write the description in two parts, including when to and when not to use the tool:
A description that says "use this to find information" will cause wrong selections because Claude cannot distinguish it from any other tool that retrieves something.
A description that says "use this to retrieve the current balance for a specific account ID and do not use this for transaction history" gives Claude an exclusion condition to work with and is appropriately descriptive.
input_schema: Defines the parameters (the inputs your tool function accepts) using JSON Schema.
You should mark parameters as required when Claude requires them to call the tool correctly.
You can mark parameters as optional when the tool can operate without them. Overlapping parameter types between tools is the most common source of wrong-tool calls.

2-3-4. Decision table: Schema design choices
The schema is what Claude reads to decide which tool to call, what arguments to pass in, and whether it has enough information to respond. A schema that’s vague, under-described, or missing required fields will produce tool calls that look syntactically correct but pick the wrong tool, pass malformed inputs, or loop unnecessarily. The five decisions below determine whether your implementation behaves predictably under real conditions. The table notes where sequential and parallel tool-calling diverge.
Decision: Subtask dependency
How to handle it: When one tool’s output feeds the next, the calls have to run in sequence because the second call cannot be built until the first result comes back. When the subtasks are independent of each other, you can structure the tool set so Claude issues multiple tool_use blocks in a single turn and your code runs them concurrently.
Why it matters: This is the one decision that changes how you design the schema. Current Claude models default to parallel calls when calls are independent. Where a real dependency exists, model it as separate turns so the first result is available before the next call is built. Use disable_parallel_tool_use to force one tool call per turn if needed.

Decision: Required fields
How to handle it: Mark a field as required only when the call doesn’t make sense without it. Place these in the required array of the input schema.
Why it matters: Marking everything required forces Claude to fabricate values for fields it has no basis to fill in. The required array is how you tell Claude which inputs are non-negotiable.

Decision: Optional fields
How to handle it: Use optional fields for parameters with sensible defaults or where absence carries meaning. Leave them out of the required array and give them defaults in the function signature.
Why it matters: Optional fields let Claude omit information it doesn’t have, instead of guessing. If a field is optional but marked required, every call must invent a value, which can cause bad inputs.

Decision: Description length
How to handle it: Write three to four sentences per tool covering what it does, when Claude should reach for it, and what it returns. Include examples of valid inputs where format matters.
Why it matters: If the description is too short, Claude guesses because there isn’t enough signal to distinguish your tool from others. If the description is too long, the trigger conditions get buried under detail Claude doesn’t reference at decision time.

Decision: Overlapping parameter types
How to handle it: When two tools accept the same parameter shape, add disambiguating language to each description that names the domain or trigger the tool is meant for.
Why it matters: Claude routes on name plus description, with parameter types as a secondary signal. When signatures are identical, routing collapses to description alone, and similar-sounding descriptions become indistinguishable.
Worked example: A schema that causes wrong-tool selection and the fix
This is an illustrative example based on common patterns observed in tool-use implementations. Tool names, descriptions, and test results are constructed to demonstrate the selection-disambiguation principle, not drawn from a specific production system.

A developer registers two tools, including search_knowledge_base and get_cached_result. The tool names are distinct, but Claude’s tool selection weighs descriptions heavily; when descriptions overlap, name alone is not sufficient to disambiguate. Both have descriptions that start with "use this to find information." Without exclusion conditions, Claude frequently selected the wrong tool on ambiguous inputs during development testing.

The problem is that both descriptions look identical to Claude at the point where the selection decision is made. The fix is adding an additional sentence per description:

search_knowledge_base: "Use this to search the knowledge base when the user asks a question that requires looking up current information. Do not use this if the result of a prior search in this session already covers the question."

get_cached_result: "Use this to retrieve a result that was already fetched during this session. Only use this if search_knowledge_base was called earlier in this conversation for the same query."
The exclusion conditions give Claude a decision rule rather than two identical-looking options. These conditions rely on complete conversation history being passed in each request. If prior turns are truncated or dropped, Claude cannot evaluate them and the exclusion logic silently fails.

Every additional tool you register increases the surface area Claude has to reason over, so this discipline only pays off when the underlying tools are distinct. The table below shows where exclusion-condition disambiguation helps and where a different approach is warranted.

Handles well
Routing Claude to the right tool reliably when descriptions are specific and exclusion conditions are stated.

Poor fit.
Two tools that do similar things and need ever-longer descriptions to keep apart: at that point, merge them into one tool with a type parameter instead.

2-3-5. When someone else has already written your tools: MCP as an alternative to manual schema authoring
Everything in the previous sections assumes you are writing the tool schemas yourself: name, description, input_schema, and the function that executes when Claude issues a tool_use block. For many integrations, you do not need to do that. The Model Context Protocol, MCP, is a standardized communication layer that moves tool definitions and execution out of your application code and into dedicated servers. When an MCP server exists for the service you want to reach, you can connect directly to the MCP server rather than building the integration yourself.

Take a GitHub integration as a concrete case. GitHub exposes repositories, pull requests, issues, projects, and more. To build a complete integration using the tool schema approach from this module, you would need to write a schema and an execution function for every piece of that functionality and maintain it as GitHub’s API evolves. An MCP server for GitHub has already done that. So, your application connects to the server, receives the full list of available tools, and Claude selects among them using the same description-based routing you have already been working with. The underlying mechanism is identical, but what changes is who wrote it and who owns the tool definitions.

How MCP fits into the tool-use loop
The loop you built earlier in this module does not change when you introduce MCP. Claude still issues a tool_use block, your application still executes the tool and returns a tool_result, and the message block pairing rules still apply. The difference is in the setup step. Instead of registering schemas you wrote, your MCP client sends a ListToolsRequest to the MCP server, receives the full tool list back, and passes those definitions to Claude. From Claude’s perspective, those tools are indistinguishable from ones you authored manually.

One practical implication worth noting: MCP servers add tool definitions to the context window even when the tools are not being used in the current turn. If you connect several servers at once, the tool definitions themselves consume budget before the first message arrives. The schema design discipline from earlier in this module applies here too. Register only the servers you are actively using, and check context cost against your window limit if you are connecting multiple servers in the same session.

If you are using the API MCP Connector, you control loading cost through an mcp_toolset object in the tools array. The mcp_toolset carries a default_config block that applies to every tool on the server, and you can override individual tools through configs keyed by tool name. Two settings matter for context cost:

The defer_loading boolean, set inside default_config or a per-tool entry in configs, delays loading a tool definition until the model needs it, which reduces upfront context cost when you connect a server with a large tool list.
The enabled boolean turns individual tools on or off, so you can register a server but expose only the tools you want the model to see. The MCP Connector requires the mcp-client-2025-11-20 beta header to be set on the request.
Without that header, the mcp_toolset configuration will not apply as described here.

The other piece worth knowing at this stage is how the client actually talks to the server. MCP runs over one of two transports, and which one you use depends on where the server lives. Local servers use stdio and your application spawns the server as a subprocess and communicates over standard input and output. Remote servers use Streamable HTTP and your application connects over the network via HTTP, using POST for client-to-server messages and an optional GET-based SSE stream for server-initiated messages. An older SSE-only transport exists but is deprecated, and new integrations should use Streamable HTTP. One constraint worth flagging if you are using Anthropic’s MCP connector in the API: only HTTP-exposed servers are supported through the connector, and stdio servers require managing the MCP client connection yourself via the SDK. Once the connection is established and tool definitions are received, your application code treats both transports identically.

Use MCP when
A well-maintained MCP server already exists for the service you need (check that it covers the specific operations you require and is actively maintained against the service’s current API. Writing and owning those schemas yourself adds implementation overhead for no additional capability. Note that the Claude API MCP Connector only supports remote servers. Local stdio servers require Claude Desktop or Claude Code as the client; they cannot be connected directly through the API.

Write schemas manually when
No MCP server covers your use case, or when you need precise control over tool scope and description quality that a general-purpose server does not provide. Before defaulting to manual schemas for scope control, note that the API MCP Connector supports allowlisting and denylisting specific tools per server via MCPToolset configuration. Manual authoring may still be warranted for description quality, but not always for scope.

Use both when
Connect to an MCP server for breadth then apply the description-tuning discipline from earlier in this module to the specific tools you are actively routing to. MCP and manual schema authoring are not mutually exclusive as the server gives you coverage, and your descriptions give you precision where it matters. Apply tool allowlisting via MCPToolset to limit the surface area Claude reasons over before layering in description tuning. Narrowing the tool set and sharpening the descriptions are two separate levers, and you should use both.

2-4. Streaming Responses
Streaming responses and handling partial output without corrupting state
Every request so far has waited for the whole response to arrive before doing anything with it. That's fine, until the response is long, or a user is sitting there staring at a blank screen. Streaming sends the response in pieces, sending them along as the model generates them. That makes things feel faster, but it also gives your code a new job: now you are tasked with assembling the final content yourself based on the series of outputs, and you need to be prepared if the series stops early.

2-4-1. What streaming changes about the response
In a non-streamed request, the API hands you one complete message with every content block, fully formed. In a streamed request, the API instead sends a series of events that describe the message as it's being built. Your code listens to that series and reassembles the blocks. The message you end up with is identical to what a non-streamed call would have given you, but the difference is that you have to assemble the pieces, and you decide what to do if the events stop before the message is finished.

It helps to know what's not happening: the model isn't holding some live object open for you. Each event is its own small message describing a single change, a block started, some text or input got added to it, a block finished, the whole message finished. Your handler takes each event and applies it to the partial state it's been building up.

2-4-2. The event sequence, and what your handler does with each
Event: message_start
What it signals: A new message is beginning. Carries the message shell with empty content and initial usage.
What your handler does: Set up an empty content array to collect blocks in.

Event: content_block_start
What it signals: A new content block is opening, with its type (text, tool_use, or thinking) and index.
What your handler does: Make a slot at that index for the named block type. A tool_use block opens with its name and id, but no input yet.

Event: content_block_delta
What it signals: An incremental piece of one block: a text fragment, a fragment of JSON input for a tool call, or a thinking fragment.
What your handler does: Append the fragment to the block at that index. Tool-call inputs arrive as a partial JSON string spread across several deltas, you can't parse them until the block closes.

Event: content_block_stop
What it signals: The block at this index is complete.
What your handler does: Finalize the block. For a tool_use block, this is the first moment the accumulated JSON input is complete enough to parse.

Event: message_delta
What it signals: Top-level changes to the message: the stop_reason and final usage counts.
What your handler does: Record the stop_reason. It tells you whether the model finished or stopped for some other reason.

Event: message_stop
What it signals: The stream is complete.
What your handler does: The assembled content array is now the finished message. From here, treat it exactly like a non-streamed response.

2-4-3. The rule that keeps your state from getting corrupted: don't act on a partial block
The tool_use block is the one to watch. Its input shows up as a partial JSON string spread across many content_block_delta events, and that string isn't valid JSON until content_block_stop closes the block. If your code tries to parse the input or run the tool before the block closes, it either chokes on malformed JSON or runs with half the arguments missing. So, the rule is simple: collect the deltas, and act only after content_block_stop for that block.

The same discipline applies when you add a streamed assistant turn to your conversation history. Add it only after message_stop, with every block fully assembled. A turn built from a stream that got cut off partway is incomplete, and the tool_use pairing rules will reject your next request if a half-built tool_use block ends up in the history.

2-4-4. When the stream stops early
Streams sometimes fail in the middle. A dropped network connection, a timeout, or a client disconnect can end the event series before message_stop arrives. The failure that really bites is treating whatever you've collected so far as if it were complete. A partial text block shown to a user is just a cosmetic glitch and a partial tool_use block written into history is a structural problem that corrupts the next turn.

Track completion on purpose. A turn is usable only once message_stop has arrived. Until then, treat what you've accumulated as provisional.
On an interrupted stream, throw away the partial assistant turn instead of saving it to history, then retry the request. Committing a half-built turn is exactly what breaks the following request.
Check the stop_reason from message_delta before you continue a loop. A stop_reason of tool_use means your assembled tool calls are ready to run; any other value means you're on a different path, not the tool path.
Handles well
Long responses and user-facing interfaces where showing output as it generates removes the blank-screen wait.

Adds cost or complexity
You assemble blocks yourself, you must not act on partial blocks, and you must handle mid-stream interruption explicitly.

Use a different approach
For short responses or backend jobs where no one is waiting on the output, a non-streamed call is simpler and removes the partial-state risk entirely.

2-5. Context Engineering
Model selection and keeping multi-turn sessions in budget
You make one early choice: which model runs the workload. The Claude family covers a range of cost, latency, and capability tradeoffs, so the model you pick sets the price and speed floor that every later decision moves within.

Once the model is set, the next constraint is the context window: the full span of text the model can take in at once, including your prompt, the conversation so far, and every tool result. Every tool result Claude returns gets appended to the context window and stays there for the rest of the session. In a single-turn prompt, that's invisible. In a multi-step agent session running ten or twenty tool calls, the window fills up fast, and once it fills, the agent either compacts (losing detail) or stalls before the task is done.

So, the question for any agent workflow is whether you've decided in advance what goes into the context window, what comes back out as a summary, and what never enters at all. That set of choices is context engineering.

2-5-1. Model selection: Start with Sonnet, move deliberately
The Claude model family currently spans four tiers: Fable, Opus, Sonnet, and Haiku, each optimized for different cost, latency, and capability tradeoffs. Sonnet is the balanced default for most production workloads. Haiku is built for speed and cost efficiency on tasks that fit its capability envelope. Opus handles demanding work above the Sonnet envelope, and Fable is Anthropic's most capable model, built for the most demanding tasks including complex reasoning, advanced coding, research synthesis, and sophisticated agentic workflows where maximum intelligence is the priority. Confirm the current lineup and model identifiers against platform.claude.com/docs at build time.

The default starting point is Sonnet. Move up to Opus only when an eval set tells you Sonnet isn't meeting your quality bar. Move down to Haiku only when an eval set tells you the quality regression is acceptable at your task, not just to save costs. Your decision to move models should always be a measured decision.

2-5-2. The context window is not a free resource
Think of the context window as the amount of space Claude can hold in working memory. Every message you send, every tool result you return, every document you inject, and every response Claude generates occupies space in that window. If a request is already larger than the context window, the Messages API rejects it with a validation error before generation; if a request fits but generation reaches the ceiling partway, current models return the output generated so far with a model_context_window_exceeded stop reason. Neither path silently truncates your oldest content. If you want a session to keep running past the window limit, your application must manage that itself by trimming or summarizing history before the next request goes out.

In development, the window rarely fills because test inputs are small and sessions are short. In production, tool outputs are often three to five times longer than test fixtures, sessions run for more turns, and the window fills at turn eight rather than turn fifty, which means they fill earlier than development. The cost of not planning for this is a production outage.

2-5-3. Four strategies for staying in budget
The previous section made the case for moving state out of the live context window. The reason behind that is the budget. Every token in the window costs money on input and adds latency to the response, and a long session compounds both. The four strategies below are concrete ways to manage that budget, each suited to a different shape of conversation.
Strategy: Pruning
What it does: Lets you jump back to an earlier message and continue from there, removing the conversation that came after.
When to apply: After Claude has gone down an unproductive path or accumulated debugging back-and-forth that won't help the next task.
What continuity you lose: The work done after the rewind point is gone. If Claude learned something useful in that stretch, it has to relearn it.

Strategy: Compaction (/compact in Claude Code; server-side compaction in the API, a beta strategy the platform performs for you, with manual summarization as the client-side alternative)
What it does: Summarizes the conversation history into a condensed version that preserves the key information Claude has learned. The summary costs fewer tokens than the original turns.
When to apply: When the session is approaching the context ceiling but you want to keep working on the same feature with the knowledge Claude has built up.
What continuity you lose: Details can be lost in the summarization. Anything not captured in the summary will not be available to Claude going forward.

Strategy: Clearing (/clear in Claude Code; new session in API)
What it does: Starts a new conversation with empty context. Nothing from the previous session carries forward.
When to apply: When the next task is completely different from the current one, and previous context would only introduce bias or confusion.
What continuity you lose: All session context is gone. Anything Claude needs to remember across sessions has to be put somewhere persistent, like a CLAUDE.md file.

Strategy: Subagent Handoffs
What it does: Spawns a subagent in its own isolated context window with only the task description and system prompt it needs. The subagent does the work and returns a summary.
When to apply: When a subtask is self-contained enough to delegate, especially exploration work where the journey clutters the main context but the answer is short.
What continuity you lose: Visibility into how the subagent reached its conclusion. The intermediate steps are discarded with the subagent's context.

2-5-4. Two more levers: prompt caching and token counting
The four strategies above manage what enters the context window. Two API features reduce what you pay for what's already there.

Prompt caching stores the processing work done on a stable prefix of your request so follow-up requests can reuse it instead of reprocessing the same tokens. The first request writes the prefix to cache; subsequent requests that send identical content up to that point pay a fraction of the original cost. The strongest candidates are parts of the request that rarely change across turns: a long system prompt, a large tool definition set, or a reference document you query repeatedly. You enable caching by marking a cache breakpoint with a cache_control field of type ephemeral on the last block you want cached. You can place up to four breakpoints. For multi-turn sessions with a stable system prompt and tool schemas, caching those prefixes once and reusing them across turns is the highest-leverage cost reduction available.

Token counting lets you measure context pressure before a request goes out rather than after it fails. The count_tokens endpoint takes the same request body as a messages call and returns the token count without running inference. Use it during development to verify your context budget assumptions hold against real tool outputs, not just test fixtures, and in production to gate requests that would exceed the window before they error.

2-5-5. The three places a RAG path can break
The path has three places where it can go wrong: the chunking, the embedding match, and the assembly into the prompt.

Chunking decides what a unit of retrievable context is. Split too small and a single chunk lacks the surrounding context to be useful. Split too large and one chunk dilutes the match with unrelated text. Sentence-based or section-based chunking with a little overlap is a reasonable default. The overlap matters because facts that cross a boundary would otherwise be split apart and become difficult to retrieve.
The embedding match decides which chunks are returned. It uses a similarity search, so it retrieves content that is semantically close. This is not always what contains the exact term you need. A query for a specific identifier can miss the relevant chunk if a more semantically similar result outranks it. This is why a lexical match is sometimes run alongside the semantic one.
The assembly step is where retrieved chunks must reach the model in the structure the prompt expects, otherwise the model answers from memory instead of from the retrieved text.
The fetch-once path gives you a system you can reason about: you can inspect which chunks were retrieved for a query and test that retrieval directly. The cost is the infrastructure: the index that must be built, stored, kept in sync as the corpus changes, and secured wherever it lives. The search-across-rounds path removes that infrastructure and the staleness that comes with it, since the model reads the current files at query time, at the cost of spending more tokens and time per query and giving you a less inspectable process. For a stable reference corpus queried with simple lookups, the index is worth owning. For a changing corpus or multi-step questions, the iterative search is usually the simpler system despite costing more per query.

The reported performance gain for single-agent agentic search over a retrieval index is a version-pinned figure. Confirm it against the reference layer at build time rather than relying on the number in this module.

Now, let's understand a bit about two of the most common strategies: compaction and subagent handoffs.

2-5-6. Applying compaction: What gets preserved depends on how you write the summarizer
When you use /compact in Claude Code, the tool decides what to include in the summary. In the API, the documented primary strategy is server-side compaction (beta): the platform summarizes the conversation for you when it is configured on the request. When you instead implement manual compaction in an API session, you write the summarizer prompt yourself. That prompt determines what the agent will know in subsequent turns.

Summarizer prompt says "summarize the conversation so far"
Produces a general summary that may drop task-critical state, which files were modified, what decision was made at a branch point, and what error was encountered and resolved.
Summarizer prompt says "summarize the conversation, preserving all file paths modified, all decisions made, and any errors encountered and their resolutions"
Produces a summary the agent can use.
This is not an edge case; task-critical state loss from an under-specified summarizer is one of the most common sources of multi-session agent failures.

2-5-7. Subagent handoffs: Managing long-horizon tasks
When a task is too large for a single context window, increasing the window is not a solution. The solution is to decompose the task and pass only the relevant context to each subagent. A subagent receives a scoped task and the minimum context it needs, the results of prior steps that are directly relevant, the tools it needs to complete its task, and clear exit conditions. The parent agent collects the results. This pattern keeps per-turn cost low and makes long-horizon tasks tractable.

Like compaction and pruning, subagent handoffs add implementation overhead, so apply them only where context cost is a real constraint: a simple single-turn prompt or short workflow doesn't need this.

Handles well
Multi-step agent sessions that exceed the token budget and need decomposition. Best designed at the architecture stage rather than patched in as a production fix.

Use a different approach
Pipelines that never approach the window limit. Measure actual token usage against your model's context limit before adding management overhead.

Forward pointer
The strategies covered so far assume you know your context budget is under pressure and you are choosing a tool to manage it. The critical point here is not to know the pressure exists until the session breaks. A workload can pass every test in development and then fail in production for one reason: the tool output got bigger, the sessions got longer, and the context window that held twenty turns cleanly now fills at turn eight. The next section walks through exactly how that happens, using a worked postmortem of an agent that ran fine on test fixtures and then hit its ceiling once real documents started flowing through it.

2-6. Agent Construction

Building a production agent: the loop, wiring paths, orchestration, and human-in-the-loop

An agent is a multi-step tool-use loop with managed context and a defined goal. You have already built the individual pieces, including tool schemas and context management. This section connects them into a working system and adds the layer that neither topics cover on their own.

When components run together across multiple turns, new failure modes appear that isolated testing does not catch. Routing decisions that worked in single-turn tests start to compound. Context fills faster than expected. A step that depends on a previous result gets the wrong input because an earlier tool call was structured incorrectly. The question that should precede every agent build is: does this problem require an agent?

Agents carry coordination overhead, expanded context costs, and more surface area for failure than simpler patterns. Answering that question deliberately is the first design decision.

2-6-1. Workflow or agent: Make this decision before you write the first line

The most critical mistake in agent development is choosing the wrong pattern at the start. Workflows and agents solve different problems: using an agent when a workflow is sufficient adds behavioral complexity without adding capability. Using a workflow when an agent is needed produces a system that breaks whenever user input deviates from the predetermined path.

Choose a workflow when you can enumerate the exact steps in code. Choose an agent when you can specify the goal and the tools but not the exact path.

Choose a workflow when error cost is real and step-level guardrails matter. Choose an agent when the path through work cannot be enumerated in advance.

Choose a workflow when observability with standard tooling is required. Choose an agent when non-determinism is acceptable and the agent's possible actions are constrained by its registered toolset.

Choose a workflow when the inputs are well-constrained to a known set. Choose an agent when user inputs vary unpredictably in content and structure.

Choose a workflow when every execution of the task follows the same sequence. Choose an agent when the task requires creative sequencing of available tools.

2-6-2. The agent is the pattern. The wiring path is an implementation choice.

Once you have decided the task needs an agent, you have also decided on a pattern: a loop that calls tools, manages context, and runs until a goal is met. For single-agent systems, that pattern is constant across all three wiring paths. Multi-agent architectures, where a planner, executor, and evaluator run as separate agents handing off through structured artifacts, introduce additional design decisions beyond the loop itself. Those patterns are covered later in this track. That pattern does not change based on how you build it, what changes is how much of the loop you write yourself versus how much you hand to a library or a hosted service.

There are three wiring paths, and they sit on a spectrum of how much infrastructure you own. You can write the loop directly against the Messages API, which gives you full control and full responsibility. You can use the Agent SDK, which runs the same loop inside your own process and hands you tool execution, context management, and the iteration structure already built. Or you can use Claude Managed Agents (currently in public beta), where Anthropic runs the loop and the sandbox and your application streams events in and results back. The sections that follow teach the loop itself, because the loop is what stays constant. The path you choose decides who maintains the parts around it.

2-6-3. Wiring paths: who runs the loop, and what you take on

The three paths differ in one variable: how much of the agent's runtime you own. The table is ordered from top to bottom by how much infrastructure you hand off. Choose based on your deployment and compliance constraints, don't be tempted to choose the path that is just fastest to prototype.

1. Raw Messages API loop

Who runs the loop: Your code runs every iteration. You send the request, read the tool-use blocks, execute the tools, and append the results yourself.

What you own: The full loop, tool execution, context management, retries, and exit conditions. Nothing is provided for you.

Choose this when: You need full control over each step, you have constraints a library does not accommodate, or you are teaching yourself how the loop works before adding abstraction.

What to check before committing: The maintenance cost is yours. Every behavior the SDK would give you for free, including context management and parallel tool handling, becomes code you write and test.

2. Agent SDK

Who runs the loop: The SDK runs the loop inside your own process. It iterates and manages context, and your code still executes the tools the agent calls.

What you own: Tool execution and the surrounding application. The SDK provides the loop structure, context management, and tool registration.

Choose this when: You want the loop, context handling, and tool scaffolding that power Claude Code without rebuilding them, and you want the agent running in your own environment in Python or TypeScript.

What to check before committing: Whether filesystem-based features like CLAUDE.md and skills load in the Agent SDK is controlled by the settingSources configuration. Do not rely on a default: always set settingSources explicitly to the sources you intend, for example, ["user", "project", "local"] to match Claude Code CLI behavior, or [] to run fully isolated with only what you pass programmatically. Confirm current default behavior against the Agent SDK reference at build time.

3. Claude Managed Agents

Who runs the loop: Anthropic runs the loop and the sandbox. Your application sends user events and streams results back over server-sent events.

What you own: The application layer and the agent definition. You define the model, system prompt, tools, MCP servers, and skills once, then reference the agent by ID across sessions.

Choose this when: You need long-running execution measured in minutes or hours, you want a managed sandbox, or you want to avoid building the loop, the sandbox, and the tool-execution layer at all. Also available on Claude Platform on AWS with some feature differences, verify capability parity against your deployment surface before committing.

What to check before committing: Sessions are stateful and stored server-side, which means they are not currently eligible for Zero Data Retention or a HIPAA Business Associate Agreement. See Anthropic API data retention documentation at platform.claude.com and verify it at publish.

Currently in public beta, all endpoints require the managed-agents-2026-04-01 beta header and behaviors may be refined between releases. Build with a migration plan in place.

2-6-4. Claude Managed Agents: when to use

The table above lists Managed Agents as the third path. Let's make that choice concrete because for some workloads it's the right default.

Here's the core difference: with a raw loop or the Agent SDK, your code runs the iteration. You send each request, read the tool-use blocks, run the tools, and append the results. With Managed Agents, Anthropic runs the loop and the sandbox for you. Your application defines the agent once (model, system prompt, tools, MCP servers, skills), refers to it by ID, sends user events, and streams the results back over server-sent events.

What you stop owning, and what you take on instead

Category: Execution & infrastructure
What you stop owning: The iteration loop, the execution sandbox, the retries inside the loop, and the tool-execution runtime. Anthropic runs all of it server-side.
What you take on instead: An agent definition managed as a versioned API resource, plus an application layer that sends events and consumes the streamed results.

Category: Session duration & state
What you stop owning: Long-running execution management. Sessions can run for minutes or hours without your process holding the loop open.
What you take on instead: Server-side session state. Sessions are stateful and stored by Anthropic, and are subject to its data handling policies and constraints (see the constraint note below).

Category: Sandbox lifecycle
What you stop owning: Sandbox provisioning and teardown for tool execution.
What you take on instead: A dependency on the managed sandbox's available tools and its execution model, rather than your own environment.

Choose Managed Agents when

The task runs long: Execution measured in minutes or hours is awkward to hold open in your own process, and the managed loop is built for exactly that.

You want a managed sandbox: If you'd otherwise be building and securing an execution environment for tool calls, using Managed Agents takes a large piece of infrastructure off your plate.

You'd rather not build the loop, the sandbox, and the tool-execution layer at all: You are willing to define the agent as an API resource instead.

The constraint that decides it for regulated work

Managed Agent sessions are stateful and stored server-side. That storage is the reason these sessions aren't currently eligible for Zero Data Retention or a HIPAA Business Associate Agreement. So, if your workload carries PHI or falls under a ZDR requirement, this path is ruled out no matter how well it fits operationally, and you route to the Agent SDK or a raw loop on a covered configuration instead. The governing constraint picks the path before convenience gets a say.

A common progression is to prototype on the Agent SDK locally, then move to Managed Agents for production. The core agent definition carries over conceptually. What changes is the format: the Agent SDK uses code-level and filesystem configuration, while Managed Agents defines the agent as a versioned API resource. Expect a re-expression step, not a direct export.

Handles well: Long-running agents, and workloads where you'd rather not build or secure a sandbox and loop yourself.

Adds cost or complexity: Server-side stateful sessions, an agent-as-resource definition format, and a beta surface that can change between releases.

Use a different approach: For PHI or ZDR workloads, or when you need full in-process control, stay on the Agent SDK or a raw loop on a covered configuration.

2-6-5. Wiring the loop: the four steps that hold across every path

The four steps below define a working agent loop no matter which path you build on. When you write the loop against the Messages API, you implement all four yourself. When you use the Agent SDK, it provides the structure for registering tools, setting the system prompt, and iterating the loop, and your code still handles tool execution. The steps are the same; what differs is how much you write versus inherit.

Register tools: Each tool follows the same schema structure. The SDK registers them against the agent, so Claude knows what is available.

Set the system prompt: Scope it to the agent's task. A broad system prompt produces broader, less reliable tool routing. A system prompt that names the specific task and the tools available for it produces more consistent behavior.

Handle the tool-use loop: Whether you iterate the loop yourself or the SDK iterates it for you, your code handles execution. Every tool call Claude issues must be executed by your code and returned in a tool-result block.

Define exit conditions: The agent loop runs until it receives a stop condition. Without explicit exit conditions, the agent will continue requesting tool calls beyond what the task requires. You should define when done means done.

2-6-6. Loop wiring checklist: verify these regardless of path

#: 1
Item: Tools registered
What to verify: Every tool the agent may need is in the registration list. No unregistered tools are referenced in the system prompt.

#: 2
Item: System prompt scoped
What to verify: The system prompt names the task and the available tools. It does not describe tools the agent does not have. It does not omit tools the agent does have that require scoping guidance.

#: 3
Item: Tool-use loop implemented
What to verify: Your code handles every tool-use block Claude issues and returns a tool-result block for each one before the next assistant turn. All tool-use blocks from a single assistant turn must be resolved together.

#: 4
Item: HITL insertion point defined
What to verify: At least one point in the loop has a human-in-the-loop check. See the section below for where to insert it.

#: 5
Item: Exit conditions defined
What to verify: The loop has a clear stopping criterion that does not depend on Claude volunteering to stop.

2-6-7. Human-in-the-loop (HITL): Insertion points and when each applies

A human-in-the-loop checkpoint pauses agent execution and routes to a human review step before proceeding. The question that determines where to insert one is: what is the worst possible outcome if this step runs without a human check?

Insertion point: Before a destructive tool call
What triggers the check: The agent is about to execute a write, delete, or send operation.
Risk level it addresses: High — irreversible actions where a wrong call cannot be undone.

Insertion point: After a planning step
What triggers the check: The agent has generated a plan and is about to begin executing it.
Risk level it addresses: Medium — incorrect plans that would produce the wrong outcome even if all steps execute correctly.

Insertion point: On unexpected output
What triggers the check: The tool result contains an error flag, an empty result, or a value outside expected bounds.
Risk level it addresses: Variable — catches failure modes that retry logic alone will not resolve.

2-6-8. Tool orchestration: Over-tooling and under-tooling

The agent's routing behavior is shaped by two things, including how tools are described and how many tools are registered. Too many tools with overlapping descriptions produce erratic routing. Too few tools force the agent to either hallucinate a path or return an incomplete result.

Over-tooling is the more common problem in production agents. Teams register every tool they might need "just in case" and discover that Claude's selection quality degrades as the tool surface grows. Start with the minimum set required for the task and add tools only when a specific gap in capability is confirmed.

When agents are the right call: Goal-directed tasks where the exact path cannot be enumerated in advance. Handling variable inputs that would require dozens of conditional branches in a workflow.

What you take on when you use an Agent: Agents add behavioral complexity: the path through the task emerges from the model's reasoning over accumulated context rather than from explicit branching logic in your code. Observability requires transcript-level tooling rather than standard operational logging.

When to choose a workflow instead: When you can enumerate the steps in code, use a workflow. Agents are the last step in progression. Start with the simplest pattern that solves the problem, a single API call, then a workflow, then an agent. And move up only when the simpler pattern cannot handle the variability the task requires.

2-6-9. Regulated data constraints set your delivery route and credentials before you write the wiring

If your data needs to be handled with specific constraints (e.g., attorney-client privilege, HIPAA, GDPR, FedRAMP, or an internal data-residency policy), that constraint decides which endpoint your code calls, which credentials it carries, and where its logs land before you make a single design choice about prompts, tools, or memory.

As a developer you usually do not pick the surface, but you do write the code that targets a specific endpoint, attaches credentials, configures the region, and emits logs. Get the governing constraint named at the start, because the wrong client configuration is much more expensive to undo after the agent is wired than to set correctly the first time. The five constraints below cover the cases you are most likely to hit in production.

Constraint: Attorney-client privilege
What it tends to rule out in code: Calls from a consumer-grade Claude.ai surface that the firm cannot audit end-to-end. Code paths that send privileged document content to any endpoint the firm has not approved for privileged material, regardless of how the prompt or system message is structured.
What usually survives a code review: Direct API or SDK calls from inside the firm's own application, authenticated via SSO, routed through a firm-approved LLM gateway with full request and response logging. Note that Anthropic's native Compliance Conversation content (prompts, responses, and tool call payloads) is not captured by Anthropic by default on direct API traffic, so the organization must implement conversation logging in the application layer and route it to an approved log destination. Tool calls and tool results stay inside the audited path. Confirm the final logging design with your Anthropic account team.

Constraint: HIPAA (PHI handling)
What it tends to rule out in code: Code that sends Protected Health Information to any endpoint or delivery route not covered by a Business Associate Agreement for the specific configuration in use. This includes any logging or retention path your code writes to that has not been scoped under the same BAA.
What usually survives a code review: Direct API or SDK calls on a BAA-covered configuration. BAA coverage for Anthropic first-party API access is arranged with Anthropic, which provisions a dedicated HIPAA-enabled organization that enforces feature restrictions on its own end. Confirm the covered configuration with your Anthropic account team. An alternative is a cloud-mediated route via AWS Bedrock or GCP Vertex on the partner's existing HIPAA-eligible cloud account. Note: the BAA does not cover Console, Workbench, beta features, or consumer plans. Not all API features are covered under the BAA, verify the current feature eligibility list in Anthropic's Implementation Guide before configuring.

Constraint: GDPR and data residency
What it tends to rule out in code: Delivery routes where the region of model execution cannot be pinned in code, or where the request can be served from a region outside the approved geographic boundary. Defaulting to a global endpoint without specifying region is the common pattern that breaks here.
What usually survives a code review: A cloud-mediated route such as Bedrock or Vertex, with the region pinned in the client configuration to a covered jurisdiction. The direct Anthropic API is a separate case; it does not currently provide EU data residency, so partners with EU data residency requirements should route through Bedrock or Vertex rather than calling the API directly.

Constraint: FedRAMP and government
What it tends to rule out in code: Any code path that calls an endpoint not on an authorized cloud environment at the required impact level. This includes development and test paths that hit the commercial endpoint while production hits the authorized one, because credentials and code patterns leak between them.
What usually survives a code review: Three authorized routes exist as of publish time. Claude for Government (C4G) carries a direct FedRAMP High authorization held through Palantir Federal Cloud Service – Supporting Services (PFCS-SS). Claude via Amazon Bedrock GovCloud is approved for FedRAMP High and DoD IL4/5 workloads. Claude via Vertex AI Assured Workloads is also FedRAMP authorized. Claude Enterprise on AWS Marketplace is not FedRAMP authorized, so teams requiring FedRAMP compliance must use one of the three routes above. Verify current authorization status at trust.anthropic.com before configuring.

Constraint: Internal data-residency policy
What it tends to rule out in code: Calls from any SDK client configured against a cloud vendor outside the partner's approved list, regardless of whether the underlying technical capability would support the workload. Procurement-level constraints rule the code path out before engineering preferences enter the conversation.
What usually survives a code review: The delivery route on the partner's approved cloud vendor. In code terms, that is whichever SDK client and endpoint configuration their CIO has already cleared. Build against that one rather than switching mid-project because another route looks easier.

This table covers the constraints that directly determine endpoint selection and credential configuration. SOC 2 is not in scope here. It governs how your systems are built and operated, not which endpoint your code calls, and is covered in Module 4 alongside other security posture and audit requirements.

Forward pointer

Module 4 (Production Engineering, Evals & Security) goes deep on secure-by-design patterns for IAM and privacy, defenses against prompt injection from untrusted inputs, runtime guardrails, and agent hardening. The role of this section is narrower: surface the constraint at the point in the build where it actually rules options out, which is when you pick the endpoint, the SDK client configuration, and the credentials your agent carries into production.

2-7. Agent Memory

Choosing the right scope for state that survives sessions

The agent from the previous section runs correctly within a single session. What it cannot do is remember anything when that session ends. Memory scope is how you decide what the agent should know at the start of the next session, and how much it costs to carry that knowledge forward.

2-7-1. Memory patterns and when each is right

Beyond memory scope, the blueprint groups several agent design patterns under this objective, and you have already built each one earlier in this module. The tool-use loop, where the model calls a tool, reads the result, and continues, is the core pattern from the tool-use and agent-construction clusters. Multi-step task decomposition breaks a goal into ordered subtasks, and planning-and-execution separates deciding the plan from carrying it out, the same split the human-in-the-loop check after a planning step guards. Memory scope, covered next, is the pattern that decides what state survives once the loop ends.

Memory scope sets what an agent knows when a new session starts. Making the wrong choice has two failure modes, and they pull in opposite directions:

Too much state in-context inflates every API call, because the model re-reads the full conversation on every turn and the bill scales with session length.
Too little state in-persistent storage strips the agent of memory across sessions, because anything not written down disappears the moment the conversation ends.

Scope: In-context memory
What persists: State lives in the active conversation and survives turns within a single session.
Cost: Zero retrieval overhead; inflates token cost as conversation grows.
When to use: Short sessions where all the state the agent needs fits inside the context window and nothing has to carry across restarts.
What you lose: Everything once the session ends. A clear command or a new session wipes the state.

Scope: External storage
What persists: State is written to a database and read back at session start or on demand.
Cost: Each database call adds retrieval latency, and you take on the engineering work of read and write logic.
When to use: State that has to survive across sessions, move between users, or be shared across multiple agent instances.
What you lose: Nothing on the persistence side. The cost shows up as latency on every call and ongoing implementation complexity.

Scope: Summarized memory
What persists: A condensed version of prior conversation is generated and injected at the start of the next session.
Cost: Lower token cost per session than replaying full history, but the summarization step drops detail that was in the original.
When to use: Long-running conversational agents where the full history would outgrow the context budget before the conversation is done.
What you lose: Any detail the summarizer did not preserve. The agent only sees what the summarization prompt chose to keep.

Scope: No persistent memory (stateless)
What persists: Nothing. Each session is independent.
Cost: No overhead at all, since there is nothing to retrieve or store.
When to use: Task-execution agents that finish and close out, or pipelines where every session is fully independent by design.
What you lose: All prior context. If a follow-up depends on something from an earlier session, the agent has no way to reach it.

2-7-2. Choosing a memory scope at agent design time

The choice of how an agent remembers prior interactions belongs in the design phase, not the production refactor. An agent that helps the same user across multiple days needs to carry state between sessions, which means storing summaries or full history outside the model's context window so the next session can read them back. An agent that receives a single job, completes it, and closes it out has no prior session to recall, so it runs stateless.

The default path looks reasonable at first. You store the full conversation history in the messages array, send it on every API call, and the prototype works. It keeps working for a while. The trouble starts further in, when token cost scales with every additional turn, latency climbs as the context window fills, and eventually a long session hits the hard limit and the agent stops responding. At that point, you need to refactor: pull conversation state out of the live context, put it in external storage, and add only what each turn needs. The refactor itself is mechanical, a few hundred lines of code and a database the team already has. What it costs is timing. The work happens under production pressure, usually with a deadline already in motion, and every hour spent restructuring memory is an hour not spent on whatever the agent is supposed to do next. Making the call during design phase is cheap, while doing it when it's time to refactor is more expensive.

The content below outlines three memory approaches and the conditions where each fits, the overhead each carries, and the assumption that most often pushes teams toward the wrong choice.

Handles well: The memory scope matches the task at design time. Use external storage when the agent continues a thread across sessions. Use stateless when each job is self-contained. Use in-context when the session is short and does not need to survive a restart.

Adds cost or complexity: External storage adds retrieval latency and the read/write logic that goes with it. Summarized memory depends on a well-specified summarizer prompt; without one, task-critical state gets dropped on every compression. Neither approach is free, so weigh the costs and choose wisely.

Use a different approach: Holding all state in-context on the assumption that the window will be large enough. Token cost grows with every additional turn because the full context is sent on each API call. Without caching or compaction, long sessions accumulate cost faster than teams expect when they only measure early turns. Measure actual session token usage against the window limit before committing.

2-7-3. Skills: reusable instruction sets that load on demand without inflating every session

The memory scope table above covers how an agent carries state across sessions. There is a related but distinct problem: how you carry repeatable instructions across tasks without paying to inject them into every session. The pattern for that is a Skill, a reusable markdown file that teaches Claude how to handle a specific kind of task once. Claude loads the Skill automatically when a request matches its description. The instructions sit on disk until they are needed; they are not resident in every conversation.

A Skill lives in a SKILL.md file inside an identified directory. The file has two parts: a frontmatter block with a name and a description, and the instructions below it. The description is the matching criterion. When you send a request, Claude reads the name and description of every available Skill, compares them against your message, and loads the full instructions only when there is a match. If the instructions are not relevant to the current request, they never enter the context window.

This is the key contrast with the memory patterns in the table above. In-context memory is always present and grows with every turn. CLAUDE.md behavior depends on where you are running Claude Code. In the Claude Code CLI, a CLAUDE.md file loads into every session regardless of what task is running. In the Agent SDK, whether filesystem settings including CLAUDE.md load is controlled by the settingSources configuration. Do not rely on a default: set it explicitly to the sources you intend, and confirm current default behavior against the Agent SDK reference at build time. A Skill, by contrast, loads only when the task calls for it, in both environments. For instruction sets that apply to specific recurring tasks rather than to every session, Skills are a lower-overhead pattern than either alternative.

Skills vs. CLAUDE.md vs. in-context instructions: choosing the right pattern

Pattern: Skill (SKILL.md)
When it loads: On demand when the request matches the skill's description.
Context cost: Low. Only the name and description load at startup; full content loads only on match.
Best for: Task-specific expertise that should not inflate sessions where it is not needed. Examples include domain-specific output formats, specialized review checklists, and workflows that apply to a subset of tasks rather than every interaction.

Pattern: CLAUDE.md
When it loads: Every session, unconditionally.
Context cost: Fixed overhead per session regardless of task.
Best for: Always-on project standards that apply to everything. Examples include coding conventions the team has standardized on, output format rules the project requires, and constraints that hold across all tasks in the codebase.

Pattern: In-context instructions
When it loads: Present for every turn within that session.
Context cost: Grows with session length; does not survive session end.
Best for: Short sessions where the full history fits within the window and nothing needs to persist. Examples include one-off exploratory work and tasks scoped to a single conversation.

2-7-4. Current availability: Skills on the Messages API

Skills are available on the Messages API today, but the integration is in beta and the configuration is not the same as the Claude Code or Agent SDK paths. Two beta headers are required on the API request: code-execution-2025-08-25 and skills-2025-10-02. Skills invoked this way run inside the code execution container rather than in the calling application's environment, which has implications for what tools and filesystem access the Skill can rely on.

Beta headers are versioned and change as features move toward general availability. Before building against this configuration in production, check the current Anthropic API documentation to confirm the header values, whether the feature has reached general availability, and whether the code execution container is still the runtime path.

One important constraint: Subagents do not automatically inherit Skills from the parent session. When you delegate a task to a subagent, it starts with a clean context. Note that while Skills and conversation history do not carry over, subagents do inherit the permission context from the parent session; permission scope is not reset at delegation. If the subagent needs a Skill, you must explicitly list it in the subagent's configuration. This matters at agent design time: if you are wiring a subagent to perform a task that depends on specific instructions, those instructions need to be registered against the subagent, not assumed to carry over from the parent.

2-8. Multimodal and Batch Ingestion

Images, PDFs, and high-volume processing

Up to now you've been managing what Claude remembers between turns. Multimodal ingestion shifts the question to what you're sending in: every image and PDF consumes context budget before Claude reads a single character of your prompt, which changes how you structure requests and what you can fit in one. The second half of this topic deals with the opposite end of the same problem. When you have thousands of inputs to process, sending one request at a time and waiting for each response stops making sense, and the Batch API is how you handle that volume without blocking your application.

2-8-1. Image token cost: Calculate before you commit

Images are not free in terms of context budget. Claude views images in patches: each 28×28-pixel block of the image is one visual token, so an image costs ⌈width / 28⌉ × ⌈height / 28⌉ visual tokens. A 1,000 × 1,000 pixel image is ⌈1000/28⌉ × ⌈1000/28⌉ = 36 × 36 patches, about 1,296 visual tokens. At that rate, ten high-resolution screenshots consume as much context as a detailed system prompt. Each model also has a maximum native image resolution, expressed as a long-edge limit and a visual-token limit, and these limits differ by model tier. The newest models accept substantially larger images than the standard tier. Images larger than either limit are downscaled before processing, so the formula runs on the scaled dimensions. Confirm the current per-tier limits against the Vision page (Resolution and token cost) at build time; the limits have changed between model generations and will again.

The calculation matters at design time. If you are building a pipeline that processes images, measure the token cost of a typical production image against your model's context limit before you write the ingestion code. The fix for an over-budget pipeline is often a ten-minute image resize step. If you discover this after deployment, it takes even longer.

2-8-2. Different ways to send an image: When each is right

Inline base64

How it works: Encode the image bytes as a base64 string and include the data directly in the message block.

Overhead: The full encoded payload travels with every request, which inflates request size and counts against latency on large images.

When to use: Best for one-off images where adding an upload step would add complexity without a payoff. The same image sent repeatedly multiplies the cost, so reach for a different method if reuse is likely.

URL reference

How it works: Pass a publicly reachable URL in the source block, and Claude fetches the image at request time.

Overhead: No payload travels with the request, but you take on the dependency that the URL must be stable, public, and reachable at the moment Claude tries to fetch it.

When to use: Best when the image is already hosted at a stable public URL you control. Skip it for anything behind auth, anything signed with a short expiry, or anything you can't guarantee will be reachable when the request runs.

Files API

How it works: Upload the file once through a separate API call, receive a file_id, and reference that ID in any future message.

Overhead: The upload is a one-time cost; every later request carries the ID instead of the bytes, so payload overhead drops to near-zero from that point on. Currently in beta and not available on Bedrock or Vertex AI; verify availability for your deployment platform.

When to use: Best when the same image or PDF appears across multiple requests, or when the asset is large enough that re-sending it would dominate request size. Also, the cleanest choice when you want asset management to live separately from inference calls, and the right choice for images that appear across multiple conversation turns, since the file_id carries no payload weight as history grows.

2-8-3. Sending PDFs: The document block

For PDFs, the block type is document rather than image. The source structure follows the same pattern as images, which means it can be base64, a URL, or a Files API file_id. There is no required name field on a document block. The block accepts an optional title field for a readable document name, and an optional context field for additional metadata, but neither is required to send a PDF. All other mechanics, including token cost considerations and Files API reuse, apply in the same way.

{
  "type": "document",
  "source": {
    "type": "base64",
    "media_type": "application/pdf",
    "data": "<base64-encoded-pdf-bytes>"
  },
  "title": "contract_review.pdf"
}

2-8-4. Applying prompting techniques to multimodal inputs

The same prompting techniques from the first section apply to image and PDF analysis. A bare "describe this image" prompt produces shallow output for the same reason a bare text prompt does as Claude has no target structure to aim for.

The difference is that images carry ambiguity that text cannot, which includes overlapping objects, depth and spatial relationships, and partial occlusion. A prompt for visual analysis should name how Claude should handle each type of ambiguity. "If objects overlap, describe each separately and note the overlap" is a concrete constraint that a text-only prompt would never need.

2-8-5. The Message Batches API: High-volume asynchronous processing

When you need to run the same prompt pattern against hundreds or thousands of inputs, the synchronous API is the wrong model. Each synchronous call blocks until complete. At scale, that means your application is either burning threads or running thousands of concurrent connections against rate limits.

The Message Batches API accepts up to 100,000 or 256 MB requests (whichever comes first) in a single batch call. You submit the batch, receive a batch_id, and poll for completion. When the batch finishes, you download the results. The per-token cost for batch requests is lower than for synchronous ones.

The tradeoff is latency: batch processing is non-deterministic and can take up to 24 hours, often much faster. The pattern suits offline pipelines, evaluation runs, and data processing jobs, not real-time user interactions.

Use case: A user uploads a photo and expects an immediate classification.
Right API pattern: Synchronous API.
Why: Real-time response is required. Batch latency is unacceptable for interactive use.

Use case: A nightly pipeline classifies 5,000 customer records.
Right API pattern: Message Batches API.
Why: Latency is not a constraint. Batch cost reduction and asynchronous processing are both valuable.

Use case: An evaluation run tests a new prompt against 2,000 examples.
Right API pattern: Message Batches API.
Why: Offline task with no real-time requirement. Batch is the correct pattern.

Use case: A chatbot generates a reply to a user's message.
Right API pattern: Synchronous API.
Why: The user is waiting; batch would introduce unacceptable delay.

2-8-6. When multimodal and batch fit together, and when they don't

The combination works for offline workloads that reuse the same assets and need structured output across thousands of inputs. A nightly pipeline classifying images against a fixed taxonomy is the textbook case: Files API removes redundant uploads, Batches API absorbs the latency, structured-output techniques keep results machine-readable.

Two failure modes break the fit.

The first is misreading latency: reaching for batch in any user-facing flow with an image produces a system that passes tests and fails in production, because the user is waiting and the batch isn't.
The second is underestimating context cost: images and PDFs consume budget before Claude processes any text, so pipelines loading multiple large images per request blow past token limits at scale. Measure token cost on production-scale inputs before you build.
`;

export const quizSections: QuizSection[] = [
  {
    id: "production-grade-prompting-agents-tool-use",
    title: "2. Production-Grade Prompting, Agents & Tool Use",
    items: [
      item("2. Production-Grade Prompting, Agents & Tool Use", "2. 프로덕션 수준의 프롬프팅, 에이전트 및 도구 사용")
    ]
  },
  {
    id: "2-1-prompting-craft",
    title: "2-1. Prompting Craft",
    items: [
      item("2-1. Prompting Craft", "2-1. 프롬프팅 기법"),
      item("System prompts, XML, few-shot, and output constraints", "시스템 프롬프트, XML, 퓨샷, 그리고 출력 제약 조건")
    ]
  },
  {
    id: "2-1-1-four-techniques-that-give-claude-a-reliable-output-shape",
    title: "2-1-1. Four techniques that give Claude a reliable output shape",
    items: [
      item("2-1-1. Four techniques that give Claude a reliable output shape", "2-1-1. Claude가 안정적인 출력 형태를 갖도록 해 주는 네 가지 기법"),
      item("When a first-pass response misses, the instinct is often to add more words to the prompt and run it again.", "첫 번째 응답이 빗나가면, 보통 프롬프트에 말을 더 많이 덧붙이고 다시 실행하고 싶어집니다."),
      item("However, that instinct can make the problem harder to isolate and rarely fixes it.", "하지만 그런 직감은 문제를 분리해서 파악하기 더 어렵게 만들 수 있으며, 실제로 문제를 해결하는 경우도 드뭅니다."),
      item("Rewording changes how you say something but does not add to the structural piece of the prompt that's missing.", "표현을 바꾸는 것은 말하는 방식을 바꿀 뿐, 프롬프트에서 빠져 있는 구조적 요소를 추가해 주지는 않습니다."),
      item("For example, if Claude is crossing the boundary between your instructions and your input data, clearer phrasing will not fix it, and if the output format keeps drifting, \"please format this correctly\" will not fix it either.", "예를 들어 Claude가 지시문과 입력 데이터 사이의 경계를 넘나든다면 더 명확한 표현만으로는 해결되지 않으며, 출력 형식이 계속 흔들린다면 \"please format this correctly\"라고 말하는 것도 해결책이 되지 않습니다."),
      item("The failure mode tells you which of the four techniques is absent.", "실패 양상은 네 가지 기법 중 무엇이 빠져 있는지를 알려 줍니다."),
      item("Diagnose how your prompt is failing first, then add the specific technique that addresses that failure.", "먼저 프롬프트가 어떻게 실패하고 있는지 진단한 다음, 그 실패를 해결하는 특정 기법을 추가하세요."),
      item("The four techniques themselves are defined in full further down this screen.", "네 가지 기법 자체는 이 화면 아래쪽에서 자세히 정의됩니다."),
      item("What you observed: The result comes back in the wrong shape: a sentence where you expected a label, prose where you expected JSON.", "관찰한 현상: 결과가 잘못된 형태로 돌아옵니다. 라벨을 기대한 곳에는 문장이, JSON을 기대한 곳에는 일반 문단이 나옵니다."),
      item("What the prompt is missing: An output constraint.", "프롬프트에 빠진 것: 출력 제약 조건입니다."),
      item("The prompt never specified the form, field names, or stopping point of the response.", "프롬프트는 응답의 형태, 필드 이름, 또는 멈춰야 할 지점을 전혀 지정하지 않았습니다."),
      item("Why this technique is the fix: An output constraint controls the form of the response independent of its content.", "이 기법이 해결책인 이유: 출력 제약 조건은 내용과 별개로 응답의 형태를 제어합니다."),
      item("Without one, Claude returns plausible text that the downstream parser was not built to accept.", "그것이 없으면 Claude는 그럴듯한 텍스트를 반환하지만, downstream parser는 그런 텍스트를 받아들이도록 만들어져 있지 않습니다."),
      item("What you observed: The content is off: scope drifts, tone shifts, or Claude answers a wider question than you asked, and it gets worse deeper into the conversation.", "관찰한 것: 내용이 어긋납니다. 범위가 흐려지거나, 톤이 바뀌거나, Claude가 요청보다 더 넓은 질문에 답하고, 대화가 깊어질수록 더 나빠집니다."),
      item("What the prompt is missing: A system prompt, or a more specific one.", "프롬프트에 빠진 것: 시스템 프롬프트, 또는 더 구체적인 시스템 프롬프트입니다."),
      item("The behavioral contract was too vague to hold across turns.", "행동 계약이 너무 모호해서 여러 턴에 걸쳐 유지되지 못했습니다."),
      item("Why this technique is the fix: The system prompt sets the rules that apply to every response regardless of the user turn.", "이 기법이 해결책인 이유: 시스템 프롬프트는 사용자 턴과 관계없이 모든 응답에 적용되는 규칙을 정합니다."),
      item("When it is underspecified, there is nothing holding role, scope, and format steady as the conversation runs on.", "그것이 충분히 구체적이지 않으면 대화가 이어지는 동안 역할, 범위, 형식을 안정적으로 붙잡아 줄 것이 없습니다."),
      item("What you observed: The task is right, but the structure is invented: Claude understood what to do and produced output in a shape you never asked for.", "관찰한 것: 작업 자체는 맞지만 구조가 임의로 만들어졌습니다. Claude는 무엇을 해야 하는지 이해했지만 요청하지 않은 형태로 출력을 만들었습니다."),
      item("What the prompt is missing: Few-shot examples.", "프롬프트에 빠진 것: 퓨샷 예시입니다."),
      item("Claude cannot infer an exact structure from a description alone.", "Claude는 설명만으로 정확한 구조를 추론할 수 없습니다."),
      item("Why this technique is the fix: Few-shot examples show the pattern rather than describe it.", "이 기법이 해결책인 이유: 퓨샷 예시는 패턴을 설명하는 대신 직접 보여 줍니다."),
      item("One correct input-output pair gives Claude the exact shape to match, which a written instruction often fails to pin down.", "올바른 입력-출력 쌍 하나는 Claude가 맞춰야 할 정확한 형태를 제공하며, 글로 쓴 지시문은 종종 이것을 정확히 고정하지 못합니다."),
      item("What you observed: Output is clean on the inputs you tested but breaks on a variant: an edge case, an unusual field, an input you did not anticipate.", "관찰한 것: 테스트한 입력에서는 출력이 깔끔하지만 변형 입력에서 깨집니다. 예외 사례, 특이한 필드, 예상하지 못한 입력이 여기에 해당합니다."),
      item("What the prompt is missing: A constraint covering the variant.", "프롬프트에 빠진 것: 변형 입력을 다루는 제약 조건입니다."),
      item("The prompt handles the happy path and has no rule for the case the parser breaks on.", "프롬프트는 정상 경로만 처리하고 parser가 깨지는 경우에 대한 규칙이 없습니다."),
      item("Why this technique is the fix: The prompt was validated against a narrow set of inputs.", "이 기법이 해결책인 이유: 프롬프트가 좁은 입력 집합에 대해서만 검증되었기 때문입니다."),
      item("Naming the variant in the constraint, or adding an example that covers it, closes the gap the test inputs never exposed.", "제약 조건에서 그 변형을 명시하거나 그것을 다루는 예시를 추가하면, 테스트 입력이 드러내지 못했던 빈틈을 메울 수 있습니다.")
    ]
  },
  {
    id: "2-1-2-diagnosing-a-classification-prompt-that-returns-the-wrong-output-shape",
    title: "2-1-2. Diagnosing a classification prompt that returns the wrong output shape",
    items: [
      item("2-1-2. Diagnosing a classification prompt that returns the wrong output shape", "2-1-2. 잘못된 출력 형태를 반환하는 분류 프롬프트 진단하기"),
      item("The rule is simple: name the failure, add the one technique that matches it, and re-run it.", "규칙은 간단합니다. 실패를 이름 붙이고, 그 실패에 맞는 하나의 기법을 추가한 뒤 다시 실행하세요."),
      item("If it still fails, diagnose again.", "그래도 실패하면 다시 진단하세요."),
      item("When a prompt keeps getting longer with every pass, that's the sign you're skipping the diagnosis step and just adding words.", "프롬프트가 매번 더 길어지기만 한다면, 진단 단계를 건너뛰고 말만 덧붙이고 있다는 신호입니다."),
      item("The pattern below is the first row of the table in action: a prompt that produces the right content in a shape the downstream code cannot accept.", "아래 패턴은 표의 첫 번째 행이 실제로 나타난 경우입니다. 내용은 맞지만 downstream 코드가 받을 수 없는 형태로 결과를 만드는 프롬프트입니다."),
      item("The classifier understands the task and returns the correct category, but the form of that answer varies from run to run, so the router that consumes it fails.", "분류기는 작업을 이해하고 올바른 카테고리를 반환하지만, 답의 형태가 실행마다 달라져서 그것을 소비하는 router가 실패합니다."),
      item("The missing piece is an output constraint, and the fix pulls in two of the other techniques to lock the label set and show the format.", "빠진 요소는 출력 제약 조건이며, 해결책은 라벨 집합을 고정하고 형식을 보여 주기 위해 다른 두 기법을 함께 끌어옵니다."),
      item("The walkthrough moves from the bare prompt that causes the problem to the constrained version that resolves it.", "이 walkthrough는 문제를 일으키는 단순한 프롬프트에서 그것을 해결하는 제약된 버전으로 이동합니다."),
      item("Worked example: a classification prompt before and after", "작업 예시: 분류 프롬프트의 수정 전과 수정 후"),
      item("A developer needs Claude to classify support tickets into three categories: billing, technical, and escalation.", "한 개발자는 Claude가 지원 티켓을 billing, technical, escalation 세 가지 카테고리로 분류하기를 원합니다."),
      item("The first prompt is a bare instruction with no constraint on the output:", "첫 번째 프롬프트는 출력에 대한 제약이 없는 단순한 지시문입니다."),
      item("System: \"You are a support classifier. Classify the ticket.\" User: <ticket>I was charged twice for the same month.</ticket>\"", "System: \"당신은 지원 문의 분류기입니다. 티켓을 분류하세요.\" User: <ticket>같은 달 요금이 두 번 청구되었습니다.</ticket>\""),
      item("Claude returns \"Billing\" on some runs, \"billing\" on others, and occasionally a full sentence like \"This looks like a billing issue.\"", "Claude는 어떤 실행에서는 \"Billing\"을, 다른 실행에서는 \"billing\"을 반환하고, 가끔은 \"이것은 billing 문제처럼 보입니다.\" 같은 완전한 문장을 반환합니다."),
      item("The downstream router expects one of a fixed set of labels and breaks on the inconsistency.", "downstream router는 고정된 라벨 집합 중 하나를 기대하므로, 이런 불일치가 생기면 깨집니다."),
      item("Read this against the table above, this situation matches what is described in the first row: the output comes back in a shape the parser cannot accept, so the missing piece is an output constraint.", "이것을 위 표와 비교해 보면, 이 상황은 첫 번째 행의 설명과 일치합니다. 출력이 parser가 받아들일 수 없는 형태로 돌아오므로 빠진 요소는 출력 제약 조건입니다."),
      item("Adding that constraint pulls in two more techniques, because locking the label set and showing the format are jobs those techniques do better than a written instruction can.", "그 제약 조건을 추가하면 두 가지 기법이 더 필요해집니다. 라벨 집합을 고정하고 형식을 보여 주는 일은 글로 쓴 지시보다 그 기법들이 더 잘하기 때문입니다."),
      item("Few-shot examples show Claude the exact label and casing to return, and XML tags keep those examples separate from the instruction so Claude does not read them as part of the task:", "퓨샷 예시는 Claude에게 반환해야 할 정확한 라벨과 대소문자를 보여 주고, XML 태그는 예시를 지시문과 분리해 Claude가 그것을 작업의 일부로 읽지 않게 합니다."),
      item("System: \"You are a support classifier. Classify each ticket into exactly one of: BILLING, TECHNICAL, ESCALATION. Return only the label. No other text.\"", "System: \"당신은 지원 문의 분류기입니다. 각 티켓을 BILLING, TECHNICAL, ESCALATION 중 정확히 하나로 분류하세요. 라벨만 반환하고 다른 텍스트는 쓰지 마세요.\""),
      item("<sample_input>My account shows two charges for April.</sample_input>", "<sample_input>내 계정에 4월 요금이 두 번 표시됩니다.</sample_input>"),
      item("<ideal_output>BILLING</ideal_output>", "<ideal_output>BILLING</ideal_output>"),
      item("<sample_input>The API keeps returning a 429 error.</sample_input>", "<sample_input>API가 계속 429 오류를 반환합니다.</sample_input>"),
      item("<ideal_output>TECHNICAL</ideal_output>", "<ideal_output>TECHNICAL</ideal_output>"),
      item("User: <ticket>I was charged twice for the same month.</ticket>", "User: <ticket>같은 달 요금이 두 번 청구되었습니다.</ticket>"),
      item("Three techniques are doing distinct work here.", "여기서는 세 가지 기법이 각각 다른 일을 하고 있습니다."),
      item("The system prompt sets the output contract: exactly one label from a fixed set, nothing else.", "시스템 프롬프트는 출력 계약을 정합니다. 고정된 집합에서 정확히 하나의 라벨만, 그 외에는 아무것도 쓰지 않는 것입니다."),
      item("The XML tags mark where each example ends and the next begins, so Claude does not read the examples as part of the instruction.", "XML 태그는 각 예시가 어디서 끝나고 다음 예시가 어디서 시작되는지 표시해서, Claude가 예시를 지시문의 일부로 읽지 않게 합니다."),
      item("The few-shot pairs show the exact casing and format rather than describing it.", "퓨샷 쌍은 형식을 설명하는 대신 정확한 대소문자와 형식을 직접 보여 줍니다."),
      item("Together they produce a result consistent enough to route programmatically.", "이것들이 함께 작동하면 프로그램으로 라우팅할 수 있을 만큼 일관된 결과가 만들어집니다."),
      item("The table below shows how we can stack all the four techniques together, where the prompt should be simplified, and where we should diagnose before adding more before too many iterations.", "아래 표는 네 가지 기법을 모두 어떻게 쌓을 수 있는지, 어디에서 프롬프트를 단순화해야 하는지, 너무 많은 반복 전에 어디에서 진단해야 하는지를 보여 줍니다."),
      item("Stack all four techniques: Stacking all four techniques against a clearly defined output contract.", "네 가지 기법 모두 쌓기: 명확하게 정의된 출력 계약에 대해 네 가지 기법을 모두 적용합니다."),
      item("Tasks with well-specified formats and edge cases that can be covered by examples.", "형식이 잘 지정되어 있고 예시로 다룰 수 있는 edge case가 있는 작업입니다."),
      item("Simplify the prompt: Adding all four techniques to a simple task that only needs one.", "프롬프트 단순화: 하나의 기법만 필요한 간단한 작업에 네 가지 기법을 모두 추가하는 경우입니다."),
      item("A \"summarize this paragraph\" prompt does not need few-shot examples and an output schema.", "\"이 문단을 요약해 줘\" 같은 프롬프트에는 퓨샷 예시와 출력 스키마가 필요하지 않습니다."),
      item("Diagnose before adding more: Prompts that are growing longer with each iteration rather than more precise.", "더 추가하기 전에 진단하기: 반복할수록 더 정확해지는 것이 아니라 더 길어지는 프롬프트입니다."),
      item("If you have re-prompted five times and the output is still wrong, diagnose the failure type before adding more text.", "다섯 번 다시 프롬프트했는데도 출력이 여전히 틀렸다면, 더 많은 텍스트를 추가하기 전에 실패 유형을 진단하세요.")
    ]
  },
  {
    id: "2-1-3-when-to-reach-for-each-technique",
    title: "2-1-3. When to reach for each technique",
    items: [
      item("2-1-3. When to reach for each technique", "2-1-3. 각 기법을 언제 사용할지"),
      item("Now, let's understand more about each of these techniques and when each one applies:", "이제 각 기법과 그것이 언제 적용되는지 더 자세히 이해해 봅시다."),
      item("1. System prompts : System prompts carry the behavioral contract for the whole session. Write them once and treat them as your persistent instruction layer. They define Claude's role, the output format, and any rules that must not change between conversations.", "1. System prompts : 시스템 프롬프트는 전체 세션의 행동 계약을 담습니다. 한 번 작성한 뒤 지속적인 지시 계층으로 다루세요. 그것들은 Claude의 역할, 출력 형식, 그리고 대화 사이에서도 바뀌면 안 되는 규칙을 정의합니다."),
      item("2. XML tags : XML tags are used when the prompt mixes inputs with instructions. A prompt that asks Claude to debug code using provided documentation is a good example; without tags, the code and the documentation look the same to Claude. Wrap them with descriptive tag names like <my_code> and <docs> and the boundary becomes unambiguous. You do not need to use official XML tag names; descriptive names that match your content work best.", "2. XML tags : XML 태그는 프롬프트가 입력과 지시를 섞을 때 사용됩니다. 제공된 문서를 사용해 Claude에게 코드를 디버그하라고 요청하는 프롬프트가 좋은 예입니다. 태그가 없으면 코드와 문서가 Claude에게 똑같이 보입니다. <my_code>와 <docs> 같은 설명적인 태그 이름으로 감싸면 경계가 명확해집니다. 공식 XML 태그 이름을 사용할 필요는 없습니다. 내용에 맞는 설명적인 이름이 가장 잘 작동합니다."),
      item("3. Few-shot examples : Few-shot examples are considered useful because they show rather than just tell. Instead of trying to describe the exact format you want, you provide one correct input-output pair and let Claude infer the pattern. To use this, wrap examples using consistent XML structure, for instance <sample_input> and <ideal_output>, so the boundary between example and prompt is clear. You can use some examples from your highest-scoring evaluation outputs rather than writing them from scratch.", "3. Few-shot examples : 퓨샷 예시는 말로 설명하는 데 그치지 않고 직접 보여 주기 때문에 유용합니다. 원하는 정확한 형식을 설명하려고 하기보다, 올바른 입력-출력 쌍 하나를 제공하고 Claude가 패턴을 추론하게 합니다. 이를 사용하려면 <sample_input>과 <ideal_output>처럼 일관된 XML 구조로 예시를 감싸서 예시와 프롬프트 사이의 경계를 명확히 하세요. 처음부터 새로 쓰기보다 가장 높은 점수를 받은 evaluation output에서 일부 예시를 사용할 수 있습니다."),
      item("4. Output constraints : Output constraints are the last line of defense before Claude's response reaches your parser. You should specify exactly what you need, including field names, types, length limits, whether to include preamble, and what to do when data is absent. Use structured output features in cases when the format must be machine-readable.", "4. Output constraints : 출력 제약 조건은 Claude의 응답이 parser에 도달하기 전 마지막 방어선입니다. 필드 이름, 타입, 길이 제한, preamble 포함 여부, 데이터가 없을 때 무엇을 할지 등 필요한 것을 정확히 지정해야 합니다. 형식이 반드시 기계가 읽을 수 있어야 하는 경우에는 structured output 기능을 사용하세요.")
    ]
  },
  {
    id: "2-1-4-the-iteration-loop-diagnosing-before-re-prompting",
    title: "2-1-4. The iteration loop: Diagnosing before re-prompting",
    items: [
      item("2-1-4. The iteration loop: Diagnosing before re-prompting", "2-1-4. 반복 루프: 다시 프롬프트하기 전에 진단하기"),
      item("When a first-pass response misses the mark, the instinct is to add more words to the prompt and try again.", "첫 번째 응답이 목표에서 벗어나면, 프롬프트에 말을 더 추가하고 다시 시도하고 싶어집니다."),
      item("That instinct almost always makes the problem harder to diagnose and rarely fixes it.", "그런 직감은 거의 항상 문제를 진단하기 더 어렵게 만들고, 해결하는 경우는 드뭅니다."),
      item("Instead, diagnose the problem first, and then re-prompt based on your findings.", "대신 먼저 문제를 진단하고, 그 결과를 바탕으로 다시 프롬프트하세요."),
      item("The failure type tells you which technique is missing:", "실패 유형은 어떤 기법이 빠졌는지를 알려 줍니다."),
      item("Wrong format: This is caused due to a missing output constraint.", "잘못된 형식: 출력 제약 조건이 빠져 있어서 발생합니다."),
      item("The prompt never specified what shape the result should take.", "프롬프트가 결과가 어떤 형태를 가져야 하는지 지정하지 않았습니다."),
      item("Wrong content or scope drift: This is caused due to an underspecified system prompt; the behavioral contract was too vague to hold across conversations.", "잘못된 내용 또는 범위 이탈: 이는 시스템 프롬프트가 충분히 구체적이지 않아서 생깁니다. 행동 계약이 너무 모호해서 대화 전반에 유지되지 못했습니다."),
      item("Correct task but hallucinated structure: This happens when few-shot examples are needed.", "작업은 맞지만 구조를 환각함: 퓨샷 예시가 필요할 때 발생합니다."),
      item("Claude cannot infer the exact structure from a description alone.", "Claude는 설명만으로 정확한 구조를 추론할 수 없습니다."),
      item("Good output on simple inputs but breaks on edge cases: The prompt handles the happy path but has no constraint covering the variant the parser breaks on.", "간단한 입력에서는 출력이 좋지만 edge case에서 깨짐: 프롬프트가 정상 경로만 처리하고 parser가 깨지는 변형을 다루는 제약 조건이 없습니다."),
      item("The fix is structural, not a matter of phrasing.", "해결책은 표현의 문제가 아니라 구조의 문제입니다."),
      item("For example, if Claude is ignoring a boundary between your instructions and your content, clearer wording will not fix it, and if the output format keeps drifting, saying \"please format this correctly\" will not fix it either.", "예를 들어 Claude가 지시문과 내용 사이의 경계를 무시한다면 더 명확한 표현으로는 해결되지 않으며, 출력 형식이 계속 흔들린다면 \"please format this correctly\"라고 말해도 해결되지 않습니다."),
      item("In each case, identify which of the four techniques is absent and add it.", "각 경우마다 네 가지 기법 중 무엇이 빠졌는지 확인하고 그것을 추가하세요.")
    ]
  },
  {
    id: "2-1-5-moving-output-control-from-the-prompt-into-the-api-with-structured-outputs",
    title: "2-1-5. Moving output control from the prompt into the API with structured outputs",
    items: [
      item("2-1-5. Moving output control from the prompt into the API with structured outputs", "2-1-5. structured outputs로 출력 제어를 프롬프트에서 API로 옮기기"),
      item("Everything up to this point shapes the output by writing instructions into the prompt and hoping Claude follows them.", "여기까지의 모든 방법은 프롬프트에 지시를 작성하고 Claude가 그것을 따르기를 기대함으로써 출력을 형성합니다."),
      item("That works most of the time, but the prompt is a request, so a model can still return a stray sentence, a wrong field name, or malformed JSON that breaks the parser downstream.", "대부분의 경우에는 작동하지만, 프롬프트는 요청일 뿐이므로 모델은 여전히 stray sentence, 잘못된 필드 이름, 또는 downstream parser를 깨뜨리는 malformed JSON을 반환할 수 있습니다."),
      item("The Claude API has a separate mechanism that removes that gap for production code.", "Claude API에는 프로덕션 코드에서 그 간극을 제거하는 별도의 메커니즘이 있습니다."),
      item("It is called structured outputs, and instead of asking for a shape in words, you hand the API a JSON schema, and the model is constrained at generation time to produce output that matches it.", "그것은 structured outputs라고 하며, 말로 형태를 요청하는 대신 API에 JSON schema를 넘기면 모델은 생성 시점에 그 schema와 일치하는 출력을 만들도록 제약됩니다."),
      item("This technique is constrained decoding: as Claude generates each token, the API only allows tokens that keep the output valid against your schema, so a response that violates the schema cannot be produced in the first place.", "이 기법은 constrained decoding입니다. Claude가 각 토큰을 생성할 때 API는 schema에 대해 출력이 유효하게 유지되는 토큰만 허용하므로, schema를 위반하는 응답은 처음부터 생성될 수 없습니다."),
      item("Structured outputs cover two situations that show up in real pipelines.", "Structured outputs는 실제 pipeline에서 나타나는 두 가지 상황을 다룹니다."),
      item("Each one constrains a different part of what the model returns, and you can use them on their own or together in the same request.", "각각은 모델이 반환하는 서로 다른 부분을 제약하며, 단독으로 쓰거나 같은 요청 안에서 함께 사용할 수 있습니다."),
      item("JSON outputs constrain the final response.", "JSON outputs는 최종 응답을 제약합니다."),
      item("You set the output_config.format parameter with type json_schema and your schema, and Claude returns valid JSON in the response text that matches that schema every time.", "output_config.format 파라미터에 type json_schema와 schema를 설정하면, Claude는 매번 그 schema와 일치하는 유효한 JSON을 응답 텍스트로 반환합니다."),
      item("Reach for this when the model itself is producing the structured payload your code consumes, like extracting fields from a support ticket or formatting an API response, because it removes the parse-and-retry code you would otherwise write around every call.", "지원 티켓에서 필드를 추출하거나 API 응답을 형식화하는 것처럼 모델 자체가 코드가 소비할 구조화된 payload를 만들 때 이것을 사용하세요. 그러면 각 호출 주변에 작성해야 했을 parse-and-retry 코드를 제거할 수 있습니다."),
      item("Strict tool use constrains the inputs Claude passes to your tools.", "Strict tool use는 Claude가 도구에 전달하는 입력을 제약합니다."),
      item("You set strict to true on a tool definition, and the arguments Claude sends to that tool are validated against the input schema before your code runs.", "도구 정의에서 strict를 true로 설정하면, Claude가 그 도구에 보내는 인자가 코드가 실행되기 전에 input schema에 대해 검증됩니다."),
      item("Reach for this in agentic loops where a malformed tool argument would crash the function or trigger a wrong action; this helps guarantee the call your code receives already conforms to the contract you defined.", "잘못된 도구 인자가 함수를 crash시키거나 잘못된 행동을 유발할 수 있는 agentic loop에서 이것을 사용하세요. 이렇게 하면 코드가 받는 호출이 이미 정의한 contract를 따른다는 것을 보장하는 데 도움이 됩니다."),
      item("The reason this belongs in the production code and not just in the prompt is because of reliability under inputs you did not test.", "이것이 프롬프트에만 머무르지 않고 프로덕션 코드에 있어야 하는 이유는 테스트하지 않은 입력에서도 신뢰성을 확보하기 위해서입니다."),
      item("A prompt-level instruction to return only JSON holds on the cases you tried and then slips on an edge case you did not, which is the exact failure the earlier classification example walked through.", "JSON만 반환하라는 프롬프트 수준의 지시는 시도해 본 경우에는 유지되다가, 시도하지 않은 edge case에서 미끄러질 수 있습니다. 이것이 앞의 classification 예시가 살펴본 정확한 실패입니다."),
      item("A schema constraint does not slip, because the API enforces it on every token rather than trusting the model to remember the instruction.", "schema 제약은 미끄러지지 않습니다. 모델이 지시를 기억하리라 믿는 대신 API가 모든 토큰에서 그것을 강제하기 때문입니다."),
      item("That moves output correctness from something you verify after the fact to something the API rules out before it happens.", "이는 출력의 정확성을 사후에 검증해야 하는 것에서, API가 발생 전에 차단하는 것으로 옮깁니다."),
      item("Constraining generation has costs, and a developer choosing this in production needs to weigh them rather than enabling it everywhere by default.", "생성을 제약하는 데에는 비용이 있으며, 프로덕션에서 이를 선택하는 개발자는 기본적으로 모든 곳에 켜기보다 그 비용을 따져야 합니다."),
      item("Below are some of those costs you must consider:", "아래는 고려해야 할 비용 중 일부입니다."),
      item("The first request on a new schema is slower.", "새 schema의 첫 번째 요청은 더 느립니다."),
      item("The API compiles your schema into a grammar before it can constrain output, and that compilation adds latency on the first call.", "API는 출력을 제약하기 전에 schema를 grammar로 컴파일하며, 그 컴파일은 첫 호출에 latency를 추가합니다."),
      item("Compiled grammars are cached for 24 hours from last use, so steady traffic on a stable schema pays the cost once, but a workload that changes schemas constantly pays it repeatedly.", "컴파일된 grammar는 마지막 사용 시점부터 24시간 동안 캐시되므로 안정적인 schema에 대한 꾸준한 traffic은 비용을 한 번만 지불하지만, schema가 계속 바뀌는 workload는 그 비용을 반복해서 지불합니다."),
      item("Your input token count rises.", "입력 토큰 수가 증가합니다."),
      item("When structured outputs are on, the API adds a system prompt describing the expected format, and that injected prompt is billed like any other input token.", "structured outputs가 켜져 있으면 API는 기대 형식을 설명하는 시스템 프롬프트를 추가하며, 이 주입된 프롬프트도 다른 입력 토큰처럼 과금됩니다."),
      item("The increase is small per call, but it is worth knowing when you are estimating cost at volume.", "호출당 증가량은 작지만, 대량 사용 비용을 추정할 때 알아 둘 가치가 있습니다."),
      item("A guaranteed schema is not a guaranteed success.", "schema가 보장된다고 해서 성공이 보장되는 것은 아닙니다."),
      item("Two cases still return output that does not match: a refusal, where the model declines for safety reasons and the response carries stop_reason refusal, and a truncation, where the response hits the max_tokens limit and stops mid-structure with stop_reason max_tokens.", "여전히 일치하지 않는 출력을 반환하는 두 경우가 있습니다. 하나는 모델이 안전상의 이유로 거절하고 응답이 stop_reason refusal을 갖는 refusal이며, 다른 하나는 응답이 max_tokens 제한에 도달해 구조 중간에서 stop_reason max_tokens로 멈추는 truncation입니다."),
      item("Your code still checks stop_reason rather than assuming every response parses.", "따라서 코드는 모든 응답이 parse된다고 가정하지 말고 여전히 stop_reason을 확인해야 합니다."),
      item("It does not combine with message prefilling.", "message prefilling과는 함께 사용할 수 없습니다."),
      item("JSON outputs and prefilling the assistant message are incompatible, so a pattern that starts the response for Claude and a pattern that constrains the whole response to a schema cannot run on the same request.", "JSON outputs와 assistant message prefilling은 호환되지 않으므로, Claude의 응답을 미리 시작해 주는 패턴과 전체 응답을 schema로 제약하는 패턴은 같은 요청에서 함께 실행될 수 없습니다."),
      item("Pick the one that fits the task.", "작업에 맞는 것을 선택하세요.")
    ]
  },
  {
    id: "2-2-extended-thinking",
    title: "2-2. Extended Thinking",
    items: [
      item("2-2. Extended Thinking", "2-2. 확장 사고"),
      item("Extended Thinking: Turning reasoning on, calibrating effort, and reading it back correctly", "확장 사고: reasoning을 켜고, effort를 조정하고, 되돌아온 reasoning을 올바르게 읽기"),
      item("The prompting techniques shape what Claude produces.", "프롬프팅 기법은 Claude가 무엇을 만들어 내는지를 형성합니다."),
      item("Extended thinking shapes how much work Claude does before it answers.", "확장 사고는 Claude가 답하기 전에 얼마나 많은 작업을 하는지를 형성합니다."),
      item("Turn it on, and the model writes out its step-by-step reasoning first, then gives you the final answer.", "이를 켜면 모델은 먼저 단계별 reasoning을 작성한 뒤 최종 답변을 제공합니다."),
      item("Your job is to decide when that extra work is worth the cost and to handle the reasoning it sends back.", "당신의 역할은 그 추가 작업이 비용을 들일 가치가 있는지 결정하고, 모델이 돌려보내는 reasoning을 처리하는 것입니다.")
    ]
  },
  {
    id: "2-2-1-what-extended-thinking-does",
    title: "2-2-1. What extended thinking does",
    items: [
      item("2-2-1. What extended thinking does", "2-2-1. 확장 사고가 하는 일"),
      item("When you turn on extended thinking, the model \"thinks out loud\" before it responds.", "확장 사고를 켜면 모델은 응답하기 전에 \"소리 내어 생각\"합니다."),
      item("You'll see this reasoning come back as its own thinking block in the API response, positioned just ahead of the block that holds the actual answer.", "이 reasoning은 API 응답에서 실제 답변 블록 바로 앞에 위치한 별도의 thinking block으로 돌아옵니다."),
      item("On the newest models, the thinking block's content is omitted by default; you must request a readable summary through the display setting to see it.", "최신 모델에서는 thinking block의 내용이 기본적으로 생략됩니다. 이를 보려면 display 설정을 통해 읽을 수 있는 요약을 요청해야 합니다."),
      item("On current models reasoning is adaptive: you enable it with the thinking parameter where it is not already on by default, and the model decides how much reasoning each request needs.", "현재 모델에서 reasoning은 적응형입니다. 기본적으로 켜져 있지 않은 경우 thinking 파라미터로 활성화하고, 모델이 각 요청에 필요한 reasoning 양을 결정합니다."),
      item("You tune depth with the effort setting rather than a fixed token budget.", "깊이는 고정된 토큰 예산이 아니라 effort 설정으로 조정합니다."),
      item("The older budget_tokens control is deprecated and, on the newest model generations, returns a 400 error.", "이전의 budget_tokens 제어는 deprecated 되었고, 최신 모델 세대에서는 400 오류를 반환합니다."),
      item("That reasoning isn't free; thinking tokens cost the same as output tokens, so running a simple task at high effort means paying for accuracy you don't need.", "그 reasoning은 무료가 아닙니다. thinking token은 output token과 같은 비용이 들기 때문에, 간단한 작업을 high effort로 실행하면 필요 없는 정확도에 비용을 지불하는 셈입니다."),
      item("The choice here mirrors the one you have already made: match the tool to the task.", "여기서의 선택은 이미 했던 선택과 같습니다. 도구를 작업에 맞추는 것입니다."),
      item("Don't reach for extended thinking by default, apply it strategically where needed.", "확장 사고를 기본값처럼 사용하지 말고, 필요한 곳에 전략적으로 적용하세요.")
    ]
  },
  {
    id: "2-2-2-when-to-use-extended-thinking",
    title: "2-2-2. When to use extended thinking",
    items: [
      item("2-2-2. When to use extended thinking", "2-2-2. 확장 사고를 언제 사용할지"),
      item("Task shape: Multi-step reasoning where the model has to hold several constraints at once: a math derivation, a multi-hop logic problem, planning a sequence of dependent actions.", "작업 형태: 수학 유도, multi-hop 논리 문제, 의존적인 행동 순서 계획처럼 모델이 여러 제약을 동시에 붙잡아야 하는 다단계 reasoning 작업입니다."),
      item("Extended thinking call: Enable it, with the effort level matched to the depth of the problem.", "확장 사고 호출: 활성화하되, 문제의 깊이에 맞게 effort 수준을 맞춥니다."),
      item("Reason: The reasoning pass is where the model works through dependencies it would otherwise skip.", "이유: reasoning pass는 모델이 그냥 지나칠 수 있는 의존 관계를 처리하는 곳입니다."),
      item("Task shape: Mechanical or lookup tasks: classification, format conversion, extracting a field, short factual answers.", "작업 형태: 분류, 형식 변환, 필드 추출, 짧은 사실 답변 같은 기계적 작업이나 조회 작업입니다."),
      item("Extended thinking call: Leave it off.", "확장 사고 호출: 끕니다."),
      item("Reason: Extended thinking will not improve the answer, and you will be paying more tokens for something you didn't need.", "이유: 확장 사고는 답을 개선하지 않으며, 필요 없는 것에 더 많은 토큰 비용을 지불하게 됩니다."),
      item("A bare prompt with an output constraint is the right tool.", "출력 제약 조건이 있는 단순한 프롬프트가 올바른 도구입니다."),
      item("Task shape: Agentic loops where the model plans across several tool calls.", "작업 형태: 모델이 여러 도구 호출에 걸쳐 계획하는 agentic loop입니다."),
      item("Extended thinking call: Enable it and budget for the planning step rather than per call.", "확장 사고 호출: 활성화하고, 각 호출마다가 아니라 계획 단계에 예산을 배정합니다."),
      item("Reason: Reasoning before a plan reduces wrong-tool selection downstream.", "이유: 계획 전에 reasoning을 하면 downstream에서 잘못된 도구를 선택할 가능성이 줄어듭니다."),
      item("Note the carry-back rule below, which applies in every tool-use loop.", "아래의 carry-back rule에 주의하세요. 이 규칙은 모든 tool-use loop에 적용됩니다.")
    ]
  },
  {
    id: "2-2-3-the-carry-back-rule-thinking-blocks-must-return-to-the-api-unchanged",
    title: "2-2-3. The carry-back rule: thinking blocks must return to the API unchanged",
    items: [
      item("2-2-3. The carry-back rule: thinking blocks must return to the API unchanged", "2-2-3. carry-back 규칙: thinking block은 변경 없이 API로 되돌려 보내야 합니다."),
      item("When extended thinking is on and your conversation uses tools, there's one rule you can't skip: every thinking block you get back has to go back to the API exactly as it arrived on the next turn.", "확장 사고가 켜져 있고 대화가 도구를 사용할 때는 건너뛸 수 없는 규칙이 하나 있습니다. 받은 모든 thinking block은 다음 턴에 도착한 그대로 API로 되돌려 보내야 합니다."),
      item("Each block comes with a signature that confirms the reasoning wasn't tampered with.", "각 block에는 reasoning이 조작되지 않았음을 확인하는 signature가 함께 옵니다."),
      item("If you edit it, summarize it, or drop it, the signature stops matching and the API rejects the request.", "이를 수정하거나 요약하거나 제거하면 signature가 맞지 않게 되고 API가 요청을 거부합니다."),
      item("Redacted thinking blocks work the same way.", "redacted thinking block도 같은 방식으로 작동합니다."),
      item("Their contents are encrypted and not meant to be read by humans, but they still have to be returned untouched.", "그 내용은 암호화되어 있고 사람이 읽기 위한 것이 아니지만, 그래도 변경 없이 되돌려 보내야 합니다."),
      item("This is a structural requirement, not a prompting choice you get to make.", "이것은 프롬프팅 선택이 아니라 구조적 요구사항입니다."),
      item("The most common slip-up is stripping out the thinking block to save context, which ends up breaking your next request.", "가장 흔한 실수는 context를 아끼려고 thinking block을 제거하는 것이며, 결국 다음 요청을 망가뜨립니다."),
      item("If the real worry is how much context piles up from accumulated reasoning, the fix is the context-engineering work we'll cover in this module.", "진짜 걱정이 누적된 reasoning으로 context가 얼마나 쌓이는지라면, 해결책은 이 모듈에서 다룰 context-engineering 작업입니다."),
      item("Forward pointer", "다음으로 이어지는 안내"),
      item("This lesson enables reasoning and calibrates its effort setting; it does not cover model selection.", "이 lesson은 reasoning을 활성화하고 effort 설정을 조정하는 내용을 다루며, 모델 선택은 다루지 않습니다."),
      item("Choosing which model to run, as distinct from whether to enable reasoning, is taught in the MSO Foundations module that precedes this one.", "reasoning을 켤지 여부와 별개로 어떤 모델을 실행할지 선택하는 내용은 이 모듈 앞의 MSO Foundations 모듈에서 배웁니다."),
      item("Handles well", "잘 처리하는 경우"),
      item("Hard reasoning and planning tasks where a wrong answer is expensive and the extra tokens buy accuracy.", "틀린 답의 비용이 크고 추가 토큰이 정확도를 높여 주는 어려운 reasoning 및 planning 작업입니다."),
      item("Adds cost or complexity", "비용 또는 복잡성을 추가하는 경우"),
      item("The carry-back requirement in tool-use loops, and an effort setting you now must calibrate.", "도구 사용 루프에서의 carry-back 요구사항과 이제 조정해야 하는 effort 설정입니다."),
      item("Use a different approach", "다른 접근법을 써야 하는 경우"),
      item("For classification, extraction, and format tasks, a well-constrained prompt is cheaper and just as accurate.", "분류, 추출, 형식 작업에는 잘 제약된 프롬프트가 더 저렴하고 충분히 정확합니다.")
    ]
  },
  {
    id: "2-3-tool-use-and-schema-design",
    title: "2-3. Tool-use and Schema Design",
    items: [
      item("2-3. Tool-use and Schema Design", "2-3. 도구 사용과 스키마 설계"),
      item("Tool Schemas Claude Selects Correctly: Definition, Loop, and Calling Patterns", "Claude가 올바르게 선택하는 도구 스키마: 정의, 루프, 호출 패턴")
    ]
  },
  {
    id: "2-3-1-how-the-tool-use-loop-works",
    title: "2-3-1. How the tool-use loop works",
    items: [
      item("2-3-1. How the tool-use loop works", "2-3-1. 도구 사용 루프가 작동하는 방식"),
      item("The most common misconception about tool-use is that Claude runs the tools.", "도구 사용에 대한 가장 흔한 오해는 Claude가 도구를 실행한다고 생각하는 것입니다."),
      item("Instead, Claude reads your tool definitions, decides which one fits the situation, and tells your application what to call it along with the required inputs.", "대신 Claude는 도구 정의를 읽고, 상황에 맞는 도구를 결정한 뒤, 필요한 입력과 함께 애플리케이션이 무엇을 호출해야 하는지 알려 줍니다."),
      item("Your application executes the tool, gets the result, and sends it back; then Claude uses that result to continue.", "애플리케이션은 도구를 실행하고 결과를 받은 뒤 다시 보내며, Claude는 그 결과를 사용해 계속 진행합니다."),
      item("This back-and-forth shouldn’t be ignored in production: if your application does not handle the return correctly, Claude never gets the data it asked for, and the loop breaks.", "프로덕션에서는 이 왕복 과정을 무시하면 안 됩니다. 애플리케이션이 반환을 올바르게 처리하지 않으면 Claude는 요청한 데이터를 받지 못하고 루프가 끊어집니다."),
      item("The boundary between what Claude owns and what your code owns is where most tool-use bugs live.", "Claude가 담당하는 것과 코드가 담당하는 것 사이의 경계에 대부분의 도구 사용 버그가 있습니다."),
      item("Here is the sequence to ensure proper implementation of tool-use.", "도구 사용을 올바르게 구현하기 위한 순서는 다음과 같습니다."),
      item("Click each step to see what happens.", "각 단계를 클릭해서 어떤 일이 일어나는지 확인하세요."),
      item("1. Define schema : You define a schema with a name, a description, and an input schema. Claude reads this to decide whether and when to call the tool.", "1. Define schema : 이름, 설명, 입력 스키마가 있는 스키마를 정의합니다. Claude는 이것을 읽고 도구를 호출할지, 언제 호출할지 결정합니다."),
      item("2. Send message : Your code sends a message to Claude including the tool definitions and the user's input.", "2. Send message : 코드는 도구 정의와 사용자 입력을 포함한 메시지를 Claude에게 보냅니다."),
      item("3. tool_use block : Claude issues a tool-use block containing the tool name, a unique ID, and the input arguments it wants to pass. The API response comes back with stop_reason: tool_use.", "3. tool_use block : Claude는 도구 이름, 고유 ID, 전달하려는 입력 인자를 포함한 tool-use block을 발행합니다. API 응답은 stop_reason: tool_use와 함께 돌아옵니다."),
      item("4. Execute tool : Your code executes the tool using those arguments. Note that the assistant turn has already ended (Claude is not holding a connection open or waiting on your server). The model is stateless between calls. To continue, your code makes a fresh API request containing the prior messages plus the tool result.", "4. Execute tool : 코드는 그 인자를 사용해 도구를 실행합니다. 이때 assistant 턴은 이미 끝났다는 점에 주의하세요. Claude가 연결을 열어 두거나 서버를 기다리는 것이 아닙니다. 모델은 호출 사이에 상태를 유지하지 않습니다. 계속하려면 코드는 이전 메시지와 도구 결과를 포함한 새 API 요청을 만듭니다."),
      item("5. Return result : You return the result in a tool-result block that references the original tool-use ID.", "5. Return result : 원래 tool-use ID를 참조하는 tool-result block으로 결과를 반환합니다."),
      item("6. Claude continues : Claude continues using the tool result as context for its next response, either another tool-use block or a final end turn.", "6. Claude continues : Claude는 도구 결과를 다음 응답의 context로 사용해 계속 진행합니다. 다음 응답은 또 다른 tool-use block이거나 최종 종료 턴일 수 있습니다."),
      item("It’s important to note that the loop is not automatic and you need to complete the fourth step.", "이 루프는 자동이 아니며 네 번째 단계를 직접 완료해야 한다는 점이 중요합니다."),
      item("If the miss is systematic, the fix is in the schema definition step.", "오류가 반복적으로 발생한다면 해결책은 스키마 정의 단계에 있습니다.")
    ]
  },
  {
    id: "2-3-2-message-block-structure-in-a-tool-use-conversation",
    title: "2-3-2. Message block structure in a tool-use conversation",
    items: [
      item("2-3-2. Message block structure in a tool-use conversation", "2-3-2. 도구 사용 대화에서의 메시지 블록 구조"),
      item("A tool-use conversation is built out of structured blocks, not plain text.", "도구 사용 대화는 일반 텍스트가 아니라 구조화된 블록으로 만들어집니다."),
      item("Each assistant turn and user turn is a list of blocks, and four block types do the work in a tool-use session.", "각 assistant 턴과 user 턴은 블록 목록이며, 도구 사용 세션에서는 네 가지 블록 타입이 핵심 역할을 합니다."),
      item("A text block carries Claude’s prose response.", "text block은 Claude의 서술형 응답을 담습니다."),
      item("A tool_use block carries a tool call, including the tool name, a unique ID, and the input arguments.", "tool_use block은 도구 이름, 고유 ID, 입력 인자를 포함한 도구 호출을 담습니다."),
      item("A tool_result block carries what your code returned after running the tool.", "tool_result block은 코드가 도구를 실행한 뒤 반환한 내용을 담습니다."),
      item("A thinking block carries Claude’s internal reasoning, and it only appears when extended thinking is enabled.", "thinking block은 Claude의 내부 reasoning을 담으며, extended thinking이 활성화된 경우에만 나타납니다."),
      item("The API enforces a specific pairing between these blocks.", "API는 이 블록들 사이의 특정한 짝짓기를 강제합니다."),
      item("Every tool_use block in an assistant turn must be answered by a tool_result block with a matching ID in the user turn that immediately follows.", "assistant 턴의 모든 tool_use block은 바로 다음 user 턴에서 일치하는 ID를 가진 tool_result block으로 응답되어야 합니다."),
      item("If the IDs don’t match, if the result is missing, or if the turns are out of order, the request fails validation.", "ID가 일치하지 않거나, 결과가 없거나, 턴 순서가 맞지 않으면 요청은 validation에 실패합니다."),
      item("This is not something you can fix by adjusting your prompt; it’s structural, and your code has to produce the sequence correctly on every request.", "이것은 프롬프트를 조정해서 고칠 수 있는 문제가 아닙니다. 구조적인 문제이며, 코드는 모든 요청에서 그 순서를 올바르게 만들어야 합니다."),
      item("The table below summarizes each block type, what it contains, and the rule that governs how your code must handle it.", "아래 표는 각 블록 타입, 포함 내용, 그리고 코드가 그것을 처리할 때 따라야 하는 규칙을 요약합니다."),
      item("Block type: text block\nRole: Assistant/Claude\nContains: Claude’s prose output\nCritical rule: Claude may return a text block alongside a tool_use block in the same turn. When it does, your code must preserve the full content array, including the text block, when appending that turn to conversation history. Dropping the text block corrupts the context Claude relies on for follow-up turns.", "Block type: text block\nRole: Assistant/Claude\nContains: Claude의 서술형 출력\nCritical rule: Claude는 같은 턴에서 tool_use block과 함께 text block을 반환할 수 있습니다. 그런 경우 코드는 그 턴을 대화 기록에 추가할 때 text block을 포함한 전체 content array를 보존해야 합니다. text block을 버리면 Claude가 후속 턴에서 의존하는 context가 손상됩니다."),
      item("Block type: tool_use block\nRole: Assistant/Claude\nContains: The tool name, a unique ID, and the input arguments Claude wants passed to your function\nCritical rule: Every tool_use block must be answered by a tool_result block in the immediately following user turn. The tool_result must carry the same ID. Without that pairing, the API rejects the next request.", "Block type: tool_use block\nRole: Assistant/Claude\nContains: 도구 이름, 고유 ID, Claude가 함수에 전달하려는 입력 인자\nCritical rule: 모든 tool_use block은 바로 다음 user 턴에서 tool_result block으로 응답되어야 합니다. tool_result는 같은 ID를 가져야 합니다. 이 짝이 없으면 API는 다음 요청을 거부합니다."),
      item("Block type: tool_result block\nRole: User\nContains: Matching tool_use ID, the result content, and an optional is_error flag set to true when the tool call fails\nCritical rule: The tool_use_id value must match the original tool_use block exactly. Claude uses this ID to connect each result back to the call that produced it, which matters when a single assistant turn issues multiple tool calls and the results arrive in a different order.", "Block type: tool_result block\nRole: User\nContains: 일치하는 tool_use ID, 결과 content, 그리고 도구 호출이 실패했을 때 true로 설정되는 선택적 is_error flag\nCritical rule: tool_use_id 값은 원래 tool_use block과 정확히 일치해야 합니다. Claude는 이 ID를 사용해 각 결과를 그것을 만든 호출과 연결하며, 하나의 assistant 턴이 여러 도구 호출을 발행하고 결과가 다른 순서로 도착할 때 중요합니다."),
      item("Block type: thinking block\nRole: Assistant (extended thinking only)/Claude\nContains: Claude’s internal reasoning, visible only when extended thinking is enabled\nCritical rule: The block must be passed back to the API unchanged in subsequent turns. The signature verifies the reasoning hasn’t been modified, so any edit or summary breaks the signature and the API rejects the message. Redacted thinking blocks follow the same rule: pass them back as received, even though the content is encrypted and not human-readable.", "Block type: thinking block\nRole: Assistant (extended thinking only)/Claude\nContains: extended thinking이 활성화된 경우에만 보이는 Claude의 내부 reasoning\nCritical rule: 이 block은 이후 턴에서 변경 없이 API로 다시 전달되어야 합니다. signature는 reasoning이 수정되지 않았음을 검증하므로, 어떤 편집이나 요약도 signature를 깨뜨리고 API가 메시지를 거부하게 만듭니다. Redacted thinking block도 같은 규칙을 따릅니다. 내용이 암호화되어 사람이 읽을 수 없더라도 받은 그대로 다시 전달해야 합니다."),
      item("The critical invariant is that every tool_use block from an assistant turn must have a corresponding tool_result block in the immediately following user turn.", "핵심 불변 조건은 assistant 턴의 모든 tool_use block이 바로 다음 user 턴에 대응하는 tool_result block을 가져야 한다는 것입니다."),
      item("Missing tool_result blocks, or tool_result blocks that appear in a later turn rather than the immediately following user turn, cause an API validation error.", "tool_result block이 없거나, 바로 다음 user 턴이 아니라 더 나중 턴에 나타나면 API validation error가 발생합니다.")
    ]
  },
  {
    id: "2-3-3-schema-anatomy-what-claude-reads-to-make-a-tool-selection-decision",
    title: "2-3-3. Schema anatomy: What Claude reads to make a tool selection decision",
    items: [
      item("2-3-3. Schema anatomy: What Claude reads to make a tool selection decision", "2-3-3. 스키마 해부: Claude가 도구 선택 결정을 내릴 때 읽는 것"),
      item("A tool schema has three parts, including name, description, and input_schema.", "도구 스키마는 name, description, input_schema라는 세 부분으로 구성됩니다."),
      item("The description determines whether Claude selects the tool correctly or not.", "description은 Claude가 도구를 올바르게 선택하는지 여부를 결정합니다."),
      item("Name: A short identifier that should be specific. For example, get_account_balance is more useful to Claude than get_data.", "Name: 구체적이어야 하는 짧은 식별자입니다. 예를 들어 get_account_balance는 get_data보다 Claude에게 더 유용합니다."),
      item("Description: A critical part that Claude reads to decide whether a tool is required or not. You should always write the description in two parts, including when to and when not to use the tool:", "Description: Claude가 도구가 필요한지 아닌지 판단하기 위해 읽는 핵심 부분입니다. description은 항상 도구를 언제 써야 하는지와 언제 쓰지 말아야 하는지를 포함한 두 부분으로 작성해야 합니다."),
      item("A description that says \"use this to find information\" will cause wrong selections because Claude cannot distinguish it from any other tool that retrieves something.", "\"use this to find information\"이라고만 쓰인 description은 Claude가 그것을 다른 검색 도구와 구별할 수 없기 때문에 잘못된 선택을 유발합니다."),
      item("A description that says \"use this to retrieve the current balance for a specific account ID and do not use this for transaction history\" gives Claude an exclusion condition to work with and is appropriately descriptive.", "\"특정 account ID의 현재 잔액을 가져올 때 사용하고 transaction history에는 사용하지 말라\"는 description은 Claude가 활용할 수 있는 제외 조건을 제공하며 적절히 설명적입니다."),
      item("input_schema: Defines the parameters (the inputs your tool function accepts) using JSON Schema.", "input_schema: JSON Schema를 사용해 도구 함수가 받는 입력인 parameters를 정의합니다."),
      item("You should mark parameters as required when Claude requires them to call the tool correctly.", "Claude가 도구를 올바르게 호출하는 데 필요한 parameter는 required로 표시해야 합니다."),
      item("You can mark parameters as optional when the tool can operate without them.", "도구가 해당 parameter 없이도 작동할 수 있다면 optional로 표시할 수 있습니다."),
      item("Overlapping parameter types between tools is the most common source of wrong-tool calls.", "도구 간 parameter type이 겹치는 것은 잘못된 도구 호출의 가장 흔한 원인입니다.")
    ]
  },
  {
    id: "2-3-4-decision-table-schema-design-choices",
    title: "2-3-4. Decision table: Schema design choices",
    items: [
      item("2-3-4. Decision table: Schema design choices", "2-3-4. 결정 표: 스키마 설계 선택지"),
      item("The schema is what Claude reads to decide which tool to call, what arguments to pass in, and whether it has enough information to respond.", "스키마는 Claude가 어떤 도구를 호출할지, 어떤 인자를 전달할지, 응답할 충분한 정보가 있는지를 판단하기 위해 읽는 것입니다."),
      item("A schema that’s vague, under-described, or missing required fields will produce tool calls that look syntactically correct but pick the wrong tool, pass malformed inputs, or loop unnecessarily.", "모호하거나 설명이 부족하거나 required field가 빠진 스키마는 문법적으로는 맞아 보이지만 잘못된 도구를 선택하거나, 잘못된 입력을 전달하거나, 불필요하게 루프를 도는 도구 호출을 만듭니다."),
      item("The five decisions below determine whether your implementation behaves predictably under real conditions.", "아래 다섯 가지 결정은 실제 조건에서 구현이 예측 가능하게 동작하는지를 결정합니다."),
      item("The table notes where sequential and parallel tool-calling diverge.", "이 표는 순차적 도구 호출과 병렬 도구 호출이 어디에서 달라지는지를 표시합니다."),
      item("Decision: Subtask dependency\nHow to handle it: When one tool’s output feeds the next, the calls have to run in sequence because the second call cannot be built until the first result comes back. When the subtasks are independent of each other, you can structure the tool set so Claude issues multiple tool_use blocks in a single turn and your code runs them concurrently.\nWhy it matters: This is the one decision that changes how you design the schema. Current Claude models default to parallel calls when calls are independent. Where a real dependency exists, model it as separate turns so the first result is available before the next call is built. Use disable_parallel_tool_use to force one tool call per turn if needed.", "Decision: Subtask dependency\nHow to handle it: 한 도구의 출력이 다음 도구의 입력이 되는 경우, 첫 결과가 돌아오기 전에는 두 번째 호출을 만들 수 없으므로 호출은 순서대로 실행되어야 합니다. 하위 작업들이 서로 독립적이라면 Claude가 한 턴에서 여러 tool_use block을 발행하고 코드가 이를 동시에 실행하도록 도구 세트를 구성할 수 있습니다.\nWhy it matters: 이것은 스키마 설계 방식을 바꾸는 결정입니다. 현재 Claude 모델은 호출들이 독립적일 때 병렬 호출을 기본값으로 사용합니다. 실제 의존성이 있다면 첫 결과가 다음 호출을 만들기 전에 사용할 수 있도록 별도 턴으로 모델링하세요. 필요하면 disable_parallel_tool_use를 사용해 턴당 하나의 도구 호출로 강제할 수 있습니다."),
      item("Decision: Required fields\nHow to handle it: Mark a field as required only when the call doesn’t make sense without it. Place these in the required array of the input schema.\nWhy it matters: Marking everything required forces Claude to fabricate values for fields it has no basis to fill in. The required array is how you tell Claude which inputs are non-negotiable.", "Decision: Required fields\nHow to handle it: 호출이 그 field 없이는 의미가 없을 때만 required로 표시하세요. input schema의 required array에 넣습니다.\nWhy it matters: 모든 것을 required로 표시하면 Claude는 근거 없이 값을 만들어 내야 합니다. required array는 어떤 입력이 타협 불가능한지를 Claude에게 알려 주는 방법입니다."),
      item("Decision: Optional fields\nHow to handle it: Use optional fields for parameters with sensible defaults or where absence carries meaning. Leave them out of the required array and give them defaults in the function signature.\nWhy it matters: Optional fields let Claude omit information it doesn’t have, instead of guessing. If a field is optional but marked required, every call must invent a value, which can cause bad inputs.", "Decision: Optional fields\nHow to handle it: 합리적인 기본값이 있거나 없는 것 자체가 의미를 갖는 parameter에는 optional field를 사용하세요. required array에서 제외하고 함수 signature에 기본값을 두세요.\nWhy it matters: Optional field는 Claude가 모르는 정보를 추측하는 대신 생략할 수 있게 합니다. optional이어야 할 field가 required로 표시되면 모든 호출이 값을 지어내야 하며, 나쁜 입력을 만들 수 있습니다."),
      item("Decision: Description length\nHow to handle it: Write three to four sentences per tool covering what it does, when Claude should reach for it, and what it returns. Include examples of valid inputs where format matters.\nWhy it matters: If the description is too short, Claude guesses because there isn’t enough signal to distinguish your tool from others. If the description is too long, the trigger conditions get buried under detail Claude doesn’t reference at decision time.", "Decision: Description length\nHow to handle it: 도구마다 무엇을 하는지, Claude가 언제 사용해야 하는지, 무엇을 반환하는지를 포함해 세 문장 또는 네 문장으로 작성하세요. 형식이 중요한 경우 유효한 입력 예시를 포함하세요.\nWhy it matters: description이 너무 짧으면 다른 도구와 구별할 신호가 부족해 Claude가 추측합니다. 너무 길면 결정 시점에 Claude가 참고하지 않는 세부 정보 속에 trigger condition이 묻힙니다."),
      item("Decision: Overlapping parameter types\nHow to handle it: When two tools accept the same parameter shape, add disambiguating language to each description that names the domain or trigger the tool is meant for.\nWhy it matters: Claude routes on name plus description, with parameter types as a secondary signal. When signatures are identical, routing collapses to description alone, and similar-sounding descriptions become indistinguishable.", "Decision: Overlapping parameter types\nHow to handle it: 두 도구가 같은 parameter shape을 받는다면, 각 description에 해당 도구의 domain이나 trigger를 명명하는 구별 문구를 추가하세요.\nWhy it matters: Claude는 name과 description을 기준으로 route하고, parameter type은 보조 신호로 사용합니다. signature가 동일하면 routing은 description에만 의존하게 되며, 비슷하게 들리는 description은 구별되지 않습니다."),
      item("Worked example: A schema that causes wrong-tool selection and the fix", "작업 예시: 잘못된 도구 선택을 유발하는 스키마와 해결책"),
      item("This is an illustrative example based on common patterns observed in tool-use implementations.", "이것은 도구 사용 구현에서 관찰되는 일반적인 패턴을 바탕으로 한 예시입니다."),
      item("Tool names, descriptions, and test results are constructed to demonstrate the selection-disambiguation principle, not drawn from a specific production system.", "도구 이름, description, test result는 특정 production system에서 가져온 것이 아니라 selection-disambiguation 원칙을 보여 주기 위해 구성된 것입니다."),
      item("A developer registers two tools, including search_knowledge_base and get_cached_result.", "한 개발자가 search_knowledge_base와 get_cached_result를 포함한 두 도구를 등록합니다."),
      item("The tool names are distinct, but Claude’s tool selection weighs descriptions heavily; when descriptions overlap, name alone is not sufficient to disambiguate.", "도구 이름은 서로 다르지만 Claude의 도구 선택은 description에 큰 비중을 둡니다. description이 겹치면 이름만으로는 충분히 구별되지 않습니다."),
      item("Both have descriptions that start with \"use this to find information.\"", "두 도구 모두 \"use this to find information\"으로 시작하는 description을 갖고 있습니다."),
      item("Without exclusion conditions, Claude frequently selected the wrong tool on ambiguous inputs during development testing.", "제외 조건이 없으면 개발 테스트 중 모호한 입력에서 Claude가 자주 잘못된 도구를 선택했습니다."),
      item("The problem is that both descriptions look identical to Claude at the point where the selection decision is made.", "문제는 선택 결정이 이루어지는 시점에 두 description이 Claude에게 동일하게 보인다는 것입니다."),
      item("The fix is adding an additional sentence per description:", "해결책은 각 description에 추가 문장을 넣는 것입니다."),
      item("search_knowledge_base: \"Use this to search the knowledge base when the user asks a question that requires looking up current information. Do not use this if the result of a prior search in this session already covers the question.\"", "search_knowledge_base: \"사용자가 최신 정보를 찾아야 하는 질문을 할 때 knowledge base를 검색하기 위해 사용하세요. 이 세션의 이전 검색 결과가 이미 질문을 다룬다면 사용하지 마세요.\""),
      item("get_cached_result: \"Use this to retrieve a result that was already fetched during this session. Only use this if search_knowledge_base was called earlier in this conversation for the same query.\"", "get_cached_result: \"이 세션 중 이미 가져온 결과를 검색하기 위해 사용하세요. 같은 query에 대해 이 대화에서 search_knowledge_base가 이전에 호출된 경우에만 사용하세요.\""),
      item("The exclusion conditions give Claude a decision rule rather than two identical-looking options.", "제외 조건은 Claude에게 똑같아 보이는 두 선택지가 아니라 결정 규칙을 제공합니다."),
      item("These conditions rely on complete conversation history being passed in each request.", "이 조건들은 각 요청에 완전한 대화 기록이 전달되는 것에 의존합니다."),
      item("If prior turns are truncated or dropped, Claude cannot evaluate them and the exclusion logic silently fails.", "이전 턴이 잘리거나 누락되면 Claude는 그것들을 평가할 수 없고 제외 논리는 조용히 실패합니다."),
      item("Every additional tool you register increases the surface area Claude has to reason over, so this discipline only pays off when the underlying tools are distinct.", "추가로 등록하는 모든 도구는 Claude가 reasoning해야 하는 표면적을 늘리므로, 이 규율은 underlying tool들이 서로 구별될 때만 효과가 있습니다."),
      item("The table below shows where exclusion-condition disambiguation helps and where a different approach is warranted.", "아래 표는 제외 조건을 통한 disambiguation이 도움이 되는 경우와 다른 접근이 필요한 경우를 보여 줍니다."),
      item("Handles well", "잘 처리하는 경우"),
      item("Routing Claude to the right tool reliably when descriptions are specific and exclusion conditions are stated.", "description이 구체적이고 제외 조건이 명시되어 있을 때 Claude를 올바른 도구로 안정적으로 routing하는 경우입니다."),
      item("Poor fit.", "잘 맞지 않는 경우."),
      item("Two tools that do similar things and need ever-longer descriptions to keep apart: at that point, merge them into one tool with a type parameter instead.", "비슷한 일을 하는 두 도구를 구별하기 위해 description이 계속 길어져야 하는 경우입니다. 그 시점에서는 type parameter를 가진 하나의 도구로 병합하는 편이 낫습니다.")
    ]
  },
  {
    id: "2-3-5-when-someone-else-has-already-written-your-tools-mcp-as-an-alternative-to-manual-schema-authoring",
    title: "2-3-5. When someone else has already written your tools: MCP as an alternative to manual schema authoring",
    items: [
      item("2-3-5. When someone else has already written your tools: MCP as an alternative to manual schema authoring", "2-3-5. 다른 사람이 이미 도구를 작성해 둔 경우: 수동 스키마 작성의 대안으로서 MCP"),
      item("Everything in the previous sections assumes you are writing the tool schemas yourself: name, description, input_schema, and the function that executes when Claude issues a tool_use block.", "앞선 섹션들은 name, description, input_schema, 그리고 Claude가 tool_use block을 발행했을 때 실행되는 함수를 직접 작성한다고 가정합니다."),
      item("For many integrations, you do not need to do that.", "많은 integration에서는 그렇게 할 필요가 없습니다."),
      item("The Model Context Protocol, MCP, is a standardized communication layer that moves tool definitions and execution out of your application code and into dedicated servers.", "Model Context Protocol, MCP는 도구 정의와 실행을 애플리케이션 코드 밖의 전용 서버로 옮기는 표준화된 통신 계층입니다."),
      item("When an MCP server exists for the service you want to reach, you can connect directly to the MCP server rather than building the integration yourself.", "사용하려는 서비스에 대한 MCP 서버가 있다면 integration을 직접 만들기보다 MCP 서버에 직접 연결할 수 있습니다."),
      item("Take a GitHub integration as a concrete case.", "GitHub integration을 구체적인 사례로 보겠습니다."),
      item("GitHub exposes repositories, pull requests, issues, projects, and more.", "GitHub는 repositories, pull requests, issues, projects 등을 제공합니다."),
      item("To build a complete integration using the tool schema approach from this module, you would need to write a schema and an execution function for every piece of that functionality and maintain it as GitHub’s API evolves.", "이 모듈의 tool schema 접근법으로 완전한 integration을 만들려면 각 기능마다 schema와 execution function을 작성하고 GitHub API가 변할 때마다 유지보수해야 합니다."),
      item("An MCP server for GitHub has already done that.", "GitHub용 MCP 서버는 이미 그 일을 해 두었습니다."),
      item("So, your application connects to the server, receives the full list of available tools, and Claude selects among them using the same description-based routing you have already been working with.", "따라서 애플리케이션은 서버에 연결해 사용 가능한 도구 전체 목록을 받고, Claude는 지금까지 다뤄 온 description 기반 routing으로 그중에서 선택합니다."),
      item("The underlying mechanism is identical, but what changes is who wrote it and who owns the tool definitions.", "기저 메커니즘은 동일하지만, 달라지는 것은 누가 작성했고 누가 도구 정의를 소유하느냐입니다."),
      item("How MCP fits into the tool-use loop", "MCP가 도구 사용 루프에 들어맞는 방식"),
      item("The loop you built earlier in this module does not change when you introduce MCP.", "MCP를 도입해도 이 모듈 앞에서 만든 루프는 바뀌지 않습니다."),
      item("Claude still issues a tool_use block, your application still executes the tool and returns a tool_result, and the message block pairing rules still apply.", "Claude는 여전히 tool_use block을 발행하고, 애플리케이션은 여전히 도구를 실행해 tool_result를 반환하며, message block pairing 규칙도 그대로 적용됩니다."),
      item("The difference is in the setup step.", "차이는 setup 단계에 있습니다."),
      item("Instead of registering schemas you wrote, your MCP client sends a ListToolsRequest to the MCP server, receives the full tool list back, and passes those definitions to Claude.", "직접 작성한 schema를 등록하는 대신 MCP client가 MCP server에 ListToolsRequest를 보내고, 전체 도구 목록을 받은 뒤 그 정의를 Claude에 전달합니다."),
      item("From Claude’s perspective, those tools are indistinguishable from ones you authored manually.", "Claude의 관점에서 이 도구들은 직접 작성한 도구와 구별되지 않습니다."),
      item("One practical implication worth noting: MCP servers add tool definitions to the context window even when the tools are not being used in the current turn.", "주목할 실무적 함의가 하나 있습니다. MCP 서버는 현재 턴에서 도구가 사용되지 않더라도 tool definition을 context window에 추가합니다."),
      item("If you connect several servers at once, the tool definitions themselves consume budget before the first message arrives.", "여러 서버를 한 번에 연결하면 첫 메시지가 오기 전부터 tool definition 자체가 budget을 소비합니다."),
      item("The schema design discipline from earlier in this module applies here too.", "이 모듈 앞에서 다룬 schema design 규율은 여기에도 적용됩니다."),
      item("Register only the servers you are actively using, and check context cost against your window limit if you are connecting multiple servers in the same session.", "실제로 사용하는 서버만 등록하고, 같은 세션에서 여러 서버를 연결한다면 context cost를 window limit과 비교해 확인하세요."),
      item("If you are using the API MCP Connector, you control loading cost through an mcp_toolset object in the tools array.", "API MCP Connector를 사용한다면 tools array 안의 mcp_toolset object로 loading cost를 제어합니다."),
      item("The mcp_toolset carries a default_config block that applies to every tool on the server, and you can override individual tools through configs keyed by tool name.", "mcp_toolset은 서버의 모든 도구에 적용되는 default_config block을 가지며, tool name을 key로 하는 configs를 통해 개별 도구를 override할 수 있습니다."),
      item("Two settings matter for context cost:", "context cost에는 두 가지 설정이 중요합니다."),
      item("The defer_loading boolean, set inside default_config or a per-tool entry in configs, delays loading a tool definition until the model needs it, which reduces upfront context cost when you connect a server with a large tool list.", "default_config 또는 configs의 개별 tool entry 안에 설정하는 defer_loading boolean은 모델이 필요로 할 때까지 tool definition loading을 지연시켜, 큰 도구 목록을 가진 서버를 연결할 때 초기 context cost를 줄입니다."),
      item("The enabled boolean turns individual tools on or off, so you can register a server but expose only the tools you want the model to see.", "enabled boolean은 개별 도구를 켜거나 끄므로, 서버는 등록하되 모델에게 보여 주고 싶은 도구만 노출할 수 있습니다."),
      item("The MCP Connector requires the mcp-client-2025-11-20 beta header to be set on the request.", "MCP Connector는 요청에 mcp-client-2025-11-20 beta header가 설정되어 있어야 합니다."),
      item("Without that header, the mcp_toolset configuration will not apply as described here.", "그 header가 없으면 mcp_toolset 설정은 여기 설명한 대로 적용되지 않습니다."),
      item("The other piece worth knowing at this stage is how the client actually talks to the server.", "이 단계에서 알아둘 또 다른 부분은 client가 실제로 server와 통신하는 방식입니다."),
      item("MCP runs over one of two transports, and which one you use depends on where the server lives.", "MCP는 두 transport 중 하나 위에서 동작하며, 어떤 것을 쓰는지는 server가 어디에 있는지에 달려 있습니다."),
      item("Local servers use stdio and your application spawns the server as a subprocess and communicates over standard input and output.", "Local server는 stdio를 사용하며, 애플리케이션이 server를 subprocess로 실행하고 표준 입력과 출력으로 통신합니다."),
      item("Remote servers use Streamable HTTP and your application connects over the network via HTTP, using POST for client-to-server messages and an optional GET-based SSE stream for server-initiated messages.", "Remote server는 Streamable HTTP를 사용하며, 애플리케이션은 HTTP 네트워크로 연결하고 client-to-server message에는 POST를, server-initiated message에는 선택적인 GET 기반 SSE stream을 사용합니다."),
      item("An older SSE-only transport exists but is deprecated, and new integrations should use Streamable HTTP.", "이전 SSE-only transport도 있지만 deprecated 되었으며, 새로운 integration은 Streamable HTTP를 사용해야 합니다."),
      item("One constraint worth flagging if you are using Anthropic’s MCP connector in the API: only HTTP-exposed servers are supported through the connector, and stdio servers require managing the MCP client connection yourself via the SDK.", "Anthropic API의 MCP connector를 사용한다면 주의할 제약이 있습니다. connector를 통해서는 HTTP로 노출된 server만 지원되며, stdio server는 SDK를 통해 MCP client connection을 직접 관리해야 합니다."),
      item("Once the connection is established and tool definitions are received, your application code treats both transports identically.", "연결이 수립되고 tool definition을 받으면 애플리케이션 코드는 두 transport를 동일하게 다룹니다."),
      item("Use MCP when\nA well-maintained MCP server already exists for the service you need (check that it covers the specific operations you require and is actively maintained against the service’s current API. Writing and owning those schemas yourself adds implementation overhead for no additional capability. Note that the Claude API MCP Connector only supports remote servers. Local stdio servers require Claude Desktop or Claude Code as the client; they cannot be connected directly through the API.", "Use MCP when\n필요한 서비스에 대해 잘 유지보수되는 MCP server가 이미 있을 때 사용하세요. 필요한 특정 작업을 지원하는지, 현재 service API에 맞춰 적극적으로 유지보수되는지 확인해야 합니다. 직접 schema를 작성하고 소유하는 것은 추가 capability 없이 구현 부담만 늘립니다. Claude API MCP Connector는 remote server만 지원합니다. Local stdio server는 Claude Desktop 또는 Claude Code가 client여야 하며 API를 통해 직접 연결할 수 없습니다."),
      item("Write schemas manually when\nNo MCP server covers your use case, or when you need precise control over tool scope and description quality that a general-purpose server does not provide. Before defaulting to manual schemas for scope control, note that the API MCP Connector supports allowlisting and denylisting specific tools per server via MCPToolset configuration. Manual authoring may still be warranted for description quality, but not always for scope.", "Write schemas manually when\nuse case를 다루는 MCP server가 없거나, general-purpose server가 제공하지 않는 tool scope와 description quality에 대한 정밀한 제어가 필요할 때 직접 작성하세요. scope control 때문에 곧바로 manual schema를 선택하기 전에, API MCP Connector가 MCPToolset configuration을 통해 server별 특정 도구 allowlist와 denylist를 지원한다는 점을 기억하세요. description quality 때문에 manual authoring이 여전히 필요할 수 있지만, scope 때문에 항상 필요한 것은 아닙니다."),
      item("Use both when\nConnect to an MCP server for breadth then apply the description-tuning discipline from earlier in this module to the specific tools you are actively routing to. MCP and manual schema authoring are not mutually exclusive as the server gives you coverage, and your descriptions give you precision where it matters. Apply tool allowlisting via MCPToolset to limit the surface area Claude reasons over before layering in description tuning. Narrowing the tool set and sharpening the descriptions are two separate levers, and you should use both.", "Use both when\n넓은 coverage를 위해 MCP server에 연결한 뒤, 실제로 routing하는 특정 도구에 대해 이 모듈 앞부분의 description-tuning 규율을 적용하세요. MCP와 manual schema authoring은 상호 배타적이지 않습니다. server는 coverage를 제공하고, description은 중요한 지점에서 precision을 제공합니다. description tuning을 더하기 전에 MCPToolset을 통한 tool allowlisting으로 Claude가 reasoning해야 할 surface area를 제한하세요. tool set을 좁히는 것과 description을 날카롭게 하는 것은 별개의 lever이며, 둘 다 사용해야 합니다.")
    ]
  },
  {
    id: "2-4-streaming-responses",
    title: "2-4. Streaming Responses",
    items: [
      item("2-4. Streaming Responses", "2-4. 스트리밍 응답"),
      item("Streaming responses and handling partial output without corrupting state", "상태를 손상시키지 않고 부분 출력을 처리하는 스트리밍 응답"),
      item("Every request so far has waited for the whole response to arrive before doing anything with it.", "지금까지의 모든 요청은 전체 응답이 도착할 때까지 기다린 뒤에야 그것을 처리했습니다."),
      item("That's fine, until the response is long, or a user is sitting there staring at a blank screen.", "응답이 길거나 사용자가 빈 화면을 바라보고 있는 상황이 아니라면 괜찮습니다."),
      item("Streaming sends the response in pieces, sending them along as the model generates them.", "스트리밍은 모델이 생성하는 대로 응답을 조각으로 나누어 보냅니다."),
      item("That makes things feel faster, but it also gives your code a new job: now you are tasked with assembling the final content yourself based on the series of outputs, and you need to be prepared if the series stops early.", "이렇게 하면 더 빠르게 느껴지지만 코드에는 새 일이 생깁니다. 이제 일련의 출력에 기반해 최종 content를 직접 조립해야 하며, 그 series가 일찍 멈출 경우에도 대비해야 합니다.")
    ]
  },
  {
    id: "2-4-1-what-streaming-changes-about-the-response",
    title: "2-4-1. What streaming changes about the response",
    items: [
      item("2-4-1. What streaming changes about the response", "2-4-1. 스트리밍이 응답에서 바꾸는 것"),
      item("In a non-streamed request, the API hands you one complete message with every content block, fully formed.", "non-streamed request에서는 API가 모든 content block이 완성된 하나의 complete message를 넘겨줍니다."),
      item("In a streamed request, the API instead sends a series of events that describe the message as it's being built.", "streamed request에서는 API가 message가 만들어지는 과정을 설명하는 일련의 event를 보냅니다."),
      item("Your code listens to that series and reassembles the blocks.", "코드는 그 series를 듣고 block들을 다시 조립합니다."),
      item("The message you end up with is identical to what a non-streamed call would have given you, but the difference is that you have to assemble the pieces, and you decide what to do if the events stop before the message is finished.", "최종적으로 얻게 되는 message는 non-streamed call이 제공했을 것과 동일하지만, 차이는 조각들을 직접 조립해야 하고 message가 끝나기 전에 event가 멈추면 어떻게 할지 직접 결정해야 한다는 점입니다."),
      item("It helps to know what's not happening: the model isn't holding some live object open for you.", "무슨 일이 일어나지 않는지를 아는 것도 도움이 됩니다. 모델이 사용자를 위해 어떤 live object를 열어 둔 것이 아닙니다."),
      item("Each event is its own small message describing a single change, a block started, some text or input got added to it, a block finished, the whole message finished.", "각 event는 하나의 변경을 설명하는 작은 message입니다. block이 시작되거나, text 또는 input이 추가되거나, block이 끝나거나, 전체 message가 끝났다는 식입니다."),
      item("Your handler takes each event and applies it to the partial state it's been building up.", "handler는 각 event를 받아 지금까지 쌓아 온 partial state에 적용합니다.")
    ]
  },
  {
    id: "2-4-2-the-event-sequence-and-what-your-handler-does-with-each",
    title: "2-4-2. The event sequence, and what your handler does with each",
    items: [
      item("2-4-2. The event sequence, and what your handler does with each", "2-4-2. event sequence와 handler가 각 event를 처리하는 방식"),
      item("Event: message_start\nWhat it signals: A new message is beginning. Carries the message shell with empty content and initial usage.\nWhat your handler does: Set up an empty content array to collect blocks in.", "Event: message_start\nWhat it signals: 새 message가 시작됩니다. 빈 content와 초기 usage를 가진 message shell을 담습니다.\nWhat your handler does: block을 모을 빈 content array를 설정합니다."),
      item("Event: content_block_start\nWhat it signals: A new content block is opening, with its type (text, tool_use, or thinking) and index.\nWhat your handler does: Make a slot at that index for the named block type. A tool_use block opens with its name and id, but no input yet.", "Event: content_block_start\nWhat it signals: type(text, tool_use, thinking)과 index를 가진 새 content block이 열립니다.\nWhat your handler does: 해당 index에 그 block type을 위한 slot을 만듭니다. tool_use block은 name과 id를 가지고 열리지만 아직 input은 없습니다."),
      item("Event: content_block_delta\nWhat it signals: An incremental piece of one block: a text fragment, a fragment of JSON input for a tool call, or a thinking fragment.\nWhat your handler does: Append the fragment to the block at that index. Tool-call inputs arrive as a partial JSON string spread across several deltas, you can't parse them until the block closes.", "Event: content_block_delta\nWhat it signals: 한 block의 incremental piece입니다. text fragment, tool call을 위한 JSON input fragment, 또는 thinking fragment일 수 있습니다.\nWhat your handler does: 그 fragment를 해당 index의 block에 append합니다. tool-call input은 여러 delta에 걸친 partial JSON string으로 도착하므로 block이 닫히기 전까지 parse할 수 없습니다."),
      item("Event: content_block_stop\nWhat it signals: The block at this index is complete.\nWhat your handler does: Finalize the block. For a tool_use block, this is the first moment the accumulated JSON input is complete enough to parse.", "Event: content_block_stop\nWhat it signals: 이 index의 block이 완료되었습니다.\nWhat your handler does: block을 finalize합니다. tool_use block의 경우 누적된 JSON input이 parse하기에 충분히 완성되는 첫 순간입니다."),
      item("Event: message_delta\nWhat it signals: Top-level changes to the message: the stop_reason and final usage counts.\nWhat your handler does: Record the stop_reason. It tells you whether the model finished or stopped for some other reason.", "Event: message_delta\nWhat it signals: message의 top-level change입니다. stop_reason과 final usage count를 담습니다.\nWhat your handler does: stop_reason을 기록합니다. 이것은 모델이 완료했는지 다른 이유로 멈췄는지를 알려 줍니다."),
      item("Event: message_stop\nWhat it signals: The stream is complete.\nWhat your handler does: The assembled content array is now the finished message. From here, treat it exactly like a non-streamed response.", "Event: message_stop\nWhat it signals: stream이 완료되었습니다.\nWhat your handler does: 조립된 content array가 이제 finished message입니다. 여기서부터는 non-streamed response와 정확히 동일하게 다루면 됩니다.")
    ]
  },
  {
    id: "2-4-3-the-rule-that-keeps-your-state-from-getting-corrupted-dont-act-on-a-partial-block",
    title: "2-4-3. The rule that keeps your state from getting corrupted: don't act on a partial block",
    items: [
      item("2-4-3. The rule that keeps your state from getting corrupted: don't act on a partial block", "2-4-3. 상태가 손상되지 않게 하는 규칙: partial block에 대해 행동하지 마세요"),
      item("The tool_use block is the one to watch.", "주의해서 봐야 할 것은 tool_use block입니다."),
      item("Its input shows up as a partial JSON string spread across many content_block_delta events, and that string isn't valid JSON until content_block_stop closes the block.", "그 input은 여러 content_block_delta event에 걸쳐 나뉜 partial JSON string으로 나타나며, content_block_stop이 block을 닫기 전까지는 유효한 JSON이 아닙니다."),
      item("If your code tries to parse the input or run the tool before the block closes, it either chokes on malformed JSON or runs with half the arguments missing.", "block이 닫히기 전에 코드가 input을 parse하거나 tool을 실행하려 하면 malformed JSON에서 막히거나 argument가 절반쯤 빠진 상태로 실행됩니다."),
      item("So, the rule is simple: collect the deltas, and act only after content_block_stop for that block.", "따라서 규칙은 간단합니다. delta를 모으고, 해당 block의 content_block_stop 이후에만 행동하세요."),
      item("The same discipline applies when you add a streamed assistant turn to your conversation history.", "streamed assistant turn을 conversation history에 추가할 때도 같은 규율이 적용됩니다."),
      item("Add it only after message_stop, with every block fully assembled.", "모든 block이 완전히 조립된 뒤 message_stop 이후에만 추가하세요."),
      item("A turn built from a stream that got cut off partway is incomplete, and the tool_use pairing rules will reject your next request if a half-built tool_use block ends up in the history.", "중간에 끊긴 stream으로 만든 turn은 incomplete이며, half-built tool_use block이 history에 들어가면 tool_use pairing rule 때문에 다음 요청이 거부됩니다.")
    ]
  },
  {
    id: "2-4-4-when-the-stream-stops-early",
    title: "2-4-4. When the stream stops early",
    items: [
      item("2-4-4. When the stream stops early", "2-4-4. stream이 일찍 멈출 때"),
      item("Streams sometimes fail in the middle.", "stream은 때때로 중간에 실패합니다."),
      item("A dropped network connection, a timeout, or a client disconnect can end the event series before message_stop arrives.", "network connection 끊김, timeout, client disconnect는 message_stop이 도착하기 전에 event series를 끝낼 수 있습니다."),
      item("The failure that really bites is treating whatever you've collected so far as if it were complete.", "정말 문제가 되는 실패는 지금까지 모은 것을 complete인 것처럼 다루는 것입니다."),
      item("A partial text block shown to a user is just a cosmetic glitch and a partial tool_use block written into history is a structural problem that corrupts the next turn.", "사용자에게 보이는 partial text block은 단순한 표시상의 문제지만, history에 기록된 partial tool_use block은 다음 turn을 손상시키는 구조적 문제입니다."),
      item("Track completion on purpose.", "완료 여부를 의도적으로 추적하세요."),
      item("A turn is usable only once message_stop has arrived.", "turn은 message_stop이 도착한 뒤에만 사용할 수 있습니다."),
      item("Until then, treat what you've accumulated as provisional.", "그 전까지는 누적한 내용을 provisional로 다루세요."),
      item("On an interrupted stream, throw away the partial assistant turn instead of saving it to history, then retry the request.", "interrupted stream에서는 partial assistant turn을 history에 저장하지 말고 버린 뒤 요청을 다시 시도하세요."),
      item("Committing a half-built turn is exactly what breaks the following request.", "half-built turn을 commit하는 것이 바로 다음 요청을 깨뜨리는 원인입니다."),
      item("Check the stop_reason from message_delta before you continue a loop.", "loop를 계속하기 전에 message_delta의 stop_reason을 확인하세요."),
      item("A stop_reason of tool_use means your assembled tool calls are ready to run; any other value means you're on a different path, not the tool path.", "stop_reason이 tool_use라면 조립된 tool call을 실행할 준비가 된 것입니다. 다른 값이라면 tool path가 아니라 다른 경로에 있는 것입니다."),
      item("Handles well\nLong responses and user-facing interfaces where showing output as it generates removes the blank-screen wait.", "Handles well\n긴 응답과, 생성되는 대로 output을 보여 주면 빈 화면 대기를 없앨 수 있는 user-facing interface에 잘 맞습니다."),
      item("Adds cost or complexity\nYou assemble blocks yourself, you must not act on partial blocks, and you must handle mid-stream interruption explicitly.", "Adds cost or complexity\nblock을 직접 조립해야 하고, partial block에 대해 행동하면 안 되며, mid-stream interruption을 명시적으로 처리해야 합니다."),
      item("Use a different approach\nFor short responses or backend jobs where no one is waiting on the output, a non-streamed call is simpler and removes the partial-state risk entirely.", "Use a different approach\n짧은 응답이나 output을 기다리는 사람이 없는 backend job에서는 non-streamed call이 더 단순하며 partial-state risk를 완전히 제거합니다.")
    ]
  },
  {
    id: "2-5-context-engineering",
    title: "2-5. Context Engineering",
    items: [
      item("2-5. Context Engineering", "2-5. Context Engineering"),
      item("Model selection and keeping multi-turn sessions in budget", "모델 선택과 multi-turn session을 budget 안에 유지하기"),
      item("You make one early choice: which model runs the workload.", "초기에 한 가지 선택을 합니다. 어떤 model이 workload를 실행할지입니다."),
      item("The Claude family covers a range of cost, latency, and capability tradeoffs, so the model you pick sets the price and speed floor that every later decision moves within.", "Claude family는 cost, latency, capability tradeoff의 범위를 포괄하므로, 선택한 model은 이후 모든 결정이 그 안에서 움직이는 가격과 속도의 하한선을 정합니다."),
      item("Once the model is set, the next constraint is the context window: the full span of text the model can take in at once, including your prompt, the conversation so far, and every tool result.", "model이 정해지면 다음 제약은 context window입니다. 이는 prompt, 지금까지의 conversation, 모든 tool result를 포함해 model이 한 번에 받아들일 수 있는 전체 text 범위입니다."),
      item("Every tool result Claude returns gets appended to the context window and stays there for the rest of the session.", "Claude가 반환하는 모든 tool result는 context window에 추가되고 session이 끝날 때까지 거기에 남습니다."),
      item("In a single-turn prompt, that's invisible.", "single-turn prompt에서는 이것이 눈에 띄지 않습니다."),
      item("In a multi-step agent session running ten or twenty tool calls, the window fills up fast, and once it fills, the agent either compacts (losing detail) or stalls before the task is done.", "열 개나 스무 개의 tool call을 실행하는 multi-step agent session에서는 window가 빠르게 차고, 가득 차면 agent는 compact되어 detail을 잃거나 task가 끝나기 전에 멈춥니다."),
      item("So, the question for any agent workflow is whether you've decided in advance what goes into the context window, what comes back out as a summary, and what never enters at all.", "따라서 모든 agent workflow에서 물어야 할 질문은 context window에 무엇이 들어가고, 무엇이 summary로 돌아오며, 무엇은 애초에 들어가지 않는지를 미리 결정했는지입니다."),
      item("That set of choices is context engineering.", "그 선택들의 집합이 context engineering입니다.")
    ]
  },
  {
    id: "2-5-1-model-selection-start-with-sonnet-move-deliberately",
    title: "2-5-1. Model selection: Start with Sonnet, move deliberately",
    items: [
      item("2-5-1. Model selection: Start with Sonnet, move deliberately", "2-5-1. 모델 선택: Sonnet에서 시작하고 의도적으로 이동하기"),
      item("The Claude model family currently spans four tiers: Fable, Opus, Sonnet, and Haiku, each optimized for different cost, latency, and capability tradeoffs.", "Claude model family는 현재 Fable, Opus, Sonnet, Haiku 네 tier로 구성되며, 각각 다른 cost, latency, capability tradeoff에 최적화되어 있습니다."),
      item("Sonnet is the balanced default for most production workloads.", "Sonnet은 대부분의 production workload에 대한 균형 잡힌 default입니다."),
      item("Haiku is built for speed and cost efficiency on tasks that fit its capability envelope.", "Haiku는 capability envelope에 맞는 task에서 speed와 cost efficiency를 위해 만들어졌습니다."),
      item("Opus handles demanding work above the Sonnet envelope, and Fable is Anthropic's most capable model, built for the most demanding tasks including complex reasoning, advanced coding, research synthesis, and sophisticated agentic workflows where maximum intelligence is the priority.", "Opus는 Sonnet envelope를 넘는 demanding work를 처리하고, Fable은 Anthropic의 가장 capable한 model로 complex reasoning, advanced coding, research synthesis, maximum intelligence가 우선인 sophisticated agentic workflow 같은 가장 demanding한 task를 위해 만들어졌습니다."),
      item("Confirm the current lineup and model identifiers against platform.claude.com/docs at build time.", "build time에 platform.claude.com/docs에서 current lineup과 model identifier를 확인하세요."),
      item("The default starting point is Sonnet.", "기본 시작점은 Sonnet입니다."),
      item("Move up to Opus only when an eval set tells you Sonnet isn't meeting your quality bar.", "eval set이 Sonnet이 quality bar를 충족하지 못한다고 알려 줄 때만 Opus로 올리세요."),
      item("Move down to Haiku only when an eval set tells you the quality regression is acceptable at your task, not just to save costs.", "비용 절감만을 위해서가 아니라, eval set이 해당 task에서 quality regression이 허용 가능하다고 알려 줄 때만 Haiku로 내리세요."),
      item("Your decision to move models should always be a measured decision.", "model을 바꾸는 결정은 항상 측정에 기반한 결정이어야 합니다.")
    ]
  },
  {
    id: "2-5-2-the-context-window-is-not-a-free-resource",
    title: "2-5-2. The context window is not a free resource",
    items: [
      item("2-5-2. The context window is not a free resource", "2-5-2. context window는 공짜 자원이 아닙니다."),
      item("Think of the context window as the amount of space Claude can hold in working memory.", "context window를 Claude가 working memory에 담을 수 있는 공간의 양이라고 생각하세요."),
      item("Every message you send, every tool result you return, every document you inject, and every response Claude generates occupies space in that window.", "보내는 모든 message, 반환하는 모든 tool result, 주입하는 모든 document, Claude가 생성하는 모든 response는 그 window의 공간을 차지합니다."),
      item("If a request is already larger than the context window, the Messages API rejects it with a validation error before generation; if a request fits but generation reaches the ceiling partway, current models return the output generated so far with a model_context_window_exceeded stop reason.", "request가 이미 context window보다 크면 Messages API는 generation 전에 validation error로 거부합니다. request는 들어가지만 generation 중 ceiling에 도달하면 현재 model은 model_context_window_exceeded stop reason과 함께 지금까지 생성한 output을 반환합니다."),
      item("Neither path silently truncates your oldest content.", "어느 경로도 가장 오래된 content를 조용히 잘라내지 않습니다."),
      item("If you want a session to keep running past the window limit, your application must manage that itself by trimming or summarizing history before the next request goes out.", "session이 window limit을 넘어 계속 실행되게 하려면 다음 request가 나가기 전에 application이 history를 trim하거나 summarize해서 직접 관리해야 합니다."),
      item("In development, the window rarely fills because test inputs are small and sessions are short.", "development에서는 test input이 작고 session이 짧기 때문에 window가 거의 차지 않습니다."),
      item("In production, tool outputs are often three to five times longer than test fixtures, sessions run for more turns, and the window fills at turn eight rather than turn fifty, which means they fill earlier than development.", "production에서는 tool output이 test fixture보다 세 배에서 다섯 배 더 긴 경우가 많고 session도 더 많은 turn을 실행하므로, window가 50번째 turn이 아니라 8번째 turn에 차는 식으로 development보다 훨씬 빨리 찹니다."),
      item("The cost of not planning for this is a production outage.", "이를 계획하지 않은 대가는 production outage입니다.")
    ]
  },
  {
    id: "2-5-3-four-strategies-for-staying-in-budget",
    title: "2-5-3. Four strategies for staying in budget",
    items: [
      item("2-5-3. Four strategies for staying in budget", "2-5-3. budget 안에 머무르기 위한 네 가지 전략"),
      item("The previous section made the case for moving state out of the live context window.", "앞 섹션은 state를 live context window 밖으로 옮겨야 하는 이유를 설명했습니다."),
      item("The reason behind that is the budget.", "그 이유는 budget입니다."),
      item("Every token in the window costs money on input and adds latency to the response, and a long session compounds both.", "window 안의 모든 token은 input 비용을 발생시키고 response latency를 더하며, 긴 session은 둘 다 누적시킵니다."),
      item("The four strategies below are concrete ways to manage that budget, each suited to a different shape of conversation.", "아래 네 가지 전략은 그 budget을 관리하는 구체적인 방법이며, 각각 다른 conversation 형태에 맞습니다."),
      item("Strategy: Pruning\nWhat it does: Lets you jump back to an earlier message and continue from there, removing the conversation that came after.\nWhen to apply: After Claude has gone down an unproductive path or accumulated debugging back-and-forth that won't help the next task.\nWhat continuity you lose: The work done after the rewind point is gone. If Claude learned something useful in that stretch, it has to relearn it.", "Strategy: Pruning\nWhat it does: 이전 message로 돌아가 그 지점부터 계속하게 하며, 그 뒤에 있던 conversation을 제거합니다.\nWhen to apply: Claude가 생산적이지 않은 경로로 갔거나 다음 task에 도움이 되지 않는 debugging 왕복을 쌓았을 때 적용합니다.\nWhat continuity you lose: rewind point 이후의 작업은 사라집니다. 그 구간에서 Claude가 유용한 것을 배웠다면 다시 배워야 합니다."),
      item("Strategy: Compaction (/compact in Claude Code; server-side compaction in the API, a beta strategy the platform performs for you, with manual summarization as the client-side alternative)\nWhat it does: Summarizes the conversation history into a condensed version that preserves the key information Claude has learned. The summary costs fewer tokens than the original turns.\nWhen to apply: When the session is approaching the context ceiling but you want to keep working on the same feature with the knowledge Claude has built up.\nWhat continuity you lose: Details can be lost in the summarization. Anything not captured in the summary will not be available to Claude going forward.", "Strategy: Compaction (/compact in Claude Code; API의 server-side compaction은 platform이 대신 수행하는 beta strategy이며, manual summarization은 client-side alternative입니다.)\nWhat it does: Claude가 배운 핵심 정보를 보존하는 condensed version으로 conversation history를 요약합니다. summary는 original turn보다 token을 적게 씁니다.\nWhen to apply: session이 context ceiling에 가까워졌지만 Claude가 쌓아 온 지식으로 같은 feature 작업을 계속하고 싶을 때 적용합니다.\nWhat continuity you lose: summarization 과정에서 detail이 사라질 수 있습니다. summary에 담기지 않은 것은 이후 Claude가 사용할 수 없습니다."),
      item("Strategy: Clearing (/clear in Claude Code; new session in API)\nWhat it does: Starts a new conversation with empty context. Nothing from the previous session carries forward.\nWhen to apply: When the next task is completely different from the current one, and previous context would only introduce bias or confusion.\nWhat continuity you lose: All session context is gone. Anything Claude needs to remember across sessions has to be put somewhere persistent, like a CLAUDE.md file.", "Strategy: Clearing (/clear in Claude Code; API에서는 new session)\nWhat it does: empty context로 새 conversation을 시작합니다. 이전 session의 것은 아무것도 이어지지 않습니다.\nWhen to apply: 다음 task가 현재 task와 완전히 다르고 이전 context가 bias나 confusion만 만들 때 적용합니다.\nWhat continuity you lose: 모든 session context가 사라집니다. Claude가 session을 넘어 기억해야 할 것은 CLAUDE.md file 같은 persistent한 곳에 넣어야 합니다."),
      item("Strategy: Subagent Handoffs\nWhat it does: Spawns a subagent in its own isolated context window with only the task description and system prompt it needs. The subagent does the work and returns a summary.\nWhen to apply: When a subtask is self-contained enough to delegate, especially exploration work where the journey clutters the main context but the answer is short.\nWhat continuity you lose: Visibility into how the subagent reached its conclusion. The intermediate steps are discarded with the subagent's context.", "Strategy: Subagent Handoffs\nWhat it does: 필요한 task description과 system prompt만 가진 isolated context window에 subagent를 띄웁니다. subagent는 작업을 수행하고 summary를 반환합니다.\nWhen to apply: subtask가 delegation하기에 충분히 self-contained일 때, 특히 과정은 main context를 어지럽히지만 답은 짧은 exploration work에 적용합니다.\nWhat continuity you lose: subagent가 결론에 어떻게 도달했는지에 대한 visibility를 잃습니다. intermediate step은 subagent context와 함께 버려집니다.")
    ]
  },
  {
    id: "2-5-4-two-more-levers-prompt-caching-and-token-counting",
    title: "2-5-4. Two more levers: prompt caching and token counting",
    items: [
      item("2-5-4. Two more levers: prompt caching and token counting", "2-5-4. 두 가지 추가 lever: prompt caching과 token counting"),
      item("The four strategies above manage what enters the context window.", "위의 네 가지 전략은 context window에 무엇이 들어가는지를 관리합니다."),
      item("Two API features reduce what you pay for what's already there.", "두 가지 API feature는 이미 그 안에 있는 것에 대해 지불하는 비용을 줄입니다."),
      item("Prompt caching stores the processing work done on a stable prefix of your request so follow-up requests can reuse it instead of reprocessing the same tokens.", "Prompt caching은 request의 stable prefix에 대해 수행한 processing work를 저장해서 follow-up request가 같은 token을 다시 처리하는 대신 재사용할 수 있게 합니다."),
      item("The first request writes the prefix to cache; subsequent requests that send identical content up to that point pay a fraction of the original cost.", "첫 request는 prefix를 cache에 쓰고, 이후 같은 지점까지 동일한 content를 보내는 request는 original cost의 일부만 지불합니다."),
      item("The strongest candidates are parts of the request that rarely change across turns: a long system prompt, a large tool definition set, or a reference document you query repeatedly.", "가장 좋은 후보는 긴 system prompt, 큰 tool definition set, 반복해서 query하는 reference document처럼 turn 사이에서 거의 변하지 않는 request 부분입니다."),
      item("You enable caching by marking a cache breakpoint with a cache_control field of type ephemeral on the last block you want cached.", "cache하려는 마지막 block에 type ephemeral의 cache_control field로 cache breakpoint를 표시해 caching을 활성화합니다."),
      item("You can place up to four breakpoints.", "breakpoint는 최대 네 개까지 둘 수 있습니다."),
      item("For multi-turn sessions with a stable system prompt and tool schemas, caching those prefixes once and reusing them across turns is the highest-leverage cost reduction available.", "stable system prompt와 tool schema가 있는 multi-turn session에서는 그 prefix들을 한 번 cache하고 turn 사이에서 재사용하는 것이 가장 leverage가 큰 cost reduction입니다."),
      item("Token counting lets you measure context pressure before a request goes out rather than after it fails.", "Token counting은 request가 실패한 뒤가 아니라 나가기 전에 context pressure를 측정하게 해 줍니다."),
      item("The count_tokens endpoint takes the same request body as a messages call and returns the token count without running inference.", "count_tokens endpoint는 messages call과 같은 request body를 받아 inference를 실행하지 않고 token count를 반환합니다."),
      item("Use it during development to verify your context budget assumptions hold against real tool outputs, not just test fixtures, and in production to gate requests that would exceed the window before they error.", "development에서는 test fixture가 아니라 real tool output에 대해 context budget 가정이 맞는지 검증하는 데 사용하고, production에서는 window를 초과할 request를 error 전에 gate하는 데 사용하세요.")
    ]
  },
  {
    id: "2-5-5-the-three-places-a-rag-path-can-break",
    title: "2-5-5. The three places a RAG path can break",
    items: [
      item("2-5-5. The three places a RAG path can break", "2-5-5. RAG 경로가 깨질 수 있는 세 지점"),
      item("The path has three places where it can go wrong: the chunking, the embedding match, and the assembly into the prompt.", "이 경로에는 잘못될 수 있는 세 지점이 있습니다. chunking, embedding match, prompt로의 assembly입니다."),
      item("Chunking decides what a unit of retrievable context is.", "Chunking은 retrievable context의 단위가 무엇인지 결정합니다."),
      item("Split too small and a single chunk lacks the surrounding context to be useful.", "너무 작게 나누면 단일 chunk가 유용해지기 위한 surrounding context를 잃습니다."),
      item("Split too large and one chunk dilutes the match with unrelated text.", "너무 크게 나누면 하나의 chunk가 관련 없는 text로 match를 희석시킵니다."),
      item("Sentence-based or section-based chunking with a little overlap is a reasonable default.", "약간의 overlap을 둔 sentence-based 또는 section-based chunking이 합리적인 default입니다."),
      item("The overlap matters because facts that cross a boundary would otherwise be split apart and become difficult to retrieve.", "boundary를 가로지르는 fact는 그렇지 않으면 쪼개져 retrieve하기 어려워지기 때문에 overlap이 중요합니다."),
      item("The embedding match decides which chunks are returned.", "embedding match는 어떤 chunk가 반환되는지를 결정합니다."),
      item("It uses a similarity search, so it retrieves content that is semantically close.", "similarity search를 사용하므로 의미적으로 가까운 content를 retrieve합니다."),
      item("This is not always what contains the exact term you need.", "이것이 항상 필요한 정확한 term을 포함하는 것은 아닙니다."),
      item("A query for a specific identifier can miss the relevant chunk if a more semantically similar result outranks it.", "특정 identifier에 대한 query는 의미적으로 더 비슷한 결과가 더 높은 순위를 차지하면 관련 chunk를 놓칠 수 있습니다."),
      item("This is why a lexical match is sometimes run alongside the semantic one.", "이 때문에 lexical match가 semantic match와 함께 실행되기도 합니다."),
      item("The assembly step is where retrieved chunks must reach the model in the structure the prompt expects, otherwise the model answers from memory instead of from the retrieved text.", "assembly step에서는 retrieved chunk가 prompt가 기대하는 구조로 model에 도달해야 합니다. 그렇지 않으면 model은 retrieved text가 아니라 memory에서 답합니다."),
      item("The fetch-once path gives you a system you can reason about: you can inspect which chunks were retrieved for a query and test that retrieval directly.", "fetch-once path는 reasoning할 수 있는 system을 제공합니다. query에 대해 어떤 chunk가 retrieve되었는지 inspect하고 retrieval을 직접 test할 수 있습니다."),
      item("The cost is the infrastructure: the index that must be built, stored, kept in sync as the corpus changes, and secured wherever it lives.", "비용은 infrastructure입니다. corpus가 변할 때 build, store, sync, secure해야 하는 index가 필요합니다."),
      item("The search-across-rounds path removes that infrastructure and the staleness that comes with it, since the model reads the current files at query time, at the cost of spending more tokens and time per query and giving you a less inspectable process.", "search-across-rounds path는 model이 query time에 current file을 읽기 때문에 그 infrastructure와 staleness를 제거하지만, query마다 더 많은 token과 time을 쓰고 process가 덜 inspectable해지는 비용이 있습니다."),
      item("For a stable reference corpus queried with simple lookups, the index is worth owning.", "simple lookup으로 query되는 stable reference corpus라면 index를 소유할 가치가 있습니다."),
      item("For a changing corpus or multi-step questions, the iterative search is usually the simpler system despite costing more per query.", "changing corpus나 multi-step question에서는 query당 비용이 더 들더라도 iterative search가 보통 더 단순한 system입니다."),
      item("The reported performance gain for single-agent agentic search over a retrieval index is a version-pinned figure.", "retrieval index 대비 single-agent agentic search의 보고된 performance gain은 version-pinned figure입니다."),
      item("Confirm it against the reference layer at build time rather than relying on the number in this module.", "이 module의 숫자에 의존하기보다 build time에 reference layer에서 확인하세요."),
      item("Now, let's understand a bit about two of the most common strategies: compaction and subagent handoffs.", "이제 가장 흔한 두 전략인 compaction과 subagent handoff에 대해 조금 이해해 봅시다.")
    ]
  },
  {
    id: "2-5-6-applying-compaction-what-gets-preserved-depends-on-how-you-write-the-summarizer",
    title: "2-5-6. Applying compaction: What gets preserved depends on how you write the summarizer",
    items: [
      item("2-5-6. Applying compaction: What gets preserved depends on how you write the summarizer", "2-5-6. compaction 적용: 무엇이 보존되는지는 summarizer를 어떻게 쓰는지에 달려 있습니다."),
      item("When you use /compact in Claude Code, the tool decides what to include in the summary.", "Claude Code에서 /compact를 사용하면 tool이 summary에 무엇을 포함할지 결정합니다."),
      item("In the API, the documented primary strategy is server-side compaction (beta): the platform summarizes the conversation for you when it is configured on the request.", "API에서 문서화된 primary strategy는 server-side compaction(beta)입니다. request에 설정되면 platform이 conversation을 대신 summarize합니다."),
      item("When you instead implement manual compaction in an API session, you write the summarizer prompt yourself.", "대신 API session에서 manual compaction을 구현한다면 summarizer prompt를 직접 작성합니다."),
      item("That prompt determines what the agent will know in subsequent turns.", "그 prompt는 이후 turn에서 agent가 무엇을 알게 될지를 결정합니다."),
      item("Summarizer prompt says \"summarize the conversation so far\"\nProduces a general summary that may drop task-critical state, which files were modified, what decision was made at a branch point, and what error was encountered and resolved.", "Summarizer prompt가 \"summarize the conversation so far\"라고 말하면\n수정된 file, branch point에서 내려진 결정, 발생하고 해결된 error 같은 task-critical state를 빠뜨릴 수 있는 general summary를 만듭니다."),
      item("Summarizer prompt says \"summarize the conversation, preserving all file paths modified, all decisions made, and any errors encountered and their resolutions\"\nProduces a summary the agent can use.", "Summarizer prompt가 \"summarize the conversation, preserving all file paths modified, all decisions made, and any errors encountered and their resolutions\"라고 말하면\nagent가 사용할 수 있는 summary를 만듭니다."),
      item("This is not an edge case; task-critical state loss from an under-specified summarizer is one of the most common sources of multi-session agent failures.", "이것은 edge case가 아닙니다. under-specified summarizer로 인한 task-critical state loss는 multi-session agent failure의 가장 흔한 원인 중 하나입니다.")
    ]
  },
  {
    id: "2-5-7-subagent-handoffs-managing-long-horizon-tasks",
    title: "2-5-7. Subagent handoffs: Managing long-horizon tasks",
    items: [
      item("2-5-7. Subagent handoffs: Managing long-horizon tasks", "2-5-7. Subagent handoff: long-horizon task 관리"),
      item("When a task is too large for a single context window, increasing the window is not a solution.", "task가 단일 context window에 비해 너무 크다면 window를 늘리는 것은 해결책이 아닙니다."),
      item("The solution is to decompose the task and pass only the relevant context to each subagent.", "해결책은 task를 분해하고 각 subagent에 관련 context만 전달하는 것입니다."),
      item("A subagent receives a scoped task and the minimum context it needs, the results of prior steps that are directly relevant, the tools it needs to complete its task, and clear exit conditions.", "subagent는 scoped task, 필요한 최소 context, 직접 관련된 이전 step의 result, task 완료에 필요한 tool, 명확한 exit condition을 받습니다."),
      item("The parent agent collects the results.", "parent agent는 result를 수집합니다."),
      item("This pattern keeps per-turn cost low and makes long-horizon tasks tractable.", "이 pattern은 per-turn cost를 낮게 유지하고 long-horizon task를 다루기 쉽게 만듭니다."),
      item("Like compaction and pruning, subagent handoffs add implementation overhead, so apply them only where context cost is a real constraint: a simple single-turn prompt or short workflow doesn't need this.", "compaction과 pruning처럼 subagent handoff는 implementation overhead를 추가하므로, context cost가 실제 제약인 경우에만 적용하세요. 간단한 single-turn prompt나 짧은 workflow에는 이것이 필요하지 않습니다."),
      item("Handles well\nMulti-step agent sessions that exceed the token budget and need decomposition. Best designed at the architecture stage rather than patched in as a production fix.", "Handles well\ntoken budget을 초과하고 decomposition이 필요한 multi-step agent session에 잘 맞습니다. production fix로 덧붙이기보다 architecture stage에서 설계하는 것이 가장 좋습니다."),
      item("Use a different approach\nPipelines that never approach the window limit. Measure actual token usage against your model's context limit before adding management overhead.", "Use a different approach\nwindow limit에 가까워지지 않는 pipeline에는 다른 접근을 쓰세요. management overhead를 추가하기 전에 실제 token usage를 model의 context limit과 비교해 측정하세요."),
      item("Forward pointer\nThe strategies covered so far assume you know your context budget is under pressure and you are choosing a tool to manage it. The critical point here is not to know the pressure exists until the session breaks. A workload can pass every test in development and then fail in production for one reason: the tool output got bigger, the sessions got longer, and the context window that held twenty turns cleanly now fills at turn eight. The next section walks through exactly how that happens, using a worked postmortem of an agent that ran fine on test fixtures and then hit its ceiling once real documents started flowing through it.", "Forward pointer\n지금까지 다룬 전략들은 context budget이 압박받고 있다는 것을 알고 그것을 관리할 도구를 선택한다고 가정합니다. 여기서 중요한 점은 session이 깨지기 전까지 그 압박이 존재한다는 것을 모를 수 있다는 것입니다. workload는 development의 모든 test를 통과하고도 production에서 실패할 수 있습니다. 이유는 tool output이 커지고, session이 길어지고, 20 turn을 깔끔하게 담던 context window가 8번째 turn에서 차기 때문입니다. 다음 섹션은 test fixture에서는 잘 돌다가 실제 document가 흘러들어오자 ceiling에 도달한 agent의 worked postmortem으로 그 일이 정확히 어떻게 발생하는지 살펴봅니다.")
    ]
  },
  {
    id: "2-6-agent-construction",
    title: "2-6. Agent Construction",
    items: [
      item("2-6. Agent Construction", "2-6. Agent Construction"),
      item("Building a production agent: the loop, wiring paths, orchestration, and human-in-the-loop", "production agent 만들기: loop, wiring path, orchestration, human-in-the-loop"),
      item("An agent is a multi-step tool-use loop with managed context and a defined goal.", "agent는 managed context와 정의된 goal을 가진 multi-step tool-use loop입니다."),
      item("You have already built the individual pieces, including tool schemas and context management.", "이미 tool schema와 context management를 포함한 개별 구성 요소를 만들었습니다."),
      item("This section connects them into a working system and adds the layer that neither topics cover on their own.", "이 section은 그것들을 작동하는 system으로 연결하고, 각 topic만으로는 다루지 못하는 layer를 추가합니다."),
      item("When components run together across multiple turns, new failure modes appear that isolated testing does not catch.", "component들이 여러 turn에 걸쳐 함께 실행되면 isolated testing으로는 잡히지 않는 새로운 failure mode가 나타납니다."),
      item("Routing decisions that worked in single-turn tests start to compound.", "single-turn test에서 잘 작동하던 routing decision이 누적되기 시작합니다."),
      item("Context fills faster than expected.", "context는 예상보다 더 빨리 찹니다."),
      item("A step that depends on a previous result gets the wrong input because an earlier tool call was structured incorrectly.", "이전 result에 의존하는 step이 앞선 tool call의 구조가 잘못되어 틀린 input을 받습니다."),
      item("The question that should precede every agent build is: does this problem require an agent?", "모든 agent build에 앞서 물어야 할 질문은 이것입니다. 이 문제가 정말 agent를 필요로 하는가?"),
      item("Agents carry coordination overhead, expanded context costs, and more surface area for failure than simpler patterns.", "agent는 더 단순한 pattern보다 coordination overhead, 더 큰 context cost, 더 넓은 failure surface를 가집니다."),
      item("Answering that question deliberately is the first design decision.", "그 질문에 의도적으로 답하는 것이 첫 번째 design decision입니다.")
    ]
  },
  {
    id: "2-6-1-workflow-or-agent-make-this-decision-before-you-write-the-first-line",
    title: "2-6-1. Workflow or agent: Make this decision before you write the first line",
    items: [
      item("2-6-1. Workflow or agent: Make this decision before you write the first line", "2-6-1. Workflow 또는 agent: 첫 줄을 쓰기 전에 이 결정을 하세요"),
      item("The most critical mistake in agent development is choosing the wrong pattern at the start.", "agent development에서 가장 치명적인 실수는 시작할 때 wrong pattern을 선택하는 것입니다."),
      item("Workflows and agents solve different problems: using an agent when a workflow is sufficient adds behavioral complexity without adding capability.", "workflow와 agent는 서로 다른 문제를 해결합니다. workflow로 충분한데 agent를 사용하면 capability는 늘리지 못하고 behavioral complexity만 추가합니다."),
      item("Using a workflow when an agent is needed produces a system that breaks whenever user input deviates from the predetermined path.", "agent가 필요한데 workflow를 사용하면 user input이 predetermined path에서 벗어날 때마다 깨지는 system이 만들어집니다."),
      item("Choose a workflow when you can enumerate the exact steps in code.", "code로 exact step을 열거할 수 있을 때 workflow를 선택하세요."),
      item("Choose an agent when you can specify the goal and the tools but not the exact path.", "goal과 tool은 지정할 수 있지만 exact path는 지정할 수 없을 때 agent를 선택하세요."),
      item("Choose a workflow when error cost is real and step-level guardrails matter.", "error cost가 실제이고 step-level guardrail이 중요할 때 workflow를 선택하세요."),
      item("Choose an agent when the path through work cannot be enumerated in advance.", "work를 통과하는 path를 미리 열거할 수 없을 때 agent를 선택하세요."),
      item("Choose a workflow when observability with standard tooling is required.", "standard tooling을 통한 observability가 필요할 때 workflow를 선택하세요."),
      item("Choose an agent when non-determinism is acceptable and the agent's possible actions are constrained by its registered toolset.", "non-determinism을 허용할 수 있고 agent의 가능한 action이 registered toolset으로 제한될 때 agent를 선택하세요."),
      item("Choose a workflow when the inputs are well-constrained to a known set.", "input이 알려진 set으로 잘 제한되어 있을 때 workflow를 선택하세요."),
      item("Choose an agent when user inputs vary unpredictably in content and structure.", "user input의 content와 structure가 예측하기 어렵게 달라질 때 agent를 선택하세요."),
      item("Choose a workflow when every execution of the task follows the same sequence.", "task의 모든 execution이 같은 sequence를 따를 때 workflow를 선택하세요."),
      item("Choose an agent when the task requires creative sequencing of available tools.", "task가 available tool의 creative sequencing을 필요로 할 때 agent를 선택하세요.")
    ]
  },
  {
    id: "2-6-2-the-agent-is-the-pattern-the-wiring-path-is-an-implementation-choice",
    title: "2-6-2. The agent is the pattern. The wiring path is an implementation choice.",
    items: [
      item("2-6-2. The agent is the pattern. The wiring path is an implementation choice.", "2-6-2. agent가 pattern입니다. wiring path는 implementation choice입니다."),
      item("Once you have decided the task needs an agent, you have also decided on a pattern: a loop that calls tools, manages context, and runs until a goal is met.", "task에 agent가 필요하다고 결정했다면 pattern도 결정한 것입니다. tool을 호출하고 context를 관리하며 goal이 충족될 때까지 실행되는 loop입니다."),
      item("For single-agent systems, that pattern is constant across all three wiring paths.", "single-agent system에서는 그 pattern이 세 가지 wiring path 모두에서 동일합니다."),
      item("Multi-agent architectures, where a planner, executor, and evaluator run as separate agents handing off through structured artifacts, introduce additional design decisions beyond the loop itself.", "planner, executor, evaluator가 별도 agent로 실행되고 structured artifact를 통해 handoff하는 multi-agent architecture는 loop 자체를 넘어서는 추가 design decision을 도입합니다."),
      item("Those patterns are covered later in this track.", "그 pattern들은 이 track의 뒤쪽에서 다룹니다."),
      item("That pattern does not change based on how you build it, what changes is how much of the loop you write yourself versus how much you hand to a library or a hosted service.", "그 pattern은 어떻게 build하느냐에 따라 바뀌지 않습니다. 바뀌는 것은 loop 중 얼마나 직접 작성하고 얼마나 library나 hosted service에 맡기느냐입니다."),
      item("There are three wiring paths, and they sit on a spectrum of how much infrastructure you own.", "세 가지 wiring path가 있으며, 이들은 얼마나 많은 infrastructure를 소유하느냐의 spectrum 위에 있습니다."),
      item("You can write the loop directly against the Messages API, which gives you full control and full responsibility.", "Messages API를 상대로 loop를 직접 작성할 수 있으며, 이는 full control과 full responsibility를 줍니다."),
      item("You can use the Agent SDK, which runs the same loop inside your own process and hands you tool execution, context management, and the iteration structure already built.", "Agent SDK를 사용할 수도 있습니다. 이는 같은 loop를 자신의 process 안에서 실행하며 tool execution, context management, iteration structure를 이미 갖춘 형태로 제공합니다."),
      item("Or you can use Claude Managed Agents (currently in public beta), where Anthropic runs the loop and the sandbox and your application streams events in and results back.", "또는 Claude Managed Agents(현재 public beta)를 사용할 수 있습니다. 여기서는 Anthropic이 loop와 sandbox를 실행하고 application은 event를 보내고 result를 다시 받습니다."),
      item("The sections that follow teach the loop itself, because the loop is what stays constant.", "이어지는 section들은 loop 자체를 가르칩니다. 변하지 않는 것은 loop이기 때문입니다."),
      item("The path you choose decides who maintains the parts around it.", "선택한 path는 그 주변 부분을 누가 유지보수할지 결정합니다.")
    ]
  },
  {
    id: "2-6-3-wiring-paths-who-runs-the-loop-and-what-you-take-on",
    title: "2-6-3. Wiring paths: who runs the loop, and what you take on",
    items: [
      item("2-6-3. Wiring paths: who runs the loop, and what you take on", "2-6-3. Wiring path: 누가 loop를 실행하고, 무엇을 떠안는가"),
      item("The three paths differ in one variable: how much of the agent's runtime you own.", "세 가지 path는 하나의 변수에서 다릅니다. agent runtime 중 얼마나 직접 소유하느냐입니다."),
      item("The table is ordered from top to bottom by how much infrastructure you hand off.", "table은 얼마나 많은 infrastructure를 넘겨주는지에 따라 위에서 아래로 정렬되어 있습니다."),
      item("Choose based on your deployment and compliance constraints, don't be tempted to choose the path that is just fastest to prototype.", "deployment와 compliance constraint를 기준으로 선택하세요. prototype이 가장 빠르다는 이유만으로 path를 고르고 싶은 유혹에 넘어가지 마세요."),
      item("1. Raw Messages API loop", "1. Raw Messages API loop"),
      item("Who runs the loop: Your code runs every iteration.", "Who runs the loop: 코드가 모든 iteration을 실행합니다."),
      item("You send the request, read the tool-use blocks, execute the tools, and append the results yourself.", "request를 보내고, tool-use block을 읽고, tool을 실행하고, result를 직접 append합니다."),
      item("What you own: The full loop, tool execution, context management, retries, and exit conditions.", "What you own: full loop, tool execution, context management, retry, exit condition을 직접 소유합니다."),
      item("Nothing is provided for you.", "자동으로 제공되는 것은 없습니다."),
      item("Choose this when: You need full control over each step, you have constraints a library does not accommodate, or you are teaching yourself how the loop works before adding abstraction.", "Choose this when: 각 step에 대한 full control이 필요하거나, library가 수용하지 못하는 constraint가 있거나, abstraction을 추가하기 전에 loop가 어떻게 작동하는지 직접 배우고 싶을 때 선택하세요."),
      item("What to check before committing: The maintenance cost is yours.", "What to check before committing: maintenance cost는 직접 부담해야 합니다."),
      item("Every behavior the SDK would give you for free, including context management and parallel tool handling, becomes code you write and test.", "context management와 parallel tool handling을 포함해 SDK가 무료로 제공했을 모든 behavior가 직접 작성하고 test해야 하는 code가 됩니다."),
      item("2. Agent SDK", "2. Agent SDK"),
      item("Who runs the loop: The SDK runs the loop inside your own process.", "Who runs the loop: SDK가 자신의 process 안에서 loop를 실행합니다."),
      item("It iterates and manages context, and your code still executes the tools the agent calls.", "SDK가 iterate하고 context를 관리하며, agent가 호출한 tool은 여전히 코드가 실행합니다."),
      item("What you own: Tool execution and the surrounding application.", "What you own: tool execution과 surrounding application을 직접 소유합니다."),
      item("The SDK provides the loop structure, context management, and tool registration.", "SDK는 loop structure, context management, tool registration을 제공합니다."),
      item("Choose this when: You want the loop, context handling, and tool scaffolding that power Claude Code without rebuilding them, and you want the agent running in your own environment in Python or TypeScript.", "Choose this when: Claude Code를 움직이는 loop, context handling, tool scaffolding을 다시 만들지 않고 사용하고 싶고, agent를 Python 또는 TypeScript 환경에서 직접 실행하고 싶을 때 선택하세요."),
      item("What to check before committing: Whether filesystem-based features like CLAUDE.md and skills load in the Agent SDK is controlled by the settingSources configuration.", "What to check before committing: CLAUDE.md와 skills 같은 filesystem-based feature가 Agent SDK에서 load되는지는 settingSources configuration이 제어합니다."),
      item("Do not rely on a default: always set settingSources explicitly to the sources you intend, for example, [\"user\", \"project\", \"local\"] to match Claude Code CLI behavior, or [] to run fully isolated with only what you pass programmatically.", "default에 의존하지 마세요. Claude Code CLI behavior와 맞추려면 [\"user\", \"project\", \"local\"]처럼, programmatically 전달한 것만으로 완전히 isolated하게 실행하려면 []처럼 의도한 source를 settingSources에 항상 명시적으로 설정하세요."),
      item("Confirm current default behavior against the Agent SDK reference at build time.", "build time에 Agent SDK reference를 기준으로 current default behavior를 확인하세요."),
      item("3. Claude Managed Agents", "3. Claude Managed Agents"),
      item("Who runs the loop: Anthropic runs the loop and the sandbox.", "Who runs the loop: Anthropic이 loop와 sandbox를 실행합니다."),
      item("Your application sends user events and streams results back over server-sent events.", "application은 user event를 보내고 server-sent event를 통해 result를 stream으로 돌려받습니다."),
      item("What you own: The application layer and the agent definition.", "What you own: application layer와 agent definition을 직접 소유합니다."),
      item("You define the model, system prompt, tools, MCP servers, and skills once, then reference the agent by ID across sessions.", "model, system prompt, tool, MCP server, skill을 한 번 정의한 뒤 session 전반에서 agent ID로 참조합니다."),
      item("Choose this when: You need long-running execution measured in minutes or hours, you want a managed sandbox, or you want to avoid building the loop, the sandbox, and the tool-execution layer at all.", "Choose this when: 분 또는 시간 단위의 long-running execution이 필요하거나, managed sandbox를 원하거나, loop, sandbox, tool-execution layer를 아예 만들고 싶지 않을 때 선택하세요."),
      item("Also available on Claude Platform on AWS with some feature differences, verify capability parity against your deployment surface before committing.", "Claude Platform on AWS에서도 사용할 수 있지만 일부 feature 차이가 있으므로, 결정하기 전에 deployment surface 기준으로 capability parity를 확인하세요."),
      item("What to check before committing: Sessions are stateful and stored server-side, which means they are not currently eligible for Zero Data Retention or a HIPAA Business Associate Agreement.", "What to check before committing: session은 stateful하며 server-side에 저장됩니다. 즉 현재 Zero Data Retention 또는 HIPAA Business Associate Agreement 대상이 아닙니다."),
      item("See Anthropic API data retention documentation at platform.claude.com and verify it at publish.", "platform.claude.com의 Anthropic API data retention documentation을 보고 publish 시점에 확인하세요."),
      item("Currently in public beta, all endpoints require the managed-agents-2026-04-01 beta header and behaviors may be refined between releases.", "현재 public beta이며, 모든 endpoint에는 managed-agents-2026-04-01 beta header가 필요하고 release 사이에 behavior가 조정될 수 있습니다."),
      item("Build with a migration plan in place.", "migration plan을 마련한 상태로 build하세요.")
    ]
  },
  {
    id: "2-6-4-claude-managed-agents-when-to-use",
    title: "2-6-4. Claude Managed Agents: when to use",
    items: [
      item("2-6-4. Claude Managed Agents: when to use", "2-6-4. Claude Managed Agents: 언제 사용할 것인가"),
      item("The table above lists Managed Agents as the third path.", "위 table은 Managed Agents를 세 번째 path로 제시합니다."),
      item("Let's make that choice concrete because for some workloads it's the right default.", "일부 workload에서는 이것이 올바른 default이므로, 그 선택을 구체화해 봅시다."),
      item("Here's the core difference: with a raw loop or the Agent SDK, your code runs the iteration.", "핵심 차이는 이것입니다. raw loop나 Agent SDK에서는 코드가 iteration을 실행합니다."),
      item("You send each request, read the tool-use blocks, run the tools, and append the results.", "각 request를 보내고, tool-use block을 읽고, tool을 실행하고, result를 append합니다."),
      item("With Managed Agents, Anthropic runs the loop and the sandbox for you.", "Managed Agents에서는 Anthropic이 loop와 sandbox를 대신 실행합니다."),
      item("Your application defines the agent once (model, system prompt, tools, MCP servers, skills), refers to it by ID, sends user events, and streams the results back over server-sent events.", "application은 agent를 한 번 정의하고(model, system prompt, tools, MCP servers, skills), ID로 참조하며, user event를 보내고 server-sent event로 result를 stream합니다."),
      item("What you stop owning, and what you take on instead", "더 이상 직접 소유하지 않는 것과 대신 맡게 되는 것"),
      item("Category: Execution & infrastructure\nWhat you stop owning: The iteration loop, the execution sandbox, the retries inside the loop, and the tool-execution runtime. Anthropic runs all of it server-side.\nWhat you take on instead: An agent definition managed as a versioned API resource, plus an application layer that sends events and consumes the streamed results.", "Category: Execution & infrastructure\nWhat you stop owning: iteration loop, execution sandbox, loop 안의 retry, tool-execution runtime을 직접 소유하지 않습니다. Anthropic이 모두 server-side에서 실행합니다.\nWhat you take on instead: versioned API resource로 관리되는 agent definition과 event를 보내고 streamed result를 소비하는 application layer를 맡습니다."),
      item("Category: Session duration & state\nWhat you stop owning: Long-running execution management. Sessions can run for minutes or hours without your process holding the loop open.\nWhat you take on instead: Server-side session state. Sessions are stateful and stored by Anthropic, and are subject to its data handling policies and constraints (see the constraint note below).", "Category: Session duration & state\nWhat you stop owning: long-running execution management를 직접 소유하지 않습니다. process가 loop를 열어두지 않아도 session은 몇 분 또는 몇 시간 동안 실행될 수 있습니다.\nWhat you take on instead: server-side session state를 받아들입니다. session은 stateful이고 Anthropic에 저장되며 data handling policy와 constraint의 적용을 받습니다."),
      item("Category: Sandbox lifecycle\nWhat you stop owning: Sandbox provisioning and teardown for tool execution.\nWhat you take on instead: A dependency on the managed sandbox's available tools and its execution model, rather than your own environment.", "Category: Sandbox lifecycle\nWhat you stop owning: tool execution을 위한 sandbox provisioning과 teardown을 직접 소유하지 않습니다.\nWhat you take on instead: 자신의 environment가 아니라 managed sandbox의 available tool과 execution model에 의존하게 됩니다."),
      item("The task runs long: Execution measured in minutes or hours is awkward to hold open in your own process, and the managed loop is built for exactly that.", "task가 길게 실행될 때: 분 또는 시간 단위의 execution을 자신의 process 안에 열어두기는 까다롭고, managed loop는 바로 그 용도를 위해 만들어졌습니다."),
      item("You want a managed sandbox: If you'd otherwise be building and securing an execution environment for tool calls, using Managed Agents takes a large piece of infrastructure off your plate.", "managed sandbox를 원할 때: tool call을 위한 execution environment를 직접 만들고 보호해야 한다면, Managed Agents는 큰 infrastructure 부담을 덜어 줍니다."),
      item("You'd rather not build the loop, the sandbox, and the tool-execution layer at all: You are willing to define the agent as an API resource instead.", "loop, sandbox, tool-execution layer를 아예 만들고 싶지 않을 때: 대신 agent를 API resource로 정의하는 방식을 받아들이는 것입니다."),
      item("Managed Agent sessions are stateful and stored server-side.", "Managed Agent session은 stateful이며 server-side에 저장됩니다."),
      item("That storage is the reason these sessions aren't currently eligible for Zero Data Retention or a HIPAA Business Associate Agreement.", "그 저장 방식 때문에 현재 이 session들은 Zero Data Retention 또는 HIPAA Business Associate Agreement 대상이 아닙니다."),
      item("So, if your workload carries PHI or falls under a ZDR requirement, this path is ruled out no matter how well it fits operationally, and you route to the Agent SDK or a raw loop on a covered configuration instead.", "따라서 workload가 PHI를 다루거나 ZDR requirement에 해당한다면, 운영상 잘 맞더라도 이 path는 제외되고 covered configuration의 Agent SDK 또는 raw loop로 가야 합니다."),
      item("The governing constraint picks the path before convenience gets a say.", "governing constraint가 convenience보다 먼저 path를 결정합니다."),
      item("A common progression is to prototype on the Agent SDK locally, then move to Managed Agents for production.", "일반적인 progression은 local에서 Agent SDK로 prototype을 만들고 production에서는 Managed Agents로 옮기는 것입니다."),
      item("Expect a re-expression step, not a direct export.", "direct export가 아니라 re-expression step이 필요하다고 예상하세요."),
      item("Handles well: Long-running agents, and workloads where you'd rather not build or secure a sandbox and loop yourself.", "Handles well: long-running agent와 sandbox 및 loop를 직접 만들거나 보호하고 싶지 않은 workload에 잘 맞습니다."),
      item("Adds cost or complexity: Server-side stateful sessions, an agent-as-resource definition format, and a beta surface that can change between releases.", "Adds cost or complexity: server-side stateful session, agent-as-resource definition format, release 사이에 바뀔 수 있는 beta surface가 추가됩니다."),
      item("Use a different approach: For PHI or ZDR workloads, or when you need full in-process control, stay on the Agent SDK or a raw loop on a covered configuration.", "Use a different approach: PHI 또는 ZDR workload이거나 full in-process control이 필요하다면 covered configuration의 Agent SDK 또는 raw loop에 머무르세요.")
    ]
  },
  {
    id: "2-6-5-wiring-the-loop-the-four-steps-that-hold-across-every-path",
    title: "2-6-5. Wiring the loop: the four steps that hold across every path",
    items: [
      item("2-6-5. Wiring the loop: the four steps that hold across every path", "2-6-5. Loop 연결하기: 모든 path에 공통으로 적용되는 네 단계"),
      item("The four steps below define a working agent loop no matter which path you build on.", "아래 네 단계는 어떤 path 위에 build하든 작동하는 agent loop를 정의합니다."),
      item("When you write the loop against the Messages API, you implement all four yourself.", "Messages API를 상대로 loop를 작성하면 네 단계를 모두 직접 구현합니다."),
      item("When you use the Agent SDK, it provides the structure for registering tools, setting the system prompt, and iterating the loop, and your code still handles tool execution.", "Agent SDK를 사용하면 tool registration, system prompt 설정, loop iteration을 위한 구조를 제공하지만, tool execution은 여전히 코드가 처리합니다."),
      item("The steps are the same; what differs is how much you write versus inherit.", "step은 같습니다. 다른 것은 얼마나 직접 작성하고 얼마나 물려받느냐입니다."),
      item("Register tools: Each tool follows the same schema structure. The SDK registers them against the agent, so Claude knows what is available.", "Register tools: 각 tool은 같은 schema structure를 따릅니다. SDK가 agent에 tool을 등록하므로 Claude는 무엇을 사용할 수 있는지 알게 됩니다."),
      item("Set the system prompt: Scope it to the agent's task. A broad system prompt produces broader, less reliable tool routing.", "Set the system prompt: agent의 task에 맞게 scope를 좁히세요. broad system prompt는 더 넓고 덜 reliable한 tool routing을 만듭니다."),
      item("A system prompt that names the specific task and the tools available for it produces more consistent behavior.", "specific task와 그 task에 available한 tool을 명시하는 system prompt는 더 consistent한 behavior를 만듭니다."),
      item("Handle the tool-use loop: Whether you iterate the loop yourself or the SDK iterates it for you, your code handles execution.", "Handle the tool-use loop: 직접 loop를 iterate하든 SDK가 대신 iterate하든 execution은 코드가 처리합니다."),
      item("Every tool call Claude issues must be executed by your code and returned in a tool-result block.", "Claude가 발행한 모든 tool call은 코드가 실행하고 tool-result block으로 반환해야 합니다."),
      item("Define exit conditions: The agent loop runs until it receives a stop condition.", "Define exit conditions: agent loop는 stop condition을 받을 때까지 실행됩니다."),
      item("Without explicit exit conditions, the agent will continue requesting tool calls beyond what the task requires.", "명시적인 exit condition이 없으면 agent는 task가 요구하는 범위를 넘어 tool call을 계속 요청합니다."),
      item("You should define when done means done.", "done이 무엇을 의미하는지 정의해야 합니다.")
    ]
  },
  {
    id: "2-6-6-loop-wiring-checklist-verify-these-regardless-of-path",
    title: "2-6-6. Loop wiring checklist: verify these regardless of path",
    items: [
      item("2-6-6. Loop wiring checklist: verify these regardless of path", "2-6-6. Loop wiring checklist: path와 상관없이 확인할 것"),
      item("#: 1\nItem: Tools registered\nWhat to verify: Every tool the agent may need is in the registration list. No unregistered tools are referenced in the system prompt.", "#: 1\nItem: Tools registered\nWhat to verify: agent가 필요로 할 수 있는 모든 tool이 registration list에 있어야 합니다. system prompt에서 unregistered tool을 참조하면 안 됩니다."),
      item("#: 2\nItem: System prompt scoped\nWhat to verify: The system prompt names the task and the available tools. It does not describe tools the agent does not have. It does not omit tools the agent does have that require scoping guidance.", "#: 2\nItem: System prompt scoped\nWhat to verify: system prompt는 task와 available tool을 명시해야 합니다. agent가 갖지 않은 tool을 설명하지 않고, scoping guidance가 필요한 tool을 빠뜨리지 않아야 합니다."),
      item("#: 3\nItem: Tool-use loop implemented\nWhat to verify: Your code handles every tool-use block Claude issues and returns a tool-result block for each one before the next assistant turn. All tool-use blocks from a single assistant turn must be resolved together.", "#: 3\nItem: Tool-use loop implemented\nWhat to verify: 코드는 Claude가 발행한 모든 tool-use block을 처리하고 다음 assistant turn 전에 각각에 대한 tool-result block을 반환해야 합니다. 단일 assistant turn의 모든 tool-use block은 함께 resolve되어야 합니다."),
      item("#: 4\nItem: HITL insertion point defined\nWhat to verify: At least one point in the loop has a human-in-the-loop check. See the section below for where to insert it.", "#: 4\nItem: HITL insertion point defined\nWhat to verify: loop의 최소 한 지점에는 human-in-the-loop check가 있어야 합니다. 어디에 넣을지는 아래 section을 보세요."),
      item("#: 5\nItem: Exit conditions defined\nWhat to verify: The loop has a clear stopping criterion that does not depend on Claude volunteering to stop.", "#: 5\nItem: Exit conditions defined\nWhat to verify: loop에는 Claude가 자발적으로 멈추겠다고 말하는 것에 의존하지 않는 명확한 stopping criterion이 있어야 합니다.")
    ]
  },
  {
    id: "2-6-7-human-in-the-loop-hitl-insertion-points-and-when-each-applies",
    title: "2-6-7. Human-in-the-loop (HITL): Insertion points and when each applies",
    items: [
      item("2-6-7. Human-in-the-loop (HITL): Insertion points and when each applies", "2-6-7. Human-in-the-loop (HITL): 삽입 지점과 적용 시점"),
      item("A human-in-the-loop checkpoint pauses agent execution and routes to a human review step before proceeding.", "human-in-the-loop checkpoint는 agent execution을 일시 중지하고 진행 전에 human review step으로 보냅니다."),
      item("The question that determines where to insert one is: what is the worst possible outcome if this step runs without a human check?", "어디에 넣을지를 결정하는 질문은 이것입니다. 이 step이 human check 없이 실행될 때 가능한 최악의 결과는 무엇인가?"),
      item("Insertion point: Before a destructive tool call\nWhat triggers the check: The agent is about to execute a write, delete, or send operation.\nRisk level it addresses: High — irreversible actions where a wrong call cannot be undone.", "Insertion point: destructive tool call 전\nWhat triggers the check: agent가 write, delete, send operation을 실행하려고 할 때입니다.\nRisk level it addresses: High — 잘못된 call을 되돌릴 수 없는 irreversible action을 다룹니다."),
      item("Insertion point: After a planning step\nWhat triggers the check: The agent has generated a plan and is about to begin executing it.\nRisk level it addresses: Medium — incorrect plans that would produce the wrong outcome even if all steps execute correctly.", "Insertion point: planning step 후\nWhat triggers the check: agent가 plan을 생성했고 실행을 시작하려고 할 때입니다.\nRisk level it addresses: Medium — 모든 step이 올바르게 실행되어도 잘못된 outcome을 만들 수 있는 incorrect plan을 다룹니다."),
      item("Insertion point: On unexpected output\nWhat triggers the check: The tool result contains an error flag, an empty result, or a value outside expected bounds.\nRisk level it addresses: Variable — catches failure modes that retry logic alone will not resolve.", "Insertion point: unexpected output 발생 시\nWhat triggers the check: tool result에 error flag, empty result, expected bounds 밖의 value가 있을 때입니다.\nRisk level it addresses: Variable — retry logic만으로 해결되지 않는 failure mode를 잡습니다.")
    ]
  },
  {
    id: "2-6-8-tool-orchestration-over-tooling-and-under-tooling",
    title: "2-6-8. Tool orchestration: Over-tooling and under-tooling",
    items: [
      item("2-6-8. Tool orchestration: Over-tooling and under-tooling", "2-6-8. Tool orchestration: over-tooling과 under-tooling"),
      item("The agent's routing behavior is shaped by two things, including how tools are described and how many tools are registered.", "agent의 routing behavior는 tool이 어떻게 설명되는지와 얼마나 많은 tool이 등록되어 있는지에 의해 형성됩니다."),
      item("Too many tools with overlapping descriptions produce erratic routing.", "description이 겹치는 tool이 너무 많으면 erratic routing이 발생합니다."),
      item("Too few tools force the agent to either hallucinate a path or return an incomplete result.", "tool이 너무 적으면 agent가 path를 hallucinate하거나 incomplete result를 반환하게 됩니다."),
      item("Over-tooling is the more common problem in production agents.", "production agent에서는 over-tooling이 더 흔한 문제입니다."),
      item("Teams register every tool they might need \"just in case\" and discover that Claude's selection quality degrades as the tool surface grows.", "팀은 혹시 몰라 필요할지도 모르는 모든 tool을 등록하고, tool surface가 커질수록 Claude의 selection quality가 떨어진다는 것을 발견합니다."),
      item("Start with the minimum set required for the task and add tools only when a specific gap in capability is confirmed.", "task에 필요한 minimum set으로 시작하고, capability의 specific gap이 확인될 때만 tool을 추가하세요."),
      item("When agents are the right call: Goal-directed tasks where the exact path cannot be enumerated in advance. Handling variable inputs that would require dozens of conditional branches in a workflow.", "When agents are the right call: exact path를 미리 열거할 수 없는 goal-directed task에 적합합니다. workflow에서 수십 개의 conditional branch가 필요할 variable input을 처리할 때도 적합합니다."),
      item("What you take on when you use an Agent: Agents add behavioral complexity: the path through the task emerges from the model's reasoning over accumulated context rather than from explicit branching logic in your code.", "What you take on when you use an Agent: agent는 behavioral complexity를 추가합니다. task를 통과하는 path는 code의 explicit branching logic이 아니라 accumulated context에 대한 model의 reasoning에서 나옵니다."),
      item("Observability requires transcript-level tooling rather than standard operational logging.", "observability에는 standard operational logging이 아니라 transcript-level tooling이 필요합니다."),
      item("When to choose a workflow instead: When you can enumerate the steps in code, use a workflow.", "When to choose a workflow instead: step을 code로 열거할 수 있으면 workflow를 사용하세요."),
      item("Agents are the last step in progression.", "agent는 progression의 마지막 단계입니다."),
      item("Start with the simplest pattern that solves the problem, a single API call, then a workflow, then an agent.", "문제를 해결하는 가장 단순한 pattern에서 시작하세요. single API call, 그다음 workflow, 그다음 agent입니다."),
      item("And move up only when the simpler pattern cannot handle the variability the task requires.", "그리고 더 단순한 pattern이 task가 요구하는 variability를 처리할 수 없을 때만 올라가세요.")
    ]
  },
  {
    id: "2-6-9-regulated-data-constraints-set-your-delivery-route-and-credentials-before-you-write-the-wiring",
    title: "2-6-9. Regulated data constraints set your delivery route and credentials before you write the wiring",
    items: [
      item("2-6-9. Regulated data constraints set your delivery route and credentials before you write the wiring", "2-6-9. Regulated data constraint는 wiring을 작성하기 전에 delivery route와 credential을 결정합니다."),
      item("If your data needs to be handled with specific constraints (e.g., attorney-client privilege, HIPAA, GDPR, FedRAMP, or an internal data-residency policy), that constraint decides which endpoint your code calls, which credentials it carries, and where its logs land before you make a single design choice about prompts, tools, or memory.", "data가 특정 constraint를 따라 처리되어야 한다면(예: attorney-client privilege, HIPAA, GDPR, FedRAMP, internal data-residency policy), prompt, tool, memory에 대한 design choice를 하기 전에 그 constraint가 code가 호출할 endpoint, 사용할 credential, log가 남을 위치를 결정합니다."),
      item("As a developer you usually do not pick the surface, but you do write the code that targets a specific endpoint, attaches credentials, configures the region, and emits logs.", "developer는 보통 surface를 직접 고르지는 않지만, 특정 endpoint를 target하고 credential을 붙이고 region을 설정하고 log를 내보내는 code를 작성합니다."),
      item("Get the governing constraint named at the start, because the wrong client configuration is much more expensive to undo after the agent is wired than to set correctly the first time.", "처음에 governing constraint의 이름을 명확히 하세요. agent가 이미 연결된 뒤 wrong client configuration을 되돌리는 것은 처음부터 올바르게 설정하는 것보다 훨씬 비쌉니다."),
      item("The five constraints below cover the cases you are most likely to hit in production.", "아래 다섯 가지 constraint는 production에서 가장 자주 마주칠 case를 다룹니다."),
      item("Constraint: Attorney-client privilege\nWhat it tends to rule out in code: Calls from a consumer-grade Claude.ai surface that the firm cannot audit end-to-end. Code paths that send privileged document content to any endpoint the firm has not approved for privileged material, regardless of how the prompt or system message is structured.", "Constraint: Attorney-client privilege\nWhat it tends to rule out in code: firm이 end-to-end로 audit할 수 없는 consumer-grade Claude.ai surface의 call입니다. prompt나 system message가 어떻게 구성되었든, firm이 privileged material용으로 승인하지 않은 endpoint에 privileged document content를 보내는 code path도 제외됩니다."),
      item("What usually survives a code review: Direct API or SDK calls from inside the firm's own application, authenticated via SSO, routed through a firm-approved LLM gateway with full request and response logging.", "What usually survives a code review: firm 자체 application 안에서 이루어지는 direct API 또는 SDK call입니다. SSO로 인증되고, full request and response logging을 갖춘 firm-approved LLM gateway를 통해 routing됩니다."),
      item("Note that Anthropic's native Compliance Conversation content (prompts, responses, and tool call payloads) is not captured by Anthropic by default on direct API traffic, so the organization must implement conversation logging in the application layer and route it to an approved log destination.", "direct API traffic에서는 Anthropic의 native Compliance Conversation content(prompt, response, tool call payload)가 기본적으로 Anthropic에 capture되지 않으므로, organization은 application layer에서 conversation logging을 구현하고 approved log destination으로 routing해야 합니다."),
      item("Constraint: HIPAA (PHI handling)\nWhat it tends to rule out in code: Code that sends Protected Health Information to any endpoint or delivery route not covered by a Business Associate Agreement for the specific configuration in use. This includes any logging or retention path your code writes to that has not been scoped under the same BAA.", "Constraint: HIPAA (PHI handling)\nWhat it tends to rule out in code: 사용 중인 specific configuration에 대한 Business Associate Agreement로 cover되지 않는 endpoint나 delivery route에 Protected Health Information을 보내는 code입니다. 같은 BAA scope에 포함되지 않은 logging 또는 retention path도 포함됩니다."),
      item("What usually survives a code review: Direct API or SDK calls on a BAA-covered configuration.", "What usually survives a code review: BAA-covered configuration에서의 direct API 또는 SDK call입니다."),
      item("BAA coverage for Anthropic first-party API access is arranged with Anthropic, which provisions a dedicated HIPAA-enabled organization that enforces feature restrictions on its own end.", "Anthropic first-party API access의 BAA coverage는 Anthropic과 arrange하며, Anthropic은 자체적으로 feature restriction을 enforce하는 dedicated HIPAA-enabled organization을 provision합니다."),
      item("An alternative is a cloud-mediated route via AWS Bedrock or GCP Vertex on the partner's existing HIPAA-eligible cloud account.", "대안은 partner의 기존 HIPAA-eligible cloud account에서 AWS Bedrock 또는 GCP Vertex를 통한 cloud-mediated route입니다."),
      item("Note: the BAA does not cover Console, Workbench, beta features, or consumer plans. Not all API features are covered under the BAA, verify the current feature eligibility list in Anthropic's Implementation Guide before configuring.", "Note: BAA는 Console, Workbench, beta feature, consumer plan을 cover하지 않습니다. 모든 API feature가 BAA 아래 cover되는 것은 아니므로 configuration 전에 Anthropic Implementation Guide에서 current feature eligibility list를 확인하세요."),
      item("Constraint: GDPR and data residency\nWhat it tends to rule out in code: Delivery routes where the region of model execution cannot be pinned in code, or where the request can be served from a region outside the approved geographic boundary.", "Constraint: GDPR and data residency\nWhat it tends to rule out in code: model execution region을 code에서 pin할 수 없거나, approved geographic boundary 밖의 region에서 request가 처리될 수 있는 delivery route입니다."),
      item("Defaulting to a global endpoint without specifying region is the common pattern that breaks here.", "region을 지정하지 않고 global endpoint를 default로 쓰는 것이 여기서 깨지는 흔한 pattern입니다."),
      item("What usually survives a code review: A cloud-mediated route such as Bedrock or Vertex, with the region pinned in the client configuration to a covered jurisdiction.", "What usually survives a code review: Bedrock 또는 Vertex 같은 cloud-mediated route이며, client configuration에서 region을 covered jurisdiction으로 pin합니다."),
      item("The direct Anthropic API is a separate case; it does not currently provide EU data residency, so partners with EU data residency requirements should route through Bedrock or Vertex rather than calling the API directly.", "direct Anthropic API는 별도 case입니다. 현재 EU data residency를 제공하지 않으므로 EU data residency requirement가 있는 partner는 API를 직접 호출하기보다 Bedrock 또는 Vertex를 통해 route해야 합니다."),
      item("Constraint: FedRAMP and government\nWhat it tends to rule out in code: Any code path that calls an endpoint not on an authorized cloud environment at the required impact level.", "Constraint: FedRAMP and government\nWhat it tends to rule out in code: required impact level의 authorized cloud environment에 있지 않은 endpoint를 호출하는 모든 code path입니다."),
      item("This includes development and test paths that hit the commercial endpoint while production hits the authorized one, because credentials and code patterns leak between them.", "production은 authorized endpoint를 쓰면서 development와 test path는 commercial endpoint를 치는 경우도 포함됩니다. credential과 code pattern이 서로 새어 나갈 수 있기 때문입니다."),
      item("What usually survives a code review: Three authorized routes exist as of publish time. Claude for Government (C4G) carries a direct FedRAMP High authorization held through Palantir Federal Cloud Service – Supporting Services (PFCS-SS). Claude via Amazon Bedrock GovCloud is approved for FedRAMP High and DoD IL4/5 workloads. Claude via Vertex AI Assured Workloads is also FedRAMP authorized.", "What usually survives a code review: publish time 기준 세 가지 authorized route가 있습니다. Claude for Government(C4G)는 Palantir Federal Cloud Service – Supporting Services(PFCS-SS)를 통해 direct FedRAMP High authorization을 갖습니다. Amazon Bedrock GovCloud를 통한 Claude는 FedRAMP High 및 DoD IL4/5 workload에 승인되어 있습니다. Vertex AI Assured Workloads를 통한 Claude도 FedRAMP authorized입니다."),
      item("Claude Enterprise on AWS Marketplace is not FedRAMP authorized, so teams requiring FedRAMP compliance must use one of the three routes above. Verify current authorization status at trust.anthropic.com before configuring.", "AWS Marketplace의 Claude Enterprise는 FedRAMP authorized가 아니므로 FedRAMP compliance가 필요한 team은 위 세 route 중 하나를 사용해야 합니다. configuration 전에 trust.anthropic.com에서 current authorization status를 확인하세요."),
      item("Constraint: Internal data-residency policy\nWhat it tends to rule out in code: Calls from any SDK client configured against a cloud vendor outside the partner's approved list, regardless of whether the underlying technical capability would support the workload.", "Constraint: Internal data-residency policy\nWhat it tends to rule out in code: underlying technical capability가 workload를 지원하더라도, partner의 approved list 밖 cloud vendor를 대상으로 구성된 SDK client의 call은 제외됩니다."),
      item("Procurement-level constraints rule the code path out before engineering preferences enter the conversation.", "procurement-level constraint는 engineering preference가 논의되기 전에 code path를 제외합니다."),
      item("What usually survives a code review: The delivery route on the partner's approved cloud vendor. In code terms, that is whichever SDK client and endpoint configuration their CIO has already cleared.", "What usually survives a code review: partner가 승인한 cloud vendor의 delivery route입니다. code 관점에서는 CIO가 이미 승인한 SDK client와 endpoint configuration입니다."),
      item("Build against that one rather than switching mid-project because another route looks easier.", "다른 route가 더 쉬워 보인다고 중간에 바꾸지 말고, 승인된 route를 기준으로 build하세요."),
      item("This table covers the constraints that directly determine endpoint selection and credential configuration.", "이 table은 endpoint selection과 credential configuration을 직접 결정하는 constraint를 다룹니다."),
      item("SOC 2 is not in scope here. It governs how your systems are built and operated, not which endpoint your code calls, and is covered in Module 4 alongside other security posture and audit requirements.", "SOC 2는 여기 scope가 아닙니다. SOC 2는 code가 어떤 endpoint를 호출하는지가 아니라 system이 어떻게 build되고 운영되는지를 다루며, Module 4에서 다른 security posture 및 audit requirement와 함께 다룹니다."),
      item("Forward pointer\nModule 4 (Production Engineering, Evals & Security) goes deep on secure-by-design patterns for IAM and privacy, defenses against prompt injection from untrusted inputs, runtime guardrails, and agent hardening.", "Forward pointer\nModule 4(Production Engineering, Evals & Security)는 IAM과 privacy를 위한 secure-by-design pattern, untrusted input의 prompt injection 방어, runtime guardrail, agent hardening을 깊게 다룹니다."),
      item("The role of this section is narrower: surface the constraint at the point in the build where it actually rules options out, which is when you pick the endpoint, the SDK client configuration, and the credentials your agent carries into production.", "이 section의 역할은 더 좁습니다. 실제로 option을 제외하는 build 지점, 즉 endpoint, SDK client configuration, production에 들어갈 agent의 credential을 선택하는 시점에 constraint를 드러내는 것입니다.")
    ]
  },
  {
    id: "2-7-agent-memory",
    title: "2-7. Agent Memory",
    items: [
      item("2-7. Agent Memory", "2-7. Agent Memory"),
      item("Choosing the right scope for state that survives sessions", "session을 넘어 살아남는 state에 적절한 scope 선택하기"),
      item("The agent from the previous section runs correctly within a single session.", "이전 section의 agent는 single session 안에서는 올바르게 실행됩니다."),
      item("What it cannot do is remember anything when that session ends.", "하지만 session이 끝나면 아무것도 기억하지 못합니다."),
      item("Memory scope is how you decide what the agent should know at the start of the next session, and how much it costs to carry that knowledge forward.", "memory scope는 다음 session 시작 시 agent가 무엇을 알아야 하는지, 그리고 그 knowledge를 이어 가는 데 비용이 얼마나 드는지 결정하는 방식입니다.")
    ]
  },
  {
    id: "2-7-1-memory-patterns-and-when-each-is-right",
    title: "2-7-1. Memory patterns and when each is right",
    items: [
      item("2-7-1. Memory patterns and when each is right", "2-7-1. Memory pattern과 각각이 맞는 상황"),
      item("Beyond memory scope, the blueprint groups several agent design patterns under this objective, and you have already built each one earlier in this module.", "memory scope 외에도 blueprint는 이 objective 아래 여러 agent design pattern을 묶으며, 이 module 앞부분에서 이미 각각을 만들었습니다."),
      item("The tool-use loop, where the model calls a tool, reads the result, and continues, is the core pattern from the tool-use and agent-construction clusters.", "model이 tool을 호출하고 result를 읽고 계속 진행하는 tool-use loop는 tool-use와 agent-construction cluster의 core pattern입니다."),
      item("Multi-step task decomposition breaks a goal into ordered subtasks, and planning-and-execution separates deciding the plan from carrying it out.", "multi-step task decomposition은 goal을 ordered subtask로 나누고, planning-and-execution은 plan을 정하는 일과 실행하는 일을 분리합니다."),
      item("Memory scope, covered next, is the pattern that decides what state survives once the loop ends.", "다음에 다룰 memory scope는 loop가 끝난 뒤 어떤 state가 살아남는지 결정하는 pattern입니다."),
      item("Memory scope sets what an agent knows when a new session starts.", "memory scope는 새 session이 시작될 때 agent가 무엇을 알고 있는지 정합니다."),
      item("Too much state in-context inflates every API call, because the model re-reads the full conversation on every turn and the bill scales with session length.", "in-context state가 너무 많으면 model이 매 turn 전체 conversation을 다시 읽고 비용이 session length에 따라 늘어나므로 모든 API call이 커집니다."),
      item("Too little state in-persistent storage strips the agent of memory across sessions, because anything not written down disappears the moment the conversation ends.", "persistent storage에 state가 너무 적으면 적어 두지 않은 것은 conversation이 끝나는 순간 사라지므로 agent가 session 간 memory를 잃습니다."),
      item("Scope: In-context memory\nWhat persists: State lives in the active conversation and survives turns within a single session.\nCost: Zero retrieval overhead; inflates token cost as conversation grows.\nWhen to use: Short sessions where all the state the agent needs fits inside the context window and nothing has to carry across restarts.\nWhat you lose: Everything once the session ends. A clear command or a new session wipes the state.", "Scope: In-context memory\nWhat persists: state는 active conversation 안에 있고 single session 내 turn 사이에서 유지됩니다.\nCost: retrieval overhead는 없지만 conversation이 커질수록 token cost가 증가합니다.\nWhen to use: agent가 필요한 모든 state가 context window에 들어가고 restart 이후로 가져갈 것이 없는 short session에 사용합니다.\nWhat you lose: session이 끝나면 모든 것을 잃습니다. clear command나 new session이 state를 지웁니다."),
      item("Scope: External storage\nWhat persists: State is written to a database and read back at session start or on demand.\nCost: Each database call adds retrieval latency, and you take on the engineering work of read and write logic.\nWhen to use: State that has to survive across sessions, move between users, or be shared across multiple agent instances.\nWhat you lose: Nothing on the persistence side. The cost shows up as latency on every call and ongoing implementation complexity.", "Scope: External storage\nWhat persists: state를 database에 쓰고 session 시작 시 또는 필요할 때 다시 읽습니다.\nCost: 각 database call은 retrieval latency를 추가하고 read/write logic의 engineering work를 맡게 됩니다.\nWhen to use: session을 넘어 살아남거나 user 간 이동하거나 여러 agent instance 사이에서 공유되어야 하는 state에 사용합니다.\nWhat you lose: persistence 측면에서는 잃는 것이 없습니다. 비용은 call마다 latency와 ongoing implementation complexity로 나타납니다."),
      item("Scope: Summarized memory\nWhat persists: A condensed version of prior conversation is generated and injected at the start of the next session.\nCost: Lower token cost per session than replaying full history, but the summarization step drops detail that was in the original.\nWhen to use: Long-running conversational agents where the full history would outgrow the context budget before the conversation is done.\nWhat you lose: Any detail the summarizer did not preserve. The agent only sees what the summarization prompt chose to keep.", "Scope: Summarized memory\nWhat persists: 이전 conversation의 condensed version을 생성해 다음 session 시작 시 주입합니다.\nCost: full history를 replay하는 것보다 session당 token cost는 낮지만 summarization step에서 원본 detail이 빠집니다.\nWhen to use: conversation이 끝나기 전에 full history가 context budget을 넘을 long-running conversational agent에 사용합니다.\nWhat you lose: summarizer가 보존하지 않은 모든 detail을 잃습니다. agent는 summarization prompt가 남기기로 한 것만 봅니다."),
      item("Scope: No persistent memory (stateless)\nWhat persists: Nothing. Each session is independent.\nCost: No overhead at all, since there is nothing to retrieve or store.\nWhen to use: Task-execution agents that finish and close out, or pipelines where every session is fully independent by design.\nWhat you lose: All prior context. If a follow-up depends on something from an earlier session, the agent has no way to reach it.", "Scope: No persistent memory (stateless)\nWhat persists: 아무것도 유지되지 않습니다. 각 session은 independent합니다.\nCost: retrieve하거나 store할 것이 없으므로 overhead가 전혀 없습니다.\nWhen to use: finish and close out하는 task-execution agent나 모든 session이 설계상 완전히 independent한 pipeline에 사용합니다.\nWhat you lose: 모든 prior context를 잃습니다. follow-up이 이전 session의 무언가에 의존하면 agent는 접근할 방법이 없습니다.")
    ]
  },
  {
    id: "2-7-2-choosing-a-memory-scope-at-agent-design-time",
    title: "2-7-2. Choosing a memory scope at agent design time",
    items: [
      item("2-7-2. Choosing a memory scope at agent design time", "2-7-2. Agent design time에 memory scope 선택하기"),
      item("The choice of how an agent remembers prior interactions belongs in the design phase, not the production refactor.", "agent가 prior interaction을 어떻게 기억할지에 대한 선택은 production refactor가 아니라 design phase에 속합니다."),
      item("An agent that helps the same user across multiple days needs to carry state between sessions.", "여러 날에 걸쳐 같은 user를 돕는 agent는 session 사이에 state를 carry해야 합니다."),
      item("An agent that receives a single job, completes it, and closes it out has no prior session to recall, so it runs stateless.", "single job을 받고 완료한 뒤 close out하는 agent는 recall할 prior session이 없으므로 stateless로 실행됩니다."),
      item("The default path looks reasonable at first. You store the full conversation history in the messages array, send it on every API call, and the prototype works.", "default path는 처음엔 합리적으로 보입니다. full conversation history를 messages array에 저장하고 모든 API call에 보내면 prototype은 작동합니다."),
      item("The trouble starts further in, when token cost scales with every additional turn, latency climbs as the context window fills, and eventually a long session hits the hard limit and the agent stops responding.", "문제는 나중에 시작됩니다. turn이 추가될 때마다 token cost가 늘고, context window가 차면서 latency가 오르며, 결국 긴 session이 hard limit에 닿아 agent가 응답을 멈춥니다."),
      item("At that point, you need to refactor: pull conversation state out of the live context, put it in external storage, and add only what each turn needs.", "그 시점에는 refactor가 필요합니다. conversation state를 live context 밖으로 꺼내 external storage에 넣고 각 turn에 필요한 것만 추가해야 합니다."),
      item("Making the call during design phase is cheap, while doing it when it's time to refactor is more expensive.", "design phase에서 결정하는 것은 저렴하지만, refactor 시점에 하는 것은 더 비쌉니다."),
      item("Handles well: The memory scope matches the task at design time.", "Handles well: design time에 memory scope가 task와 맞을 때 잘 작동합니다."),
      item("Use external storage when the agent continues a thread across sessions. Use stateless when each job is self-contained. Use in-context when the session is short and does not need to survive a restart.", "agent가 session을 넘어 thread를 이어가면 external storage를 사용하세요. 각 job이 self-contained이면 stateless를 사용하세요. session이 짧고 restart 이후 유지할 필요가 없으면 in-context를 사용하세요."),
      item("Adds cost or complexity: External storage adds retrieval latency and the read/write logic that goes with it.", "Adds cost or complexity: external storage는 retrieval latency와 그에 따르는 read/write logic을 추가합니다."),
      item("Summarized memory depends on a well-specified summarizer prompt; without one, task-critical state gets dropped on every compression.", "summarized memory는 well-specified summarizer prompt에 의존합니다. 그것이 없으면 compression마다 task-critical state가 빠집니다."),
      item("Use a different approach: Holding all state in-context on the assumption that the window will be large enough.", "Use a different approach: window가 충분히 클 것이라는 가정으로 모든 state를 in-context에 붙잡아 두는 방식은 피하세요."),
      item("Token cost grows with every additional turn because the full context is sent on each API call.", "full context가 각 API call마다 전송되므로 token cost는 turn이 추가될 때마다 증가합니다."),
      item("Measure actual session token usage against the window limit before committing.", "결정하기 전에 실제 session token usage를 window limit과 비교해 측정하세요.")
    ]
  },
  {
    id: "2-7-3-skills-reusable-instruction-sets-that-load-on-demand-without-inflating-every-session",
    title: "2-7-3. Skills: reusable instruction sets that load on demand without inflating every session",
    items: [
      item("2-7-3. Skills: reusable instruction sets that load on demand without inflating every session", "2-7-3. Skills: 모든 session을 키우지 않고 필요할 때 load되는 reusable instruction set"),
      item("The memory scope table above covers how an agent carries state across sessions.", "위 memory scope table은 agent가 session 간 state를 어떻게 carry하는지 다룹니다."),
      item("There is a related but distinct problem: how you carry repeatable instructions across tasks without paying to inject them into every session.", "관련 있지만 별개의 문제가 있습니다. repeatable instruction을 모든 session에 주입하는 비용 없이 task 간에 어떻게 carry할 것인가입니다."),
      item("The pattern for that is a Skill, a reusable markdown file that teaches Claude how to handle a specific kind of task once.", "그 pattern은 Skill입니다. Claude에게 특정 종류의 task를 처리하는 법을 한 번 가르치는 reusable markdown file입니다."),
      item("Claude loads the Skill automatically when a request matches its description.", "request가 description과 match되면 Claude가 Skill을 자동으로 load합니다."),
      item("The instructions sit on disk until they are needed; they are not resident in every conversation.", "instruction은 필요할 때까지 disk에 머물며 모든 conversation에 상주하지 않습니다."),
      item("A Skill lives in a SKILL.md file inside an identified directory.", "Skill은 identified directory 안의 SKILL.md file에 있습니다."),
      item("The file has two parts: a frontmatter block with a name and a description, and the instructions below it.", "file은 두 부분으로 구성됩니다. name과 description을 가진 frontmatter block, 그리고 그 아래의 instruction입니다."),
      item("The description is the matching criterion.", "description이 matching criterion입니다."),
      item("When you send a request, Claude reads the name and description of every available Skill, compares them against your message, and loads the full instructions only when there is a match.", "request를 보내면 Claude는 available Skill의 name과 description을 읽고 message와 비교한 뒤 match가 있을 때만 full instruction을 load합니다."),
      item("If the instructions are not relevant to the current request, they never enter the context window.", "instruction이 current request와 관련 없으면 context window에 들어가지 않습니다."),
      item("In-context memory is always present and grows with every turn.", "in-context memory는 항상 존재하며 turn마다 커집니다."),
      item("CLAUDE.md behavior depends on where you are running Claude Code.", "CLAUDE.md behavior는 Claude Code를 어디에서 실행하는지에 따라 달라집니다."),
      item("In the Claude Code CLI, a CLAUDE.md file loads into every session regardless of what task is running.", "Claude Code CLI에서는 어떤 task가 실행되든 CLAUDE.md file이 모든 session에 load됩니다."),
      item("In the Agent SDK, whether filesystem settings including CLAUDE.md load is controlled by the settingSources configuration.", "Agent SDK에서는 CLAUDE.md를 포함한 filesystem setting이 load되는지가 settingSources configuration으로 제어됩니다."),
      item("A Skill, by contrast, loads only when the task calls for it, in both environments.", "반면 Skill은 두 environment 모두에서 task가 요구할 때만 load됩니다."),
      item("Pattern: Skill (SKILL.md)\nWhen it loads: On demand when the request matches the skill's description.\nContext cost: Low. Only the name and description load at startup; full content loads only on match.\nBest for: Task-specific expertise that should not inflate sessions where it is not needed.", "Pattern: Skill (SKILL.md)\nWhen it loads: request가 skill description과 match될 때 on demand로 load됩니다.\nContext cost: 낮습니다. startup에는 name과 description만 load되고 full content는 match될 때만 load됩니다.\nBest for: 필요하지 않은 session을 키우지 않아야 하는 task-specific expertise에 적합합니다."),
      item("Pattern: CLAUDE.md\nWhen it loads: Every session, unconditionally.\nContext cost: Fixed overhead per session regardless of task.\nBest for: Always-on project standards that apply to everything.", "Pattern: CLAUDE.md\nWhen it loads: 모든 session에 unconditionally load됩니다.\nContext cost: task와 상관없이 session마다 fixed overhead가 있습니다.\nBest for: 모든 것에 적용되는 always-on project standard에 적합합니다."),
      item("Pattern: In-context instructions\nWhen it loads: Present for every turn within that session.\nContext cost: Grows with session length; does not survive session end.\nBest for: Short sessions where the full history fits within the window and nothing needs to persist.", "Pattern: In-context instructions\nWhen it loads: 해당 session 안의 모든 turn에 존재합니다.\nContext cost: session length와 함께 증가하며 session end 후에는 남지 않습니다.\nBest for: full history가 window에 들어가고 persist할 필요가 없는 short session에 적합합니다.")
    ]
  },
  {
    id: "2-7-4-current-availability-skills-on-the-messages-api",
    title: "2-7-4. Current availability: Skills on the Messages API",
    items: [
      item("2-7-4. Current availability: Skills on the Messages API", "2-7-4. Current availability: Messages API에서의 Skills"),
      item("Skills are available on the Messages API today, but the integration is in beta and the configuration is not the same as the Claude Code or Agent SDK paths.", "Skills는 현재 Messages API에서 사용할 수 있지만 integration은 beta이고 configuration은 Claude Code나 Agent SDK path와 같지 않습니다."),
      item("Two beta headers are required on the API request: code-execution-2025-08-25 and skills-2025-10-02.", "API request에는 두 beta header가 필요합니다. code-execution-2025-08-25와 skills-2025-10-02입니다."),
      item("Skills invoked this way run inside the code execution container rather than in the calling application's environment, which has implications for what tools and filesystem access the Skill can rely on.", "이 방식으로 invoke된 Skill은 calling application environment가 아니라 code execution container 안에서 실행되므로, Skill이 의존할 수 있는 tool과 filesystem access에 영향이 있습니다."),
      item("Beta headers are versioned and change as features move toward general availability.", "beta header는 versioned되어 있으며 feature가 general availability로 이동하면서 바뀔 수 있습니다."),
      item("Before building against this configuration in production, check the current Anthropic API documentation to confirm the header values, whether the feature has reached general availability, and whether the code execution container is still the runtime path.", "production에서 이 configuration을 기준으로 build하기 전에 current Anthropic API documentation에서 header value, feature가 general availability에 도달했는지, code execution container가 여전히 runtime path인지 확인하세요."),
      item("One important constraint: Subagents do not automatically inherit Skills from the parent session.", "중요한 constraint 하나는 subagent가 parent session의 Skill을 자동으로 inherit하지 않는다는 점입니다."),
      item("When you delegate a task to a subagent, it starts with a clean context.", "subagent에 task를 delegate하면 clean context에서 시작합니다."),
      item("Note that while Skills and conversation history do not carry over, subagents do inherit the permission context from the parent session; permission scope is not reset at delegation.", "Skill과 conversation history는 carry over되지 않지만, subagent는 parent session의 permission context를 inherit합니다. permission scope는 delegation에서 reset되지 않습니다."),
      item("If the subagent needs a Skill, you must explicitly list it in the subagent's configuration.", "subagent에 Skill이 필요하다면 subagent configuration에 명시적으로 list해야 합니다."),
      item("This matters at agent design time: if you are wiring a subagent to perform a task that depends on specific instructions, those instructions need to be registered against the subagent, not assumed to carry over from the parent.", "이는 agent design time에 중요합니다. specific instruction에 의존하는 task를 수행하도록 subagent를 wiring한다면, 그 instruction은 parent에서 carry over된다고 가정하지 말고 subagent에 등록해야 합니다.")
    ]
  },
  {
    id: "2-8-multimodal-and-batch-ingestion",
    title: "2-8. Multimodal and Batch Ingestion",
    items: [
      item("2-8. Multimodal and Batch Ingestion", "2-8. Multimodal and Batch Ingestion"),
      item("Images, PDFs, and high-volume processing", "image, PDF, high-volume processing"),
      item("Up to now you've been managing what Claude remembers between turns.", "지금까지는 Claude가 turn 사이에서 무엇을 기억하는지를 관리했습니다."),
      item("Multimodal ingestion shifts the question to what you're sending in: every image and PDF consumes context budget before Claude reads a single character of your prompt, which changes how you structure requests and what you can fit in one.", "multimodal ingestion은 질문을 무엇을 보내는가로 옮깁니다. 모든 image와 PDF는 Claude가 prompt의 한 글자를 읽기 전에 context budget을 소비하며, 이는 request structure와 한 번에 넣을 수 있는 양을 바꿉니다."),
      item("When you have thousands of inputs to process, sending one request at a time and waiting for each response stops making sense.", "처리할 input이 수천 개라면 request를 하나씩 보내고 각 response를 기다리는 방식은 더 이상 적절하지 않습니다."),
      item("The Batch API is how you handle that volume without blocking your application.", "Batch API는 application을 block하지 않고 그 volume을 처리하는 방법입니다.")
    ]
  },
  {
    id: "2-8-1-image-token-cost-calculate-before-you-commit",
    title: "2-8-1. Image token cost: Calculate before you commit",
    items: [
      item("2-8-1. Image token cost: Calculate before you commit", "2-8-1. Image token cost: 결정하기 전에 계산하세요"),
      item("Images are not free in terms of context budget.", "image는 context budget 측면에서 무료가 아닙니다."),
      item("Claude views images in patches: each 28×28-pixel block of the image is one visual token, so an image costs ⌈width / 28⌉ × ⌈height / 28⌉ visual tokens.", "Claude는 image를 patch로 봅니다. image의 각 28×28 pixel block이 visual token 하나이므로 image cost는 ⌈width / 28⌉ × ⌈height / 28⌉ visual token입니다."),
      item("A 1,000 × 1,000 pixel image is ⌈1000/28⌉ × ⌈1000/28⌉ = 36 × 36 patches, about 1,296 visual tokens.", "1,000 × 1,000 pixel image는 ⌈1000/28⌉ × ⌈1000/28⌉ = 36 × 36 patch, 약 1,296 visual token입니다."),
      item("At that rate, ten high-resolution screenshots consume as much context as a detailed system prompt.", "그 정도라면 high-resolution screenshot 10장은 detailed system prompt만큼의 context를 소비합니다."),
      item("Each model also has a maximum native image resolution, expressed as a long-edge limit and a visual-token limit, and these limits differ by model tier.", "각 model에는 long-edge limit과 visual-token limit으로 표현되는 maximum native image resolution이 있으며, 이 limit은 model tier마다 다릅니다."),
      item("The newest models accept substantially larger images than the standard tier.", "newest model은 standard tier보다 훨씬 큰 image를 받습니다."),
      item("Images larger than either limit are downscaled before processing, so the formula runs on the scaled dimensions.", "둘 중 하나의 limit보다 큰 image는 processing 전에 downscale되므로 formula는 scaled dimension에 적용됩니다."),
      item("Confirm the current per-tier limits against the Vision page (Resolution and token cost) at build time; the limits have changed between model generations and will again.", "build time에 Vision page의 Resolution and token cost를 기준으로 current per-tier limit을 확인하세요. limit은 model generation 사이에 바뀌었고 앞으로도 바뀔 수 있습니다."),
      item("The calculation matters at design time.", "이 계산은 design time에 중요합니다."),
      item("If you are building a pipeline that processes images, measure the token cost of a typical production image against your model's context limit before you write the ingestion code.", "image를 처리하는 pipeline을 만든다면 ingestion code를 작성하기 전에 typical production image의 token cost를 model context limit과 비교해 측정하세요."),
      item("The fix for an over-budget pipeline is often a ten-minute image resize step.", "over-budget pipeline의 해결책은 종종 10분짜리 image resize step입니다."),
      item("If you discover this after deployment, it takes even longer.", "deployment 후에 발견하면 더 오래 걸립니다.")
    ]
  },
  {
    id: "2-8-2-different-ways-to-send-an-image-when-each-is-right",
    title: "2-8-2. Different ways to send an image: When each is right",
    items: [
      item("2-8-2. Different ways to send an image: When each is right", "2-8-2. Image를 보내는 여러 방식: 각각이 맞는 상황"),
      item("Inline base64", "Inline base64"),
      item("How it works: Encode the image bytes as a base64 string and include the data directly in the message block.", "How it works: image byte를 base64 string으로 encode하고 data를 message block에 직접 포함합니다."),
      item("Overhead: The full encoded payload travels with every request, which inflates request size and counts against latency on large images.", "Overhead: full encoded payload가 모든 request와 함께 이동하므로 request size가 커지고 large image에서는 latency에 영향을 줍니다."),
      item("When to use: Best for one-off images where adding an upload step would add complexity without a payoff.", "When to use: upload step을 추가해도 이득 없이 complexity만 늘어나는 one-off image에 가장 적합합니다."),
      item("The same image sent repeatedly multiplies the cost, so reach for a different method if reuse is likely.", "같은 image를 반복해서 보내면 cost가 배가되므로 reuse 가능성이 있다면 다른 method를 선택하세요."),
      item("URL reference", "URL reference"),
      item("How it works: Pass a publicly reachable URL in the source block, and Claude fetches the image at request time.", "How it works: source block에 publicly reachable URL을 전달하면 Claude가 request time에 image를 가져옵니다."),
      item("Overhead: No payload travels with the request, but you take on the dependency that the URL must be stable, public, and reachable at the moment Claude tries to fetch it.", "Overhead: payload는 request와 함께 이동하지 않지만, Claude가 fetch하려는 순간 URL이 stable, public, reachable해야 한다는 dependency를 맡게 됩니다."),
      item("When to use: Best when the image is already hosted at a stable public URL you control.", "When to use: image가 이미 직접 control하는 stable public URL에 hosted되어 있을 때 가장 적합합니다."),
      item("Skip it for anything behind auth, anything signed with a short expiry, or anything you can't guarantee will be reachable when the request runs.", "auth 뒤에 있거나 short expiry로 signed되었거나 request 실행 시 reachable하다고 보장할 수 없는 경우에는 피하세요."),
      item("Files API", "Files API"),
      item("How it works: Upload the file once through a separate API call, receive a file_id, and reference that ID in any future message.", "How it works: separate API call로 file을 한 번 upload하고 file_id를 받은 뒤 이후 message에서 그 ID를 참조합니다."),
      item("Overhead: The upload is a one-time cost; every later request carries the ID instead of the bytes, so payload overhead drops to near-zero from that point on.", "Overhead: upload는 one-time cost입니다. 이후 모든 request는 byte 대신 ID를 carry하므로 그 시점부터 payload overhead가 거의 0으로 떨어집니다."),
      item("Currently in beta and not available on Bedrock or Vertex AI; verify availability for your deployment platform.", "현재 beta이며 Bedrock 또는 Vertex AI에서는 사용할 수 없습니다. deployment platform에서 availability를 확인하세요."),
      item("When to use: Best when the same image or PDF appears across multiple requests, or when the asset is large enough that re-sending it would dominate request size.", "When to use: 같은 image나 PDF가 multiple request에 나타나거나 asset이 커서 다시 보내는 것이 request size를 지배할 때 가장 적합합니다."),
      item("Also, the cleanest choice when you want asset management to live separately from inference calls, and the right choice for images that appear across multiple conversation turns, since the file_id carries no payload weight as history grows.", "또한 asset management를 inference call과 분리하고 싶을 때 가장 깔끔한 선택이며, file_id는 history가 커져도 payload weight를 갖지 않으므로 multiple conversation turn에 걸쳐 등장하는 image에 적합합니다.")
    ]
  },
  {
    id: "2-8-3-sending-pdfs-the-document-block",
    title: "2-8-3. Sending PDFs: The document block",
    items: [
      item("2-8-3. Sending PDFs: The document block", "2-8-3. PDF 보내기: document block"),
      item("For PDFs, the block type is document rather than image.", "PDF의 경우 block type은 image가 아니라 document입니다."),
      item("The source structure follows the same pattern as images, which means it can be base64, a URL, or a Files API file_id.", "source structure는 image와 같은 pattern을 따르므로 base64, URL, 또는 Files API file_id가 될 수 있습니다."),
      item("There is no required name field on a document block.", "document block에는 required name field가 없습니다."),
      item("The block accepts an optional title field for a readable document name, and an optional context field for additional metadata, but neither is required to send a PDF.", "block은 readable document name을 위한 optional title field와 추가 metadata를 위한 optional context field를 받지만, PDF를 보내는 데 둘 다 필수는 아닙니다."),
      item("All other mechanics, including token cost considerations and Files API reuse, apply in the same way.", "token cost 고려와 Files API reuse를 포함한 다른 모든 mechanism은 같은 방식으로 적용됩니다."),
      item("{\n  \"type\": \"document\",\n  \"source\": {\n    \"type\": \"base64\",\n    \"media_type\": \"application/pdf\",\n    \"data\": \"<base64-encoded-pdf-bytes>\"\n  },\n  \"title\": \"contract_review.pdf\"\n}", "{\n  \"type\": \"document\",\n  \"source\": {\n    \"type\": \"base64\",\n    \"media_type\": \"application/pdf\",\n    \"data\": \"<base64-encoded-pdf-bytes>\"\n  },\n  \"title\": \"contract_review.pdf\"\n}")
    ]
  },
  {
    id: "2-8-4-applying-prompting-techniques-to-multimodal-inputs",
    title: "2-8-4. Applying prompting techniques to multimodal inputs",
    items: [
      item("2-8-4. Applying prompting techniques to multimodal inputs", "2-8-4. Multimodal input에 prompting technique 적용하기"),
      item("The same prompting techniques from the first section apply to image and PDF analysis.", "첫 section의 같은 prompting technique이 image와 PDF analysis에도 적용됩니다."),
      item("A bare \"describe this image\" prompt produces shallow output for the same reason a bare text prompt does as Claude has no target structure to aim for.", "bare \"describe this image\" prompt는 bare text prompt와 같은 이유로 shallow output을 만듭니다. Claude가 목표로 삼을 target structure가 없기 때문입니다."),
      item("The difference is that images carry ambiguity that text cannot, which includes overlapping objects, depth and spatial relationships, and partial occlusion.", "차이는 image가 text에는 없는 ambiguity를 가진다는 점입니다. 여기에는 overlapping object, depth와 spatial relationship, partial occlusion이 포함됩니다."),
      item("A prompt for visual analysis should name how Claude should handle each type of ambiguity.", "visual analysis prompt는 Claude가 각 ambiguity type을 어떻게 처리해야 하는지 명시해야 합니다."),
      item("\"If objects overlap, describe each separately and note the overlap\" is a concrete constraint that a text-only prompt would never need.", "\"If objects overlap, describe each separately and note the overlap\"은 text-only prompt라면 필요하지 않을 concrete constraint입니다.")
    ]
  },
  {
    id: "2-8-5-the-message-batches-api-high-volume-asynchronous-processing",
    title: "2-8-5. The Message Batches API: High-volume asynchronous processing",
    items: [
      item("2-8-5. The Message Batches API: High-volume asynchronous processing", "2-8-5. Message Batches API: high-volume asynchronous processing"),
      item("When you need to run the same prompt pattern against hundreds or thousands of inputs, the synchronous API is the wrong model.", "수백 또는 수천 개의 input에 같은 prompt pattern을 실행해야 한다면 synchronous API는 잘못된 model입니다."),
      item("Each synchronous call blocks until complete.", "각 synchronous call은 완료될 때까지 block됩니다."),
      item("At scale, that means your application is either burning threads or running thousands of concurrent connections against rate limits.", "scale이 커지면 application이 thread를 소모하거나 rate limit을 상대로 수천 개의 concurrent connection을 실행하게 됩니다."),
      item("The Message Batches API accepts up to 100,000 or 256 MB requests (whichever comes first) in a single batch call.", "Message Batches API는 single batch call에서 최대 100,000개 또는 256 MB request 중 먼저 도달하는 한도까지 받습니다."),
      item("You submit the batch, receive a batch_id, and poll for completion.", "batch를 submit하고 batch_id를 받은 뒤 completion을 poll합니다."),
      item("When the batch finishes, you download the results.", "batch가 끝나면 result를 download합니다."),
      item("The per-token cost for batch requests is lower than for synchronous ones.", "batch request의 per-token cost는 synchronous request보다 낮습니다."),
      item("The tradeoff is latency: batch processing is non-deterministic and can take up to 24 hours, often much faster.", "tradeoff는 latency입니다. batch processing은 non-deterministic하며 최대 24시간이 걸릴 수 있지만, 보통은 훨씬 빠릅니다."),
      item("The pattern suits offline pipelines, evaluation runs, and data processing jobs, not real-time user interactions.", "이 pattern은 real-time user interaction이 아니라 offline pipeline, evaluation run, data processing job에 적합합니다."),
      item("Use case: A user uploads a photo and expects an immediate classification.\nRight API pattern: Synchronous API.\nWhy: Real-time response is required. Batch latency is unacceptable for interactive use.", "Use case: user가 photo를 upload하고 immediate classification을 기대합니다.\nRight API pattern: Synchronous API.\nWhy: real-time response가 필요합니다. interactive use에는 batch latency를 허용할 수 없습니다."),
      item("Use case: A nightly pipeline classifies 5,000 customer records.\nRight API pattern: Message Batches API.\nWhy: Latency is not a constraint. Batch cost reduction and asynchronous processing are both valuable.", "Use case: nightly pipeline이 5,000개 customer record를 classify합니다.\nRight API pattern: Message Batches API.\nWhy: latency가 constraint가 아닙니다. batch cost reduction과 asynchronous processing이 모두 가치 있습니다."),
      item("Use case: An evaluation run tests a new prompt against 2,000 examples.\nRight API pattern: Message Batches API.\nWhy: Offline task with no real-time requirement. Batch is the correct pattern.", "Use case: evaluation run이 2,000개 example에 대해 new prompt를 test합니다.\nRight API pattern: Message Batches API.\nWhy: real-time requirement가 없는 offline task입니다. Batch가 올바른 pattern입니다."),
      item("Use case: A chatbot generates a reply to a user's message.\nRight API pattern: Synchronous API.\nWhy: The user is waiting; batch would introduce unacceptable delay.", "Use case: chatbot이 user message에 대한 reply를 생성합니다.\nRight API pattern: Synchronous API.\nWhy: user가 기다리고 있으므로 batch는 허용할 수 없는 delay를 만듭니다.")
    ]
  },
  {
    id: "2-8-6-when-multimodal-and-batch-fit-together-and-when-they-dont",
    title: "2-8-6. When multimodal and batch fit together, and when they don't",
    items: [
      item("2-8-6. When multimodal and batch fit together, and when they don't", "2-8-6. Multimodal과 batch가 잘 맞는 때와 그렇지 않은 때"),
      item("The combination works for offline workloads that reuse the same assets and need structured output across thousands of inputs.", "이 조합은 같은 asset을 reuse하고 수천 개 input에 걸쳐 structured output이 필요한 offline workload에 잘 맞습니다."),
      item("A nightly pipeline classifying images against a fixed taxonomy is the textbook case: Files API removes redundant uploads, Batches API absorbs the latency, structured-output techniques keep results machine-readable.", "fixed taxonomy에 따라 image를 classify하는 nightly pipeline이 대표적인 case입니다. Files API는 redundant upload를 제거하고, Batches API는 latency를 흡수하며, structured-output technique은 result를 machine-readable하게 유지합니다."),
      item("Two failure modes break the fit.", "두 가지 failure mode가 이 fit을 깨뜨립니다."),
      item("The first is misreading latency: reaching for batch in any user-facing flow with an image produces a system that passes tests and fails in production, because the user is waiting and the batch isn't.", "첫 번째는 latency를 잘못 읽는 것입니다. image가 포함된 user-facing flow에서 batch를 사용하면 test는 통과하지만 production에서 실패하는 system이 됩니다. user는 기다리고 있지만 batch는 그렇지 않기 때문입니다."),
      item("The second is underestimating context cost: images and PDFs consume budget before Claude processes any text, so pipelines loading multiple large images per request blow past token limits at scale.", "두 번째는 context cost를 과소평가하는 것입니다. image와 PDF는 Claude가 text를 처리하기 전에 budget을 소비하므로 request마다 여러 large image를 load하는 pipeline은 scale에서 token limit을 넘습니다."),
      item("Measure token cost on production-scale inputs before you build.", "build하기 전에 production-scale input에서 token cost를 측정하세요.")
    ]
  }
];
