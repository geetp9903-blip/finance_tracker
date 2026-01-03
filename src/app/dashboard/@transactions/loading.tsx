export default function TransactionsLoading() {
    return (
        <div className="h-full border-0 shadow-none p-6 space-y-6">
            <div className="h-6 w-1/3 bg-muted rounded animate-pulse mb-4"></div>
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="h-9 w-9 rounded-full bg-muted"></div>
                    <div className="space-y-2 flex-1">
                        <div className="h-4 w-1/3 bg-muted rounded"></div>
                        <div className="h-3 w-1/4 bg-muted rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
