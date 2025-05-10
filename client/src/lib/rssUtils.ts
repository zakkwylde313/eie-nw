import { RssFeedResponse, RssItem, Post } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// Parse RSS feed XML string to structured data
export async function parseFeed(feedXml: string): Promise<RssFeedResponse> {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(feedXml, "text/xml");
    
    // Try to detect feed type (RSS or Atom)
    const isAtom = xmlDoc.getElementsByTagName('feed').length > 0;
    
    const feedTitle = isAtom 
      ? xmlDoc.querySelector('feed > title')?.textContent || ''
      : xmlDoc.querySelector('channel > title')?.textContent || '';
      
    const feedDescription = isAtom
      ? xmlDoc.querySelector('feed > subtitle')?.textContent || ''
      : xmlDoc.querySelector('channel > description')?.textContent || '';
      
    const feedLink = isAtom
      ? xmlDoc.querySelector('feed > link[rel="alternate"]')?.getAttribute('href') || 
        xmlDoc.querySelector('feed > link')?.getAttribute('href') || ''
      : xmlDoc.querySelector('channel > link')?.textContent || '';
    
    // Get feed items
    const itemElements = isAtom 
      ? Array.from(xmlDoc.getElementsByTagName('entry'))
      : Array.from(xmlDoc.getElementsByTagName('item'));
    
    const items: RssItem[] = itemElements.map(item => {
      const title = isAtom
        ? item.querySelector('title')?.textContent || ''
        : item.getElementsByTagName('title')[0]?.textContent || '';
        
      const link = isAtom
        ? item.querySelector('link[rel="alternate"]')?.getAttribute('href') || 
          item.querySelector('link')?.getAttribute('href') || ''
        : item.getElementsByTagName('link')[0]?.textContent || '';
        
      const pubDate = isAtom
        ? item.querySelector('published')?.textContent || 
          item.querySelector('updated')?.textContent || ''
        : item.getElementsByTagName('pubDate')[0]?.textContent || '';
        
      const content = isAtom
        ? item.querySelector('content')?.textContent || ''
        : item.getElementsByTagName('description')[0]?.textContent || '';
        
      const contentSnippet = content?.substring(0, 150) || '';
      
      const guid = isAtom
        ? item.querySelector('id')?.textContent || ''
        : item.getElementsByTagName('guid')[0]?.textContent || '';
        
      // Try to standardize date format to ISO
      let isoDate = pubDate;
      try {
        if (pubDate) {
          isoDate = new Date(pubDate).toISOString();
        }
      } catch (e) {
        // Just keep original date if parsing fails
      }
      
      return {
        title,
        link,
        pubDate,
        content,
        contentSnippet,
        guid,
        isoDate
      };
    });
    
    return {
      title: feedTitle,
      description: feedDescription,
      link: feedLink,
      items
    };
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    throw new Error('Failed to parse RSS feed');
  }
}

// Fetch RSS feed via proxy to avoid CORS issues
export async function fetchFeed(rssUrl: string): Promise<RssFeedResponse> {
  try {
    const response = await fetch(`/api/proxy/rss?url=${encodeURIComponent(rssUrl)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }
    
    const feedXml = await response.text();
    return parseFeed(feedXml);
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    throw new Error('Failed to fetch RSS feed');
  }
}

// Convert RSS items to post objects
export function rssToPosts(rssItems: RssItem[]): Post[] {
  return rssItems.map(item => {
    const date = item.isoDate ? new Date(item.isoDate) : new Date();
    return {
      id: item.guid || `${item.link}-${date.getTime()}`,
      title: item.title,
      url: item.link,
      date
    };
  });
}
