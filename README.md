<div align="center">
  <h1>BB.S3</h1>
  <p><strong>A browser‑based S3 and MinIO file manager</strong></p>
  <p>
    <a href="https://github.com/promto-c/bb.s3/blob/main/LICENSE">
      <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg">
    </a>
    <a href="https://github.com/promto-c/bb.s3">
      <img alt="GitHub Stars" src="https://img.shields.io/github/stars/promto-c/bb.s3">
    </a>
  </p>
</div>

## 🚀 Demo

Experience `BB.S3` live: **[Live Demo](https://promto-c.github.io/bb.s3)** (GitHub Pages)

> [!TIP]
> For quick testing, you may use the official public MinIO sandbox:
> - **Endpoint:** `https://play.min.io`
> - **Access Key:** `minioadmin`
> - **Secret Key:** `minioadmin`

> [!WARNING]
> - `https://play.min.io` is a **shared, public service**; avoid uploading private or sensitive data.
> - Data may be **deleted at any time**.
> - Performance and availability are **not guaranteed**.
> - It exists for **testing/experimentation only** and is not suitable for production.

For any real work, point the app at your own MinIO server or AWS S3 account.

## ✨ Features

- 📁 **Browse Buckets** — Navigate your AWS S3 or MinIO buckets with an intuitive interface
- 🔍 **File Management** — Upload, download, and delete files with drag-and-drop support
- 📋 **Breadcrumb Navigation** — Easy navigation through nested folders
- 🔐 **Custom endpoints** — Connect to any HTTPS‑enabled S3 or MinIO URL by providing credentials
- 🛡️ **Local credential handling** — All access keys and secrets stay in the browser; nothing is sent to or stored on any server

## 📋 Prerequisites

- **Node.js** 16.0 or higher
- **npm** or **yarn** package manager
- **AWS Account** (for AWS S3) or **MinIO Server** (for self-hosted object storage)

> The deployed site itself is a static Single‑Page App and does **not** require Node.js.
## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/promto-c/bb.s3.git
cd bb.s3
```

### 2. Install dependencies

```bash
npm install
```

## 🏃 Quick Start

### Development Mode

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📖 Usage

1. **Connect to S3/MinIO**
   - Launch the app
   - Enter your endpoint URL and credentials (they are used only in the browser and never persisted)
   - Click "Connect"

2. **Browse Buckets**
   - Select a bucket from the sidebar
   - Navigate through folders using the breadcrumb navigation
   - View file details by clicking on files

3. **Manage Files**
   - Drag and drop files to upload
   - Create new folders
   - Download or delete files from the detail panel

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://react.dev)
- Powered by [Vite](https://vitejs.dev)
- Icons from [Lucide React](https://lucide.dev)
- AWS SDK from [@aws-sdk/client-s3](https://github.com/aws/aws-sdk-js-v3)
- Compatible with [MinIO](https://min.io) — High-performance, S3-compatible object storage
