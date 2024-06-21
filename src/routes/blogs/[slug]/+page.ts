export async function entries() {
  const files = import.meta.glob('../*.md')
  const slugs = Object.keys(files).map(x => {
    return {slug: x.slice(3, -3)}
  })

  console.log(slugs)

  return slugs
}

export async function load({params}) {
  const post = await import(`../${params.slug}.md`)
  const { title, date } = post.metadata || {title: "", date: ""}
  const content = post.default

  return {
    content,
    title,
    date
  }
}
