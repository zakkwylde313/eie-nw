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
    
    const blog: Blog = { 
      ...insertBlog, 
      id,
      lastPosted: insertBlog.lastPosted || null,
      totalPosts: insertBlog.totalPosts || 0,
      posts: insertBlog.posts || [],
      createdAt: now
    };
    
    this.blogs.set(id, blog);
    return blog;
  }

  async updateBlog(id: number, data: Partial<Blog>): Promise<Blog | undefined> {
    const blog = this.blogs.get(id);
    if (!blog) return undefined;

    const updatedBlog = { ...blog, ...data };
    this.blogs.set(id, updatedBlog);
    return updatedBlog;
  }

  async deleteBlog(id: number): Promise<boolean> {
    return this.blogs.delete(id);
  }
}

export const storage = new MemStorage();
