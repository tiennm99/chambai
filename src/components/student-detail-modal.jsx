'use client';

import { useState, useEffect } from 'react';
import { getDebugImage } from '@/lib/indexed-db-store';
import ManualCorrectionModal from './manual-correction-modal';

export default function StudentDetailModal({ student, testConfig, onClose, onResultUpdate }) {
  const [debugImageUrl, setDebugImageUrl] = useState(null);
  const [showCorrection, setShowCorrection] = useState(false);

  useEffect(() => {
    getDebugImage(student.id).then((url) => setDebugImageUrl(url)).catch(() => {});
  }, [student.id]);

  const handleCorrectionSave = (correctedStudent) => {
    setShowCorrection(false);
    if (onResultUpdate) onResultUpdate(correctedStudent);
  };

  if (showCorrection) {
    return (
      <ManualCorrectionModal
        student={student}
        testConfig={testConfig}
        onSave={handleCorrectionSave}
        onClose={() => setShowCorrection(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-semibold">Chi tiết - SBD: {student.studentId}</h3>
              {student.examCode && <p className="text-sm text-gray-500">Mã đề: {student.examCode}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCorrection(true)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sửa đáp án
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
          </div>

          {/* Score summary */}
          {student.score && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <ScoreCard label="Phần I" score={student.score.phanI} />
              <ScoreCard label="Phần II" score={student.score.phanII} />
              <ScoreCard label="Phần III" score={student.score.phanIII} />
            </div>
          )}

          <div className="space-y-6">
            {/* Phan I */}
            <div>
              <h4 className="font-semibold mb-2">Phần I - Trắc nghiệm</h4>
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
                {student.phanI.map((answer, i) => {
                  const correct = testConfig?.phanI.answers[i];
                  const isCorrect = answer && answer === correct;
                  return (
                    <div key={i} className={`p-1.5 rounded text-center text-xs ${
                      !answer ? 'bg-gray-100 text-gray-400' :
                      isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      <span className="font-medium">{i + 1}:</span> {answer || '-'}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phan II */}
            <div>
              <h4 className="font-semibold mb-2">Phần II - Đúng/Sai</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {student.phanII.map((answer, i) => (
                  <div key={i} className="border rounded p-2 text-sm">
                    <span className="font-medium">Câu {i + 1}: </span>
                    {['a', 'b', 'c', 'd'].map((opt) => {
                      const correct = testConfig?.phanII.answers[i]?.[opt];
                      const isCorrect = answer[opt] === correct;
                      return (
                        <span key={opt} className={`inline-block px-1.5 py-0.5 rounded mx-0.5 ${
                          isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {opt.toUpperCase()}: {answer[opt] ? 'Đ' : 'S'}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Phan III */}
            <div>
              <h4 className="font-semibold mb-2">Phần III - Tự luận số</h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {student.phanIII.map((answer, i) => {
                  const correct = testConfig?.phanIII.answers[i];
                  const isCorrect = answer && answer === correct;
                  return (
                    <div key={i} className={`p-2 rounded text-center text-sm ${
                      !answer ? 'bg-gray-100 text-gray-400' :
                      isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      <span className="font-medium">{i + 1}:</span> {answer || '-'}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Debug visualization */}
            {debugImageUrl && (
              <div>
                <h4 className="font-semibold mb-2">Ảnh debug</h4>
                <img src={debugImageUrl} alt="Debug visualization" className="max-w-full h-auto border border-gray-300 rounded" style={{ maxHeight: '400px' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, score }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-900">{score}</div>
    </div>
  );
}
