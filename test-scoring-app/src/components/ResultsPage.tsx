'use client';

import { useState, useEffect } from 'react';

interface StudentResult {
  id: string;
  fileName: string;
  studentId: string;
  phanI: string[];
  phanII: Array<{ a: boolean; b: boolean; c: boolean; d: boolean }>;
  phanIII: string[];
  score?: {
    phanI: number;
    phanII: number;
    phanIII: number;
    total: number;
    percentage: number;
  };
}

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

export default function ResultsPage() {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  useEffect(() => {
    const savedResults = localStorage.getItem('studentResults');
    const savedConfig = localStorage.getItem('testConfig');
    
    if (savedResults && savedConfig) {
      const resultsData = JSON.parse(savedResults);
      const configData = JSON.parse(savedConfig);
      
      setTestConfig(configData);
      
      // Calculate scores
      const scoredResults = resultsData.map((result: StudentResult) => ({
        ...result,
        score: calculateScore(result, configData),
      }));
      
      setResults(scoredResults);
    }
  }, []);

  const calculateScore = (studentResult: StudentResult, config: TestConfig) => {
    let phanIScore = 0;
    let phanIIScore = 0;
    let phanIIIScore = 0;

    // Calculate Phan I score
    for (let i = 0; i < config.phanI.questionCount; i++) {
      if (studentResult.phanI[i] === config.phanI.answers[i]) {
        phanIScore++;
      }
    }

    // Calculate Phan II score
    for (let i = 0; i < config.phanII.questionCount; i++) {
      if (studentResult.phanII[i] && config.phanII.answers[i]) {
        const student = studentResult.phanII[i];
        const correct = config.phanII.answers[i];
        
        if (
          student.a === correct.a &&
          student.b === correct.b &&
          student.c === correct.c &&
          student.d === correct.d
        ) {
          phanIIScore++;
        }
      }
    }

    // Calculate Phan III score
    for (let i = 0; i < config.phanIII.questionCount; i++) {
      if (studentResult.phanIII[i] === config.phanIII.answers[i]) {
        phanIIIScore++;
      }
    }

    const totalQuestions = config.phanI.questionCount + config.phanII.questionCount + config.phanIII.questionCount;
    const totalScore = phanIScore + phanIIScore + phanIIIScore;
    const percentage = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;

    return {
      phanI: phanIScore,
      phanII: phanIIScore,
      phanIII: phanIIIScore,
      total: totalScore,
      percentage: Math.round(percentage * 100) / 100,
    };
  };

  const exportToCSV = () => {
    if (results.length === 0) {
      alert('Không có dữ liệu để xuất.');
      return;
    }

    const headers = ['Mã học sinh', 'Tổng điểm', 'Phần trăm'];
    
    // Add detailed question headers
    if (testConfig) {
      for (let i = 1; i <= testConfig.phanI.questionCount; i++) {
        headers.push(`P1_Q${i}`);
      }
      for (let i = 1; i <= testConfig.phanII.questionCount; i++) {
        headers.push(`P2_Q${i}_a`, `P2_Q${i}_b`, `P2_Q${i}_c`, `P2_Q${i}_d`);
      }
      for (let i = 1; i <= testConfig.phanIII.questionCount; i++) {
        headers.push(`P3_Q${i}`);
      }
    }

    const csvContent = [
      headers.join(','),
      ...results.map(result => {
        const row = [
          result.studentId,
          result.score?.total || 0,
          result.score?.percentage || 0,
        ];
        
        // Add detailed answers
        if (testConfig) {
          // Phan I answers
          for (let i = 0; i < testConfig.phanI.questionCount; i++) {
            row.push(result.phanI[i] || '');
          }
          
          // Phan II answers
          for (let i = 0; i < testConfig.phanII.questionCount; i++) {
            const answer = result.phanII[i];
            if (answer) {
              row.push(answer.a.toString(), answer.b.toString(), answer.c.toString(), answer.d.toString());
            } else {
              row.push('', '', '', '');
            }
          }
          
          // Phan III answers
          for (let i = 0; i < testConfig.phanIII.questionCount; i++) {
            row.push(result.phanIII[i] || '');
          }
        }
        
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ket_qua_thi_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedStudentData = results.find(r => r.id === selectedStudent);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Kết quả chấm điểm</h2>
        <button
          onClick={exportToCSV}
          disabled={results.length === 0}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            results.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          Xuất CSV
        </button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Chưa có kết quả nào. Vui lòng xử lý ảnh trước.</p>
        </div>
      ) : (
        <div>
          {/* Summary Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Tổng quan kết quả</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Mã học sinh
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Phần I
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Phần II
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Phần III
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Tổng điểm
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Phần trăm
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {result.studentId}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {result.score?.phanI || 0}/{testConfig?.phanI.questionCount || 0}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {result.score?.phanII || 0}/{testConfig?.phanII.questionCount || 0}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {result.score?.phanIII || 0}/{testConfig?.phanIII.questionCount || 0}
                      </td>
                      <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                        {result.score?.total || 0}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {result.score?.percentage || 0}%
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <button
                          onClick={() => setSelectedStudent(result.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Detail Modal */}
          {selectedStudent && selectedStudentData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">
                      Chi tiết bài thi - {selectedStudentData.studentId}
                    </h3>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Phan I */}
                    <div>
                      <h4 className="font-semibold mb-2">Phần I - Trắc nghiệm</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {selectedStudentData.phanI.map((answer, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded text-center text-sm ${
                              answer === testConfig?.phanI.answers[i]
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {i + 1}: {answer}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Phan II */}
                    <div>
                      <h4 className="font-semibold mb-2">Phần II - Đúng/Sai</h4>
                      <div className="space-y-2">
                        {selectedStudentData.phanII.map((answer, i) => (
                          <div key={i} className="border rounded p-2">
                            <div className="font-medium mb-1">Câu {i + 1}:</div>
                            <div className="flex gap-4 text-sm">
                              {['a', 'b', 'c', 'd'].map((option) => (
                                <span
                                  key={option}
                                  className={`px-2 py-1 rounded ${
                                    answer[option as keyof typeof answer] === 
                                    testConfig?.phanII.answers[i]?.[option as keyof typeof answer]
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {option.toUpperCase()}: {answer[option as keyof typeof answer] ? 'Đúng' : 'Sai'}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Phan III */}
                    <div>
                      <h4 className="font-semibold mb-2">Phần III - Tự luận số</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedStudentData.phanIII.map((answer, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded text-center text-sm ${
                              answer === testConfig?.phanIII.answers[i]
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {i + 1}: {answer}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}