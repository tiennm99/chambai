'use client';

import { useState, useEffect } from 'react';

interface TestConfig {
  phanI: {
    questionCount: number;
    answers: string[];
  };
  phanII: {
    questionCount: number;
    answers: Array<{ a: boolean; b: boolean; c: boolean; d: boolean }>;
  };
  phanIII: {
    questionCount: number;
    answers: string[];
  };
}

export default function ConfigurationPage() {
  const [config, setConfig] = useState<TestConfig>({
    phanI: { questionCount: 40, answers: [] },
    phanII: { questionCount: 8, answers: [] },
    phanIII: { questionCount: 6, answers: [] },
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('testConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const saveConfig = () => {
    localStorage.setItem('testConfig', JSON.stringify(config));
    alert('Cấu hình đã được lưu thành công!');
  };

  const resetAllData = () => {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu? Hành động này không thể hoàn tác.')) {
      localStorage.clear();
      setConfig({
        phanI: { questionCount: 40, answers: [] },
        phanII: { questionCount: 8, answers: [] },
        phanIII: { questionCount: 6, answers: [] },
      });
      alert('Đã xóa tất cả dữ liệu!');
    }
  };

  const updatePhanIAnswer = (index: number, answer: string) => {
    const newAnswers = [...config.phanI.answers];
    newAnswers[index] = answer;
    setConfig({
      ...config,
      phanI: { ...config.phanI, answers: newAnswers },
    });
  };

  const updatePhanIIAnswer = (questionIndex: number, option: 'a' | 'b' | 'c' | 'd', value: boolean) => {
    const newAnswers = [...config.phanII.answers];
    if (!newAnswers[questionIndex]) {
      newAnswers[questionIndex] = { a: false, b: false, c: false, d: false };
    }
    newAnswers[questionIndex][option] = value;
    setConfig({
      ...config,
      phanII: { ...config.phanII, answers: newAnswers },
    });
  };

  const updatePhanIIIAnswer = (index: number, answer: string) => {
    const newAnswers = [...config.phanIII.answers];
    newAnswers[index] = answer;
    setConfig({
      ...config,
      phanIII: { ...config.phanIII, answers: newAnswers },
    });
  };

  const updateQuestionCount = (section: 'phanI' | 'phanII' | 'phanIII', count: number) => {
    setConfig({
      ...config,
      [section]: { ...config[section], questionCount: count },
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cấu hình đề thi</h2>
        <div className="flex gap-4">
          <button
            onClick={saveConfig}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Lưu cấu hình
          </button>
          <button
            onClick={resetAllData}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Xóa tất cả dữ liệu
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Phần I - Trắc nghiệm */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Phần I - Trắc nghiệm (A, B, C, D)</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số câu hỏi:
            </label>
            <input
              type="number"
              value={config.phanI.questionCount}
              onChange={(e) => updateQuestionCount('phanI', parseInt(e.target.value) || 0)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: config.phanI.questionCount }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm font-medium w-12">Câu {i + 1}:</span>
                <div className="flex gap-1">
                  {['A', 'B', 'C', 'D'].map((option) => (
                    <button
                      key={option}
                      onClick={() => updatePhanIAnswer(i, option)}
                      className={`w-8 h-8 rounded border-2 text-sm font-medium transition-colors ${
                        config.phanI.answers[i] === option
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
        </div>

        {/* Phần II - Đúng/Sai */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Phần II - Đúng/Sai</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số câu hỏi:
            </label>
            <input
              type="number"
              value={config.phanII.questionCount}
              onChange={(e) => updateQuestionCount('phanII', parseInt(e.target.value) || 0)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="50"
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
                          onClick={() => updatePhanIIAnswer(i, option as 'a' | 'b' | 'c' | 'd', true)}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            config.phanII.answers[i]?.[option as 'a' | 'b' | 'c' | 'd'] === true
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Đúng
                        </button>
                        <button
                          onClick={() => updatePhanIIAnswer(i, option as 'a' | 'b' | 'c' | 'd', false)}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            config.phanII.answers[i]?.[option as 'a' | 'b' | 'c' | 'd'] === false
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Sai
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phần III - Tự luận số */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Phần III - Tự luận số</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số câu hỏi:
            </label>
            <input
              type="number"
              value={config.phanIII.questionCount}
              onChange={(e) => updateQuestionCount('phanIII', parseInt(e.target.value) || 0)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="20"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: config.phanIII.questionCount }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm font-medium w-12">Câu {i + 1}:</span>
                <input
                  type="text"
                  value={config.phanIII.answers[i] || ''}
                  onChange={(e) => updatePhanIIIAnswer(i, e.target.value)}
                  placeholder="Nhập đáp án số"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}