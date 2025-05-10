import { Newspaper, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardsProps {
  totalBlogs: number;
  activeBlogs: number;
  inactiveBlogs: number;
}

export default function StatsCards({ totalBlogs, activeBlogs, inactiveBlogs }: StatsCardsProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total Blogs Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Newspaper className="text-primary h-5 w-5" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">총 블로그 수</h3>
              <p className="text-2xl font-semibold">{totalBlogs}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Active Blogs Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <CheckCircle2 className="text-green-600 dark:text-green-500 h-5 w-5" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">활성 블로그</h3>
              <p className="text-2xl font-semibold">{activeBlogs}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Inactive Blogs Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
              <AlertCircle className="text-red-600 dark:text-red-500 h-5 w-5" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">비활성 블로그</h3>
              <p className="text-2xl font-semibold">{inactiveBlogs}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
