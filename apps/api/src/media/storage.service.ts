import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  GetBucketLocationCommand,
} from "@aws-sdk/client-s3";
import { config } from "../common/config";
@Injectable()
export class StorageService {
  private readonly s3: S3Client | null;
  constructor() {
    const { S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = config;
    this.s3 =
      S3_ENDPOINT &&
      S3_ACCESS_KEY_ID &&
      S3_SECRET_ACCESS_KEY &&
      config.S3_BUCKET
        ? new S3Client({
            endpoint: S3_ENDPOINT,
            region: config.S3_REGION,
            forcePathStyle: true,
            credentials: {
              accessKeyId: S3_ACCESS_KEY_ID,
              secretAccessKey: S3_SECRET_ACCESS_KEY,
            },
            requestHandler: { connectionTimeout: 5000, requestTimeout: 15000 },
          })
        : null;
  }
  get configured() {
    return !!this.s3;
  }
  private client() {
    if (!this.s3)
      throw new ServiceUnavailableException(
        "El almacenamiento de fotografías todavía no está disponible. Puedes seguir preparando el texto y guardar el borrador.",
      );
    return this.s3;
  }
  async check() {
    await this.client().send(
      new GetBucketLocationCommand({ Bucket: config.S3_BUCKET }),
    );
  }
  put(key: string, body: Buffer, contentType = "image/webp") {
    return this.client().send(
      new PutObjectCommand({
        Bucket: config.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }
  remove(key: string) {
    return this.client().send(
      new DeleteObjectCommand({ Bucket: config.S3_BUCKET, Key: key }),
    );
  }
  get(key: string) {
    return this.client().send(
      new GetObjectCommand({ Bucket: config.S3_BUCKET, Key: key }),
    );
  }
}
