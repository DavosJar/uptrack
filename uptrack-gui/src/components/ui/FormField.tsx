import React from 'react';

interface FormFieldProps {
  label: string;
  type: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  helpText?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  type,
  name,
  value,
  onChange,
  required,
  placeholder,
  options,
  helpText,
}) => {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-muted">{label}</label>
      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full bg-background-input border border-border-dark rounded-lg h-11 px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
        >
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className="w-full bg-background-input border border-border-dark rounded-lg h-11 px-4 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
        />
      )}
      {helpText && <p className="text-xs text-text-muted">{helpText}</p>}
    </div>
  );
};

export default FormField;