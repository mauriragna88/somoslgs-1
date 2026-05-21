export default function Loading() {
  return (
    <main className="min-h-screen pueblo-shell">
      <div className="bg-gradient-to-b from-pueblo-crema via-pueblo-crema/80 to-transparent border-b border-pueblo-canteraLight/30 py-8">
        <div className="container mx-auto px-4">
          <div className="h-6 w-24 bg-pueblo-canteraLight/30 rounded-full animate-pulse mb-3" />
          <div className="h-8 w-48 bg-pueblo-canteraLight/30 rounded animate-pulse mb-2" />
          <div className="h-5 w-72 bg-pueblo-canteraLight/20 rounded animate-pulse" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="pueblo-card rounded-2xl p-6 text-center">
              <div className="w-14 h-14 bg-pueblo-canteraLight/30 rounded-2xl mx-auto mb-4 animate-pulse" />
              <div className="h-5 w-24 bg-pueblo-canteraLight/30 rounded mx-auto mb-2 animate-pulse" />
              <div className="h-4 w-16 bg-pueblo-canteraLight/20 rounded mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
