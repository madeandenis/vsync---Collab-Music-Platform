import { ScoredTrack } from "@frontend/shared";

/**
 * Moves the first track to the end with score reset to 0
 */
export function rotateQueueForward(queue: ScoredTrack[]): ScoredTrack[] {
  if (queue.length <= 1) return queue;

  const [first, ...rest] = queue;
  return [...rest, { ...first, score: 0 }];
}

/**
 * Moves the last track to the beginning with score reset to 0
 */
export function rotateQueueBackward(queue: ScoredTrack[]): ScoredTrack[] {
  if (queue.length <= 1) return queue;

  const lastIndex = queue.length - 1;
  const last = queue[lastIndex];
  const rest = queue.slice(0, lastIndex);

  return [{ ...last, score: 0 }, ...rest];
};
