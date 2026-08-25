import { useState } from "react";
import { quizItems, sourceText } from "./data";
import "./styles.css";

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [sourceVisible, setSourceVisible] = useState(false);
  const currentItem = quizItems[currentIndex];

  function moveQuiz(step: number) {
    setCurrentIndex((index) => Math.min(Math.max(index + step, 0), quizItems.length - 1));
    setAnswerVisible(false);
  }

  return (
    <main>
      <section className="quiz-shell" aria-live="polite">
        <div className="meta-row">
          <span>
            문제 {currentIndex + 1} / {quizItems.length}
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
            disabled={currentIndex === 0}
            onClick={() => moveQuiz(-1)}
          >
            이전
          </button>
          <button
            type="button"
            className="secondary"
            disabled={currentIndex === quizItems.length - 1}
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
