export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💑</div>
          <h1 className="text-2xl font-bold text-rose-500">Couple Space</h1>
          <p className="text-sm text-zinc-400 mt-1">只屬於你們兩個的小天地</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
