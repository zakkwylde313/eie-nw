import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define post type that will be stored in the blog posts array
export const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  date: z.date(),
});

export type Post = z.infer<typeof postSchema>;

// Define the main blogs table
export const blogs = pgTable("blogs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  rssUrl: text("rss_url").notNull(),
  lastPosted: timestamp("last_posted", { mode: 'date' }),
  totalPosts: integer("total_posts").default(0),
  posts: jsonb("posts").$type<Post[]>().default([]),
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
});

export const insertBlogSchema = createInsertSchema(blogs).omit({
  id: true,
  createdAt: true,
})
.extend({
  rssUrl: z.string().url("유효한 URL을 입력해주세요"),
  url: z.string().url("유효한 URL을 입력해주세요"),
  name: z.string().min(1, "블로그 이름은 필수입니다"),
});

export type InsertBlog = z.infer<typeof insertBlogSchema>;
export type Blog = typeof blogs.$inferSelect;

// API response types for RSS feed processing
export interface RssFeedResponse {
  title: string;
  description?: string;
  link?: string;
  items: RssItem[];
}

export interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  isoDate?: string;
}
