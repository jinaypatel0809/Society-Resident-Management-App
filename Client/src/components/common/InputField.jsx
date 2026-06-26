import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function InputField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon: Icon,
  error,
  theme = "admin",  // 'admin' | 'resident'
  required = false,
  disabled = false,
  rightLabel,
  onRightLabelClick,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType  = isPassword ? (showPassword ? "text" : "password") : type;

  const focusClass = theme === "admin" ? "input-admin" : "input-resident";
  const borderErr  = error ? "border-red-400" : "border-gray-200";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {rightLabel && (
          <button
            type="button"
            onClick={onRightLabelClick}
            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
          >
            {rightLabel}
          </button>
        )}
      </div>

      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={16} />
          </span>
        )}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`
            w-full py-2.5 pr-10 text-sm bg-white border rounded-lg
            text-gray-800 placeholder-gray-400
            transition-all duration-150
            ${Icon ? "pl-9" : "pl-3"}
            ${borderErr}
            ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : focusClass}
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
