import {withApi} from '@/lib/middlewares/withApi';
import {registerSchema} from '@/lib/validations/auth';
import {userService} from '@/lib/services/user';

export const POST = withApi(async (req, context) => {
  const result = registerSchema.safeParse(await req.json());
  if (!result.success) throw new Error(result.error.message);
  const user = await userService.create(result.data, result.data.password);
  const {password: _, ...safeUser} = user.toJSON();
  return {
    data: safeUser,
    message: 'Account created successfully'
  };
})
