import { json } from "@sveltejs/kit"
import type { Metadata, Post } from "$lib/types/blog"

export const GET = async () => {
  const files = import.meta.glob('/src/routes/blogs/*.md', { eager: true})
  
  const blogs : Post[] = []
  for (const path in files) {
    const file = files[path]
    const slug = path.split('/').at(-1)?.slice(0, -3)
    
    if (file && typeof file == 'object' && 'metadata' in file && typeof file.metadata == 'object' && slug)  {
      const metadata = file.metadata as Metadata
      metadata.published && blogs.push({...metadata, slug})
    }
  }

  blogs.sort((a, b) => 
    new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
  )

  return json(blogs)
}
