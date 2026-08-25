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
* It does not combine with message prefilling. JSON outputs and prefilling the assistant message are incompatible, so a pattern that starts the response for Claude and a pattern that constrains the whole response to a schema cannot run on the same request. Pick the one that fits the task.`;

export const quizSections: QuizSection[] = [
  {
    id: "prompting-craft",
    title: "2-1. Prompting Craft",
    items: [
      item("2. Production-Grade Prompting, Agents & Tool Use", "2. 프로덕션 수준의 프롬프팅, 에이전트 및 도구 사용"),
      item("2-1. Prompting Craft", "2-1. 프롬프팅 기법"),
      item("System prompts, XML, few-shot, and output constraints", "시스템 프롬프트, XML, 퓨샷, 그리고 출력 제약 조건")
    ]
  },
  {
    id: "reliable-output-shape",
    title: "2-1-1. Four techniques",
    items: [
      item("2-1-1. Four techniques that give Claude a reliable output shape", "2-1-1. Claude가 안정적인 출력 형태를 갖도록 해 주는 네 가지 기법"),
      item("When a first-pass response misses, the instinct is often to add more words to the prompt and run it again.", "첫 번째 응답이 빗나가면, 보통 프롬프트에 말을 더 많이 덧붙이고 다시 실행하고 싶어집니다."),
      item("However, that instinct can make the problem harder to isolate and rarely fixes it.", "하지만 그런 직감은 문제를 분리해서 파악하기 더 어렵게 만들 수 있으며, 실제로 문제를 해결하는 경우도 드뭅니다."),
      item("Rewording changes how you say something but does not add to the structural piece of the prompt that's missing.", "표현을 바꾸는 것은 말하는 방식을 바꿀 뿐, 프롬프트에서 빠져 있는 구조적 요소를 추가해 주지는 않습니다."),
      item("The failure mode tells you which of the four techniques is absent.", "실패 양상은 네 가지 기법 중 무엇이 빠져 있는지를 알려 줍니다."),
      item("What you observed: The result comes back in the wrong shape: a sentence where you expected a label, prose where you expected JSON.", "관찰한 현상: 결과가 잘못된 형태로 돌아옵니다. 라벨을 기대한 곳에는 문장이, JSON을 기대한 곳에는 일반 문단이 나옵니다."),
      item("What the prompt is missing: An output constraint.", "프롬프트에 빠진 것: 출력 제약 조건입니다."),
      item("What the prompt is missing: A system prompt, or a more specific one.", "프롬프트에 빠진 것: 시스템 프롬프트, 또는 더 구체적인 시스템 프롬프트입니다."),
      item("What the prompt is missing: Few-shot examples.", "프롬프트에 빠진 것: 퓨샷 예시입니다."),
      item("What the prompt is missing: A constraint covering the variant.", "프롬프트에 빠진 것: 변형 입력을 다루는 제약 조건입니다.")
    ]
  },
  {
    id: "classification-shape",
    title: "2-1-2. Classification shape",
    items: [
      item("2-1-2. Diagnosing a classification prompt that returns the wrong output shape", "2-1-2. 잘못된 출력 형태를 반환하는 분류 프롬프트 진단하기"),
      item("The rule is simple: name the failure, add the one technique that matches it, and re-run it.", "규칙은 간단합니다. 실패를 이름 붙이고, 그 실패에 맞는 하나의 기법을 추가한 뒤 다시 실행하세요."),
      item("Worked example: a classification prompt before and after", "작업 예시: 분류 프롬프트의 수정 전과 수정 후"),
      item("A developer needs Claude to classify support tickets into three categories: billing, technical, and escalation.", "한 개발자는 Claude가 지원 티켓을 billing, technical, escalation 세 가지 카테고리로 분류하기를 원합니다."),
      item("The first prompt is a bare instruction with no constraint on the output:", "첫 번째 프롬프트는 출력에 대한 제약이 없는 단순한 지시문입니다."),
      item("Claude returns \"Billing\" on some runs, \"billing\" on others, and occasionally a full sentence like \"This looks like a billing issue.\"", "Claude는 어떤 실행에서는 \"Billing\"을, 다른 실행에서는 \"billing\"을 반환하고, 가끔은 \"이것은 billing 문제처럼 보입니다.\" 같은 완전한 문장을 반환합니다."),
      item("The downstream router expects one of a fixed set of labels and breaks on the inconsistency.", "downstream router는 고정된 라벨 집합 중 하나를 기대하므로, 이런 불일치가 생기면 깨집니다."),
      item("Few-shot examples show Claude the exact label and casing to return, and XML tags keep those examples separate from the instruction so Claude does not read them as part of the task:", "퓨샷 예시는 Claude에게 반환해야 할 정확한 라벨과 대소문자를 보여 주고, XML 태그는 예시를 지시문과 분리해 Claude가 그것을 작업의 일부로 읽지 않게 합니다."),
      item("System: \"You are a support classifier. Classify each ticket into exactly one of: BILLING, TECHNICAL, ESCALATION. Return only the label. No other text.\"", "System: \"당신은 지원 문의 분류기입니다. 각 티켓을 BILLING, TECHNICAL, ESCALATION 중 정확히 하나로 분류하세요. 라벨만 반환하고 다른 텍스트는 쓰지 마세요.\""),
      item("Three techniques are doing distinct work here.", "여기서는 세 가지 기법이 각각 다른 일을 하고 있습니다."),
      item("The system prompt sets the output contract: exactly one label from a fixed set, nothing else.", "시스템 프롬프트는 출력 계약을 정합니다. 고정된 집합에서 정확히 하나의 라벨만, 그 외에는 아무것도 쓰지 않는 것입니다."),
      item("The XML tags mark where each example ends and the next begins, so Claude does not read the examples as part of the instruction.", "XML 태그는 각 예시가 어디서 끝나고 다음 예시가 어디서 시작되는지 표시해서, Claude가 예시를 지시문의 일부로 읽지 않게 합니다."),
      item("The few-shot pairs show the exact casing and format rather than describing it.", "퓨샷 쌍은 형식을 설명하는 대신 정확한 대소문자와 형식을 직접 보여 줍니다."),
      item("Stack all four techniques: Stacking all four techniques against a clearly defined output contract.", "네 가지 기법 모두 쌓기: 명확하게 정의된 출력 계약에 대해 네 가지 기법을 모두 적용합니다."),
      item("Simplify the prompt: Adding all four techniques to a simple task that only needs one.", "프롬프트 단순화: 하나의 기법만 필요한 간단한 작업에 네 가지 기법을 모두 추가하는 경우입니다."),
      item("Diagnose before adding more: Prompts that are growing longer with each iteration rather than more precise.", "더 추가하기 전에 진단하기: 반복할수록 더 정확해지는 것이 아니라 더 길어지는 프롬프트입니다.")
    ]
  },
  {
    id: "when-to-reach",
    title: "2-1-3. When to reach",
    items: [
      item("2-1-3. When to reach for each technique", "2-1-3. 각 기법을 언제 사용할지"),
      item("System prompts carry the behavioral contract for the whole session.", "시스템 프롬프트는 전체 세션의 행동 계약을 담습니다."),
      item("XML tags are used when the prompt mixes inputs with instructions.", "XML 태그는 프롬프트가 입력과 지시를 함께 섞을 때 사용됩니다."),
      item("Few-shot examples are considered useful because they show rather than just tell.", "퓨샷 예시는 말로 설명하는 대신 직접 보여 주기 때문에 유용합니다."),
      item("Output constraints are the last line of defense before Claude's response reaches your parser.", "출력 제약 조건은 Claude의 응답이 parser에 도달하기 전 마지막 방어선입니다."),
      item("Use structured output features in cases when the format must be machine-readable.", "형식이 반드시 기계가 읽을 수 있어야 하는 경우에는 structured output 기능을 사용하세요.")
    ]
  },
  {
    id: "iteration-loop",
    title: "2-1-4. Iteration loop",
    items: [
      item("2-1-4. The iteration loop: Diagnosing before re-prompting", "2-1-4. 반복 루프: 다시 프롬프트하기 전에 진단하기"),
      item("When a first-pass response misses the mark, the instinct is to add more words to the prompt and try again.", "첫 번째 응답이 목표에서 벗어나면, 프롬프트에 말을 더 추가하고 다시 시도하고 싶어집니다."),
      item("Instead, diagnose the problem first, and then re-prompt based on your findings.", "대신 먼저 문제를 진단하고, 그 결과를 바탕으로 다시 프롬프트하세요."),
      item("Wrong format: This is caused due to a missing output constraint.", "잘못된 형식: 출력 제약 조건이 빠져 있어서 발생합니다."),
      item("Wrong content or scope drift: This is caused due to an underspecified system prompt.", "잘못된 내용 또는 범위 이탈: 시스템 프롬프트가 충분히 구체적이지 않아서 발생합니다."),
      item("Correct task but hallucinated structure: This happens when few-shot examples are needed.", "작업은 맞지만 구조를 환각함: 퓨샷 예시가 필요할 때 발생합니다."),
      item("The fix is structural, not a matter of phrasing.", "해결책은 표현의 문제가 아니라 구조의 문제입니다.")
    ]
  },
  {
    id: "structured-outputs",
    title: "2-1-5. Structured outputs",
    items: [
      item("2-1-5. Moving output control from the prompt into the API with structured outputs", "2-1-5. structured outputs로 출력 제어를 프롬프트에서 API로 옮기기"),
      item("Everything up to this point shapes the output by writing instructions into the prompt and hoping Claude follows them.", "여기까지의 모든 방법은 프롬프트에 지시를 작성하고 Claude가 그것을 따르기를 기대함으로써 출력을 형성합니다."),
      item("The Claude API has a separate mechanism that removes that gap for production code.", "Claude API에는 프로덕션 코드에서 그 간극을 제거하는 별도의 메커니즘이 있습니다."),
      item("It is called structured outputs, and instead of asking for a shape in words, you hand the API a JSON schema, and the model is constrained at generation time to produce output that matches it.", "그것은 structured outputs라고 하며, 말로 형태를 요청하는 대신 API에 JSON schema를 넘기면 모델은 생성 시점에 그 schema와 일치하는 출력을 만들도록 제약됩니다."),
      item("This technique is constrained decoding.", "이 기법은 constrained decoding입니다."),
      item("JSON outputs constrain the final response.", "JSON outputs는 최종 응답을 제약합니다."),
      item("Strict tool use constrains the inputs Claude passes to your tools.", "Strict tool use는 Claude가 도구에 전달하는 입력을 제약합니다."),
      item("The reason this belongs in the production code and not just in the prompt is because of reliability under inputs you did not test.", "이것이 프롬프트에만 머무르지 않고 프로덕션 코드에 있어야 하는 이유는 테스트하지 않은 입력에서도 신뢰성을 확보하기 위해서입니다."),
      item("Constraining generation has costs, and a developer choosing this in production needs to weigh them rather than enabling it everywhere by default.", "생성을 제약하는 데에는 비용이 있으며, 프로덕션에서 이를 선택하는 개발자는 기본적으로 모든 곳에 켜기보다 그 비용을 따져야 합니다."),
      item("The first request on a new schema is slower.", "새 schema의 첫 번째 요청은 더 느립니다."),
      item("Your input token count rises.", "입력 토큰 수가 증가합니다."),
      item("A guaranteed schema is not a guaranteed success.", "schema가 보장된다고 해서 성공이 보장되는 것은 아닙니다."),
      item("It does not combine with message prefilling.", "message prefilling과는 함께 사용할 수 없습니다.")
    ]
  }
];
