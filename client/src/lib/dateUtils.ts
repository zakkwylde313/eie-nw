import { format, formatDistanceToNow, subDays, isBefore, isAfter, parse } from 'date-fns';
import { ko } from 'date-fns/locale';

// Enum for blog activity status
export enum ApiStatus {
  Active = 'active',
  Inactive = 'inactive'
}

// 챌린지 시작일 (2025년 5월 10일)
export const CHALLENGE_START_DATE = new Date(2025, 4, 10); // 월은 0부터 시작하므로 5월은 4

// Check if blog is active based on last post date (active = posted within last 2 weeks)
export function getBlogStatus(lastPostedDate: Date | null | undefined): ApiStatus {
  if (!lastPostedDate) return ApiStatus.Inactive;
  
  const twoWeeksAgo = subDays(new Date(), 14);
  const lastPosted = new Date(lastPostedDate);
  
  return isAfter(lastPosted, twoWeeksAgo) ? ApiStatus.Active : ApiStatus.Inactive;
}

// 챌린지 시작일 이후의 포스트 수 계산
export function getPostsAfterChallengeStart(posts: { date: Date }[] | null | undefined): number {
  if (!posts || posts.length === 0) return 0;
  
  return posts.filter(post => {
    const postDate = new Date(post.date);
    return isAfter(postDate, CHALLENGE_START_DATE) || 
           postDate.getTime() === CHALLENGE_START_DATE.getTime();
  }).length;
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
