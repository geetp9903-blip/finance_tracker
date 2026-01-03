"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "../ui/DropdownMenu";
import { getExportData } from "@/lib/actions/export";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type augmentation for default/autotable compatibility
declare module 'jspdf' {
    interface jsPDF {
        lastAutoTable: { finalY: number };
    }
}

export function ExportButton({ currency = 'USD' }: { currency?: string }) {
    const [isExporting, setIsExporting] = useState(false);

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'code' // Use 'INR' instead of symbol to avoid font issues in PDF
    });

    const fetchAllData = async () => {
        const data = await getExportData();
        return data;
    };

    const handleExcel = async () => {
        setIsExporting(true);
        try {
            const data = await fetchAllData();
            const ws = XLSX.utils.json_to_sheet(data.map((t: any) => ({
                Date: new Date(t.date).toLocaleDateString(),
                Description: t.description,
                Category: t.category,
                Type: t.type,
                Amount: t.amount,
                ID: t.id
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Transactions");
            XLSX.writeFile(wb, `Finance_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (e) {
            console.error(e);
        } finally {
            setIsExporting(false);
        }
    };

    const handlePDF = async () => {
        setIsExporting(true);
        try {
            const data = await fetchAllData();
            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.text("Financial Statement", 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
            doc.text(`Currency: ${currency}`, 14, 35);

            // Table
            autoTable(doc, {
                startY: 45,
                head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
                body: data.map((t: any) => [
                    new Date(t.date).toLocaleDateString(),
                    t.description,
                    t.category,
                    t.type.toUpperCase(),
                    formatter.format(t.amount)
                ]),
                styles: { fontSize: 9 },
                headStyles: { fillColor: [22, 163, 74] },
                alternateRowStyles: { fillColor: [240, 253, 244] }
            });

            // Summary
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            const totalIncome = data
                .filter((t: any) => t.type === 'income')
                .reduce((sum: number, t: any) => sum + t.amount, 0);
            const totalExpense = data
                .filter((t: any) => t.type === 'expense')
                .reduce((sum: number, t: any) => sum + t.amount, 0);

            doc.text(`Total Income: ${formatter.format(totalIncome)}`, 14, finalY);
            doc.text(`Total Expenses: ${formatter.format(totalExpense)}`, 14, finalY + 7);
            doc.text(`Net Balance: ${formatter.format(totalIncome - totalExpense)}`, 14, finalY + 14);

            const pdfBlob = doc.output('bloburl');
            window.open(pdfBlob, '_blank');
        } catch (e) {
            console.error(e);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Export Data
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    PDF Statement
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExcel}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Excel Backup
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
