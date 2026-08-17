"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading = false, children, disabled, ...props }, ref) => {
        const variants = {
            primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            glass: "glass-button",
            outline: "border border-white/20 bg-transparent hover:bg-white/10 text-foreground"
        };

        const sizes = {
            sm: "h-9 px-3 text-xs",
            md: "h-11 px-6 text-sm",
            lg: "h-14 px-8 text-base",
            icon: "h-10 w-10 p-2"
        };

        return (
            <motion.button
                whileHover={disabled || loading ? {} : { scale: 1.02 }}
                whileTap={disabled || loading ? {} : { scale: 0.95 }}
                ref={ref}
                disabled={disabled || loading}
                className={cn(
                    "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {loading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {children as React.ReactNode}
            </motion.button>
        );
    }
);
Button.displayName = "Button";
