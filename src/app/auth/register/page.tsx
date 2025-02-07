import {cn} from '@/lib/utils';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import RegisterForm from '@/app/auth/register/RegisterForm';

export default function RegisterPage() {
  return <div className={cn('flex flex-col gap-6')}>
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          Create an account
        </CardTitle>
        <CardDescription>
          Create your account to access Unified Drive.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm/>
      </CardContent>
    </Card>
    <div
      className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
      By clicking continue, you agree to our <a href="#">Terms of Service</a>{' '}
      and <a href="#">Privacy Policy</a>.
    </div>
  </div>;
}
