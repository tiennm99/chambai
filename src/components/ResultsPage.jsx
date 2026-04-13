'use client';

import { useState, useMemo } from 'react';
import { calculateScore } from '@/lib/scoring';
import { calculateClassStatistics } from '@/lib/statistics';
import StudentDetailModal from './student-detail-modal';

export default function ResultsPage({ results: rawResults, config, onResultsUpdate, onResultsClear }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sortKey, setSortKey] = useState('studentId');
  const [sortDir, setSortDir] = useState('asc');
  const [filterText, setFilterText] = useState('');

  // Score all results against current config
  const results = useMemo(() => {
    if (!config) return rawResults;
    return rawResults.map((r) => ({ ...r, score: calculateScore(r, config) }));
  }, [rawResults, config]);

  const handleSort = (key) => {
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
      filtered = results.filter((r) => r.studentId?.toLowerCase().includes(lower));
    }
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'studentId') cmp = (a.studentId || '').localeCompare(b.studentId || '');
      else if (sortKey === 'total') cmp = (a.score?.total ?? 0) - (b.score?.total ?? 0);
      else if (sortKey === 'percentage') cmp = (a.score?.percentage ?? 0) - (b.score?.percentage ?? 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [results, sortKey, sortDir, filterText]);

  const stats = useMemo(() => calculateClassStatistics(results), [results]);

  const clearResults = () => {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả kết quả?')) {
      onResultsClear();
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return;
    const headers = ['SBD', 'Ma de', 'Phan I', 'Phan II', 'Phan III', 'Tong diem', 'Diem toi da', 'Phan tram'];
    const csvContent = [
      headers.join(','),
      ...sortedResults.map((r) => [
        r.studentId, r.examCode || '',
        r.score?.phanI ?? 0, r.score?.phanII ?? 0, r.score?.phanIII ?? 0,
        r.score?.total ?? 0, r.score?.maxTotal ?? 0, r.score?.percentage ?? 0,
      ].join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ket_qua_thi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const selectedData = results.find((r) => r.id === selectedStudent);
  const sortArrow = (key) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Kết quả chấm điểm</h2>
        <div className="flex-1" />
        <button onClick={exportToCSV} disabled={results.length === 0}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            results.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
          }`}>Xuất CSV</button>
        <button onClick={clearResults} disabled={results.length === 0}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            results.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'
          }`}>Xóa kết quả</button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Chưa có kết quả nào. Vui lòng xử lý ảnh trước.</p>
        </div>
      ) : (
        <div>
          {/* Statistics */}
          {stats && <StatisticsSummary stats={stats} />}

          {/* Filter */}
          <div className="mb-4">
            <input type="text" placeholder="Tìm theo SBD..." value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-64 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-sm text-gray-500 ml-3">{sortedResults.length} / {results.length} kết quả</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <ThBtn onClick={() => handleSort('studentId')}>SBD{sortArrow('studentId')}</ThBtn>
                  <Th>Mã đề</Th><Th>Phần I</Th><Th>Phần II</Th><Th>Phần III</Th>
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
                    <Td><ScoreBadge percentage={result.score?.percentage ?? 0} /></Td>
                    <Td>
                      <button onClick={() => setSelectedStudent(result.id)} className="text-blue-600 hover:text-blue-800 text-sm">Xem</button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedStudent && selectedData && (
            <StudentDetailModal student={selectedData} testConfig={config} onClose={() => setSelectedStudent(null)} />
          )}
        </div>
      )}
    </div>
  );
}

// --- Statistics ---

function StatisticsSummary({ stats }) {
  const maxBucket = Math.max(...Object.values(stats.distribution), 1);
  return (
    <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">Thống kê lớp</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <StatCard label="Sĩ số" value={stats.count} />
        <StatCard label="Điểm TB" value={stats.mean} />
        <StatCard label="Trung vị" value={stats.median} />
        <StatCard label="Thấp nhất" value={stats.min} />
        <StatCard label="Cao nhất" value={stats.max} />
      </div>
      <div className="flex items-end gap-2 h-16">
        {Object.entries(stats.distribution).map(([range, count]) => (
          <div key={range} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(count / maxBucket) * 48}px`, minHeight: count > 0 ? '4px' : '0' }} />
            <span className="text-xs text-gray-500 mt-1">{range}%</span>
            <span className="text-xs font-medium">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
    </div>
  );
}

// --- Table helpers ---

function Th({ children }) {
  return <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">{children}</th>;
}
function ThBtn({ children, onClick }) {
  return <th className="px-3 py-2 text-left text-sm font-medium text-gray-700 cursor-pointer hover:text-blue-600" onClick={onClick}>{children}</th>;
}
function Td({ children, className = '' }) {
  return <td className={`px-3 py-2 text-sm text-gray-900 ${className}`}>{children}</td>;
}
function ScoreBadge({ percentage }) {
  const color = percentage >= 80 ? 'bg-green-100 text-green-800' :
    percentage >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{percentage}%</span>;
}
