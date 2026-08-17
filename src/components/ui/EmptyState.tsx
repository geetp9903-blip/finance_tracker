import { motion } from "framer-motion";
import { FileText, LucideIcon } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({ title, description, icon: Icon = FileText, actionLabel, onAction }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-12 text-center glass-card border-dashed border-white/10"
        >
            <div className="rounded-full bg-white/5 p-4 mb-4 text-muted-foreground">
                <Icon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
            {actionLabel && onAction && (
                <Button onClick={onAction} variant="primary">
                    {actionLabel}
                </Button>
            )}
        </motion.div>
    );
}
