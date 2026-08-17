import { Card } from "./Card";

interface ChartSkeletonProps {
    className?: string;
}

export function ChartSkeleton({ className }: ChartSkeletonProps) {
    return (
        <Card className={`glass-card p-6 flex flex-col gap-4 animate-pulse ${className || ''}`}>
            <div className="flex justify-between items-center mb-4">
                <div className="h-5 w-32 bg-white/10 rounded" />
                <div className="h-4 w-24 bg-white/10 rounded" />
            </div>
            
            <div className="flex-1 flex items-end gap-2 px-2 mt-4">
                {/* Randomly sized bars to simulate a chart */}
                {[40, 70, 45, 90, 65, 30, 85].map((height, i) => (
                    <div 
                        key={i} 
                        className="flex-1 bg-white/5 rounded-t-sm" 
                        style={{ height: `${height}%` }}
                    />
                ))}
            </div>
            
            <div className="flex justify-between mt-2">
                <div className="h-3 w-8 bg-white/10 rounded" />
                <div className="h-3 w-8 bg-white/10 rounded" />
                <div className="h-3 w-8 bg-white/10 rounded" />
            </div>
        </Card>
    );
}
