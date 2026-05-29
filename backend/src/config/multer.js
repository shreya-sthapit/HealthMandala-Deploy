const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createStorage = (folder) => new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: `healthmandala/${folder}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
    resource_type: 'auto',
    public_id: file.fieldname + '-' + Date.now() + '-' + Math.round(Math.random() * 1E9),
  }),
});

const getStorage = (file) => {
  if (file.fieldname.includes('nid')) return createStorage('nid');
  if (file.fieldname.includes('profile')) return createStorage('profiles');
  if (file.fieldname.includes('logo')) return createStorage('logos');
  if (file.fieldname.includes('certificate') || file.fieldname.includes('degree')) return createStorage('documents');
  return createStorage('others');
};

const dynamicStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: `healthmandala/${
      file.fieldname.includes('nid') ? 'nid' :
      file.fieldname.includes('profile') ? 'profiles' :
      file.fieldname.includes('logo') ? 'logos' :
      file.fieldname.includes('certificate') || file.fieldname.includes('degree') ? 'documents' :
      'others'
    }`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
    resource_type: 'auto',
    public_id: file.fieldname + '-' + Date.now() + '-' + Math.round(Math.random() * 1E9),
  }),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype || extname) {
    return cb(null, true);
  }
  cb(new Error('Only image and PDF files are allowed'));
};

const upload = multer({
  storage: dynamicStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

const uploadConfigs = {
  patientUploads: upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'nidFront', maxCount: 1 },
    { name: 'nidBack', maxCount: 1 }
  ]),

  doctorUploads: upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'nidFront', maxCount: 1 },
    { name: 'nidBack', maxCount: 1 },
    { name: 'nmcCertificate', maxCount: 1 },
    { name: 'degreeCertificate', maxCount: 1 }
  ]),

  single: (fieldName) => upload.single(fieldName),
  multiple: (fieldName, maxCount = 5) => upload.array(fieldName, maxCount),
};

module.exports = uploadConfigs;
