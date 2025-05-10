import { CheckCircle2, AlertCircle, Link as LinkIcon, ExternalLink, RssIcon, Clock } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Blog } from '@shared/schema';
import { ApiStatus, getBlogStatus, formatDate, formatUrl } from '@/lib/dateUtils';

interface BlogCardProps {
  blog: Blog;
}

export default function BlogCard({ blog }: BlogCardProps) {
  const status = getBlogStatus(blog.lastPosted);
  const isActive = status === ApiStatus.Active;
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition duration-300">
      {/* Blog Header */}
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">{blog.name}</h3>
          {isActive ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>활성</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>비활성</span>
            </Badge>
          )}
        </div>
        <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <LinkIcon className="h-3 w-3 mr-1" />
          <a 
            href={blog.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="truncate hover:text-primary transition"
          >
            {formatUrl(blog.url)}
          </a>
        </div>
      </CardHeader>
      
      {/* Blog Stats */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">최근 포스팅</div>
          <div className="text-sm font-medium flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {blog.lastPosted ? formatDate(blog.lastPosted) : '포스팅 없음'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">총 포스팅</div>
          <div className="text-sm font-medium">{blog.totalPosts || 0}</div>
        </div>
      </div>
      
      {/* Latest Posts */}
      <CardContent className="p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">최신 포스팅</h4>
        {(!blog.posts || blog.posts.length === 0) ? (
          <div className="text-gray-400 dark:text-gray-500 text-sm italic">포스팅이 없습니다</div>
        ) : (
          <ul className="space-y-2">
            {blog.posts.slice(0, 3).map((post) => (
              <li key={post.id}>
                <a 
                  href={post.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-primary transition truncate">
                    {post.title}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatDate(post.date)}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      
      {/* Actions Footer */}
      <CardFooter className="border-t p-3 flex justify-between items-center">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <RssIcon className="h-3 w-3 text-orange-500 mr-1" />
          <span>RSS 등록됨</span>
        </div>
        <a 
          href={blog.url}
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium"
        >
          방문하기
          <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </CardFooter>
    </Card>
  );
}
