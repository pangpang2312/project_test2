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


import React, { useState, useRef } from 'react';
import './App.css';

/**
 * 2단계: 장비-용도 알아가기 데이터
 */
const STAGES = [
  {
    page: 1,
    title: "2단계: 장비-용도 알아가기",
    data: [
      { id: 1, name: "덤프트럭", usage: "굴착 토사 등을 운반", img: "/images/b.png" },
      { id: 2, name: "굴착기", usage: "지반을 굴착", img: "/images/a.png" }
    ]
  }
];

function App() {
  const [matches, setMatches] = useState([]); 
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [submitted, setSubmitted] = useState(false);      
  const [isAllCorrect, setIsAllCorrect] = useState(false); 

  const containerRef = useRef(null);
  const items = STAGES[0].data;

  // --- 드래그 시작 (포인터 다운) ---
  const handlePointerDown = (e, id, type) => {
    if (isAllCorrect || submitted) return; 

    // 브라우저 기본 동작 차단 및 포인터 고정
    e.preventDefault(); 
    e.target.setPointerCapture(e.pointerId); 

    const rect = e.target.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // [핵심] 현재 스크롤 위치(scrollTop)를 더해 절대 좌표를 계산합니다.
    setDragStart({
      id, type,
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top + containerRef.current.scrollTop
    });
    setIsDragging(true);
  };

  // --- 드래그 중 (포인터 무브) ---
  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top + containerRef.current.scrollTop
    });
  };

  // --- 드래그 종료 (도착점 인식) ---
  const handlePointerUp = (e) => {
    if (!isDragging || !dragStart) return;

    // 터치 지점의 요소를 찾아 타겟 확인
    const releaseTarget = document.elementFromPoint(e.clientX, e.clientY);
    const targetId = parseInt(releaseTarget?.getAttribute('data-id'));
    const targetType = releaseTarget?.getAttribute('data-type');

    const connectionType = (dragStart.type === 'img' && targetType === 'nameTop') ? 'first' : 
                           (dragStart.type === 'nameBottom' && targetType === 'usage') ? 'second' : null;

    if (connectionType && targetId) {
      const rect = releaseTarget.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const endX = rect.left + rect.width / 2 - containerRect.left;
      const endY = rect.top + rect.height / 2 - containerRect.top + containerRef.current.scrollTop;

      setMatches(prev => {
        // 1:1 매칭 및 자동 교체 로직
        const filteredMatches = prev.filter(m => 
          !(m.type === connectionType && (m.startId === dragStart.id || m.endId === targetId))
        );
        return [...filteredMatches, {
          startId: dragStart.id, endId: targetId,
          x1: dragStart.x, y1: dragStart.y, x2: endX, y2: endY,
          type: connectionType, isCorrect: null 
        }];
      });
    }

    if (e.target.hasPointerCapture(e.pointerId)) {
      e.target.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    setDragStart(null);
  };

  const handleSubmit = () => {
    const requiredMatches = items.length * 2;
    if (matches.length < requiredMatches) {
      alert("모든 점을 연결해주세요!");
      return;
    }

    const validated = matches.map(line => ({
      ...line,
      isCorrect: line.startId === line.endId 
    }));

    const allCorrect = validated.every(m => m.isCorrect);
    setMatches(validated);
    setSubmitted(true);
    if (allCorrect) setIsAllCorrect(true);
  };

  const handleRetry = () => {
    setMatches([]); 
    setSubmitted(false);
    setIsAllCorrect(false);
  };

  return (
    <div className="app-container" ref={containerRef} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      <div className="status-bar"></div>
      
      <header className="header">
        <h2 className="title">{STAGES[0].title}</h2>
        <p className="subtitle">점을 드래그하여 알맞게 연결하세요.</p>
      </header>

      <svg className="connector-svg">
        {isDragging && (
          <line x1={dragStart.x} y1={dragStart.y} x2={mousePos.x} y2={mousePos.y} className="line-dragging" />
        )}
        {matches.map((line, i) => (
          <line 
            key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} 
            className={`line-fixed ${submitted ? (line.isCorrect ? 'correct' : 'wrong') : ''}`} 
          />
        ))}
      </svg>

      <div className="content">
        <div className="row">
          {items.map(item => (
            <div key={item.id} className="item-group">
              <div className="image-card"><img src={item.img} alt="" /></div>
              <div className="dot" data-id={item.id} data-type="img" onPointerDown={(e) => handlePointerDown(e, item.id, 'img')}></div>
            </div>
          ))}
        </div>

        <div className="row">
          {items.map(item => (
            <div key={item.id} className="item-group">
              <div className="dot" data-id={item.id} data-type="nameTop"></div>
              <div className="text-button">{item.name}</div>
              <div className="dot" data-id={item.id} data-type="nameBottom" onPointerDown={(e) => handlePointerDown(e, item.id, 'nameBottom')}></div>
            </div>
          ))}
        </div>

        <div className="row">
          {items.map(item => (
            <div key={item.id} className="item-group">
              <div className="dot" data-id={item.id} data-type="usage"></div>
              <div className="text-button">{item.usage}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="footer">
        {isAllCorrect ? (
          <button className="next-button" onClick={() => alert("미션 성공!")}>다음 문제</button>
        ) : submitted ? (
          <button className="retry-button" onClick={handleRetry}>다시 풀기</button>
        ) : (
          <button className="submit-button" onClick={handleSubmit}>정답 제출</button>
        )}
      </footer>
    </div>
  );
}

export default App;