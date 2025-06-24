import { ScoredTrack } from "@frontend/shared";

/**
 * Rotates the queue forward (standard rotation)
 * Moves the first track to the end with score reset to 0
 */
export const rotateQueueForward = (queue: ScoredTrack[]): ScoredTrack[] => {
  if (queue.length === 0) return queue;
  return [...queue.slice(1), { ...queue[0], score: 0 }];
};

/**
 * Rotates the queue backward (opposite rotation)
 * Moves the last track to the beginning with score reset to 0
 */
export const rotateQueueBackward = (queue: ScoredTrack[]): ScoredTrack[] => {
  if (queue.length === 0) return queue;
  const lastIndex = queue.length - 1;
  return [{ ...queue[lastIndex], score: 0 }, ...queue.slice(0, lastIndex)];
};
