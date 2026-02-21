/**
 * Utility functions for formatting data
 */

import { AssistMode, InsightPriority } from '../types';

/**
 * Format assist mode for display
 */
export function formatAssistMode(mode: AssistMode): string {
  const labels: Record<AssistMode, string> = {
    [AssistMode.MEETING]: 'Meeting',
    [AssistMode.CALL]: 'Call',
    [AssistMode.INTERVIEW]: 'Interview',
  };
  return labels[mode];
}

/**
 * Get color class for priority
 */
export function getPriorityColor(priority: InsightPriority): string {
  const colors: Record<InsightPriority, string> = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-gray-600',
  };
  return colors[priority];
}

/**
 * Get background color class for priority
 */
export function getPriorityBgColor(priority: InsightPriority): string {
  const colors: Record<InsightPriority, string> = {
    high: 'bg-red-100',
    medium: 'bg-yellow-100',
    low: 'bg-gray-100',
  };
  return colors[priority];
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  } catch {
    return timestamp;
  }
}
