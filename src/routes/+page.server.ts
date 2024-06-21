import type { Post } from "$lib/types/blog.d.ts"

export async function load({ fetch }) {
  const response = await fetch('/api/blogs')
  const posts : Post[] = await response.json()

  return {
    posts
  }
}
