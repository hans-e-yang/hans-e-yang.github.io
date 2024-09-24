export type Metadata = {
  title: string,
  publishedDate: string,
  lastUpdate: string,
  description: string,
  published: boolean,
  projectLinks: Link[]
}

type Link = {
  name: string,
  url: string
} | {tag: string}

export type Post = Metadata & {
  slug: string
}
