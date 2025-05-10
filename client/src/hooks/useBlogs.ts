import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Blog, InsertBlog, RssFeedResponse, Post } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { fetchFeed, rssToPosts } from '@/lib/rssUtils';
import { useToast } from '@/hooks/use-toast';

export function useBlogs() {
  const { toast } = useToast();
  
  // Get all blogs
  const {
    data: blogs = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Blog[]>({
    queryKey: ['/api/blogs'],
  });
  
  // Add a new blog
  const addBlogMutation = useMutation({
    mutationFn: async (blog: InsertBlog) => {
      // Try to fetch the RSS feed first to make sure it's valid
      try {
        const feed = await fetchFeed(blog.rssUrl);
        const posts = rssToPosts(feed.items);
        
        // Update the blog with data from the feed
        const lastPost = posts.length > 0 ? posts[0].date : null;
        
        const blogWithFeedData: InsertBlog = {
          ...blog,
          lastPosted: lastPost,
          totalPosts: posts.length,
          posts: posts.slice(0, 5) // Only store the 5 most recent posts
        };
        
        const response = await apiRequest('POST', '/api/blogs', blogWithFeedData);
        return response.json();
      } catch (error) {
        throw new Error('RSS 피드를 가져오는데 실패했습니다. URL을 확인해주세요.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blogs'] });
      toast({
        title: "블로그 추가 완료",
        description: "새 블로그가 성공적으로 추가되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "블로그 추가 실패",
        description: error instanceof Error ? error.message : "블로그를 추가하는데 실패했습니다.",
      });
    },
  });
  
  // Refresh all blogs
  const refreshBlogsMutation = useMutation({
    mutationFn: async () => {
      const updatedBlogs: Blog[] = [];
      
      for (const blog of blogs) {
        try {
          const feed = await fetchFeed(blog.rssUrl);
          const posts = rssToPosts(feed.items);
          
          const updatedBlog: Partial<Blog> = {
            lastPosted: posts.length > 0 ? posts[0].date : blog.lastPosted,
            totalPosts: posts.length,
            posts: posts.slice(0, 5)
          };
          
          const response = await apiRequest('PATCH', `/api/blogs/${blog.id}`, updatedBlog);
          const updated = await response.json();
          updatedBlogs.push(updated);
        } catch (error) {
          console.error(`Failed to refresh blog ${blog.id}:`, error);
          updatedBlogs.push(blog);
        }
      }
      
      return updatedBlogs;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blogs'] });
      toast({
        title: "새로고침 완료",
        description: "모든 블로그 정보가 갱신되었습니다.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "새로고침 실패",
        description: "일부 블로그 정보를 갱신하는데 실패했습니다.",
      });
    },
  });
  
  return {
    blogs,
    isLoading,
    isError,
    refetch,
    addBlog: addBlogMutation.mutate,
    isAddingBlog: addBlogMutation.isPending,
    refreshBlogs: refreshBlogsMutation.mutate,
    isRefreshing: refreshBlogsMutation.isPending,
  };
}
