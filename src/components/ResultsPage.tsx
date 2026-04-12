'use client';

import { useState, useEffect, useMemo } from 'react';
import type { StudentResult, TestConfig } from '@/types';
import { calculateScore } from '@/lib/scoring';

type SortKey = 'studentId' | 'total' | 'percentage';
type SortDir = 'asc' | 'desc';

export default function ResultsPage() {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('studentId');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    const savedResults = localStorage.getItem('studentResults');
    const savedConfig = localStorage.getItem('testConfig');

    if (savedResults && savedConfig) {
      const resultsData: StudentResult[] = JSON.parse(savedResults);
      const configData: TestConfig = JSON.parse(savedConfig);
      setTestConfig(configData);

      const scoredResults = resultsData.map((r) => ({
        ...r,
        score: calculateScore(r, configData),
      }));
      setResults(scoredResults);
    }
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedResults = useMemo(() => {
    let filtered = results;
    if (filterText) {
      const lower = filterText.toLowerCase();
      filtered = results.filter((r) => r.studentId.toLowerCase().includes(lower));
    }

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'studentId':
          cmp = a.studentId.localeCompare(b.studentId);
          break;
        case 'total':
          cmp = (a.score?.total ?? 0) - (b.score?.total ?? 0);
          break;
        case 'percentage':
          cmp = (a.score?.percentage ?? 0) - (b.score?.percentage ?? 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [results, sortKey, sortDir, filterText]);

  const clearResults = () => {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả kết quả?')) {
      localStorage.removeItem('studentResults');
      setResults([]);
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return;

    const headers = ['SBD', 'Ma de', 'Phan I', 'Phan II', 'Phan III', 'Tong diem', 'Diem toi da', 'Phan tram'];

    const csvContent = [
      headers.join(','),
      ...sortedResults.map((r) =>
        [
          r.studentId,
          r.examCode || '',
          r.score?.phanI ?? 0,
          r.score?.phanII ?? 0,
          r.score?.phanIII ?? 0,
          r.score?.total ?? 0,
          r.score?.maxTotal ?? 0,
          r.score?.percentage ?? 0,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ket_qua_thi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const selectedData = results.find((r) => r.id === selectedStudent);
  const sortArrow = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Kết quả chấm điểm</h2>
        <div className="flex-1" />
        <button
          onClick={exportToCSV}
          disabled={results.length === 0}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            results.length === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          Xuất CSV
        </button>
        <button
          onClick={clearResults}
          disabled={results.length === 0}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            results.length === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          Xóa kết quả
        </button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Chưa có kết quả nào. Vui lòng xử lý ảnh trước.</p>
        </div>
      ) : (
        <div>
          {/* Filter */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Tìm theo SBD..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-64 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500 ml-3">
              {sortedResults.length} / {results.length} kết quả
            </span>
          </div>

          {/* Summary Table */}
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <ThBtn onClick={() => handleSort('studentId')}>SBD{sortArrow('studentId')}</ThBtn>
                  <Th>Mã đề</Th>
                  <Th>Phần I</Th>
                  <Th>Phần II</Th>
                  <Th>Phần III</Th>
                  <ThBtn onClick={() => handleSort('total')}>Tổng{sortArrow('total')}</ThBtn>
                  <ThBtn onClick={() => handleSort('percentage')}>%{sortArrow('percentage')}</ThBtn>
                  <Th>Chi tiết</Th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((result) => (
                  <tr key={result.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <Td>{result.studentId}</Td>
                    <Td>{result.examCode || '-'}</Td>
                    <Td>{result.score?.phanI ?? 0}</Td>
                    <Td>{result.score?.phanII ?? 0}</Td>
                    <Td>{result.score?.phanIII ?? 0}</Td>
                    <Td className="font-semibold">{result.score?.total ?? 0}/{result.score?.maxTotal ?? 0}</Td>
                    <Td>
                      <ScoreBadge percentage={result.score?.percentage ?? 0} />
                    </Td>
                    <Td>
                      <button
                        onClick={() => setSelectedStudent(result.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Xem
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Student Detail Modal */}
          {selectedStudent && selectedData && (
            <StudentDetailModal
              student={selectedData}
              testConfig={testConfig}
              onClose={() => setSelectedStudent(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function StudentDetailModal({
  student,
  testConfig,
  onClose,
}: {
  student: StudentResult;
  testConfig: TestConfig | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-semibold">Chi tiết - SBD: {student.studentId}</h3>
              {student.examCode && (
                <p className="text-sm text-gray-500">Mã đề: {student.examCode}</p>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
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
                    <div
                      key={i}
                      className={`p-1.5 rounded text-center text-xs ${
                        !answer ? 'bg-gray-100 text-gray-400' :
                        isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
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
                    {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                      const correct = testConfig?.phanII.answers[i]?.[opt];
                      const isCorrect = answer[opt] === correct;
                      return (
                        <span
                          key={opt}
                          className={`inline-block px-1.5 py-0.5 rounded mx-0.5 ${
                            isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
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
                    <div
                      key={i}
                      className={`p-2 rounded text-center text-sm ${
                        !answer ? 'bg-gray-100 text-gray-400' :
                        isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <span className="font-medium">{i + 1}:</span> {answer || '-'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Small UI components ---

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">{children}</th>;
}

function ThBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <th className="px-3 py-2 text-left text-sm font-medium text-gray-700 cursor-pointer hover:text-blue-600" onClick={onClick}>
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 text-sm text-gray-900 ${className}`}>{children}</td>;
}

function ScoreBadge({ percentage }: { percentage: number }) {
  const color = percentage >= 80 ? 'bg-green-100 text-green-800' :
                percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {percentage}%
    </span>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-900">{score}</div>
    </div>
  );
}
