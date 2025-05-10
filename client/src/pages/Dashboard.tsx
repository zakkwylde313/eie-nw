import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Newspaper, RefreshCw, InfoIcon, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Blog, RssFeedResponse } from '@shared/schema';
import { ApiStatus, getBlogStatus, formatDate, formatUrl } from '@/lib/dateUtils';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import BlogCard from '@/components/BlogCard';
import StatsCards from '@/components/StatsCards';
import AddBlogModal from '@/components/AddBlogModal';
import { parseFeed } from '@/lib/rssUtils';

export default function Dashboard() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('rank');
  const [isAddBlogModalOpen, setIsAddBlogModalOpen] = useState(false);

  const {
    data: blogs = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Blog[]>({
    queryKey: ['/api/blogs'],
  });
  
  const refreshAllFeeds = async () => {
    try {
      // Trigger a hard refresh
      await queryClient.invalidateQueries({ queryKey: ['/api/blogs'] });
      toast({
        title: "새로고침 완료",
        description: "모든 블로그 정보가 갱신되었습니다.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "새로고침 실패",
        description: "블로그 정보를 갱신하는데 문제가 발생했습니다.",
      });
    }
  };

  // Filter and sort blogs
  const filteredBlogs = blogs
    .filter(blog => {
      if (statusFilter === 'all') return true;
      const status = getBlogStatus(blog.lastPosted);
      return statusFilter === 'active' ? status === ApiStatus.Active : status === ApiStatus.Inactive;
    })
    .sort((a, b) => {
      if (sortOption === 'date') {
        return new Date(b.lastPosted || 0).getTime() - new Date(a.lastPosted || 0).getTime();
      } else {
        return a.name.localeCompare(b.name);
      }
    });
  
  // Calculate stats
  const activeBlogs = blogs.filter(blog => getBlogStatus(blog.lastPosted) === ApiStatus.Active).length;
  const inactiveBlogs = blogs.length - activeBlogs;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center mb-3 sm:mb-0">
            <Newspaper className="text-primary mr-2 h-6 w-6" />
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              <span className="block">경기 서북부 협의회</span>
              <span className="block">블로그 챌린지</span>
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="상태별 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="active">활성 블로그만</SelectItem>
                <SelectItem value="inactive">비활성 블로그만</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="정렬 방식" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">최신 포스팅순</SelectItem>
                <SelectItem value="name">블로그명순</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={refreshAllFeeds} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              새로고침
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <StatsCards 
          totalBlogs={blogs.length} 
          activeBlogs={activeBlogs} 
          inactiveBlogs={inactiveBlogs} 
        />
        
        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6 flex items-start">
          <InfoIcon className="text-blue-500 mt-0.5 mr-3 flex-shrink-0 h-5 w-5" />
          <div>
            <h3 className="font-medium text-blue-800 dark:text-blue-300">블로그 활동 규칙</h3>
            <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">경기 서북부 협의회 구성원은 2주에 한 번 이상 포스팅해야 합니다. 최근 2주 동안 포스팅이 없는 블로그는 비활성으로 표시됩니다.</p>
          </div>
        </div>
        
        {/* Blog Dashboard */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">협의회 블로그 현황</h2>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        {/* Error State */}
        {isError && (
          <div className="bg-red-50 dark:bg-red-950 rounded-xl shadow-sm border border-red-100 dark:border-red-900 p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300">데이터를 불러오는데 실패했습니다</h3>
            <p className="text-red-600 dark:text-red-400 mt-2 max-w-md mx-auto">블로그 정보를 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              다시 시도
            </Button>
          </div>
        )}
        
        {/* No Blogs State */}
        {!isLoading && !isError && filteredBlogs.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
            <div className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mb-4">
              <Newspaper className="text-gray-400 h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">블로그가 없습니다</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
              {blogs.length === 0 
                ? "모니터링할 블로그를 추가해보세요." 
                : "필터 설정을 변경해보세요."}
            </p>
          </div>
        )}
        
        {/* Blogs Grid */}
        {!isLoading && !isError && filteredBlogs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBlogs.map(blog => (
              <BlogCard 
                key={blog.id} 
                blog={blog} 
              />
            ))}
          </div>
        )}
        
        {/* Add Blog Button */}
        <div className="mt-6 flex justify-center">
          <Button 
            variant="ghost" 
            onClick={() => setIsAddBlogModalOpen(true)}
            className="flex items-center text-primary font-medium"
          >
            <Newspaper className="mr-2 h-5 w-5" />
            새 협의회 블로그 추가하기
          </Button>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-4 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-500 dark:text-gray-400 text-sm">
            <div>
              © {new Date().getFullYear()} 경기 서북부 협의회 블로그 첼린지
            </div>
            <div className="mt-2 md:mt-0">
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary transition mr-4">도움말</a>
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary transition">개인정보처리방침</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Add Blog Modal */}
      <AddBlogModal 
        open={isAddBlogModalOpen} 
        onOpenChange={setIsAddBlogModalOpen} 
      />
    </div>
  );
}
