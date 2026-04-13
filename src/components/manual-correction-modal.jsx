'use client';

import { useState, useMemo } from 'react';
import { calculateScore } from '@/lib/scoring';

/**
 * Modal for manually correcting detected answers.
 * Shows editable answer grid with confidence-based highlighting.
 * Low-confidence detections (0.25-0.45) are highlighted for review.
 */
export default function ManualCorrectionModal({ student, testConfig, onSave, onClose }) {
  const [phanI, setPhanI] = useState([...student.phanI]);
  const [phanII, setPhanII] = useState(student.phanII.map((a) => ({ ...a })));
  const [phanIII, setPhanIII] = useState([...student.phanIII]);

  const confidenceMap = student.confidenceMap || {};

  // Live score preview
  const liveScore = useMemo(() => {
    const tempStudent = { ...student, phanI, phanII, phanIII };
    return calculateScore(tempStudent, testConfig);
  }, [student, phanI, phanII, phanIII, testConfig]);

  const handlePhanIToggle = (questionIdx, option) => {
    setPhanI((prev) => {
      const next = [...prev];
      next[questionIdx] = next[questionIdx] === option ? '' : option;
      return next;
    });
  };

  const handlePhanIIToggle = (questionIdx, subOpt) => {
    setPhanII((prev) => {
      const next = prev.map((a) => ({ ...a }));
      next[questionIdx][subOpt] = !next[questionIdx][subOpt];
      return next;
    });
  };

  const handlePhanIIIChange = (questionIdx, value) => {
    setPhanIII((prev) => {
      const next = [...prev];
      next[questionIdx] = value;
      return next;
    });
  };

  const handleSave = () => {
    onSave({
      ...student,
      phanI,
      phanII,
      phanIII,
      corrected: true,
      score: liveScore,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-semibold">Sửa đáp án - SBD: {student.studentId}</h3>
              <p className="text-sm text-gray-500">
                Nhấn vào đáp án để thay đổi. Điểm cập nhật tự động.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-blue-600">
                {liveScore.total}/{liveScore.maxTotal}
              </span>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs mb-4 bg-gray-50 p-2 rounded">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-200 border border-yellow-400" /> Độ tin cậy thấp</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 border border-green-400" /> Đúng</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 border border-red-400" /> Sai</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" /> Trống</span>
          </div>

          <PhanIGrid
            answers={phanI}
            correctAnswers={testConfig.phanI.answers}
            confidenceMap={confidenceMap}
            onToggle={handlePhanIToggle}
          />

          <PhanIIGrid
            answers={phanII}
            correctAnswers={testConfig.phanII.answers}
            onToggle={handlePhanIIToggle}
          />

          <PhanIIIGrid
            answers={phanIII}
            correctAnswers={testConfig.phanIII.answers}
            onChange={handlePhanIIIChange}
          />

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">Hủy</button>
            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhanIGrid({ answers, correctAnswers, confidenceMap, onToggle }) {
  const options = ['A', 'B', 'C', 'D'];

  return (
    <div className="mb-6">
      <h4 className="font-semibold mb-2">Phần I - Trắc nghiệm</h4>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-1">
        {answers.map((answer, i) => {
          const qConf = confidenceMap[i + 1] || {};
          const correct = correctAnswers[i];
          const isCorrect = answer && answer === correct;
          // Check if selected answer has low confidence
          const selectedFill = answer ? (qConf[answer] || 0) : 0;
          const isLowConf = answer && selectedFill > 0.25 && selectedFill < 0.45;

          return (
            <div key={i} className={`border rounded p-1 text-center ${isLowConf ? 'border-yellow-400 bg-yellow-50' : ''}`}>
              <div className="text-xs font-medium text-gray-500 mb-0.5">{i + 1}</div>
              <div className="flex gap-0.5 justify-center">
                {options.map((opt) => {
                  const selected = answer === opt;
                  let bg = 'bg-gray-100 hover:bg-gray-200';
                  if (selected) {
                    bg = isCorrect ? 'bg-green-200 border-green-400' : 'bg-red-200 border-red-400';
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => onToggle(i, opt)}
                      className={`w-6 h-6 text-xs rounded border ${bg} transition-colors`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhanIIGrid({ answers, correctAnswers, onToggle }) {
  return (
    <div className="mb-6">
      <h4 className="font-semibold mb-2">Phần II - Đúng/Sai</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {answers.map((answer, i) => (
          <div key={i} className="border rounded p-2 text-sm">
            <span className="font-medium mr-2">Câu {i + 1}:</span>
            {['a', 'b', 'c', 'd'].map((opt) => {
              const correct = correctAnswers[i]?.[opt];
              const isCorrect = answer[opt] === correct;
              return (
                <button
                  key={opt}
                  onClick={() => onToggle(i, opt)}
                  className={`inline-block px-2 py-0.5 rounded mx-0.5 border transition-colors ${
                    isCorrect ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'
                  }`}
                >
                  {opt.toUpperCase()}: {answer[opt] ? 'Đ' : 'S'}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function PhanIIIGrid({ answers, correctAnswers, onChange }) {
  return (
    <div>
      <h4 className="font-semibold mb-2">Phần III - Tự luận số</h4>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {answers.map((answer, i) => {
          const correct = correctAnswers[i];
          const isCorrect = answer && answer === correct;
          return (
            <div key={i} className="text-center">
              <div className="text-xs font-medium text-gray-500 mb-1">Câu {i + 1}</div>
              <input
                type="text"
                value={answer}
                onChange={(e) => onChange(i, e.target.value)}
                className={`w-full px-2 py-1 text-sm text-center border rounded ${
                  !answer ? 'border-gray-300' :
                  isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
                }`}
              />
              {correct && <div className="text-xs text-gray-400 mt-0.5">ĐA: {correct}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
