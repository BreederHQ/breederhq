import * as React from "react";
import { DayPicker } from "react-day-picker";
import { Popover } from "../Popover";
import { Input } from "../Input";
import "../../styles/datepicker.css";

export type DatePickerProps = {
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  readOnly?: boolean;
  showIcon?: boolean;
};

/**
 * DatePicker component - drop-in replacement for native date input
 * Uses react-day-picker for fast year/month navigation
 * Maintains exact same DOM structure as previous CalendarInput for CSS compatibility
 */
export function DatePicker(props: DatePickerProps) {
  const readOnly = !!props.readOnly;
  const className = props.className;
  const inputClassName = props.inputClassName;
  const onChange = props.onChange;
  const value = props.value as string | undefined;
  const placeholder = props.placeholder ?? "mm/dd/yyyy";
  const showIcon = props.showIcon ?? true;

  // Any extra props intended for the visible input
  const rest: any = { ...props };
  delete rest.readOnly;
  delete rest.className;
  delete rest.inputClassName;
  delete rest.onChange;
  delete rest.value;
  delete rest.defaultValue;
  delete rest.placeholder;
  delete rest.showIcon;

  // ISO helpers
  const onlyISO = (s: string) => (s || "").slice(0, 10);

  const toDisplay = (s: string | undefined | null) => {
    if (!s) return "";
    const iso = onlyISO(s);
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return "";
    return `${m}/${d}/${y}`;
  };

  const toISO = (s: string) => {
    const trimmed = s.trim();
    if (!trimmed) return "";
    const m = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (m) {
      const mm = m[1].padStart(2, "0");
      const dd = m[2].padStart(2, "0");
      let yyyy = m[3];
      if (yyyy.length === 2) yyyy = `20${yyyy}`;
      return `${yyyy}-${mm}-${dd}`;
    }
    return onlyISO(trimmed);
  };

  const parseISOToDate = (iso: string | undefined | null): Date | undefined => {
    if (!iso) return undefined;
    const [y, m, d] = onlyISO(iso).split("-");
    if (!y || !m || !d) return undefined;
    return new Date(Number(y), Number(m) - 1, Number(d));
  };

  const formatDateToISO = (date: Date | undefined): string => {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [textValue, setTextValue] = React.useState(() => toDisplay(value));
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (value != null) {
      setTextValue(toDisplay(value));
    }
  }, [value]);

  const shellRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleTextChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const raw = e.currentTarget.value;
    setTextValue(raw);

    if (!onChange) return;

    const iso = toISO(raw);
    onChange({ currentTarget: { value: iso } } as any);
  };

  const handleDaySelect = (date: Date | undefined) => {
    if (!date) return;
    const iso = formatDateToISO(date);
    setTextValue(toDisplay(iso));
    if (onChange) {
      onChange({ currentTarget: { value: iso } } as any);
    }
    setOpen(false);
  };

  const selectedDate = parseISOToDate(value);

  return (
    <div ref={shellRef} className={className}>
      <div className="relative">
        <Input
          ref={inputRef}
          className={inputClassName}
          placeholder={placeholder}
          value={textValue}
          onChange={handleTextChange}
          readOnly={readOnly}
          {...rest}
        />
        {showIcon && (
          <button
            type="button"
            ref={buttonRef}
            className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
            aria-label="Open date picker"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!readOnly) {
                setOpen(!open);
              }
            }}
          >
            <span className="text-xs">📅</span>
          </button>
        )}

        {/* Custom date picker popover */}
        <Popover
          anchorRef={buttonRef}
          open={open}
          onClose={() => setOpen(false)}
          estHeight={340}
          width={300}
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            defaultMonth={selectedDate || new Date()}
            showOutsideDays
            classNames={{
              root: "rdp-root",
              months: "rdp-months",
              month: "rdp-month",
              month_caption: "rdp-month_caption",
              caption_label: "rdp-caption_label",
              nav: "rdp-nav",
              button_previous: "rdp-button_previous",
              button_next: "rdp-button_next",
              month_grid: "rdp-month_grid",
              weekdays: "rdp-weekdays",
              weekday: "rdp-weekday",
              week: "rdp-week",
              day: "rdp-day",
              day_button: "rdp-day_button",
              selected: "rdp-selected",
              today: "rdp-today",
              outside: "rdp-outside",
              disabled: "rdp-disabled",
              hidden: "rdp-hidden",
            }}
          />
        </Popover>
      </div>
    </div>
  );
}
