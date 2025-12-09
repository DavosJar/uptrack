import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  loading,
  variant = 'primary',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'px-4 h-11 rounded-lg font-bold focus:outline-none transition-all active:scale-[0.98]';
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20',
    secondary: 'bg-background-hover text-white hover:bg-border-dark border border-border-dark',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

export default Button;