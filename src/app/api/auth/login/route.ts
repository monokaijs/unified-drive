import {withApi} from '@/lib/middlewares/withApi';
import {authService} from '@/lib/services/auth';
import {loginSchema} from '@/lib/validations/auth';
import {NextResponse} from 'next/server';

export const POST = withApi(async (req, context, decoded) => {
  if (decoded) throw new Error('Already logged in');
  const data = await req.json();
  const result = loginSchema.safeParse(data);
  if (!result.success) throw new Error('Invalid data');
  const user = await authService.validateLogin(result.data.username, result.data.password);
  const token = await authService.generateUserToken(user);
  const response = NextResponse.json({
    data: {user},
    message: 'Login success',
  });
  // use next middleware to handle session token changed
  response.cookies.set('next-auth.session-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return response;
});
