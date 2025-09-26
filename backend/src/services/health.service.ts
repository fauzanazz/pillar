import { healthCheck } from '@/repositories/health.repository';

export const healthCheckService = async () => {
  return await healthCheck();
};
