export default function MetricsLoading() {
    return (
        <>
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border bg-card text-card-foreground shadow p-6 space-y-2 animate-pulse">
                    <div className="h-4 w-1/2 bg-muted rounded"></div>
                    <div className="h-8 w-3/4 bg-muted rounded"></div>
                </div>
            ))}
        </>
    );
}
