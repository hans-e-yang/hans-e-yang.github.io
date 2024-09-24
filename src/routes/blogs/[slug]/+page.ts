import type { Metadata } from '$lib/types/blog'
import blogs from "$lib/blogs"

export async function entries() {
  return blogs
}


export async function load({params}) {
  const post = await import(`../${params.slug}.md`)
  const content = post.default

  return {
    content,
    ...post.metadata as Metadata
  }
}
