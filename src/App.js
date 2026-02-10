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

import React, { useState, useRef } from 'react'; // useEffect를 제거하여 배포 에러 해결
import './App.css';

/**
 * 2단계: 장비-용도 알아가기 데이터
 */
const STAGES = [
  {
    page: 1,
    title: "2단계: 장비-용도 알아가기",
    data: [
      { id: 1, name: "덤프트럭", usage: "굴착 토사 등을 운반", img: "/images/a.png" },
      { id: 2, name: "굴착기", usage: "지반을 굴착", img: "/images/b.png" }
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

  // --- 드래그 핸들러 ---
  const handleMouseDown = (e, id, type) => {
    if (isAllCorrect || submitted) return; 
    
    // 브라우저 기본 드래그 및 텍스트 선택 차단
    e.preventDefault(); 

    const rect = e.target.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    setDragStart({
      id, type,
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top + containerRef.current.scrollTop
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top + containerRef.current.scrollTop
    });
  };

  const handleMouseUp = (e, targetId, targetType) => {
    if (!isDragging || !dragStart) return;

    const connectionType = (dragStart.type === 'img' && targetType === 'nameTop') ? 'first' : 
                           (dragStart.type === 'nameBottom' && targetType === 'usage') ? 'second' : null;

    if (connectionType) {
      const rect = e.target.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const endX = rect.left + rect.width / 2 - containerRect.left;
      const endY = rect.top + rect.height / 2 - containerRect.top + containerRef.current.scrollTop;

      setMatches(prev => {
        // 1:1 매칭을 위한 기존 선 자동 교체 로직
        const filteredMatches = prev.filter(m => 
          !(m.type === connectionType && (m.startId === dragStart.id || m.endId === targetId))
        );

        return [...filteredMatches, {
          startId: dragStart.id,
          endId: targetId,
          x1: dragStart.x, y1: dragStart.y,
          x2: endX, y2: endY,
          type: connectionType,
          isCorrect: null 
        }];
      });
    }
    setIsDragging(false);
    setDragStart(null);
  };

  // --- 결과 확인 로직 ---
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
    <div className="app-container" ref={containerRef} onMouseMove={handleMouseMove} onMouseUp={() => setIsDragging(false)}>
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
              <div className="dot" onMouseDown={(e) => handleMouseDown(e, item.id, 'img')}></div>
            </div>
          ))}
        </div>

        <div className="row">
          {items.map(item => (
            <div key={item.id} className="item-group">
              <div className="dot" onMouseUp={(e) => handleMouseUp(e, item.id, 'nameTop')}></div>
              <div className="text-button">{item.name}</div>
              <div className="dot" onMouseDown={(e) => handleMouseDown(e, item.id, 'nameBottom')}></div>
            </div>
          ))}
        </div>

        <div className="row">
          {items.map(item => (
            <div key={item.id} className="item-group">
              <div className="dot" onMouseUp={(e) => handleMouseUp(e, item.id, 'usage')}></div>
              <div className="text-button">{item.usage}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="footer">
        {isAllCorrect ? (
          <button className="next-button" onClick={() => alert("다음 문제 이동")}>다음 문제</button>
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