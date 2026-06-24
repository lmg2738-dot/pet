import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.replace(/\s/g, "-").toLowerCase();

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-stone-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20",
          error && "border-red-400",
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.replace(/\s/g, "-").toLowerCase();

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-stone-700"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? label?.replace(/\s/g, "-").toLowerCase();

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-stone-700"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          "w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20",
          className
        )}
        {...props}
      />
    </div>
  );
}
