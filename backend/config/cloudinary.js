const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createStorage = (folder) => new CloudinaryStorage({
  cloudinary,
  params: {
    folder: `healthmandala/${folder}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
    resource_type: 'auto',
  },
});

const uploadProfile = multer({ storage: createStorage('profiles') });
const uploadLogo = multer({ storage: createStorage('logos') });
const uploadDocument = multer({ storage: createStorage('documents') });
const uploadNID = multer({ storage: createStorage('nid') });
const uploadPartner = multer({ storage: createStorage('partners') });
const uploadOther = multer({ storage: createStorage('others') });

module.exports = {
  cloudinary,
  uploadProfile,
  uploadLogo,
  uploadDocument,
  uploadNID,
  uploadPartner,
  uploadOther,
};
