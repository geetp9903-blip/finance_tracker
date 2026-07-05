"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Context for simple composition
const DropdownMenuContext = React.createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
} | null>(null);

function DropdownMenu({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);

    // Close on click outside could be added here similar to useOnClickOutside
    // For this refactor, we'll keep it simple or implement a basic backdrop

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-block text-left">
                {children}
                {open && (
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpen(false)}
                    />
                )}
            </div>
        </DropdownMenuContext.Provider>
    );
}

const DropdownMenuTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, onClick, asChild = false, ...props }, ref) => {
    const ctx = React.useContext(DropdownMenuContext);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        ctx?.setOpen(!ctx.open);
        onClick?.(e);
    };

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            ref,
            onClick: handleClick,
            className: cn((children.props as any).className, className),
            ...props
        });
    }

    return (
        <button
            ref={ref}
            type="button"
            className={cn("inline-flex justify-center", className)}
            onClick={handleClick}
            aria-haspopup="menu"
            aria-expanded={ctx?.open}
            {...props}
        >
            {children}
        </button>
    );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" }
>(({ className, align = "end", ...props }, ref) => {
    const ctx = React.useContext(DropdownMenuContext);

    if (!ctx?.open) return null;

    return (
        <div
            ref={ref}
            role="menu"
            className={cn(
                "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-1 text-foreground shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                align === "end" ? "right-0" : "left-0",
                className
            )}
            {...props}
        />
    );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, onClick, ...props }, ref) => {
    const ctx = React.useContext(DropdownMenuContext);

    return (
        <div
            ref={ref}
            role="menuitem"
            tabIndex={0}
            className={cn(
                "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-white/10 focus:bg-white/10 hover:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            onClick={(e) => {
                ctx?.setOpen(false);
                onClick?.(e);
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    ctx?.setOpen(false);
                    onClick?.(e as any);
                }
            }}
            {...props}
        />
    );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuSeparator = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("-mx-1 my-1 h-px bg-muted", className)}
        {...props}
    />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuLabel = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "px-2 py-1.5 text-sm font-semibold",
            inset && "pl-8",
            className
        )}
        {...props}
    />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel
};
