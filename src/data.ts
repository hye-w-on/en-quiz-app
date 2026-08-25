export type QuizItem = {
  sentence: string;
  translation: string;
  source: string;
};

const source = "Production-Grade Prompting, Agents & Tool Use - Prompting Craft";

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

2-1-2. Diagnosing a classification prompt that returns the wrong output shape`;

export const quizItems: QuizItem[] = [
  {
    sentence: "2. Production-Grade Prompting, Agents & Tool Use",
    translation: "2. 프로덕션 수준의 프롬프팅, 에이전트 및 도구 사용",
    source
  },
  {
    sentence: "2-1. Prompting Craft",
    translation: "2-1. 프롬프팅 기법",
    source
  },
  {
    sentence: "System prompts, XML, few-shot, and output constraints",
    translation: "시스템 프롬프트, XML, 퓨샷, 그리고 출력 제약 조건",
    source
  },
  {
    sentence: "2-1-1. Four techniques that give Claude a reliable output shape",
    translation: "2-1-1. Claude가 안정적인 출력 형태를 갖도록 해 주는 네 가지 기법",
    source
  },
  {
    sentence: "When a first-pass response misses, the instinct is often to add more words to the prompt and run it again.",
    translation: "첫 번째 응답이 빗나가면, 보통 프롬프트에 말을 더 많이 덧붙이고 다시 실행하고 싶어집니다.",
    source
  },
  {
    sentence: "However, that instinct can make the problem harder to isolate and rarely fixes it.",
    translation: "하지만 그런 직감은 문제를 분리해서 파악하기 더 어렵게 만들 수 있으며, 실제로 문제를 해결하는 경우도 드뭅니다.",
    source
  },
  {
    sentence: "Rewording changes how you say something but does not add to the structural piece of the prompt that's missing.",
    translation: "표현을 바꾸는 것은 말하는 방식을 바꿀 뿐, 프롬프트에서 빠져 있는 구조적 요소를 추가해 주지는 않습니다.",
    source
  },
  {
    sentence: "For example, if Claude is crossing the boundary between your instructions and your input data, clearer phrasing will not fix it, and if the output format keeps drifting, \"please format this correctly\" will not fix it either.",
    translation: "예를 들어 Claude가 지시문과 입력 데이터 사이의 경계를 넘나들고 있다면 더 명확한 표현만으로는 해결되지 않습니다. 출력 형식이 계속 흔들린다면 \"이것을 올바르게 형식화해 주세요\"라고 말하는 것 역시 해결책이 되지 않습니다.",
    source
  },
  {
    sentence: "The failure mode tells you which of the four techniques is absent.",
    translation: "실패 양상은 네 가지 기법 중 무엇이 빠져 있는지를 알려 줍니다.",
    source
  },
  {
    sentence: "Diagnose how your prompt is failing first, then add the specific technique that addresses that failure.",
    translation: "먼저 프롬프트가 어떤 방식으로 실패하고 있는지 진단한 다음, 그 실패를 해결하는 특정 기법을 추가하세요.",
    source
  },
  {
    sentence: "The four techniques themselves are defined in full further down this screen.",
    translation: "이 네 가지 기법 자체는 이 화면의 아래쪽에서 자세히 정의됩니다.",
    source
  },
  {
    sentence: "What you observed: The result comes back in the wrong shape: a sentence where you expected a label, prose where you expected JSON.",
    translation: "관찰한 현상: 결과가 잘못된 형태로 돌아옵니다. 라벨을 기대한 곳에는 문장이, JSON을 기대한 곳에는 일반 문단이 나옵니다.",
    source
  },
  {
    sentence: "What the prompt is missing: An output constraint. The prompt never specified the form, field names, or stopping point of the response.",
    translation: "프롬프트에 빠진 것: 출력 제약 조건입니다. 프롬프트가 응답의 형식, 필드 이름, 또는 멈춰야 할 지점을 지정하지 않았습니다.",
    source
  },
  {
    sentence: "Why this technique is the fix: An output constraint controls the form of the response independent of its content. Without one, Claude returns plausible text that the downstream parser was not built to accept.",
    translation: "이 기법이 해결책인 이유: 출력 제약 조건은 내용과 별개로 응답의 형태를 제어합니다. 이것이 없으면 Claude는 그럴듯한 텍스트를 반환하지만, downstream parser는 그런 텍스트를 받아들이도록 만들어져 있지 않습니다.",
    source
  },
  {
    sentence: "What you observed: The content is off: scope drifts, tone shifts, or Claude answers a wider question than you asked, and it gets worse deeper into the conversation.",
    translation: "관찰한 현상: 내용이 어긋납니다. 범위가 흔들리거나, 어조가 바뀌거나, Claude가 사용자가 물은 것보다 더 넓은 질문에 답하고, 대화가 깊어질수록 더 나빠집니다.",
    source
  },
  {
    sentence: "What the prompt is missing: A system prompt, or a more specific one. The behavioral contract was too vague to hold across turns.",
    translation: "프롬프트에 빠진 것: 시스템 프롬프트, 또는 더 구체적인 시스템 프롬프트입니다. 행동 규칙이 너무 모호해서 여러 턴에 걸쳐 유지되지 못했습니다.",
    source
  },
  {
    sentence: "Why this technique is the fix: The system prompt sets the rules that apply to every response regardless of the user turn. When it is underspecified, there is nothing holding role, scope, and format steady as the conversation runs on.",
    translation: "이 기법이 해결책인 이유: 시스템 프롬프트는 사용자 턴과 관계없이 모든 응답에 적용되는 규칙을 정합니다. 이것이 충분히 구체적이지 않으면, 대화가 이어지는 동안 역할, 범위, 형식을 안정적으로 붙잡아 줄 것이 없습니다.",
    source
  },
  {
    sentence: "What you observed: The task is right, but the structure is invented: Claude understood what to do and produced output in a shape you never asked for.",
    translation: "관찰한 현상: 작업 자체는 맞지만 구조가 임의로 만들어집니다. Claude는 무엇을 해야 하는지 이해했지만, 사용자가 요청하지 않은 형태로 결과를 만들었습니다.",
    source
  },
  {
    sentence: "What the prompt is missing: Few-shot examples. Claude cannot infer an exact structure from a description alone.",
    translation: "프롬프트에 빠진 것: 퓨샷 예시입니다. Claude는 설명만으로 정확한 구조를 추론할 수 없습니다.",
    source
  },
  {
    sentence: "Why this technique is the fix: Few-shot examples show the pattern rather than describe it. One correct input-output pair gives Claude the exact shape to match, which a written instruction often fails to pin down.",
    translation: "이 기법이 해결책인 이유: 퓨샷 예시는 패턴을 설명하는 대신 직접 보여 줍니다. 올바른 입력-출력 한 쌍만으로도 Claude가 맞춰야 할 정확한 형태를 제공하며, 글로 쓴 지시만으로는 이를 고정하기 어려운 경우가 많습니다.",
    source
  },
  {
    sentence: "What you observed: Output is clean on the inputs you tested but breaks on a variant: an edge case, an unusual field, an input you did not anticipate.",
    translation: "관찰한 현상: 테스트한 입력에서는 출력이 깔끔하지만, 변형 입력에서 깨집니다. 예를 들면 엣지 케이스, 특이한 필드, 예상하지 못한 입력입니다.",
    source
  },
  {
    sentence: "What the prompt is missing: A constraint covering the variant. The prompt handles the happy path and has no rule for the case the parser breaks on.",
    translation: "프롬프트에 빠진 것: 변형 입력을 다루는 제약 조건입니다. 프롬프트는 정상 경로만 처리하고, parser가 깨지는 경우에 대한 규칙이 없습니다.",
    source
  },
  {
    sentence: "Why this technique is the fix: The prompt was validated against a narrow set of inputs. Naming the variant in the constraint, or adding an example that covers it, closes the gap the test inputs never exposed.",
    translation: "이 기법이 해결책인 이유: 프롬프트가 좁은 입력 집합으로만 검증되었기 때문입니다. 제약 조건에 변형 입력을 명시하거나 이를 다루는 예시를 추가하면, 테스트 입력이 드러내지 못했던 틈을 메울 수 있습니다.",
    source
  },
  {
    sentence: "2-1-2. Diagnosing a classification prompt that returns the wrong output shape",
    translation: "2-1-2. 잘못된 출력 형태를 반환하는 분류 프롬프트 진단하기",
    source
  }
];
