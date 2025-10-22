'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';

// Generic form field component
interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'textarea' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  control?: any;
  className?: string;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
}

export function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  error,
  control,
  className = '',
  rows = 4,
  min,
  max,
  step,
}: FormFieldProps) {
  const renderInput = (field: any) => {
    const baseClasses = cn(
      "transition-colors",
      error && "border-destructive focus-visible:ring-destructive"
    );

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...field}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={cn(
              "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              baseClasses,
              className
            )}
          />
        );
      case 'number':
        return (
          <Input
            {...field}
            type="number"
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={cn(baseClasses, className)}
          />
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              {...field}
              type="checkbox"
              checked={field.value || false}
              disabled={disabled}
              className={cn(
                "h-4 w-4 rounded border border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                error && "border-destructive"
              )}
            />
            <span className="text-sm text-gray-600">{label}</span>
          </div>
        );
      default:
        return (
          <Input
            {...field}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(baseClasses, className)}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => renderInput(field)}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// Generic form component
interface FormProps<T extends z.ZodType> {
  schema: T;
  onSubmit: (data: z.infer<T>) => void | Promise<void>;
  children: React.ReactNode;
  defaultValues?: Partial<z.infer<T>>;
  className?: string;
  loading?: boolean;
}

export function Form<T extends z.ZodType>({
  schema,
  onSubmit,
  children,
  defaultValues,
  className = '',
  loading = false,
}: FormProps<T>) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  });

  const handleFormSubmit = async (data: z.infer<T>) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn("space-y-6", className)}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === FormField) {
          return React.cloneElement(child, {
            control,
            error: errors[child.props.name]?.message,
          } as any);
        }
        return child;
      })}
      
      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || loading}
          className="flex-1"
        >
          {isSubmitting || loading ? 'Processing...' : 'Submit'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isSubmitting || loading}
          className="flex-1"
        >
          Reset
        </Button>
      </div>
    </form>
  );
}

// Select field component
interface SelectFieldProps {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  control: any;
  className?: string;
}

export function SelectField({
  label,
  name,
  options,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  error,
  control,
  className = '',
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <select
            {...field}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// Checkbox field component
interface CheckboxFieldProps {
  label: string;
  name: string;
  description?: string;
  disabled?: boolean;
  error?: string;
  control: any;
  className?: string;
}

export function CheckboxField({
  label,
  name,
  description,
  disabled = false,
  error,
  control,
  className = '',
}: CheckboxFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="flex items-start space-x-3">
            <div className="flex items-center h-5">
              <input
                {...field}
                type="checkbox"
                checked={field.value || false}
                disabled={disabled}
                className={cn(
                  "h-4 w-4 rounded border border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  error && "border-destructive"
                )}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">
                {label}
              </Label>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        )}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// Radio group component
interface RadioGroupProps {
  label: string;
  name: string;
  options: Array<{ value: string; label: string; description?: string }>;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  control: any;
  className?: string;
}

export function RadioGroup({
  label,
  name,
  options,
  required = false,
  disabled = false,
  error,
  control,
  className = '',
}: RadioGroupProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="space-y-3">
            {options.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <div className="flex items-center h-5">
                  <input
                    {...field}
                    type="radio"
                    value={option.value}
                    checked={field.value === option.value}
                    disabled={disabled}
                    className={cn(
                      "h-4 w-4 border border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                      error && "border-destructive"
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">
                    {option.label}
                  </Label>
                  {option.description && (
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// Form validation hook
export function useFormValidation<T extends z.ZodType>(schema: T) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    setValue,
    watch,
    getValues,
  } = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  return {
    control,
    handleSubmit,
    errors,
    isSubmitting,
    isValid,
    reset,
    setValue,
    watch,
    getValues,
  };
}
