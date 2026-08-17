"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { MassDeleteModal } from "./MassDeleteModal";

export function FlushButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Mass Delete / Flush</span>
            </Button>

            <MassDeleteModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
}
