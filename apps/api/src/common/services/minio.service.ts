import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Minio.Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.client = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: this.configService.get<number>('MINIO_PORT', 9000),
      useSSL: false,
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'CAMBIAR_POR_SEGURO'),
    });
    this.bucket = this.configService.get<string>('MINIO_BUCKET', 'legal-documents');
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, 'us-east-1');
      }
    } catch {
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<{ fileUrl: string; objectName: string }> {
    const objectName = `${Date.now()}-${fileName.replace(/\s+/g, '_')}`;

    await this.client.putObject(this.bucket, objectName, fileBuffer, fileBuffer.length, {
      'Content-Type': mimeType,
    });

    // URI interna (no publica): el bucket NO se expone; el acceso pasa por la API.
    const fileUrl = `minio://${this.bucket}/${objectName}`;

    return { fileUrl, objectName };
  }

  async getFileBuffer(objectName: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, objectName);
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async getFileUrl(
    objectName: string,
    expirySeconds = 3600,
    downloadFileName?: string,
  ): Promise<string> {
    const respHeaders = downloadFileName
      ? { 'response-content-disposition': `attachment; filename="${downloadFileName}"` }
      : undefined;
    return this.client.presignedGetObject(this.bucket, objectName, expirySeconds, respHeaders);
  }

  async deleteFile(objectName: string): Promise<void> {
    await this.client.removeObject(this.bucket, objectName);
  }
}
