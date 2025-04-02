import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HealthAnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[140px]" />
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col">
              <Skeleton className="h-4 w-40 mb-2" />
              <div className="flex items-end gap-2">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-6 w-24 mb-1" />
              </div>
              <Skeleton className="h-4 w-32 mt-1" />
              <Skeleton className="h-2 w-full mt-3" />
              <Skeleton className="h-3 w-32 mt-2" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-32 mb-2" />
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-32 mb-2" />
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="risk" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="risk" disabled>
            Disease Risk
          </TabsTrigger>
          <TabsTrigger value="medications" disabled>
            Medications
          </TabsTrigger>
          <TabsTrigger value="progress" disabled>
            Health Progress
          </TabsTrigger>
          <TabsTrigger value="reports" disabled>
            Lab Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="risk" className="space-y-6 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-32 mt-1" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

