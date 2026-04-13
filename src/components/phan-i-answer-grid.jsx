'use client';

import { useRef, useCallback } from 'react';

/**
 * Keyboard-navigable answer grid for Phần I multiple choice (A/B/C/D).
 * Type A/B/C/D to set answer and auto-advance. Backspace to clear and go back.
 * Arrow keys to navigate between questions.
 */
export default function PhanIAnswerGrid({ questionCount, answers, onAnswerChange }) {
  const questionRefs = useRef([]);

  const handleKeyDown = useCallback((index, e) => {
    const key = e.key.toUpperCase();

    if (['A', 'B', 'C', 'D'].includes(key)) {
      e.preventDefault();
      onAnswerChange(index, key);
      // Auto-advance to next question
      if (index < questionCount - 1) {
        questionRefs.current[index + 1]?.focus();
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      onAnswerChange(index, '');
      if (index > 0) {
        questionRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (index < questionCount - 1) {
        questionRefs.current[index + 1]?.focus();
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (index > 0) {
        questionRefs.current[index - 1]?.focus();
      }
    }
  }, [questionCount, onAnswerChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: questionCount }, (_, i) => (
        <div
          key={i}
          ref={(el) => { questionRefs.current[i] = el; }}
          tabIndex={0}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="flex items-center gap-2 rounded p-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <span className="text-sm font-medium w-12">Câu {i + 1}:</span>
          <div className="flex gap-1">
            {['A', 'B', 'C', 'D'].map((option) => (
              <button
                key={option}
                tabIndex={-1}
                onClick={() => onAnswerChange(i, option)}
                className={`w-9 h-9 rounded border-2 text-sm font-medium transition-colors ${
                  answers[i] === option
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
