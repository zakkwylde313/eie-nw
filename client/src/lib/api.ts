// client/src/lib/api.ts
import type { Blog } from "@shared/schema";

export async function getBlogs(): Promise<Blog[]> {
  const res = await fetch("/api/blogs");
  if (!res.ok) {
    throw new Error("블로그 데이터를 불러오지 못했습니다.");
  }
  return res.json();
}