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

1. System prompts carry the behavioral contract for the whole session. Write them once and treat them as your persistent instruction layer. They define Claude's role, the output format, and any rules that must not change between conversations.
2. XML tags are used when the prompt mixes inputs with instructions. A prompt that asks Claude to debug code using provided documentation is a good example; without tags, the code and the documentation look the same to Claude. Wrap them with descriptive tag names like <my_code> and <docs> and the boundary becomes unambiguous. You do not need to use official XML tag names; descriptive names that match your content work best.
3. Few-shot examples are considered useful because they show rather than just tell. Instead of trying to describe the exact format you want, you provide one correct input-output pair and let Claude infer the pattern. To use this, wrap examples using consistent XML structure, for instance <sample_input> and <ideal_output>, so the boundary between example and prompt is clear. You can use some examples from your highest-scoring evaluation outputs rather than writing them from scratch.
4. Output constraints are the last line of defense before Claude's response reaches your parser. You should specify exactly what you need, including field names, types, length limits, whether to include preamble, and what to do when data is absent. Use structured output features in cases when the format must be machine-readable.

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
      item("1. System prompts carry the behavioral contract for the whole session.", "1. 시스템 프롬프트는 전체 세션의 행동 계약을 담습니다."),
      item("Write them once and treat them as your persistent instruction layer.", "한 번 작성한 뒤 지속적인 지시 계층으로 다루세요."),
      item("They define Claude's role, the output format, and any rules that must not change between conversations.", "그것들은 Claude의 역할, 출력 형식, 그리고 대화 사이에서도 바뀌면 안 되는 규칙을 정의합니다."),
      item("2. XML tags are used when the prompt mixes inputs with instructions.", "2. XML 태그는 프롬프트가 입력과 지시를 섞을 때 사용됩니다."),
      item("A prompt that asks Claude to debug code using provided documentation is a good example; without tags, the code and the documentation look the same to Claude.", "제공된 문서를 사용해 Claude에게 코드를 디버그하라고 요청하는 프롬프트가 좋은 예입니다. 태그가 없으면 코드와 문서가 Claude에게 똑같이 보입니다."),
      item("Wrap them with descriptive tag names like <my_code> and <docs> and the boundary becomes unambiguous.", "<my_code>와 <docs> 같은 설명적인 태그 이름으로 감싸면 경계가 명확해집니다."),
      item("You do not need to use official XML tag names; descriptive names that match your content work best.", "공식 XML 태그 이름을 사용할 필요는 없습니다. 내용에 맞는 설명적인 이름이 가장 잘 작동합니다."),
      item("3. Few-shot examples are considered useful because they show rather than just tell.", "3. 퓨샷 예시는 말로 설명하는 데 그치지 않고 직접 보여 주기 때문에 유용합니다."),
      item("Instead of trying to describe the exact format you want, you provide one correct input-output pair and let Claude infer the pattern.", "원하는 정확한 형식을 설명하려고 하기보다, 올바른 입력-출력 쌍 하나를 제공하고 Claude가 패턴을 추론하게 합니다."),
      item("To use this, wrap examples using consistent XML structure, for instance <sample_input> and <ideal_output>, so the boundary between example and prompt is clear.", "이를 사용하려면 <sample_input>과 <ideal_output>처럼 일관된 XML 구조로 예시를 감싸서 예시와 프롬프트 사이의 경계를 명확히 하세요."),
      item("You can use some examples from your highest-scoring evaluation outputs rather than writing them from scratch.", "처음부터 새로 쓰기보다 가장 높은 점수를 받은 evaluation output에서 일부 예시를 사용할 수 있습니다."),
      item("4. Output constraints are the last line of defense before Claude's response reaches your parser.", "4. 출력 제약 조건은 Claude의 응답이 parser에 도달하기 전 마지막 방어선입니다."),
      item("You should specify exactly what you need, including field names, types, length limits, whether to include preamble, and what to do when data is absent.", "필드 이름, 타입, 길이 제한, preamble 포함 여부, 데이터가 없을 때 무엇을 할지 등 필요한 것을 정확히 지정해야 합니다."),
      item("Use structured output features in cases when the format must be machine-readable.", "형식이 반드시 기계가 읽을 수 있어야 하는 경우에는 structured output 기능을 사용하세요.")
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
  }
];
