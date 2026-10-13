import { supabase } from './supabase';

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Resizes and optimizes an image file client-side using Canvas.
 * Returns an optimized Data URL (WebP or JPEG).
 */
export async function optimizeImageFile(
  file: File,
  options: ImageUploadOptions = {}
): Promise<string> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem inválido ou corrompido.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first for great compression, fallback to JPEG
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {
          // fallback
        }

        const jpegData = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegData);
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image to Supabase Storage if available,
 * otherwise falls back to returning the optimized Data URL.
 */
export async function uploadBlogImage(
  file: File,
  options: ImageUploadOptions = {}
): Promise<string> {
  // First optimize the image to ensure high performance and low size
  const optimizedDataUrl = await optimizeImageFile(file, options);

  // Attempt Supabase storage upload if configured
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Convert data URL back to Blob for storage upload
    const response = await fetch(optimizedDataUrl);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('blog-images')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: blob.type
      });

    if (!error) {
      const { data: publicUrlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }
  } catch {
    // If Supabase storage bucket doesn't exist or isn't accessible, fallback to optimized data URL
  }

  return optimizedDataUrl;
}

/**
 * Compresses and crops an avatar profile picture to a square image (max 500x500, quality 0.82)
 * for fast loading and low storage footprint, uploading to avatars bucket if possible.
 */
export async function uploadProfileAvatar(
  file: File,
  userId: string
): Promise<string> {
  // Heavy optimization for user profile avatar: max 500x500, quality 0.82
  const optimizedDataUrl = await optimizeImageFile(file, {
    maxWidth: 500,
    maxHeight: 500,
    quality: 0.82
  });

  // Attempt Supabase storage upload if bucket exists
  try {
    const fileExt = 'webp';
    const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
    const filePath = `user-avatars/${fileName}`;

    const response = await fetch(optimizedDataUrl);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: blob.type || 'image/webp'
      });

    if (!error) {
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }
  } catch {
    // Fallback to optimized data URL if bucket is not configured
  }

  return optimizedDataUrl;
}

/**
 * Compresses and prepares a child patient photo (max 800x800, quality 0.85).
 * Attempts to upload to Supabase Storage ('avatars' bucket),
 * falling back safely to the optimized WebP/JPEG data URL if bucket is not configured.
 */
export async function uploadChildPhoto(
  file: File,
  childId?: string
): Promise<string> {
  const optimizedDataUrl = await optimizeImageFile(file, {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.85
  });

  try {
    const fileExt = 'webp';
    const fileName = `child-${childId || 'new'}-${Date.now()}.${fileExt}`;
    const filePath = `children/${fileName}`;

    const response = await fetch(optimizedDataUrl);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: blob.type || 'image/webp'
      });

    if (!error) {
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }
  } catch {
    // Graceful fallback to optimized data URL
  }

  return optimizedDataUrl;
}

/**
 * Compresses and uploads a project photo or cover image (max 1600x1200, quality 0.85).
 * Attempts Supabase storage buckets ('projects', 'avatars', 'blog-images'),
 * falling back safely to the client-side optimized WebP/JPEG data URL if buckets are not available.
 */
export async function uploadProjectImage(
  file: File,
  projectId?: string
): Promise<string> {
  const optimizedDataUrl = await optimizeImageFile(file, {
    maxWidth: 1600,
    maxHeight: 1200,
    quality: 0.85
  });

  try {
    const fileExt = 'webp';
    const fileName = `proj-${projectId || 'new'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `projects/${fileName}`;

    const response = await fetch(optimizedDataUrl);
    const blob = await response.blob();

    // 1. Try 'projects' bucket
    const { error: projErr } = await supabase.storage
      .from('projects')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: blob.type || 'image/webp'
      });

    if (!projErr) {
      const { data: publicUrlData } = supabase.storage
        .from('projects')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }

    // 2. Fallback to 'avatars'
    const { error: avatarErr } = await supabase.storage
      .from('avatars')
      .upload(`projects/${fileName}`, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: blob.type || 'image/webp'
      });

    if (!avatarErr) {
      const { data: avatarUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`projects/${fileName}`);

      if (avatarUrlData?.publicUrl) {
        return avatarUrlData.publicUrl;
      }
    }
  } catch {
    // Graceful fallback to optimized data URL
  }

  return optimizedDataUrl;
}

