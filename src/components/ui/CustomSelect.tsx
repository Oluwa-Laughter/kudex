'use client';
import type { ReactNode } from 'react';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { FiCheck, FiChevronDown } from 'react-icons/fi';
export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}
export interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  variant?: 'default' | 'compact' | 'input-addon';
  label?: string;
}
export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Choose an option',
  disabled = false,
  className = '',
  buttonClassName = '',
  variant = 'default',
  label,
}: CustomSelectProps) {
  const selected = options.find((option) => option.value === value);
  return (
    <div className={className}>
      <Menu.Root modal={false}>
        <Menu.Trigger
          disabled={disabled}
          aria-label={label}
          className={`flex min-h-11 items-center justify-between gap-3 rounded-xl border border-input bg-card px-4 py-3 text-sm font-medium disabled:opacity-50 ${variant === 'default' ? 'w-full' : ''} ${buttonClassName}`}
        >
          <span className="flex min-w-0 items-center gap-2">
            {selected?.icon}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          <FiChevronDown aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content
            sideOffset={6}
            collisionPadding={12}
            align={variant === 'input-addon' ? 'end' : 'start'}
            className="menu-content z-[70] min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[calc(100vw-24px)] overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl"
            aria-label={label ?? placeholder}
          >
            {options.map((option) => (
              <Menu.Item
                key={option.value}
                textValue={option.label}
                onSelect={() => onChange(option.value)}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-secondary data-[highlighted]:text-primary"
              >
                {option.icon}
                <span className="min-w-0 flex-1">
                  <span className="block">{option.label}</span>
                  {option.description && (
                    <span className="block text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </span>
                {value === option.value && (
                  <>
                    <FiCheck aria-hidden="true" />
                    <span className="sr-only">Selected</span>
                  </>
                )}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}
