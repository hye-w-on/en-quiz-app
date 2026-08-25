import { useState } from "react";
import { quizSections, sourceText } from "./data";
import "./styles.css";

function App() {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [sourceVisible, setSourceVisible] = useState(false);
  const [tocVisible, setTocVisible] = useState(false);
  const activeSection = quizSections[sectionIndex];
  const currentItem = activeSection.items[questionIndex];

  function selectSection(nextSectionIndex: number) {
    setSectionIndex(nextSectionIndex);
    setQuestionIndex(0);
    setAnswerVisible(false);
    setTocVisible(false);
  }

  function moveQuiz(step: number) {
    setQuestionIndex((index) => Math.min(Math.max(index + step, 0), activeSection.items.length - 1));
    setAnswerVisible(false);
  }

  return (
    <main>
      <header className="toc">
        <div className="toc-heading">
          <div>
            <p className="toc-label">목차</p>
            <h1>Production-Grade Prompting</h1>
            <p className="toc-current">{activeSection.title}</p>
          </div>
          <button type="button" className="secondary toc-toggle" onClick={() => setTocVisible((visible) => !visible)}>
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
                <span className="toc-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="toc-title">{section.title}</span>
                <span className="toc-count">{section.items.length}문제</span>
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
          <p className="label">문장</p>
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
        {sourceVisible ? <p className="original-text">{sourceText}</p> : null}
      </section>
    </main>
  );
}

export default App;
