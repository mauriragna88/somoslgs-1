export default function Loading() {
  return (
    <main className="min-h-screen pueblo-shell">
      <div className="bg-gradient-to-b from-pueblo-crema via-pueblo-crema/80 to-transparent border-b border-pueblo-canteraLight/30 py-6">
        <div className="container mx-auto px-4">
          <div className="h-10 w-full max-w-xl bg-pueblo-canteraLight/30 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pueblo-card rounded-2xl overflow-hidden">
              <div className="h-40 bg-pueblo-canteraLight/20 animate-pulse" />
              <div className="p-4">
                <div className="h-5 w-3/4 bg-pueblo-canteraLight/30 rounded mb-2 animate-pulse" />
                <div className="h-4 w-1/2 bg-pueblo-canteraLight/20 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
