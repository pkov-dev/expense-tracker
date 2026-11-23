import Link from 'next/link';
import { LoginForm } from '@/features/login';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';

export function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Вход</CardTitle>
        <CardDescription>Войдите в свой аккаунт Expense Tracker</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Нет аккаунта?&nbsp;
        <Link href="/auth/register" className="text-foreground underline underline-offset-4">
          Зарегистрироваться
        </Link>
      </CardFooter>
    </Card>
  );
}
