'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@near-by/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Checkbox, Input, Label, Tabs, TabsList, TabsTrigger } from '@near-by/ui';
import { useAuth } from '../../../hooks/use-auth';

export default function RegisterPage() {
  const { register: doRegister } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CUSTOMER', ageConfirmed: false as unknown as true, termsAccepted: false as unknown as true },
  });

  const role = watch('role');

  const onSubmit = async (data: RegisterInput) => {
    try {
      await doRegister.mutateAsync(data);
      router.push(role === 'PROVIDER' ? '/provider/dashboard' : '/dashboard');
    } catch {
      // surfaced via doRegister.isError below
    }
  };

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-16">
      <Card className="w-full max-w-md p-8">
        <p className="text-xs uppercase tracking-widest text-gold-400/80">Join Near By</p>
        <h1 className="mt-2 font-display text-3xl text-cream-50">Create your account</h1>

        <Tabs value={role} onValueChange={(v) => setValue('role', v as 'CUSTOMER' | 'PROVIDER')} className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="CUSTOMER" className="flex-1">
              I&apos;m a customer
            </TabsTrigger>
            <TabsTrigger value="PROVIDER" className="flex-1">
              I&apos;m a provider
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" className="mt-2" {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" className="mt-2" {...register('phone')} />
            {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" className="mt-2" {...register('password')} />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" className="mt-2" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>}
          </div>

          <Controller
            control={control}
            name="ageConfirmed"
            render={({ field }) => (
              <label className="flex items-start gap-3 text-sm text-cream-300/80">
                <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} />
                I confirm that I am 18 years of age or older.
              </label>
            )}
          />
          {errors.ageConfirmed && <p className="text-xs text-red-400">{errors.ageConfirmed.message}</p>}

          <Controller
            control={control}
            name="termsAccepted"
            render={({ field }) => (
              <label className="flex items-start gap-3 text-sm text-cream-300/80">
                <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} />
                I agree to the terms of service and privacy policy.
              </label>
            )}
          />
          {errors.termsAccepted && <p className="text-xs text-red-400">{errors.termsAccepted.message}</p>}

          {doRegister.isError && (
            <p className="text-sm text-red-400">
              {(doRegister.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                'Something went wrong — please try again.'}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={doRegister.isPending}>
            {doRegister.isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-cream-400/60">
          Already have an account?{' '}
          <Link href="/login" className="text-gold-300 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
