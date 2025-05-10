import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBlogSchema } from "@shared/schema";
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
      const blogData = insertBlogSchema.parse(req.body);
      const blog = await storage.createBlog(blogData);
      res.status(201).json(blog);
    } catch (error) {
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

      const updatedBlog = await storage.updateBlog(id, req.body);
      if (!updatedBlog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      res.json(updatedBlog);
    } catch (error) {
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
