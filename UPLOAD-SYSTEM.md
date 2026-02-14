# File Upload System - Chunked Uploads

## 📋 Overview

Sistema completo de chunked uploads para manejar archivos grandes (GB+) con:
- ✅ Chunked upload (5MB chunks por defecto)
- ✅ Progress tracking
- ✅ Resume capability
- ✅ Checksum verification (MD5)
- ✅ Session management
- ✅ Automatic cleanup

## 🗄️ Database Schema

### Upload_Session
Tracks upload sessions with metadata and status.

```sql
CREATE TABLE Upload_Session (
  id INT AUTO_INCREMENT PRIMARY KEY,
  upload_id VARCHAR(255) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  chunk_size INT NOT NULL DEFAULT 5242880,
  total_chunks INT NOT NULL,
  uploaded_chunks INT NOT NULL DEFAULT 0,
  status ENUM('pending', 'uploading', 'completed', 'failed', 'cancelled'),
  temp_path TEXT,
  final_path TEXT,
  metadata TEXT,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME
);
```

### Upload_Chunk
Tracks individual chunks for resume capability.

```sql
CREATE TABLE Upload_Chunk (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  chunk_index INT NOT NULL,
  chunk_size INT NOT NULL,
  checksum VARCHAR(64),
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 📡 API Endpoints

### 1. Initiate Upload
**POST** `/api/upload/initiate`

Starts a new upload session.

**Request:**
```json
{
  "fileName": "large-tileset.zip",
  "fileSize": 5368709120,
  "mimeType": "application/zip",
  "chunkSize": 5242880,
  "metadata": {
    "description": "Orthomosaic tileset",
    "project": "Site A"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadId": "550e8400-e29b-41d4-a716-446655440000",
    "chunkSize": 5242880,
    "totalChunks": 1024,
    "sessionId": 123
  }
}
```

### 2. Upload Chunk
**POST** `/api/upload/chunk`

Uploads a single chunk (FormData).

**Request (FormData):**
- `uploadId`: UUID from initiate
- `chunkIndex`: 0-based index
- `chunk`: File blob
- `checksum`: (optional) MD5 hash

**Response:**
```json
{
  "success": true,
  "data": {
    "chunkIndex": 0,
    "uploadedChunks": 1,
    "totalChunks": 1024,
    "progress": 0.0977
  }
}
```

### 3. Get Upload Status
**GET** `/api/upload/status?uploadId={uuid}`

Get current upload status and missing chunks.

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadId": "550e8400-e29b-41d4-a716-446655440000",
    "fileName": "large-tileset.zip",
    "fileSize": 5368709120,
    "chunkSize": 5242880,
    "totalChunks": 1024,
    "uploadedChunks": 512,
    "status": "uploading",
    "progress": 50.0,
    "missingChunks": [513, 514, 515, ...],
    "createdAt": "2026-02-12T18:00:00Z",
    "completedAt": null
  }
}
```

### 4. Complete Upload
**POST** `/api/upload/complete`

Assembles all chunks into final file.

**Request:**
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadId": "550e8400-e29b-41d4-a716-446655440000",
    "fileName": "large-tileset.zip",
    "finalPath": "./uploads/final/550e8400-e29b-41d4-a716-446655440000_large-tileset.zip",
    "fileSize": 5368709120
  }
}
```

### 5. Cancel Upload
**POST** `/api/upload/cancel`

Cancels upload and cleans up temp files.

**Request:**
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "cancelled"
  }
}
```

## 🔄 Upload Flow

```
1. Client: POST /api/upload/initiate
   ↓
2. Server: Returns uploadId, chunkSize, totalChunks
   ↓
3. Client: Loop through chunks
   ├─ POST /api/upload/chunk (chunk 0)
   ├─ POST /api/upload/chunk (chunk 1)
   ├─ POST /api/upload/chunk (chunk 2)
   └─ ...
   ↓
4. Client: POST /api/upload/complete
   ↓
5. Server: Assembles chunks → final file
```

## 🔁 Resume Flow

```
1. Client: GET /api/upload/status?uploadId={uuid}
   ↓
2. Server: Returns missingChunks: [5, 7, 9, ...]
   ↓
3. Client: Upload only missing chunks
   ├─ POST /api/upload/chunk (chunk 5)
   ├─ POST /api/upload/chunk (chunk 7)
   └─ POST /api/upload/chunk (chunk 9)
   ↓
4. Client: POST /api/upload/complete
```

## 🧪 Testing with JavaScript

```javascript
// 1. Initiate upload
const file = document.getElementById('fileInput').files[0];
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

const initResponse = await fetch('/api/upload/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    chunkSize: CHUNK_SIZE
  })
});

const { uploadId, totalChunks } = (await initResponse.json()).data;

// 2. Upload chunks
for (let i = 0; i < totalChunks; i++) {
  const start = i * CHUNK_SIZE;
  const end = Math.min(start + CHUNK_SIZE, file.size);
  const chunk = file.slice(start, end);

  const formData = new FormData();
  formData.append('uploadId', uploadId);
  formData.append('chunkIndex', i);
  formData.append('chunk', chunk);

  const response = await fetch('/api/upload/chunk', {
    method: 'POST',
    body: formData
  });

  const { progress } = (await response.json()).data;
  console.log(`Progress: ${progress.toFixed(2)}%`);
}

// 3. Complete upload
await fetch('/api/upload/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ uploadId })
});
```

## ⚙️ Configuration

Environment variables (`.env`):

```env
# Upload directories
UPLOAD_TEMP_DIR=./uploads/temp
UPLOAD_FINAL_DIR=./uploads/final
```

## 📁 File Structure

```
uploads/
├── temp/
│   └── {uploadId}/
│       ├── chunk_0
│       ├── chunk_1
│       └── ...
└── final/
    └── {uploadId}_{fileName}
```

## 🔒 Security

- ✅ All endpoints require authentication (`withAuth`)
- ✅ Upload sessions are tied to user ID
- ✅ Checksum verification prevents corruption
- ✅ Temp files are cleaned up after completion/cancellation

## 📊 Performance

- **Chunk Size**: 5MB default (configurable)
- **Concurrent Uploads**: Supported (different uploadIds)
- **Resume**: Automatic via missing chunks detection
- **Storage**: Temp files cleaned automatically

## 🚀 Next Steps

1. Run database migration to create tables
2. Test with small file (< 100MB)
3. Test with large file (> 1GB)
4. Test resume capability (interrupt and resume)
5. Integrate with tileset creation workflow

---

**Status**: ✅ IMPLEMENTED  
**Date**: 2026-02-12  
**TypeScript**: ✅ Compiles without errors
