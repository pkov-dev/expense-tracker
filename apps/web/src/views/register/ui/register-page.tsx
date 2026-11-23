import Link from 'next/link';
import { RegisterForm } from '@/features/register';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';

export function RegisterPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Регистрация</CardTitle>
        <CardDescription>Создайте аккаунт, чтобы вести учёт расходов</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Уже есть аккаунт?&nbsp;
        <Link href="/auth/login" className="text-foreground underline underline-offset-4">
          Войти
        </Link>
      </CardFooter>
    </Card>
  );
}
