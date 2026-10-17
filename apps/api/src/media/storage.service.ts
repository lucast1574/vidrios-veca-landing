import { Injectable } from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { config } from "../common/config";
@Injectable()
export class StorageService {
  private readonly s3 = new S3Client({
    endpoint: config.S3_ENDPOINT,
    region: config.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.S3_ACCESS_KEY_ID,
      secretAccessKey: config.S3_SECRET_ACCESS_KEY,
    },
  });
  async check() {
    await this.s3.send(new HeadBucketCommand({ Bucket: config.S3_BUCKET }));
  }
  put(key: string, body: Buffer) {
    return this.s3.send(
      new PutObjectCommand({
        Bucket: config.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: "image/webp",
      }),
    );
  }
  get(key: string) {
    return this.s3.send(
      new GetObjectCommand({ Bucket: config.S3_BUCKET, Key: key }),
    );
  }
}
