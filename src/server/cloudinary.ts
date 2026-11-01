import { v2 as cloudinary } from 'cloudinary';
import { ServiceReport, ServiceReportPhoto } from '../types/index.ts';

interface UploadedPhoto {
  photo: ServiceReportPhoto;
  publicId: string;
}

export interface UploadedReports {
  reports: ServiceReport[];
  publicIds: string[];
}

const configureCloudinary = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
};

const uploadPhoto = async (photo: ServiceReportPhoto): Promise<UploadedPhoto> => {
  if (!photo.url.startsWith('data:image/')) {
    return { photo, publicId: '' };
  }

  configureCloudinary();
  const separator = photo.url.indexOf(',');
  if (separator < 0) {
    throw new Error('Invalid image data URL.');
  }

  const header = photo.url.slice(0, separator);
  const mimeType = /^data:(image\/[^;]+)/.exec(header)?.[1];
  if (!mimeType) {
    throw new Error('Unsupported image data URL.');
  }

  const payload = photo.url.slice(separator + 1);
  const bytes = header.includes(';base64')
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload.replace(/%(?![0-9a-f]{2})/gi, '%25')), 'utf8');
  if (bytes.length === 0) {
    throw new Error('Cannot upload an empty image.');
  }

  const result = await cloudinary.uploader.upload(
    `data:${mimeType};base64,${bytes.toString('base64')}`,
    { folder: 'internal-technician-service-app/reports', resource_type: 'image' }
  );

  return {
    photo: { ...photo, url: result.secure_url, publicId: result.public_id },
    publicId: result.public_id,
  };
};

export const uploadReportPhotos = async (reports: ServiceReport[]): Promise<UploadedReports> => {
  const publicIds: string[] = [];
  try {
    const uploadedReports: ServiceReport[] = [];
    for (const report of reports) {
      const photos: UploadedPhoto[] = [];
      for (const photo of report.photos || []) {
        const uploaded = await uploadPhoto(photo);
        photos.push(uploaded);
        if (uploaded.publicId) publicIds.push(uploaded.publicId);
      }
      uploadedReports.push({ ...report, photos: photos.map(({ photo }) => photo) });
    }
    return { reports: uploadedReports, publicIds };
  } catch (error) {
    try {
      await deleteCloudinaryImages(publicIds);
    } catch (cleanupError) {
      console.error('Failed to clean up partially uploaded Cloudinary images:', cleanupError);
    }
    throw error;
  }
};

export const deleteCloudinaryImages = async (publicIds: string[]): Promise<void> => {
  if (publicIds.length === 0) return;
  configureCloudinary();
  const results = await Promise.all(
    publicIds.map((publicId) => cloudinary.uploader.destroy(publicId, { resource_type: 'image' }))
  );
  const failed = results.filter((result) => result.result !== 'ok' && result.result !== 'not found');
  if (failed.length > 0) {
    throw new Error(`Failed to clean up ${failed.length} Cloudinary image(s).`);
  }
};
