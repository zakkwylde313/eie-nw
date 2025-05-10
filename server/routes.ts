import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBlogSchema, type Post } from "@shared/schema";
import fetch from "node-fetch";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all blogs
  app.get("/api/blogs", async (_req: Request, res: Response) => {
    try {
      const blogs = await storage.getBlogs();
      res.json(blogs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blogs" });
    }
  });

  // Get a specific blog
  app.get("/api/blogs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid blog ID" });
      }

      const blog = await storage.getBlog(id);
      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      res.json(blog);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog" });
    }
  });

  // Create a new blog
  app.post("/api/blogs", async (req: Request, res: Response) => {
    try {
      // 날짜 형식 처리를 위한 전처리 작업
      const data = req.body;
      
      // lastPosted가 문자열로 왔을 때 Date 객체로 변환
      if (data.lastPosted && typeof data.lastPosted === 'string') {
        try {
          // ISO 문자열을 Date 객체로 변환해서 그대로 사용
          const date = new Date(data.lastPosted);
          data.lastPosted = date;
        } catch (e) {
          console.error('Date parsing error:', e);
          data.lastPosted = null;
        }
      }
      
      // posts 배열의 각 항목에서 date 속성이 문자열일 경우 Date 객체로 변환
      if (data.posts && Array.isArray(data.posts)) {
        data.posts = data.posts.map((post: { id: string; title: string; url: string; date: string | Date }) => {
          if (post.date && typeof post.date === 'string') {
            try {
              post.date = new Date(post.date);
            } catch (e) {
              console.error('Post date parsing error:', e);
              // 유효하지 않은 날짜일 경우 현재 날짜로 설정
              post.date = new Date();
            }
          }
          return post;
        });
      }
      
      // 유효성 검사 없이 직접 저장
      try {
        console.log('Processed data for saving:', JSON.stringify(data));
        const blog = await storage.createBlog(data);
        res.status(201).json(blog);
      } catch (saveError) {
        console.error('Error saving blog:', saveError);
        res.status(500).json({ message: "Failed to save blog data" });
      }
    } catch (error) {
      console.error('Blog creation error:', error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create blog" });
    }
  });

  // Update a blog
  app.patch("/api/blogs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid blog ID" });
      }

      // 날짜 형식 처리를 위한 전처리 작업
      const data = req.body;
      
      // lastPosted가 문자열로 왔을 때 Date 객체로 변환
      if (data.lastPosted && typeof data.lastPosted === 'string') {
        try {
          const date = new Date(data.lastPosted);
          data.lastPosted = date;
        } catch (e) {
          console.error('Date parsing error:', e);
          data.lastPosted = null;
        }
      }
      
      // posts 배열의 각 항목에서 date 속성이 문자열일 경우 Date 객체로 변환
      if (data.posts && Array.isArray(data.posts)) {
        data.posts = data.posts.map((post: { id: string; title: string; url: string; date: string | Date }) => {
          if (post.date && typeof post.date === 'string') {
            try {
              post.date = new Date(post.date);
            } catch (e) {
              console.error('Post date parsing error:', e);
              // 유효하지 않은 날짜일 경우 현재 날짜로 설정
              post.date = new Date();
            }
          }
          return post;
        });
      }

      const updatedBlog = await storage.updateBlog(id, data);
      if (!updatedBlog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      res.json(updatedBlog);
    } catch (error) {
      console.error('Blog update error:', error);
      res.status(500).json({ message: "Failed to update blog" });
    }
  });

  // Delete a blog
  app.delete("/api/blogs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid blog ID" });
      }

      const success = await storage.deleteBlog(id);
      if (!success) {
        return res.status(404).json({ message: "Blog not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blog" });
    }
  });

  // Proxy for RSS feeds to avoid CORS issues
  app.get("/api/proxy/rss", async (req: Request, res: Response) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ message: "URL parameter is required" });
      }

      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ 
          message: `Failed to fetch RSS feed: ${response.statusText}` 
        });
      }

      const contentType = response.headers.get('content-type') || '';
      res.set('Content-Type', contentType);
      const data = await response.text();
      res.send(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to proxy RSS feed request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
