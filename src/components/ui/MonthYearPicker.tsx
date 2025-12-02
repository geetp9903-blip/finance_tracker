import { useState } from "react";

interface MonthYearPickerProps {
    selectedDate: Date;
    onChange: (date: Date) => void;
}

export function MonthYearPicker({ selectedDate, onChange }: MonthYearPickerProps) {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(parseInt(e.target.value));
        onChange(newDate);
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(parseInt(e.target.value));
        onChange(newDate);
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

    return (
        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1 transition-all duration-200 hover:bg-white/10 hover:shadow-lg hover:shadow-primary/5">
            <select
                value={selectedDate.getMonth()}
                onChange={handleMonthChange}
                className="bg-transparent text-sm font-medium text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer p-1 transition-colors duration-200"
            >
                {months.map((month, index) => (
                    <option key={month} value={index} className="bg-card text-foreground">
                        {month}
                    </option>
                ))}
            </select>
            <select
                value={selectedDate.getFullYear()}
                onChange={handleYearChange}
                className="bg-transparent text-sm font-medium text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer p-1 border-l border-border pl-2 transition-colors duration-200"
            >
                {years.map(year => (
                    <option key={year} value={year} className="bg-card text-foreground">
                        {year}
                    </option>
                ))}
            </select>
        </div>
    );
}
