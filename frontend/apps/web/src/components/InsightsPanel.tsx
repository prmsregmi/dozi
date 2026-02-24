/**
 * Insights panel component - Display battle cards
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useInsightsStore } from '../store/insightsStore';
import { formatAssistMode, getPriorityColor, getPriorityBgColor } from '@dozi/shared';
import { type LucideIcon, Lightbulb, AlertCircle, MessageSquare, TrendingUp } from 'lucide-react';

const insightIcons: Record<string, LucideIcon> = {
  key_point: Lightbulb,
  objection: AlertCircle,
  suggestion: MessageSquare,
  action_item: TrendingUp,
};

export default function InsightsPanel() {
  const battleCard = useInsightsStore((state) => state.battleCard);
  const mode = useInsightsStore((state) => state.mode);

  if (!battleCard) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Insights</h2>
          <p className="text-sm text-gray-500">Mode: {formatAssistMode(mode)}</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-gray-400">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Waiting for insights...</p>
            <p className="text-xs mt-1">Start speaking to generate battle cards</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Battle Card</h2>
        <p className="text-sm text-gray-500">Mode: {formatAssistMode(battleCard.mode)}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Summary */}
        {battleCard.summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
            <p className="text-sm text-blue-800">{battleCard.summary}</p>
          </motion.div>
        )}

        {/* Insights */}
        {battleCard.insights.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Insights ({battleCard.insights.length})
            </h3>
            <div className="space-y-3">
              <AnimatePresence>
                {battleCard.insights.map((insight, index) => {
                  const Icon = insightIcons[insight.type] || Lightbulb;
                  const priorityColor = getPriorityColor(insight.priority);
                  const priorityBg = getPriorityBgColor(insight.priority);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`${priorityBg} border border-gray-200 rounded-lg p-3`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 ${priorityColor} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-700 uppercase">
                              {insight.type.replace('_', ' ')}
                            </span>
                            <span
                              className={`text-xs font-semibold ${priorityColor} uppercase`}
                            >
                              {insight.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800">{insight.content}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {battleCard.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <h3 className="font-semibold text-green-900 mb-2">Recommendations</h3>
            <ul className="space-y-2">
              {battleCard.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-green-800">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}
