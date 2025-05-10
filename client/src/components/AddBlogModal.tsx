import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { InsertBlog } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertBlogSchema } from '@shared/schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface AddBlogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddBlogModal({ open, onOpenChange }: AddBlogModalProps) {
  const { toast } = useToast();
  
  const form = useForm<InsertBlog>({
    resolver: zodResolver(insertBlogSchema),
    defaultValues: {
      name: '',
      url: '',
      rssUrl: '',
      lastPosted: null,
      totalPosts: 0,
      posts: []
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: InsertBlog) => {
      const res = await apiRequest('POST', '/api/blogs', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blogs'] });
      toast({
        title: "블로그 추가 완료",
        description: "새 블로그가 성공적으로 추가되었습니다.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "블로그 추가 실패",
        description: error instanceof Error ? error.message : "블로그 추가 중 오류가 발생했습니다.",
      });
    }
  });

  const onSubmit = (data: InsertBlog) => {
    mutate(data);
  };

  // Auto-fill RSS URL based on blog URL
  const handleUrlChange = (value: string) => {
    form.setValue('url', value);
    
    // Only suggest an RSS URL if none is provided yet
    if (!form.getValues('rssUrl')) {
      try {
        const url = new URL(value);
        form.setValue('rssUrl', `${url.origin}/feed` || `${url.origin}/rss.xml` || '');
      } catch (e) {
        // Invalid URL, ignore
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            협의회 블로그 추가
          </DialogTitle>
          <DialogDescription>
            등록하려는 협의회 블로그 정보와 RSS 피드 URL을 입력하세요.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>블로그 이름</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="예: 해리의 코딩 블로그" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>블로그 URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="예: https://blog.example.com" 
                      {...field} 
                      onChange={(e) => handleUrlChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="rssUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RSS 피드 URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="예: https://blog.example.com/feed.xml" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? '추가 중...' : '추가하기'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
