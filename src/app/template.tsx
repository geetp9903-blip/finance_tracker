"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
    const shouldReduceMotion = useReducedMotion();
    
    return (
        <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            transition={{ ease: "easeInOut", duration: 0.4 }}
        >
            {children}
        </motion.div>
    );
}
