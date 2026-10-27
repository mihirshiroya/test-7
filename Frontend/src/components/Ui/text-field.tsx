import { useId, type ComponentProps } from 'react';
import { cn } from '../../lib/utills';
import { Input } from './input';

export interface TextFieldProps extends ComponentProps<'input'> {
  label: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export function TextField({
  label,
  error,
  helperText,
  id,
  className,
  containerClassName,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const describedBy =
    [props['aria-describedby'], error || helperText ? messageId : undefined].filter(Boolean).join(' ') ||
    undefined;

  return (
    <div className={cn('text-field', containerClassName)} data-invalid={error ? true : undefined}>
      <label htmlFor={inputId} className="text-field-label">
        {label}
      </label>
      <Input
        {...props}
        id={inputId}
        className={cn('text-field-input', className)}
        aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={describedBy}
      />
      {(error || helperText) && (
        <p
          id={messageId}
          className={cn('text-field-message', error && 'text-field-error')}
          role={error ? 'alert' : undefined}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
