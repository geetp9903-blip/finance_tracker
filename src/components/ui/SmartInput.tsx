"use client";

import { useState, useEffect, forwardRef, InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/Input";
import { Calculator } from "lucide-react";

interface SmartInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: number | string;
    onValueChange: (val: number) => void;
}

export const SmartInput = forwardRef<HTMLInputElement, SmartInputProps>(
    ({ value, onValueChange, className, ...props }, ref) => {
        const [displayValue, setDisplayValue] = useState(value.toString());

        useEffect(() => {
            setDisplayValue(value.toString());
        }, [value]);

        const evaluateExpression = (expression: string) => {
            try {
                // Sanitize: allow only numbers, +, -, *, /, ., (, )
                const sanitized = expression.replace(/[^0-9+\-*/.()]/g, '');
                if (!sanitized) return;

                // Safe evaluation using Function constructor with restricted scope
                // eslint-disable-next-line no-new-func
                const result = new Function(`return ${sanitized}`)();

                if (typeof result === 'number' && !isNaN(result)) {
                    onValueChange(result);
                    setDisplayValue(result.toString());
                }
            } catch (e) {
                // Keep original value if invalid
                console.warn("Invalid math expression");
            }
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            evaluateExpression(e.target.value);
            if (props.onBlur) props.onBlur(e);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                evaluateExpression(e.currentTarget.value);
            }
        };

        return (
            <div className="relative">
                <Input
                    ref={ref}
                    {...props}
                    value={displayValue}
                    onChange={(e) => setDisplayValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={`pr-8 ${className}`}
                />
                <Calculator className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
            </div>
        );
    }
);
SmartInput.displayName = "SmartInput";
