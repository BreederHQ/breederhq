import * as React from "react";

const cx = (...s: Array<string | false | null | undefined>) => s.filter(Boolean).join(" ");

export type FieldRowProps = {
  label: React.ReactNode;
  htmlFor?: string;
  help?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function FieldRow({ label, htmlFor, help, required, className = "", children }: FieldRowProps) {
  return (
    <div className={cx("grid grid-cols-1 md:grid-cols-12 gap-2 items-start py-2", className)}>
      <label
        htmlFor={htmlFor}
        className="md:col-span-3 text-sm text-gray-600 dark:text-gray-300 pt-2"
      >
        <span className="font-medium">{label}</span>
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      <div className="md:col-span-6">{children}</div>
      <div className="md:col-span-3 text-xs text-gray-500 dark:text-gray-400 pt-2">{help}</div>
    </div>
  );
}
