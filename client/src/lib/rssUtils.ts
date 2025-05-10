import { RssFeedResponse, RssItem, Post } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// Parse RSS feed XML string to structured data
export async function parseFeed(feedXml: string): Promise<RssFeedResponse> {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(feedXml, "text/xml");
    
    // 디버깅을 위한 전체 XML 구조 로깅
    console.log('XML Structure:', {
      docElement: xmlDoc.documentElement.tagName,
      rootChildren: Array.from(xmlDoc.documentElement.children).map(el => el.tagName),
      hasRss: xmlDoc.getElementsByTagName('rss').length,
      hasAtom: xmlDoc.getElementsByTagName('feed').length,
      hasChannel: xmlDoc.getElementsByTagName('channel').length,
      hasItems: xmlDoc.getElementsByTagName('item').length,
      hasEntries: xmlDoc.getElementsByTagName('entry').length
    });
    
    // Try to detect feed type (RSS or Atom)
    const isAtom = xmlDoc.getElementsByTagName('feed').length > 0;
    const isRss = xmlDoc.getElementsByTagName('rss').length > 0 || xmlDoc.getElementsByTagName('channel').length > 0;
    
    console.log('Feed type detection:', { isAtom, isRss });
    
    let feedTitle = '';
    let feedDescription = '';
    let feedLink = '';
    
    // 네이버 블로그 특수 처리
    const isNaverBlog = feedXml.includes('blog.naver.com') || feedXml.includes('rss.blog.naver.com');
    
    if (isNaverBlog) {
      console.log('Detected Naver blog feed, applying special handling');
      // 네이버 블로그는 채널 정보가 다른 위치에 있을 수 있음
      feedTitle = xmlDoc.querySelector('channel > title')?.textContent || 
                 xmlDoc.querySelector('title')?.textContent || '';
      feedDescription = xmlDoc.querySelector('channel > description')?.textContent || 
                       xmlDoc.querySelector('description')?.textContent || '';
      feedLink = xmlDoc.querySelector('channel > link')?.textContent || 
                xmlDoc.querySelector('link')?.textContent || '';
    } else if (isAtom) {
      feedTitle = xmlDoc.querySelector('feed > title')?.textContent || '';
      feedDescription = xmlDoc.querySelector('feed > subtitle')?.textContent || '';
      feedLink = xmlDoc.querySelector('feed > link[rel="alternate"]')?.getAttribute('href') || 
                xmlDoc.querySelector('feed > link')?.getAttribute('href') || '';
    } else {
      feedTitle = xmlDoc.querySelector('channel > title')?.textContent || '';
      feedDescription = xmlDoc.querySelector('channel > description')?.textContent || '';
      feedLink = xmlDoc.querySelector('channel > link')?.textContent || '';
    }
    
    console.log('Feed info:', { feedTitle, feedLink });
    
    // Get feed items - try different selectors for different feed types
    let itemElements: Element[] = [];
    
    if (isNaverBlog) {
      // 네이버 블로그 전용 처리
      itemElements = Array.from(xmlDoc.getElementsByTagName('item'));
      if (itemElements.length === 0) {
        // 다른 방법으로 시도
        itemElements = Array.from(xmlDoc.querySelectorAll('channel > item'));
      }
    } else if (isAtom) {
      itemElements = Array.from(xmlDoc.getElementsByTagName('entry'));
    } else {
      itemElements = Array.from(xmlDoc.getElementsByTagName('item'));
    }
    
    console.log(`Found ${itemElements.length} items in the feed`);
    
    // 항목이 없을 경우 직접 XPath로 찾아보기
    if (itemElements.length === 0) {
      console.log('No items found, trying XPath queries');
      const xpathResult = document.evaluate('//item | //entry', xmlDoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      const items = [];
      for (let i = 0; i < xpathResult.snapshotLength; i++) {
        items.push(xpathResult.snapshotItem(i) as Element);
      }
      itemElements = items;
      console.log(`Found ${itemElements.length} items using XPath`);
    }
    
    const items: RssItem[] = itemElements.map((item, index) => {
      // 네이버 블로그 전용 처리
      if (isNaverBlog) {
        console.log(`Naver blog item ${index} structure:`, {
          tags: Array.from(item.children).map(el => el.tagName),
          hasTitle: item.querySelector('title') !== null,
          hasLink: item.querySelector('link') !== null,
          hasPubDate: item.querySelector('pubDate') !== null
        });
      }
      
      let title = '';
      let link = '';
      let pubDate = '';
      let content = '';
      let guid = '';
      
      if (isNaverBlog) {
        title = item.querySelector('title')?.textContent || '';
        link = item.querySelector('link')?.textContent || '';
        pubDate = item.querySelector('pubDate')?.textContent || '';
        content = item.querySelector('description')?.textContent || '';
        guid = item.querySelector('guid')?.textContent || link;
      } else if (isAtom) {
        title = item.querySelector('title')?.textContent || '';
        link = item.querySelector('link[rel="alternate"]')?.getAttribute('href') || 
               item.querySelector('link')?.getAttribute('href') || '';
        pubDate = item.querySelector('published')?.textContent || 
                 item.querySelector('updated')?.textContent || '';
        content = item.querySelector('content')?.textContent || '';
        guid = item.querySelector('id')?.textContent || '';
      } else {
        title = item.getElementsByTagName('title')[0]?.textContent || '';
        link = item.getElementsByTagName('link')[0]?.textContent || '';
        pubDate = item.getElementsByTagName('pubDate')[0]?.textContent || '';
        content = item.getElementsByTagName('description')[0]?.textContent || '';
        guid = item.getElementsByTagName('guid')[0]?.textContent || '';
      }
        
      const contentSnippet = content?.substring(0, 150) || '';
      
      // 네이버 블로그의 경우 직접 날짜 포맷을 처리
      let isoDate = pubDate;
      try {
        if (pubDate) {
          // 네이버 블로그 특수 처리
          if (isNaverBlog && pubDate.includes('+0900')) {
            // 네이버 날짜 형식: Wed, 24 Apr 2024 21:18:33 +0900
            pubDate = pubDate.replace('+0900', '+09:00');
          }
          
          const parsedDate = new Date(pubDate);
          if (!isNaN(parsedDate.getTime())) {
            isoDate = parsedDate.toISOString();
          } else {
            console.error('Invalid date format for:', pubDate);
            // 날짜 해석 실패시 현재 날짜 사용
            isoDate = new Date().toISOString();
          }
          
          // 디버깅 로그
          if (index === 0) {
            console.log('First post date info:', {
              original: pubDate,
              parsed: parsedDate.toString(),
              isoDate: isoDate,
              timestamp: parsedDate.getTime(),
              isValid: !isNaN(parsedDate.getTime())
            });
          }
        } else {
          // 날짜 정보가 없는 경우 현재 날짜로 설정
          isoDate = new Date().toISOString();
        }
      } catch (e) {
        console.error('Date parsing error:', e, 'for date:', pubDate);
        // 에러 발생 시 현재 날짜로 설정
        isoDate = new Date().toISOString();
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
    
    if (items.length > 0) {
      console.log(`Processed ${items.length} items with first item date:`, items[0]?.isoDate);
    } else {
      console.warn('No items were found in the feed');
    }
    
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
