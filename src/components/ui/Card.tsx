import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface CardProps extends HTMLMotionProps<"div"> {
    glass?: boolean;
}

export function Card({ className, glass = true, ...props }: CardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={cn(
                "rounded-2xl p-6",
                glass ? "glass-card" : "bg-card text-card-foreground shadow-sm",
                className
            )}
            {...props}
        />
    );
}
