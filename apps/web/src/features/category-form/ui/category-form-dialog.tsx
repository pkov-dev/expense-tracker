'use client';

import { type CategoryDto, createCategorySchema } from '@expense-tracker/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CategoryBadge,
  CategoryIcon,
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
} from '@/entities/category';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { createCategoryAction, updateCategoryAction } from '../api/category.actions';

type FormInput = z.input<typeof createCategorySchema>;
type FormOutput = z.output<typeof createCategorySchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present → edit mode, absent → create mode. */
  category?: CategoryDto;
}

export function CategoryFormDialog({ open, onOpenChange, category }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Редактировать категорию' : 'Новая категория'}</DialogTitle>
          <DialogDescription>Название, цвет и иконка помогают быстро находить траты.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open → the form always starts from fresh defaults. */}
        <CategoryForm category={category} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({ category, onDone }: { category: CategoryDto | undefined; onDone: () => void }) {
  const [serverError, setServerError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: category?.name ?? '',
      color: category?.color ?? DEFAULT_CATEGORY_COLOR,
      icon: category?.icon ?? DEFAULT_CATEGORY_ICON,
    },
  });

  const [name, color, icon] = useWatch({ control, name: ['name', 'color', 'icon'] });

  const onSubmit = handleSubmit((values) => {
    setServerError(undefined);
    startTransition(async () => {
      const result = category
        ? await updateCategoryAction(category.id, values)
        : await createCategoryAction(values);
      if (result) setServerError(result.error);
      else onDone();
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="category-name">Название</FieldLabel>
          <Input
            id="category-name"
            autoComplete="off"
            maxLength={50}
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          {errors.name && <FieldError>Введите название (до 50 символов)</FieldError>}
        </Field>

        <Field>
          <FieldLabel>Цвет</FieldLabel>
          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORY_COLORS.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    aria-label={`Цвет ${swatch}`}
                    aria-pressed={field.value === swatch}
                    onClick={() => field.onChange(swatch)}
                    className="flex size-7 items-center justify-center rounded-full outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    style={{ backgroundColor: swatch }}
                  >
                    {field.value === swatch && <Check className="size-4 text-white" />}
                  </button>
                ))}
                <input
                  type="color"
                  aria-label="Свой цвет"
                  value={field.value ?? DEFAULT_CATEGORY_COLOR}
                  onChange={(event) => field.onChange(event.target.value)}
                  className="size-7 cursor-pointer rounded-full border bg-transparent p-0"
                />
              </div>
            )}
          />
        </Field>

        <Field>
          <FieldLabel>Иконка</FieldLabel>
          <Controller
            name="icon"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-6 gap-2">
                {Object.keys(CATEGORY_ICONS).map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    aria-label={iconName}
                    aria-pressed={field.value === iconName}
                    onClick={() => field.onChange(iconName)}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-md border outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50',
                      field.value === iconName && 'border-primary bg-accent',
                    )}
                  >
                    <CategoryIcon name={iconName} className="size-4" />
                  </button>
                ))}
              </div>
            )}
          />
        </Field>

        <div className="rounded-md border bg-muted/40 p-3">
          <CategoryBadge name={name.trim() || 'Предпросмотр'} color={color ?? DEFAULT_CATEGORY_COLOR} icon={icon ?? null} />
        </div>

        {serverError && <FieldError>{serverError}</FieldError>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
            Отмена
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Сохраняем…' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}
