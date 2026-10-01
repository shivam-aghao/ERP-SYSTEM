import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export class SupabaseStorageService {
  static async uploadFile(bucket, filePath, fileBuffer, contentType) {
    if (!supabase) {
      logger.warn('Supabase client not initialized for storage');
      return null;
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (error) {
      logger.error('Failed to upload file to Supabase storage:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }
}
