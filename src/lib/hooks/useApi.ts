import { useState, useCallback } from 'react';
import {AxiosError} from 'axios';
import {ApiResponse} from '@/lib/types/common/api';


function useApi<TArgs extends unknown[], TData>(
  apiMethod: (...args: TArgs) => Promise<ApiResponse<TData>>
): [
  (...args: TArgs) => Promise<ApiResponse<TData>>,
  {
    loading: boolean;
    data: TData | null;
    message: string | null;
    statusCode: number | null;
    error: Error | null;
  }
] {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const doRequest = useCallback(async (...args: TArgs) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiMethod(...args);
      setData(response.data);
      setMessage(response.message);
      setStatusCode(response.code);
      return response;
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
        if (err instanceof AxiosError) {
          const {message} = err.response?.data ?? {
            message: 'Unknown error'
          };
          const newError: any = new Error(message);
          newError.status = err.response?.status;
          throw newError;
        }
      } else {
        setError(err as any);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiMethod]);

  return [doRequest, { loading, data, message, statusCode, error }];
}

export default useApi;
