'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@near-by/types';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Input, Label } from '@near-by/ui';
import { useAuth } from '../../../hooks/use-auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login.mutateAsync(data);
      router.push(searchParams.get('next') || '/dashboard');
    } catch {
      // surfaced via login.isError below
    }
  };

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-16">
      <Card className="w-full max-w-md p-8">
        <p className="text-xs uppercase tracking-widest text-gold-400/80">Welcome back</p>
        <h1 className="mt-2 font-display text-3xl text-cream-50">Log in to Near By</h1>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" className="mt-2" {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" className="mt-2" {...register('password')} />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          {login.isError && (
            <p className="text-sm text-red-400">
              {(login.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                'Invalid email or password.'}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-cream-400/60">
          New to Near By?{' '}
          <Link href="/register" className="text-gold-300 hover:underline">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
