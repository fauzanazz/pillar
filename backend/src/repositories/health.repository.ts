export const healthCheck = async () => {
  return {
    success: true,
    message: 'Health check successful',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    code: 200,
  };
};
