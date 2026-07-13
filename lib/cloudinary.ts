import { v2 as cloudinary } from 'cloudinary'

// Configure explicitly to avoid CLOUDINARY_URL conflict
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? 'dvpkzol28',
  api_key: process.env.CLOUDINARY_API_KEY ?? '967595934923233',
  api_secret: process.env.CLOUDINARY_API_SECRET ?? 'ETBF7FhIEtNQNbpmqcklijB3OaY',
  secure: true,
})

export default cloudinary
