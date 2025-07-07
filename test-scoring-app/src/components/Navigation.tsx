interface NavigationProps {
  currentPage: 'config' | 'upload' | 'results';
  onPageChange: (page: 'config' | 'upload' | 'results') => void;
}

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const buttons = [
    { key: 'config', label: '1. Cấu hình đề thi', description: 'Thiết lập câu hỏi và đáp án' },
    { key: 'upload', label: '2. Tải và xử lý ảnh', description: 'Nhận diện bài thi' },
    { key: 'results', label: '3. Kết quả', description: 'Xem điểm và xuất CSV' },
  ] as const;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {buttons.map((button) => (
          <button
            key={button.key}
            onClick={() => onPageChange(button.key)}
            className={`flex-1 p-4 rounded-lg text-left transition-all duration-200 ${
              currentPage === button.key
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="font-semibold text-lg">{button.label}</div>
            <div className={`text-sm mt-1 ${
              currentPage === button.key ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {button.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}