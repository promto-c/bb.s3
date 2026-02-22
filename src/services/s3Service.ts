import { 
  S3Client, 
  ListBucketsCommand, 
  ListObjectsV2Command, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  CreateBucketCommandInput,
  BucketLocationConstraint
} from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Config, S3Object, Bucket } from '@/types';

export class S3Service {
  private client: S3Client | null = null;
  private config: S3Config | null = null;

  constructor(config?: S3Config) {
    if (config) {
      this.init(config);
    }
  }

  init(config: S3Config) {
    this.config = config;
    try {
      this.client = new S3Client({
        endpoint: config.endpoint,
        region: config.region || 'us-east-1',
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
        forcePathStyle: true, // Needed for MinIO usually
      });
    } catch (error) {
      console.error("Failed to initialize S3 Client", error);
    }
  }

  async listBuckets(): Promise<Bucket[]> {
    if (!this.client) throw new Error("Client not initialized");

    const command = new ListBucketsCommand({});
    const response = await this.client.send(command);
    
    return (response.Buckets || []).map(b => ({
      name: b.Name || 'Unknown',
      creationDate: b.CreationDate
    }));
  }

  async createBucket(bucketName: string): Promise<void> {
    if (!this.client) throw new Error("Client not initialized");

    const region = this.config?.region;
    // use the official SDK type so that we satisfy location constraint union
    const input: CreateBucketCommandInput = { Bucket: bucketName };

    // AWS requires a location constraint for regions other than us-east-1.
    if (region && region !== 'us-east-1') {
      input.CreateBucketConfiguration = {
        LocationConstraint: region as BucketLocationConstraint
      };
    }

    await this.client.send(new CreateBucketCommand(input));
  }

  async deleteBucket(bucketName: string): Promise<void> {
    if (!this.client) throw new Error("Client not initialized");

    // Buckets must be empty before deletion on S3-compatible providers.
    let continuationToken: string | undefined = undefined;
    do {
      const response = await this.client.send(new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken
      }));

      const keys = (response.Contents || [])
        .map((item) => item.Key)
        .filter((key): key is string => Boolean(key));

      if (keys.length > 0) {
        await this.client.send(new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: keys.map((Key) => ({ Key })),
            Quiet: true
          }
        }));
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    await this.client.send(new DeleteBucketCommand({ Bucket: bucketName }));
  }

  async listObjects(bucketName: string, prefix: string = ''): Promise<S3Object[]> {
    if (!this.client) throw new Error("Client not initialized");

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: '/'
    });

    const response = await this.client.send(command);
    
    const folders: S3Object[] = (response.CommonPrefixes || []).map(p => ({
      key: p.Prefix || '',
      isFolder: true
    }));

    const objects: S3Object[] = (response.Contents || []).map(c => {
      const key = c.Key || '';
      return {
        key,
        lastModified: c.LastModified,
        size: c.Size,
        etag: c.ETag,
        // Some S3-compatible providers return folder markers in Contents.
        isFolder: key.endsWith('/')
      };
    }).filter(o => o.key !== prefix); // Exclude the folder object itself if it exists

    // De-duplicate keys when both CommonPrefixes and Contents include the same folder marker.
    const merged = new Map<string, S3Object>();
    folders.forEach((folder) => merged.set(folder.key, folder));
    objects.forEach((obj) => {
      const existing = merged.get(obj.key);
      if (!existing) {
        merged.set(obj.key, obj);
        return;
      }

      if (existing.isFolder && !obj.isFolder) {
        return;
      }

      merged.set(obj.key, obj);
    });

    const items = Array.from(merged.values());
    items.sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      return a.key.localeCompare(b.key);
    });

    return items;
  }

  async uploadFile(bucketName: string, key: string, file: File): Promise<void> {
    if (!this.client) throw new Error("Client not initialized");

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: file.type
    });

    await this.client.send(command);
  }

  async createFolder(bucketName: string, folderKey: string): Promise<void> {
    const normalizedFolderKey = folderKey.endsWith('/') ? folderKey : `${folderKey}/`;

    if (!this.client) throw new Error("Client not initialized");

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: normalizedFolderKey,
      Body: '',
    });

    await this.client.send(command);
  }

  async deleteObject(bucketName: string, key: string): Promise<void> {
    if (!this.client) throw new Error("Client not initialized");

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    await this.client.send(command);
  }

  async getFileUrl(bucketName: string, key: string): Promise<string> {
    if (!this.client) throw new Error("Client not initialized");

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    // Generate a signed URL that expires in 1 hour
    return await getSignedUrl(this.client, command, { expiresIn: 3600 });
  }

  async getFileContent(bucketName: string, key: string): Promise<Blob | null> {
    if (!this.client) throw new Error("Client not initialized");

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    const response = await this.client.send(command);
    if (response.Body) {
       // Convert SDK stream to Blob
       return new Response(response.Body as BodyInit).blob();
    }
    return null;
  }
}
