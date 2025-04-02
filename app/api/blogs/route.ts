import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get("limit") || "10"

  try {
    const blogs = await fetchHealthBlogs(Number.parseInt(limit as string))
    return NextResponse.json(blogs)
  } catch (error) {
    console.error("Error fetching health blogs:", error)
    return NextResponse.json({ error: "Failed to fetch health blogs" }, { status: 500 })
  }
}

async function fetchHealthBlogs(numArticles = 10) {
  // NewsAPI endpoint for health news
  const url = "https://newsapi.org/v2/top-headlines"

  // Parameters for the API request
  const params = new URLSearchParams({
    apiKey: "4b2d87a05c03424e8c58b45de8bee4ae", // This should be in an environment variable in production
    category: "health",
    language: "en",
    pageSize: numArticles.toString(),
  })

  try {
    // Make the API request
    const response = await fetch(`${url}?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    // Parse the JSON response
    const data = await response.json()

    // Filter articles to only include those with images
    const articlesWithImages = data.articles
      .filter((article) => article.urlToImage)
      .map((article, index) => ({
        id: index.toString(), // Generate an ID for each article
        title: article.title,
        description: article.description,
        url: article.url,
        image_url: article.urlToImage,
        source: article.source?.name,
        published_at: article.publishedAt,
        content: article.content,
      }))

    return articlesWithImages
  } catch (error) {
    console.error("Error fetching health blogs:", error)
    throw error
  }
}

