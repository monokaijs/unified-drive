'use client';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {zodResolver} from '@hookform/resolvers/zod';
import {loginSchema, registerSchema} from '@/lib/validations/auth';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import useApi from '@/lib/hooks/useApi';
import { apiService } from '@/lib/services/api';
import {toast} from 'sonner';
import {useRouter} from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [callRegister, {loading}] = useApi(apiService.register);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    callRegister(data).then(data => {
      toast(data.message);
      router.push('/');
    });
  }


  return <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="Password" type={'password'} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          Submit
        </Button>
      </div>
      <div className="text-center text-sm">
        Got an account?{' '}
        <a href="/auth/login" className="underline underline-offset-4">
          Login
        </a>
      </div>
    </form>
  </Form>;
}
