"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
    id: string;
    message: string;
    type?: ToastType;
    onClose: (id: string) => void;
}

export function Toast({ id, message, type = "info", onClose }: ToastProps) {
    const icons = {
        success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
        error: <AlertCircle className="h-5 w-5 text-destructive" />,
        info: <Info className="h-5 w-5 text-primary" />
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="flex items-center gap-3 glass-card px-4 py-3 min-w-[300px] shadow-2xl border-white/10"
            role="alert"
        >
            {icons[type]}
            <p className="text-sm font-medium flex-1 text-foreground">{message}</p>
            <button
                onClick={() => onClose(id)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Close"
            >
                <X className="h-4 w-4" />
            </button>
        </motion.div>
    );
}
