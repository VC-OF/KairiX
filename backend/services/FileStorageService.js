const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Use local storage if S3 credentials are not provided (for development)
const isS3Enabled = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const uploadToS3 = async (file, projectId) => {
  const filename = `${Date.now()}_${file.originalname}`;
  
  if (isS3Enabled) {
    const fileKey = `${projectId}/${filename}`;
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };
    const result = await s3.upload(params).promise();
    return { key: result.Key, url: result.Location };
  } else {
    // Fallback to local storage for dev if no S3
    const uploadDir = path.join(__dirname, '../uploads', projectId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const localPath = path.join(uploadDir, filename);
    fs.writeFileSync(localPath, file.buffer);
    
    // Return the correct static URL for the uploaded file
    // Note: In development, we use relative paths for the static server
    return { key: localPath, url: `/uploads/${projectId}/${filename}` };
  }
};

const deleteFromS3 = async (key) => {
  if (isS3Enabled) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    };
    await s3.deleteObject(params).promise();
  } else {
    if (fs.existsSync(key)) {
      fs.unlinkSync(key);
    }
  }
};

module.exports = { upload, uploadToS3, deleteFromS3 };
