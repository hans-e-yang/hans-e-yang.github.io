export type Metadata = {
  title: string,
  date: string,
  description: string,
  published: boolean
}

export type Post = Metadata & {
  slug: string
}
