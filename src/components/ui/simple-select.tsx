"use client";

import * as React from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SimpleSelectOption = { value: string; label: React.ReactNode; disabled?: boolean };

type SimpleSelectProps = {
  options: SimpleSelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  id?: string;
  name?: string;
  /** Defaults to the label of an option whose value is "" (such as "All courses"). */
  placeholder?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default";
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

/**
 * Themed replacement for a native <select> with the same mental model:
 * string values, optional form `name`, controlled or uncontrolled.
 */
export function SimpleSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  id,
  name,
  placeholder,
  required,
  disabled,
  className,
  size = "default",
  ...aria
}: SimpleSelectProps) {
  const items = React.useMemo(() => options.map((option) => ({ value: option.value, label: option.label })), [options]);
  return (
    <Select
      items={items}
      name={name}
      required={required}
      disabled={disabled}
      {...(value !== undefined ? { value } : { defaultValue: defaultValue ?? null })}
      onValueChange={(next) => onValueChange?.(next == null ? "" : String(next))}
    >
      <SelectTrigger
        id={id}
        size={size}
        className={cn("w-full bg-card data-[size=default]:h-9", className)}
        {...aria}
      >
        <SelectValue placeholder={placeholder ?? options.find((option) => option.value === "")?.label ?? "Select…"} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="max-h-72">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
