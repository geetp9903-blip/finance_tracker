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

        // Header
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("FINANCE TRACKER REPORT", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        const tableData = transactions.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.description,
            t.category.toUpperCase(),
            t.type.toUpperCase(),
            t.amount.toFixed(2)
        ]);

        autoTable(doc, {
            head: [['DATE', 'DESCRIPTION', 'CATEGORY', 'TYPE', 'AMOUNT']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 3 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 4) {
                    const type = (data.row.raw as string[])[3];
                    if (type === 'INCOME') {
                        data.cell.styles.textColor = [16, 185, 129]; // Emerald-500
                    } else {
                        data.cell.styles.textColor = [239, 68, 68]; // Red-500
                    }
                }
            }
        });

        doc.save("finance-report.pdf");
        setIsOpen(false);
    };

    const exportExcel = () => {
        // Transform data for Excel
        const excelData = transactions.map(t => ({
            DATE: new Date(t.date).toLocaleDateString(),
            DESCRIPTION: t.description,
            CATEGORY: t.category.toUpperCase(),
            "INCOME AMOUNT": t.type === 'income' ? t.amount : '',
            "EXPENSE AMOUNT": t.type === 'expense' ? t.amount : ''
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
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
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-popover backdrop-blur-xl border border-border shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                        <button
                            onClick={exportPDF}
                            className="group flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent cursor-pointer"
                        >
                            <Download className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                            Export PDF
                        </button>
                        <button
                            onClick={exportExcel}
                            className="group flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent cursor-pointer"
                        >
                            <FileSpreadsheet className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                            Export Excel
                        </button>
                        <button
                            onClick={handlePrint}
                            className="group flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent cursor-pointer"
                        >
                            <Printer className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                            Print View
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
