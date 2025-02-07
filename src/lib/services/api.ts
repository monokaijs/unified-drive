import {z} from 'zod';
import {registerSchema} from '@/lib/validations/auth';
import axios, {AxiosRequestConfig, Method} from 'axios';
import {ApiResponse} from '@/lib/types/common/api';

class ApiService {
  api = axios.create({
    baseURL: '/api',
  });

  register = (data: z.infer<typeof registerSchema>) => {
    return this.call('POST', '/auth/register', {data});
  }

  call = async <T>(method: Method, endpoint: string, options?: AxiosRequestConfig) => {
    const r = await this.api(endpoint, {
      method,
      ...options,
    });
    return r.data as ApiResponse<T>;
  };
}

export const apiService = new ApiService();
