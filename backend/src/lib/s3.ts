import * as Minio from 'minio';

import { env } from '@/configs';

const client = new Minio.Client({
  endPoint: env.S3_ENDPOINT,
  // port: 9000,
  useSSL: true,
  accessKey: env.S3_ACCESS_KEY_ID,
  secretKey: env.S3_SECRET_ACCESS_KEY,
});

export const createPutObjectPresignedUrl = async (
  key: string,
  bucketName: string,
  expiresIn: number,
) => {
  return await client.presignedPutObject(bucketName, key, expiresIn);
};

export const createGetObjectPresignedUrl = async (
  key: string,
  bucketName: string,
  expiresIn: number,
) => {
  return await client.presignedGetObject(bucketName, key, expiresIn);
};

export const getPresignedUrlByUrl = async (url: string) => {
  try {
    const urlObj = new URL(url);
    const bucketName = urlObj.pathname.split('/')[1];
    const objectKey = urlObj.pathname.split('/').slice(2).join('/');

    return await createGetObjectPresignedUrl(objectKey, bucketName, 60 * 60);
  } catch (error) {
    console.error('Error generating presigned URL from url:', error);
    return '';
  }
};
