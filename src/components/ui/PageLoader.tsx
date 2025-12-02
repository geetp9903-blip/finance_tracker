"use client";

import { motion } from "framer-motion";

export function PageLoader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 1,
                    ease: "easeInOut",
                }}
                className="relative h-24 w-24"
            >
                <img
                    src="/Prospera_1.png"
                    alt="Loading..."
                    className="h-full w-full object-contain"
                />
            </motion.div>
        </div>
    );
}
