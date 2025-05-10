import { blogs, type Blog, type InsertBlog, type Post } from "@shared/schema";

export interface IStorage {
  getBlogs(): Promise<Blog[]>;
  getBlog(id: number): Promise<Blog | undefined>;
  createBlog(blog: InsertBlog): Promise<Blog>;
  updateBlog(id: number, data: Partial<Blog>): Promise<Blog | undefined>;
  deleteBlog(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private blogs: Map<number, Blog>;
  currentId: number;

  constructor() {
    this.blogs = new Map();
    this.currentId = 1;
  }

  async getBlogs(): Promise<Blog[]> {
    return Array.from(this.blogs.values());
  }

  async getBlog(id: number): Promise<Blog | undefined> {
    return this.blogs.get(id);
  }

  async createBlog(insertBlog: InsertBlog): Promise<Blog> {
    const id = this.currentId++;
    const now = new Date();
    
    // 날짜 관련 타입 문제를 처리하기 위한 posts 정규화
    let normalizedPosts: Post[] = [];
    
    if (insertBlog.posts && Array.isArray(insertBlog.posts)) {
      normalizedPosts = insertBlog.posts.map(post => ({
        id: post.id || `post-${Math.random().toString(36).substring(2, 11)}`,
        title: post.title || '',
        url: post.url || '',
        date: post.date instanceof Date ? post.date : new Date(post.date || now)
      }));
    }
    
    const blog: Blog = { 
      ...insertBlog, 
      id,
      lastPosted: insertBlog.lastPosted || null,
      totalPosts: insertBlog.totalPosts || 0,
      posts: normalizedPosts,
      createdAt: now
    };
    
    this.blogs.set(id, blog);
    return blog;
  }

  async updateBlog(id: number, data: Partial<Blog>): Promise<Blog | undefined> {
    const blog = this.blogs.get(id);
    if (!blog) return undefined;

    // posts 배열이 있을 경우 정규화
    if (data.posts && Array.isArray(data.posts)) {
      const now = new Date();
      const normalizedPosts: Post[] = data.posts.map(post => ({
        id: post.id || `post-${Math.random().toString(36).substring(2, 11)}`,
        title: post.title || '',
        url: post.url || '',
        date: post.date instanceof Date ? post.date : new Date(post.date || now)
      }));
      data.posts = normalizedPosts;
    }

    const updatedBlog = { ...blog, ...data };
    this.blogs.set(id, updatedBlog);
    return updatedBlog;
  }

  async deleteBlog(id: number): Promise<boolean> {
    return this.blogs.delete(id);
  }
}

export const storage = new MemStorage();
