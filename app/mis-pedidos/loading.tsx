export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-gray-200 rounded mb-2 animate-pulse" />
        <div className="h-5 w-64 bg-gray-100 rounded mb-8 animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg animate-pulse" />
                <div>
                  <div className="h-5 w-32 bg-gray-200 rounded mb-1 animate-pulse" />
                  <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-50 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
