import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    glass?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, glass = true, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    "flex h-11 w-full rounded-xl px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    glass ? "glass-input" : "border border-input bg-background",
                    className
                )}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";
