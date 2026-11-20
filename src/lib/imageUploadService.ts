// ─── Image Upload Service (Local / Data URL Mode) ───────────────────────────

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Rasmni lokal Data URL (base64) ko'rinishida saqlash.
 * Hech qanday tashqi API ga bog'lanmasdan to'liq oflayn ishlaydi.
 */
export async function uploadImageToImgBB(file: File): Promise<ImageUploadResult> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          success: true,
          url: reader.result as string,
        });
      };
      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Rasm o\'qishda xatolik',
        });
      };
      reader.readAsDataURL(file);
    } catch (e) {
      resolve({
        success: false,
        error: e instanceof Error ? e.message : 'Noma\'lum xatolik',
      });
    }
  });
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function resizeImage(file: File, _maxWidth = 800, _maxHeight = 800, _quality = 0.85): Promise<File> {
  // In demo mode, return original or processed file directly
  return file;
}
