import { useEffect, useState } from "react";
import { quizSections, sourceText } from "./data";
import { wordItems } from "./wordData";
import "./styles.css";

function getSectionSource(sectionIndex: number) {
  const section = quizSections[sectionIndex];
  if (!section) {
    return sourceText;
  }

  const startIndex = sourceText.indexOf(section.title);
  if (startIndex < 0) {
    return sourceText;
  }

  const nextSection = quizSections[sectionIndex + 1];
  const endIndex = nextSection ? sourceText.indexOf(nextSection.title, startIndex + section.title.length) : -1;
  return sourceText.slice(startIndex, endIndex > startIndex ? endIndex : undefined).trim();
}

function shuffleWords() {
  const shuffled = [...wordItems];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function App() {
  const [activeTab, setActiveTab] = useState<"sentence" | "word">("sentence");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [sourceVisible, setSourceVisible] = useState(false);
  const [tocVisible, setTocVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordAnswerVisible, setWordAnswerVisible] = useState(false);
  const [shuffledWordItems] = useState(shuffleWords);
  const [wordAutoPlay, setWordAutoPlay] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const activeSection = quizSections[sectionIndex];
  const currentItem = activeSection.items[questionIndex];
  const currentWord = shuffledWordItems[wordIndex];
  const activeSourceText = getSectionSource(sectionIndex);

  useEffect(() => {
    if (activeTab !== "word" || !wordAutoPlay || shuffledWordItems.length === 0) {
      return;
    }

    setWordAnswerVisible(false);

    const showAnswerTimer = window.setTimeout(() => {
      setWordAnswerVisible(true);
    }, 3000);

    const moveNextTimer = window.setTimeout(() => {
      setWordIndex((index) => (index + 1) % shuffledWordItems.length);
      setWordAnswerVisible(false);
    }, 5000);

    return () => {
      window.clearTimeout(showAnswerTimer);
      window.clearTimeout(moveNextTimer);
    };
  }, [activeTab, shuffledWordItems.length, wordAutoPlay, wordIndex]);

  function selectTab(nextTab: "sentence" | "word") {
    setActiveTab(nextTab);
    setAnswerVisible(false);
    setWordAnswerVisible(false);
    setWordAutoPlay(false);
    setSourceVisible(false);
    setTocVisible(false);
  }

  function selectSection(nextSectionIndex: number) {
    setSectionIndex(nextSectionIndex);
    setQuestionIndex(0);
    setAnswerVisible(false);
    setSourceVisible(false);
    setTocVisible(false);
  }

  function moveQuiz(step: number) {
    setQuestionIndex((index) => Math.min(Math.max(index + step, 0), activeSection.items.length - 1));
    setAnswerVisible(false);
  }

  function moveWord(step: number) {
    setWordIndex((index) => Math.min(Math.max(index + step, 0), shuffledWordItems.length - 1));
    setWordAnswerVisible(false);
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedText(text);
    window.setTimeout(() => setCopiedText(""), 1200);
  }

  return (
    <main>
      <div className="tabs" role="tablist" aria-label="퀴즈 종류">
        <button
          type="button"
          className={activeTab === "sentence" ? "tab-button active" : "tab-button"}
          onClick={() => selectTab("sentence")}
        >
          문장 퀴즈
        </button>
        <button
          type="button"
          className={activeTab === "word" ? "tab-button active" : "tab-button"}
          onClick={() => selectTab("word")}
        >
          단어 퀴즈
        </button>
      </div>

      {activeTab === "sentence" ? (
        <>
          <header className="toc">
            <div className="toc-heading">
              <div>
                <h1>Production-Grade Prompting</h1>
                <p className="toc-current">{activeSection.title}</p>
              </div>
              <button
                type="button"
                className="secondary toc-toggle"
                onClick={() => setTocVisible((visible) => !visible)}
              >
                {tocVisible ? "목차 접기" : "목차 보기"}
              </button>
            </div>

            {tocVisible ? (
              <nav className="toc-list" aria-label="퀴즈 목차">
                {quizSections.map((section, index) => (
                  <button
                    type="button"
                    className={index === sectionIndex ? "toc-button active" : "toc-button"}
                    key={section.id}
                    onClick={() => selectSection(index)}
                  >
                    <span className="toc-title">{section.title}</span>
                  </button>
                ))}
              </nav>
            ) : null}
          </header>

          <section className="quiz-shell" aria-live="polite">
            <div className="meta-row">
              <span>
                {activeSection.title} · 문제 {questionIndex + 1} / {activeSection.items.length}
              </span>
              <span className="source">{currentItem.source}</span>
            </div>

            <div className="sentence-box">
              <div className="sentence-heading">
                <p className="label">문장</p>
                <button type="button" className="copy-button" onClick={() => copyText(currentItem.sentence)}>
                  {copiedText === currentItem.sentence ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="sentence">{currentItem.sentence}</p>
            </div>

            <div className={answerVisible ? "answer-box" : "answer-box is-hidden"}>
              <p className="label">해석</p>
              <p className="answer">{currentItem.translation}</p>
            </div>

            <div className="controls">
              <button type="button" onClick={() => setAnswerVisible((visible) => !visible)}>
                {answerVisible ? "해석 숨기기" : "해석 보기"}
              </button>
              <button
                type="button"
                className="secondary"
                disabled={questionIndex === 0}
                onClick={() => moveQuiz(-1)}
              >
                이전
              </button>
              <button
                type="button"
                className="secondary"
                disabled={questionIndex === activeSection.items.length - 1}
                onClick={() => moveQuiz(1)}
              >
                다음
              </button>
            </div>
          </section>

          <section className="original">
            <div className="original-controls">
              <button type="button" className="secondary" onClick={() => setSourceVisible((visible) => !visible)}>
                {sourceVisible ? "원본 숨기기" : "원본 보기"}
              </button>
            </div>
            {sourceVisible ? <p className="original-text">{activeSourceText}</p> : null}
          </section>
        </>
      ) : (
        <section className="quiz-shell" aria-live="polite">
          <div className="meta-row">
            <span>
              단어 퀴즈 · 문제 {wordIndex + 1} / {shuffledWordItems.length}
            </span>
            <button
              type="button"
              className={wordAutoPlay ? "timer-button auto-active" : "timer-button"}
              aria-label={wordAutoPlay ? "타이머 끄기" : "타이머 켜기"}
              title={wordAutoPlay ? "타이머 끄기" : "타이머 켜기"}
              onClick={() => setWordAutoPlay((playing) => !playing)}
            >
              타이머
            </button>
          </div>

          <div className="sentence-box">
            <div className="sentence-heading">
              <p className="label">단어 / 표현</p>
              <button type="button" className="copy-button" onClick={() => copyText(currentWord.term)}>
                {copiedText === currentWord.term ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="sentence word-term">{currentWord.term}</p>
          </div>

          <div className={wordAnswerVisible ? "answer-box" : "answer-box is-hidden"}>
            <p className="label">뜻</p>
            <p className="answer word-meaning">{currentWord.meaning}</p>
          </div>

          <div className="controls word-controls">
            <button type="button" onClick={() => setWordAnswerVisible((visible) => !visible)}>
              {wordAnswerVisible ? "뜻 숨기기" : "뜻 보기"}
            </button>
            <button type="button" className="secondary" disabled={wordIndex === 0} onClick={() => moveWord(-1)}>
              이전
            </button>
            <button
              type="button"
              className="secondary"
              disabled={wordIndex === shuffledWordItems.length - 1}
              onClick={() => moveWord(1)}
            >
              다음
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
