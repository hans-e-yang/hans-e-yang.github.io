import type { Metadata } from '$lib/types/blog'

// export async function entries() {
//   const res = await fetch("api/blogs")
//   let json = res.json()
//   console.log(json)
//   return []
// }


export async function load({params}) {
  const post = await import(`../${params.slug}.md`)
  const content = post.default

  return {
    content,
    ...post.metadata as Metadata
  }
}
