"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FormFieldType =
  | "text"
  | "number"
  | "email"
  | "password"
  | "textarea"
  | "select"
  | "searchable-select"
  | "multi-select"
  | "date";

export interface FormFieldConfig {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string | number; disabled?: boolean }[];
  validation?: z.ZodType<any>;
  disabled?: boolean;
  searchableConfig?: {
    onSearch?: (value: string) => void;
    onLoadMore?: () => void;
    loading?: boolean;
    hasMore?: boolean;
    detailsPanel?: (value: string | number | undefined) => React.ReactNode;
  };
}

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  defaultValues?: Record<string, any>;
  loading?: boolean;
}

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  fields,
  defaultValues = {},
  loading = false,
}: FormModalProps) {
  // Normalize defaultValues based on field types
  const normalizedDefaults = useMemo(() => fields.reduce((acc, field) => {
    const value = defaultValues[field.name];
    if (value !== undefined) {
      if (field.type === "number") {
        acc[field.name] = String(value ?? "");
      } else if (field.type === "select") {
        acc[field.name] = String(value);
      } else if (field.type === "multi-select") {
        acc[field.name] = Array.isArray(value) ? value : [];
      } else if (field.type === "date") {
        // Convert ISO date strings to YYYY-MM-DD for date inputs
        if (typeof value === "string") {
          try {
            const date = new Date(value);
            acc[field.name] = date.toISOString().split('T')[0];
          } catch (e) {
            acc[field.name] = value;
          }
        } else if (value instanceof Date) {
          acc[field.name] = value.toISOString().split('T')[0];
        } else {
          acc[field.name] = value;
        }
      } else {
        acc[field.name] = value;
      }
    } else if (field.type === "multi-select") {
      acc[field.name] = [];
    } else if (field.type === "date") {
      // Set empty string for date fields if no default value
      acc[field.name] = "";
    }
    return acc;
  }, {} as Record<string, any>), [fields, defaultValues]);

  // Create dynamic Zod schema based on fields
  const schema = useMemo(() => z.object(
    fields.reduce((acc, field) => {
      let fieldSchema: z.ZodType<any>;

      if (field.validation) {
        fieldSchema = field.validation;
      } else {
        switch (field.type) {
          case "email":
            fieldSchema = z.string().email("Invalid email address");
            break;
          case "number":
            fieldSchema = z.string();
            break;
          case "date":
            fieldSchema = z.string();
            break;
          case "multi-select":
            fieldSchema = z.array(z.number()).optional();
            break;
          case "searchable-select":
            fieldSchema = z.union([z.string(), z.number()]);
            break;
          default:
            fieldSchema = z.string();
        }

        if (field.required) {
          if (field.type === "number") {
            fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.label} is required`);
          } else if (field.type === "multi-select") {
            fieldSchema = (fieldSchema as z.ZodArray<z.ZodNumber>).min(1, `${field.label} is required`);
          } else if (field.type === "searchable-select") {
            fieldSchema = fieldSchema;
          } else {
            fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.label} is required`);
          }
        } else {
          fieldSchema = fieldSchema.optional();
        }
      }

      acc[field.name] = fieldSchema;
      return acc;
    }, {} as Record<string, z.ZodType<any>>)
  ), [fields]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: normalizedDefaults,
  });

  const prevIsOpen = useRef(false);
  
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      form.reset(normalizedDefaults);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, form]);

  const handleSubmit = async (data: any) => {
    try {
      // Convert string numbers to numbers only for number type fields
      // Automatically convert fields ending in 'Id' to numbers if they are strings
      // Convert date strings to ISO strings for date inputs
      const processedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => {
          const field = fields.find(f => f.name === key);
          if (field?.type === "number" && typeof value === 'string') {
            const numValue = Number(value);
            return [key, isNaN(numValue) ? 0 : numValue];
          }
          // Automatically convert fields ending in 'Id' to numbers if they are strings
          if (key.endsWith('Id') && typeof value === 'string') {
            const numValue = Number(value);
            return [key, isNaN(numValue) ? value : numValue];
          }
          // Convert date strings to ISO strings for date inputs
          if (field?.type === "date" && typeof value === 'string' && value) {
            try {
              // For date inputs, we need to send ISO date strings that Zod can parse
              const date = new Date(value);
              // Check if it's a valid date
              if (!isNaN(date.getTime())) {
                return [key, date.toISOString()];
              } else {
                return [key, value];
              }
            } catch (e) {
              return [key, value];
            }
          }
          return [key, value];
        })
      );
      await onSubmit(processedData);
      onClose();
      form.reset();
    } catch (error) {
      console.error("Form submission failed:", error);
    }
  };

  const renderField = (field: FormFieldConfig) => {
    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </FormLabel>
            <FormControl>
              {field.type === "textarea" ? (
                <Textarea
                  {...formField}
                  placeholder={field.placeholder}
                  className="min-h-[80px]"
                  disabled={field.disabled}
                />
              ) : field.type === "select" ? (
                <Select
                  onValueChange={formField.onChange}
                  value={formField.value || ""}
                >
                  <SelectTrigger disabled={field.disabled}>
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={String(option.value)}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "searchable-select" ? (
                <SearchableSelect
                  value={formField.value}
                  onSelect={(val) => formField.onChange(val)}
                  options={field.options?.map((o) => ({
                    value: o.value,
                    label: o.label,
                  })) || []}
                  onSearch={field.searchableConfig?.onSearch}
                  loading={field.searchableConfig?.loading}
                  hasMore={field.searchableConfig?.hasMore}
                  onLoadMore={field.searchableConfig?.onLoadMore}
                  detailsPanel={field.searchableConfig?.detailsPanel}
                  placeholder={field.placeholder}
                  searchPlaceholder={`Search ${field.label.toLowerCase()}...`}
                  disabled={field.disabled}
                />
              ) : field.type === "multi-select" ? (
                <div className="space-y-2">
                  {field.options?.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${field.name}-${option.value}`}
                        checked={(formField.value || []).includes(option.value)}
                        onCheckedChange={(checked) => {
                          const currentValue = formField.value || [];
                          if (checked) {
                            formField.onChange([...currentValue, option.value]);
                          } else {
                            formField.onChange(currentValue.filter((v: any) => v !== option.value));
                          }
                        }}
                        disabled={field.disabled}
                      />
                      <label
                        htmlFor={`${field.name}-${option.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <Input
                  {...formField}
                  type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                   onChange={(e) => formField.onChange(e.target.value)}
                  value={formField.value ?? ""}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {fields.map(renderField)}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}