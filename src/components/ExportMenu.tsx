"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Download, Printer, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Transaction } from "@/lib/types";

interface ExportMenuProps {
    transactions: Transaction[];
}

export function ExportMenu({ transactions }: ExportMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Finance Tracker Report", 14, 22);

        const tableData = transactions.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.description,
            t.category,
            t.type,
            t.amount.toString()
        ]);

        autoTable(doc, {
            head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
            body: tableData,
            startY: 30,
        });

        doc.save("finance-report.pdf");
        setIsOpen(false);
    };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(transactions);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        XLSX.writeFile(wb, "finance-report.xlsx");
        setIsOpen(false);
    };

    const handlePrint = () => {
        window.print();
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left">
            <Button onClick={() => setIsOpen(!isOpen)} variant="secondary">
                <Download className="h-4 w-4 mr-2" /> Export
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                        <button
                            onClick={exportPDF}
                            className="group flex w-full items-center px-4 py-2 text-sm text-white hover:bg-white/10 cursor-pointer"
                        >
                            <Download className="mr-3 h-4 w-4 text-white/50 group-hover:text-white" />
                            Export PDF
                        </button>
                        <button
                            onClick={exportExcel}
                            className="group flex w-full items-center px-4 py-2 text-sm text-white hover:bg-white/10 cursor-pointer"
                        >
                            <FileSpreadsheet className="mr-3 h-4 w-4 text-white/50 group-hover:text-white" />
                            Export Excel
                        </button>
                        <button
                            onClick={handlePrint}
                            className="group flex w-full items-center px-4 py-2 text-sm text-white hover:bg-white/10 cursor-pointer"
                        >
                            <Printer className="mr-3 h-4 w-4 text-white/50 group-hover:text-white" />
                            Print View
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
