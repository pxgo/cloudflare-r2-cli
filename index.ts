import { 
  S3Client, 
  CopyObjectCommand, 
  DeleteObjectCommand, 
  ListObjectsCommand, 
  GetObjectCommand, 
  PutObjectCommand, 
  HeadObjectCommand, 
  ListBucketsCommand 
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import type { Readable } from 'stream';

// 配置 Cloudflare R2 凭证
const REGION = 'auto';  // R2 需要使用 'auto' 作为区域
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID as string;
const ACCESS_KEY = process.env.R2_ACCESS_KEY as string;
const SECRET_KEY = process.env.R2_SECRET_KEY as string;

// 创建 S3 客户端实例
const s3Client = new S3Client({
  region: REGION,
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY
  }
});

// 上传文件
async function uploadFile(bucket: string, filePath: string, key?: string): Promise<void> {
  const fileStream = fs.createReadStream(filePath);
  const params = {
    Bucket: bucket,
    Key: key || path.basename(filePath),
    Body: fileStream
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    console.log(`文件 ${filePath} 上传成功到 ${bucket} 中的 ${key || path.basename(filePath)}`);
  } catch (err) {
    console.error("上传文件失败:", err);
  }
}

// 下载文件
async function downloadFile(bucket: string, key: string, downloadPath?: string): Promise<void> {
  const params = {
    Bucket: bucket,
    Key: key
  };

  try {
    const data = await s3Client.send(new GetObjectCommand(params));
    const fileStream = fs.createWriteStream(downloadPath || key);
    (data.Body as Readable).pipe(fileStream).on('finish', () => {
      console.log(`文件 ${key} 下载成功到 ${downloadPath || key}`);
    }).on('error', (err) => {
      console.error("下载文件失败:", err);
    });
  } catch (err) {
    console.error("下载文件失败:", err);
  }
}

// 显示文件列表
async function listFiles(bucket: string): Promise<void> {
  const params = {
    Bucket: bucket
  };

  try {
    const data = await s3Client.send(new ListObjectsCommand(params));
    if (data.Contents && data.Contents.length > 0) {
      console.log(`${bucket} 中的文件列表：`);
      data.Contents.forEach((file) => {
        console.log(`- ${file.Key} (大小: ${file.Size} 字节)`);
      });
    } else {
      console.log(`${bucket} 存储桶中没有文件。`);
    }
  } catch (err) {
    console.error("获取文件列表失败:", err);
  }
}

// 显示文件信息
async function getFileInfo(bucket: string, key: string): Promise<void> {
  const params = {
    Bucket: bucket,
    Key: key
  };

  try {
    const data = await s3Client.send(new HeadObjectCommand(params));
    console.log(`文件信息 - ${key}:`);
    console.log(`大小: ${data.ContentLength} 字节`);
    console.log(`类型: ${data.ContentType}`);
    console.log(`最后修改时间: ${data.LastModified}`);
    const fileUrl = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com/${bucket}/${key}`;
    console.log(`访问链接: ${fileUrl}`);
  } catch (err) {
    console.error("获取文件信息失败:", err);
  }
}

// 列出所有存储桶
async function listBuckets(): Promise<void> {
  try {
    const data = await s3Client.send(new ListBucketsCommand({}));
    if (data.Buckets && data.Buckets.length > 0) {
      console.log("存储桶列表：");
      data.Buckets.forEach(bucket => console.log(`- ${bucket.Name}`));
    } else {
      console.log("没有存储桶。");
    }
  } catch (err) {
    console.error("获取存储桶列表失败:", err);
  }
}

// 主函数，处理命令行输入
async function main(): Promise<void> {
  const [,, command, ...args] = process.argv;

  if (command === 'buckets') {
    await listBuckets();
    return;
  }

  const bucket = args[0];

  switch (command) {
    case 'upload':
      const filePath = args[1];
      const key = args[2];
      if (!filePath) {
        console.log("用法: <command> upload <bucketName> <filePath> [key]");
        return;
      }
      await uploadFile(bucket, filePath, key);
      break;

    case 'download':
      const downloadKey = args[1];
      const downloadPath = args[2];
      if (!downloadKey) {
        console.log("用法: <command> download <bucketName> <key> [downloadPath]");
        return;
      }
      await downloadFile(bucket, downloadKey, downloadPath);
      break;

    case 'list':
      await listFiles(bucket);
      break;

    case 'info':
      const infoKey = args[1];
      if (!infoKey) {
        console.log("用法: <command> info <bucketName> <key>");
        return;
      }
      await getFileInfo(bucket, infoKey);
      break;

    case 'rename':
      const oldKey = args[1];
      const newKey = args[2];
      if (!oldKey || !newKey) {
        console.log("用法: <command> rename <bucketName> <oldKey> <newKey>");
        return;
      }
      await renameFile(bucket, oldKey, newKey);
      break;

    case 'delete':
      const deleteKey = args[1];
      if (!deleteKey) {
        console.log("用法: <command> delete <bucketName> <key>");
        return;
      }
      await deleteFile(bucket, deleteKey);
      break;

    default:
      console.log("可用命令:");
      console.log("  upload    <bucketName> <filePath> <key>          - 上传文件到 R2");
      console.log("  download  <bucketName> <key> <downloadPath>      - 从 R2 下载文件");
      console.log("  list      <bucketName>                           - 显示存储桶中的文件列表");
      console.log("  info      <bucketName> <key>                     - 显示文件的信息");
      console.log("  rename    <bucketName> <oldKey> <newKey>         - 修改文件的目录或文件名");
      console.log("  delete    <bucketName> <key>                     - 删除文件");
      console.log("  buckets                                          - 列出所有存储桶");
      break;
  }
}

// 重命名或移动文件
async function renameFile(bucket: string, oldKey: string, newKey: string): Promise<void> {
  const copyParams = {
    Bucket: bucket,
    CopySource: `${bucket}/${oldKey}`,  // 源文件路径
    Key: newKey                          // 新文件路径
  };
  const deleteParams = {
    Bucket: bucket,
    Key: oldKey
  };

  try {
    await s3Client.send(new CopyObjectCommand(copyParams));
    console.log(`文件 ${oldKey} 成功复制到新位置 ${newKey}`);
    
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log(`旧文件 ${oldKey} 已删除`);
  } catch (err) {
    console.error("重命名或移动文件失败:", err);
  }
}

// 删除文件
async function deleteFile(bucket: string, key: string): Promise<void> {
  const deleteParams = {
    Bucket: bucket,
    Key: key
  };

  try {
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log(`文件 ${key} 已成功删除`);
  } catch (err) {
    console.error("删除文件失败:", err);
  }
}

main().catch(err => console.error("程序运行失败:", err));
