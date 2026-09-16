import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered';
}

export function Card({ className = '', variant = 'default', children, ...props }: CardProps) {
  const variantStyles = {
    default: 'bg-white border border-neutral-200 shadow-edu',
    elevated: 'bg-white shadow-edu-lg border-0',
    bordered: 'bg-white border-2 border-primary-100',
  };

  return (
    <div
      className={`rounded-edu transition-shadow duration-200 hover:shadow-edu-lg ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: CardProps) {
  return (
    <div className={`px-6 py-5 border-b border-neutral-200 bg-neutral-50 rounded-t-edu ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className = '', children, ...props }: CardProps) {
  return (
    <div className={`px-6 py-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }: CardProps) {
  return (
    <div className={`px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-edu ${className}`} {...props}>
      {children}
    </div>
  );
}
