"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Calendar, ExternalLink, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { type BlogPost, formatPublishedDate, getBlogById } from "@/lib/blog-service"

export default function BlogPostPage() {
  const router = useRouter()
  const params = useParams()
  const [blog, setBlog] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBlog() {
      setLoading(true)
      try {
        if (params.id) {
          const fetchedBlog = await getBlogById(params.id as string)
          setBlog(fetchedBlog)
        }
      } catch (error) {
        console.error("Error fetching blog:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBlog()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <Button variant="ghost" onClick={() => router.push("/blogs")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blogs
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="w-full h-[400px] rounded-lg mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <Button variant="ghost" onClick={() => router.push("/blogs")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blogs
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-3xl mx-auto p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push("/blogs")}>Return to Blog</Button>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => router.push("/blogs")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blogs
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <article className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">{blog.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatPublishedDate(blog.published_at)}
            </div>
            {blog.source && (
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {blog.source}
              </div>
            )}
          </div>

          <div className="relative w-full h-[400px] mb-8 rounded-lg overflow-hidden">
            <Image src={blog.image_url || "/placeholder.svg"} alt={blog.title} fill className="object-cover" />
          </div>

          <div className="prose max-w-none">
            <p className="text-lg mb-6">{blog.description}</p>

            {blog.content && (
              <div className="mb-6">
                {blog.content.split("\n").map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            <div className="mt-8 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                This is a summary of the original article. To read the full content, please visit the source website.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => window.open(blog.url, "_blank")}>
                Read Full Article
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}

