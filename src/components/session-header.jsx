'use client';

/**
 * Header bar showing active session name with back-to-list button.
 */
export default function SessionHeader({ session, onBack }) {
  return (
    <div className="flex items-center gap-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
      <button
        onClick={onBack}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        &larr; Danh sách phiên
      </button>
      <span className="text-gray-400">|</span>
      <h2 className="font-semibold text-blue-900">{session.name}</h2>
      <span className="text-sm text-blue-600">{session.date}</span>
    </div>
  );
}
