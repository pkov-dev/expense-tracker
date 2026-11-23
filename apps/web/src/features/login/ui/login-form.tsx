'use client';

import { loginSchema } from '@expense-tracker/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { loginAction } from '../api/login.action';

// `agreement` is a client-side consent gate only; it is not sent to the API.
const loginFormSchema = loginSchema.extend({
  agreement: z.literal(true, { error: 'Необходимо принять условия' }),
});
type LoginFormValues = z.input<typeof loginFormSchema>;

export function LoginForm() {
  const [serverError, setServerError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues, unknown, z.output<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '', agreement: false as unknown as true },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(undefined);
    startTransition(async () => {
      const { email, password } = values;
      const result = await loginAction({ email, password });
      if (result) setServerError(result.error);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="login-email">Email</FieldLabel>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && <FieldError>Введите корректный email</FieldError>}
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="login-password">Пароль</FieldLabel>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && <FieldError>Введите пароль</FieldError>}
        </Field>

        <Field orientation="horizontal" className="items-start" data-invalid={!!errors.agreement}>
          <Controller
            name="agreement"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="login-agreement"
                className="mt-0.5"
                checked={field.value === true}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                onBlur={field.onBlur}
                aria-invalid={!!errors.agreement}
              />
            )}
          />
          <FieldLabel htmlFor="login-agreement" className="block font-normal leading-snug">
            Согласен с{' '}
            <Link href="/terms" target="_blank" className="underline underline-offset-4">
              пользовательским соглашением
            </Link>{' '}
            и{' '}
            <Link href="/privacy" target="_blank" className="underline underline-offset-4">
              политикой обработки данных
            </Link>
          </FieldLabel>
        </Field>
        {errors.agreement && <FieldError>Необходимо принять условия, чтобы продолжить</FieldError>}

        {serverError && <FieldError>{serverError}</FieldError>}

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Входим…' : 'Войти'}
        </Button>
      </FieldGroup>
    </form>
  );
}
