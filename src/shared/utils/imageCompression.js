import imageCompression from 'browser-image-compression';

/**
 * Auto-compress gambar dari kamera HP sebelum upload.
 * User tidak perlu tau proses ini — otomatis di belakang layar.
 * 
 * Input:  File dari <input type="file"> atau capture kamera (bisa 5-20MB)
 * Output: File terkompresi (~300KB, max 1280px, format WebP)
 */
export async function compressImage(file, options = {}) {
  const defaultOptions = {
    maxSizeMB: 0.3,           // Max 300KB
    maxWidthOrHeight: 1280,   // Resize max 1280px
    useWebWorker: true,       // Non-blocking
    fileType: 'image/webp',   // Format lebih kecil dari JPEG
    ...options,
  };

  try {
    const compressed = await imageCompression(file, defaultOptions);
    return compressed;
  } catch (error) {
    console.error('Image compression failed, using original:', error);
    return file; // Fallback ke file asli jika gagal compress
  }
}
