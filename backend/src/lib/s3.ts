import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from '@/configs';

const s3 = new S3Client({
  region: 'auto',
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

export const getPutObjectSignedUrl = async (
  key: string,
  contentType: string,
): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME || 'nusa',
    Key: key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return signedUrl;
};

export const getGetObjectSignedUrl = async (key: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET_NAME || 'nusa',
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return signedUrl;
};
