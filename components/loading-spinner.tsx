export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-20 h-20 border-4 border-gray-200 rounded-full animate-spin"></div>
        {/* Inner ring */}
        <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
