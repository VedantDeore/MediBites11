export interface BlogPost {
  id: string
  title: string
  description: string
  url: string
  image_url: string
  source: string
  published_at: string
  content: string
}

export async function getHealthBlogs(limit = 10): Promise<BlogPost[]> {
  try {
    const response = await fetch(`/api/blogs?limit=${limit}`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    })

    if (!response.ok) {
      throw new Error("Failed to fetch blogs")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching blogs:", error)
    return []
  }
}

export async function getBlogById(id: string): Promise<BlogPost | null> {
  try {
    const blogs = await getHealthBlogs(20) // Get a larger set to ensure we find the blog
    const blog = blogs.find((blog) => blog.id === id)
    return blog || null
  } catch (error) {
    console.error("Error fetching blog by ID:", error)
    return null
  }
}

export function formatPublishedDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    return "Unknown date"
  }
}

