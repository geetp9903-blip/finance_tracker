"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { AddTransactionModal } from "./AddTransactionModal";

export function AddTransactionButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New
            </Button>
            <AddTransactionModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
