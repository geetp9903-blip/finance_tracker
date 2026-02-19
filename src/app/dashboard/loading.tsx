export default function DashboardLoading() {
    return (
        <div className="space-y-4">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between space-y-2 mb-8">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                </div>
                <div className="flex items-center space-x-2">
                    <div className="h-9 w-24 bg-white/5 rounded animate-pulse" />
                    <div className="h-9 w-24 bg-white/5 rounded animate-pulse" />
                </div>
            </div>

            {/* Metrics Grid Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 rounded-xl border border-white/10 bg-white/5 animate-pulse" />
                ))}
            </div>

            {/* Dashboard Grid Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Main Chart Skeleton */}
                <div className="col-span-4 h-[400px] rounded-xl border border-white/10 bg-white/5 animate-pulse" />

                {/* Side Panel Skeleton */}
                <div className="col-span-3 h-[400px] rounded-xl border border-white/10 bg-white/5 animate-pulse" />
            </div>
        </div>
    );
}
