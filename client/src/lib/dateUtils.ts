import { format, formatDistanceToNow, subDays, isBefore, isAfter } from 'date-fns';
import { ko } from 'date-fns/locale';

// Enum for blog activity status
export enum ApiStatus {
  Active = 'active',
  Inactive = 'inactive'
}

// Check if blog is active based on last post date (active = posted within last 2 weeks)
export function getBlogStatus(lastPostedDate: Date | null | undefined): ApiStatus {
  if (!lastPostedDate) return ApiStatus.Inactive;
  
  const twoWeeksAgo = subDays(new Date(), 14);
  const lastPosted = new Date(lastPostedDate);
  
  return isAfter(lastPosted, twoWeeksAgo) ? ApiStatus.Active : ApiStatus.Inactive;
}

// Format a date to Korean locale format
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '날짜 없음';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'yyyy년 M월 d일', { locale: ko });
  } catch (e) {
    return '날짜 형식 오류';
  }
}

// Format URL to remove protocol and www
export function formatUrl(url: string): string {
  if (!url) return '';
  try {
    return url.replace(/^https?:\/\/(www\.)?/, '');
  } catch (e) {
    return url;
  }
}

// Get relative time (e.g., "3일 전")
export function getRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ko });
  } catch (e) {
    return '';
  }
}
