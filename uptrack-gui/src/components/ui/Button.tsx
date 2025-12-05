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
  const baseClasses = 'px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
  const variantClasses = {
    primary: 'bg-primary text-text-main hover:bg-primary-hover focus:ring-primary',
    secondary: 'bg-background-hover text-text-main hover:bg-border-dark focus:ring-border-dark',
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