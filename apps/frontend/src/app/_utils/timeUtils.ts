import { formatDistanceToNow } from 'date-fns';

export function timeSinceNow(date: Date, abbreviated = true): string {
  const distanceToNow = formatDistanceToNow(date, { addSuffix: true });
  return !abbreviated ? 
    distanceToNow :
    distanceToNow
      .replace('about', '')
      .replace(/minutes?/, 'min')  
      .replace(/hours?/, 'h')      
      .replace(/days?/, 'd')       
}

export const formatMs= (ms: number): string => {

  const second = 1000;
  const minute = 60 * second;
  const hour = 60 * minute;

  const hours = Math.floor(ms / hour);
  const minutes = Math.floor((ms % hour) / minute);
  const seconds = Math.floor((ms % minute) / second); 

  const formattedHours = hours > 0 ? String(hours).padStart(2, '0') : ''; // Add hours only if greater than 0
  const formattedMinutes = String(minutes).padStart(2, '0'); // Ensure two-digit format
  const formattedSeconds = String(seconds).padStart(2, '0'); // Ensure two-digit format

  return hours > 0 ? `${formattedHours}:${formattedMinutes}:${formattedSeconds}` : `${formattedMinutes}:${formattedSeconds}`;
};

