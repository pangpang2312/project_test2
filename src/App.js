/*import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;*/

import React, { useState } from 'react';
import './App.css';

/**
 * 단계별 데이터 정의: 각 단계의 제목, 단어, 음성 설명을 객체 배열로 관리합니다.
 * PDF 설계안의 1단계(개념-단어)와 2단계(장비-용도)를 구분합니다[cite: 5, 11].
 */
const STAGES = [
  {
    title: "1단계: 개념-단어 연결 짓기",
    data: [
      { id: 1, word: "단부 개구부", audioDesc: "낭떠러지나 바닥에 뚫린 구멍을 의미합니다." },
      { id: 2, word: "철골 공사", audioDesc: "강재를 사용하여 건물의 뼈대를 만드는 작업입니다." },
      { id: 3, word: "지붕 공사", audioDesc: "건물의 최상부 덮개를 설치하는 작업입니다." },
      { id: 4, word: "비계·작업발판", audioDesc: "높은 곳에서 작업할 수 있도록 설치하는 가설물입니다." },
      { id: 5, word: "사다리", audioDesc: "높은 곳으로 오르내릴 때 사용하는 도구입니다." },
    ]
  },
  {
    title: "2단계: 장비-용도 알아가기",
    data: [
      { id: 1, word: "A", audioDesc: "A" },
      { id: 2, word: "B", audioDesc: "B" },
      { id: 3, word: "C", audioDesc: "C" },
      { id: 4, word: "D", audioDesc: "D" },
      { id: 5, word: "E", audioDesc: "E" },
    ]
  }
];

function App() {
  // --- 상태(State) 관리 영역 ---
  const [currentStage, setCurrentStage] = useState(0);    // 현재 진행 중인 단계 인덱스 (0: 1단계, 1: 2단계)
  const [selectedAudioId, setSelectedAudioId] = useState(null); // 현재 클릭되어 음성이 나오고 있는 버튼 ID
  const [matches, setMatches] = useState({});            // 연결된 쌍 저장 { 음성ID: 단어ID }
  const [submitted, setSubmitted] = useState(false);      // '정답 제출' 버튼을 눌렀는지 여부
  const [isCorrect, setIsCorrect] = useState(false);      // 모든 연결이 정답인지 여부

  // 현재 단계에 해당하는 데이터 추출
  const stageInfo = STAGES[currentStage];
  const items = stageInfo.data;

  /**
   * 음성 버튼 클릭 핸들러
   * Web Speech API를 사용하여 텍스트를 읽어주고, 해당 버튼을 '활성 상태'로 만듭니다.
   */
  const handleAudioClick = (id) => {
    if (submitted && isCorrect) return; // 이미 정답을 맞췄다면 동작하지 않음
    
    setSelectedAudioId(id); // 클릭한 음성 버튼을 선택 상태로 설정
    window.speechSynthesis.cancel(); // 이전 음성이 재생 중이면 중지

    const targetItem = items.find(item => item.id === id);
    if (targetItem) {
      const utterance = new SpeechSynthesisUtterance(targetItem.audioDesc);
      utterance.lang = 'ko-KR'; // 한국어 설정 [cite: 1, 4]
      window.speechSynthesis.speak(utterance);
    }
  };

  /**
   * 단어 버튼 클릭 핸들러
   * 유연한 연결 수정 로직을 포함합니다.
   */
  const handleWordClick = (wordId) => {
    // 음성이 선택되지 않았거나, 정답 제출 후 성공 상태면 클릭 무시
    if (!selectedAudioId || (submitted && isCorrect)) return;

    const newMatches = { ...matches };

    // [중복 방지] 선택하려는 단어가 이미 다른 음성에 연결되어 있다면 기존 연결 제거
    const prevAudioId = Object.keys(newMatches).find(key => newMatches[key] === wordId);
    if (prevAudioId) delete newMatches[prevAudioId];

    // [연결 업데이트] 현재 선택된 음성에 새 단어 매칭 (재선택 시 덮어쓰기)
    newMatches[selectedAudioId] = wordId;
    setMatches(newMatches);
    
    // 주의: setSelectedAudioId(null)을 하지 않음으로써 단어를 즉시 재선택 가능하게 유지합니다.
  };

  /**
   * 정답 제출 핸들러
   * 모든 항목이 연결되었는지 확인하고, 실제 정답(ID 일치)과 비교합니다.
   */
  const handleSubmit = () => {
    const totalCount = items.length;
    const matchCount = Object.keys(matches).length;

    // 미연결 항목이 있을 경우 경고 [PDF 기획 반영]
    if (matchCount < totalCount) {
      alert("모든 문제를 연결해주세요!");
      return;
    }

    // 정답 확인 로직: 데이터의 ID와 매칭된 단어의 ID가 일치하는지 검사
    let correctCount = 0;
    items.forEach(item => {
      if (matches[item.id] === item.id) correctCount++;
    });

    setSubmitted(true); // 제출 상태로 전환
    setIsCorrect(correctCount === totalCount); // 전체 정답 여부 저장
  };

  /**
   * 상태 초기화 (다시 풀기 또는 다음 단계 이동 시 사용)
   */
  const handleReset = () => {
    setMatches({});
    setSubmitted(false);
    setIsCorrect(false);
    setSelectedAudioId(null);
  };

  /**
   * 다음 단계 이동 핸들러
   * 다음 단계로 데이터를 교체하고 화면을 초기화합니다.
   */
  const handleNextStage = () => {
    if (currentStage < STAGES.length - 1) {
      setCurrentStage(currentStage + 1); // 단계 인덱스 증가
      handleReset(); // 이전 단계 데이터 초기화
    } else {
      alert("모든 단계를 완료했습니다!"); // 최종 완료 시 안내 [cite: 36]
    }
  };

  /**
   * 버튼 클래스 결정 함수
   * 상태에 따라 CSS 클래스(기본, 활성, 매칭됨, 정답, 오답)를 동적으로 반환합니다.
   */
  const getButtonClass = (id, type) => {
    if (type === 'audio') {
      if (selectedAudioId === id) return 'btn active'; // 현재 선택된 음성
      if (matches[id]) return 'btn matched';           // 단어와 연결된 상태
      return 'btn';
    }
    
    // 단어 버튼의 경우 어떤 음성과 연결되었는지 찾음
    const audioId = Object.keys(matches).find(key => matches[key] === id);
    if (!audioId) return 'btn'; // 연결 안 됨

    if (submitted) {
      // 제출 후: 정답이면 파란색(correct), 오답이면 빨간색(wrong) 반환
      return parseInt(audioId) === id ? 'btn correct' : 'btn wrong';
    }
    return 'btn matched'; // 제출 전: 매칭만 된 상태
  };

  return (
    <div className="container">
      {/* 2. 상단 진행 표시줄: 현재 단계 / 전체 단계 비율로 계산  */}
      <div className="progress-bar">
        <div className="progress" style={{ width: `${((currentStage + 1) / STAGES.length) * 100}%` }}></div>
      </div>

      <header className="header">
        <h2>{stageInfo.title}</h2>
      </header>

      <div className="quiz-section">
        {/* 음성 버튼 열 */}
        <div className="column">
          {items.map(item => (
            <div key={item.id} className="button-wrapper">
              <button className={getButtonClass(item.id, 'audio')} onClick={() => handleAudioClick(item.id)}>
                🔊 음성 {item.id}
              </button>
              {/* 시각적 피드백: 어떤 단어와 연결되었는지 표시 */}
              {matches[item.id] && <span className="link-tag">{matches[item.id]}번 단어와 연결</span>}
            </div>
          ))}
        </div>

        {/* 단어 버튼 열 */}
        <div className="column">
          {items.map(item => {
            const linkedAudioId = Object.keys(matches).find(key => matches[key] === item.id);
            return (
              <div key={item.id} className="button-wrapper">
                <button className={getButtonClass(item.id, 'word')} onClick={() => handleWordClick(item.id)}>
                  {item.word}
                </button>
                {/* 시각적 피드백: 어떤 음성과 연결되었는지 표시 */}
                {linkedAudioId && <span className="link-tag">음성 {linkedAudioId}와 연결</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="footer">
        {/* 조건부 렌더링: 정답 여부에 따라 버튼 종류 변경 */}
        {!isCorrect ? (
          <button className="submit-btn" onClick={submitted ? handleReset : handleSubmit}>
            {submitted ? "다시 풀기" : "정답 제출"}
          </button>
        ) : (
          <button className="next-btn" onClick={handleNextStage}>
            {currentStage < STAGES.length - 1 ? "다음 문제" : "최종 완료"}
          </button>
        )}
      </div>
    </div>
  );
}

export default App;