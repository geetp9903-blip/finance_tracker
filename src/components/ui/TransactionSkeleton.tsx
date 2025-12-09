import { Card } from "@/components/ui/Card";

export function TransactionSkeleton() {
    return (
        <Card className="glass-card flex items-center justify-between p-4 animate-pulse">
            <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Icon Skeleton */}
                <div className="h-10 w-10 shrink-0 rounded-full bg-white/10" />
                
                {/* Text Skeleton */}
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-24 bg-white/10 rounded" />
                    <div className="h-3 w-32 bg-white/10 rounded" />
                </div>
            </div>
            
            {/* Amount Skeleton */}
            <div className="flex items-center gap-4 shrink-0">
                <div className="h-5 w-20 bg-white/10 rounded" />
                <div className="h-4 w-4 bg-white/10 rounded" />
            </div>
        </Card>
    );
}
