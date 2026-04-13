'use client';

import { useState } from 'react';
import PhanIAnswerGrid from './phan-i-answer-grid';

export default function ConfigurationPage({ config, onConfigChange, onSave, onResetAll }) {
  const [statusMessage, setStatusMessage] = useState(null);

  const showStatus = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const saveConfig = () => {
    onSave(config);
    showStatus('success', 'Cấu hình đã được lưu thành công!');
  };

  const resetAllData = () => {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu? Hành động này không thể hoàn tác.')) {
      onResetAll();
      showStatus('success', 'Đã xóa tất cả dữ liệu!');
    }
  };

  const updatePhanIAnswer = (index, answer) => {
    const newAnswers = [...config.phanI.answers];
    newAnswers[index] = answer;
    onConfigChange({ ...config, phanI: { ...config.phanI, answers: newAnswers } });
  };

  const updatePhanIIAnswer = (questionIndex, option, value) => {
    const newAnswers = [...config.phanII.answers];
    if (!newAnswers[questionIndex]) {
      newAnswers[questionIndex] = { a: false, b: false, c: false, d: false };
    }
    newAnswers[questionIndex][option] = value;
    onConfigChange({ ...config, phanII: { ...config.phanII, answers: newAnswers } });
  };

  const updatePhanIIIAnswer = (index, answer) => {
    const newAnswers = [...config.phanIII.answers];
    newAnswers[index] = answer;
    onConfigChange({ ...config, phanIII: { ...config.phanIII, answers: newAnswers } });
  };

  const updateQuestionCount = (section, count) => {
    onConfigChange({ ...config, [section]: { ...config[section], questionCount: count } });
  };

  const updateScoring = (section, value) => {
    onConfigChange({
      ...config,
      scoring: { ...config.scoring, [section]: { ...config.scoring[section], pointsPerQuestion: parseFloat(value) || 0 } },
    });
  };

  // Paste A,B,C,D answers from spreadsheet
  const handlePasteAnswers = (e) => {
    const text = (e.clipboardData?.getData('text') || '').trim();
    const answers = text.split(/[,\t\n\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => ['A', 'B', 'C', 'D'].includes(s));
    if (answers.length > 0) {
      const newAnswers = answers.slice(0, config.phanI.questionCount);
      onConfigChange({ ...config, phanI: { ...config.phanI, answers: newAnswers } });
      showStatus('success', `Đã dán ${newAnswers.length} đáp án Phần I`);
      e.preventDefault();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 pb-20">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Cấu hình đề thi</h2>

      {statusMessage && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium transition-opacity ${
          statusMessage.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Scoring Config */}
        <ScoringConfig config={config} onUpdate={updateScoring} />

        {/* Phần I */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Phần I - Trắc nghiệm (A, B, C, D)</h3>
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số câu hỏi:</label>
              <input
                type="number"
                value={config.phanI.questionCount}
                onChange={(e) => updateQuestionCount('phanI', parseInt(e.target.value) || 0)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0" max="100"
              />
            </div>
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dán đáp án từ Excel (A,B,C,D...):
              </label>
              <input
                type="text"
                placeholder="Dán danh sách đáp án tại đây"
                onPaste={handlePasteAnswers}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Nhấn vào câu hỏi rồi gõ A/B/C/D trên bàn phím để nhập nhanh. Mũi tên để di chuyển.
          </p>
          <PhanIAnswerGrid
            questionCount={config.phanI.questionCount}
            answers={config.phanI.answers}
            onAnswerChange={updatePhanIAnswer}
          />
        </div>

        {/* Phần II */}
        <PhanIISection config={config} onUpdate={updatePhanIIAnswer} onCountChange={updateQuestionCount} />

        {/* Phần III */}
        <PhanIIISection config={config} onUpdate={updatePhanIIIAnswer} onCountChange={updateQuestionCount} />
      </div>

      {/* Sticky bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10">
        <div className="container mx-auto flex gap-3">
          <button onClick={saveConfig} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Lưu cấu hình
          </button>
          <button onClick={resetAllData} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
            Xóa tất cả dữ liệu
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoringConfig({ config, onUpdate }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">Cấu hình điểm số</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: 'phanI', label: 'Phần I (điểm/câu)', defaultVal: 0.25 },
          { key: 'phanII', label: 'Phần II (điểm/ý)', defaultVal: 0.25 },
          { key: 'phanIII', label: 'Phần III (điểm/câu)', defaultVal: 0.5 },
        ].map(({ key, label, defaultVal }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type="number" step="0.25" min="0"
              value={config.scoring?.[key]?.pointsPerQuestion ?? defaultVal}
              onChange={(e) => onUpdate(key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PhanIISection({ config, onUpdate, onCountChange }) {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Phần II - Đúng/Sai</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Số câu hỏi:</label>
        <input
          type="number"
          value={config.phanII.questionCount}
          onChange={(e) => onCountChange('phanII', parseInt(e.target.value) || 0)}
          className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0" max="50"
        />
      </div>
      <div className="space-y-4">
        {Array.from({ length: config.phanII.questionCount }, (_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-3">Câu {i + 1}:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['a', 'b', 'c', 'd'].map((option) => (
                <div key={option} className="flex items-center gap-2">
                  <span className="text-sm font-medium w-4">{option.toUpperCase()}:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onUpdate(i, option, true)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        config.phanII.answers[i]?.[option] === true
                          ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >Đúng</button>
                    <button
                      onClick={() => onUpdate(i, option, false)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        config.phanII.answers[i]?.[option] === false
                          ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >Sai</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhanIIISection({ config, onUpdate, onCountChange }) {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Phần III - Tự luận số</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Số câu hỏi:</label>
        <input
          type="number"
          value={config.phanIII.questionCount}
          onChange={(e) => onCountChange('phanIII', parseInt(e.target.value) || 0)}
          className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0" max="20"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: config.phanIII.questionCount }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm font-medium w-12">Câu {i + 1}:</span>
            <input
              type="text"
              value={config.phanIII.answers[i] || ''}
              onChange={(e) => onUpdate(i, e.target.value)}
              placeholder="Nhập đáp án số"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
