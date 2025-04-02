import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex h-screen">
      <div className="w-64 border-r bg-background">
        <Skeleton className="h-14 w-full" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <Skeleton className="h-14 w-full" />
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-20 w-full max-w-[85%]" />
          <Skeleton className="h-20 w-full max-w-[85%] ml-auto" />
          <Skeleton className="h-20 w-full max-w-[85%]" />
          <Skeleton className="h-40 w-full max-w-[85%]" />
        </div>
        <div className="p-4 border-t">
          <Skeleton className="h-10 w-full max-w-4xl mx-auto" />
        </div>
      </div>
    </div>
  )
}

