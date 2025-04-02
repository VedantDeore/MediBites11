import { Skeleton } from "@/components/ui/skeleton"

export default function NearbyHospitalsLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Skeleton className="h-6 w-32" />
      </div>

      <div className="mb-8">
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3 mt-1" />
      </div>

      <Skeleton className="h-[200px] w-full mb-8 rounded-md" />

      <Skeleton className="h-[500px] w-full rounded-md" />

      <div className="mt-8">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[150px] rounded-md" />
          <Skeleton className="h-[150px] rounded-md" />
          <Skeleton className="h-[150px] rounded-md" />
        </div>
      </div>
    </div>
  )
}

