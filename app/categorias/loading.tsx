export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-72 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 animate-pulse" />
              <div className="h-5 w-24 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
              <div className="h-4 w-16 bg-gray-100 rounded mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
