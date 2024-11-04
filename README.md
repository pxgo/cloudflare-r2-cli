# Cloudflare R2 CLI

Cloudflare R2 CLI 是一个简单的命令行工具，旨在帮助用户通过命令行轻松管理 Cloudflare R2 存储。该工具使用 Node.js 和 AWS SDK 构建，为 Cloudflare R2 提供上传、下载、重命名、删除等基本的文件操作功能。

## 特性

- **文件上传**：将本地文件上传到指定的 Cloudflare R2 存储桶
- **文件下载**：从 Cloudflare R2 存储桶下载文件到本地
- **列出文件**：显示存储桶中的所有文件及其详细信息
- **文件信息**：查看指定文件的元数据和访问链接
- **文件重命名/移动**：支持文件重命名或在存储桶内移动文件
- **文件删除**：从存储桶中删除指定文件
- **列出存储桶**：显示账户中所有存储桶列表

## 安装

1. 克隆仓库：

```bash
git clone https://github.com/pxgo/cloudflare-r2-cli.git
cd cloudflare-r2-cli
```

2. 安装依赖项：
``` bash
npm install
```

3. 设置环境变量：
```bash
export R2_ACCOUNT_ID="your_account_id"
export R2_ACCESS_KEY="your_access_key"
export R2_SECRET_KEY="your_secret_key"
```

## 使用说明

可用命令:

- `upload <bucketName> <filePath> <key>` - 上传文件到 R2
- `download <bucketName> <key> <downloadPath>` - 从 R2 下载文件
- `list <bucketName>` - 显示存储桶中的文件列表
- `info <bucketName> <key>` - 显示文件的信息
- `rename <bucketName> <oldKey> <newKey>` - 修改文件的目录或文件名
- `delete <bucketName> <key>` - 删除文件
- `buckets` - 列出所有存储桶
