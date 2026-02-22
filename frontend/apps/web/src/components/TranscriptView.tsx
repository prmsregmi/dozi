/**
 * Transcript view component
 */

import { useInsightsStore } from '../store/insightsStore';
import { formatTimestamp } from '@dozi/shared';

export default function TranscriptView() {
  const transcripts = useInsightsStore((state) => state.transcripts);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
        <p className="text-sm text-gray-500">
          {transcripts.length} {transcripts.length === 1 ? 'entry' : 'entries'}
        </p>
      </div>

      {/* Transcripts */}
      <div className="flex-1 overflow-y-auto p-4">
        {transcripts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto mb-3 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              <p className="text-sm">No transcripts yet</p>
              <p className="text-xs mt-1">Audio will be transcribed in real-time</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {transcripts.map((transcript, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(transcript.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-800">{transcript.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
