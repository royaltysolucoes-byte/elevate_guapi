import crypto from 'crypto';

// Use a strong secret key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16; // For AES, this is always 16

// Get a 32-byte key from the string
const getKey = (customKey?: string): Buffer => {
  const keyToUse = customKey || ENCRYPTION_KEY;
  
  // Log para debug (apenas em produção para identificar problema)
  if (process.env.NODE_ENV === 'production' && !customKey) {
    console.log('ENCRYPTION_KEY configurada:', ENCRYPTION_KEY ? 'SIM' : 'NÃO');
    console.log('ENCRYPTION_KEY length:', ENCRYPTION_KEY?.length || 0);
    if (ENCRYPTION_KEY) {
      console.log('ENCRYPTION_KEY (primeiros 10 chars):', ENCRYPTION_KEY.substring(0, 10));
    }
  }
  
  if (keyToUse.length === 64) {
    // Already hex encoded 32 bytes
    return Buffer.from(keyToUse, 'hex');
  }
  // Hash the key to get exactly 32 bytes
  return crypto.createHash('sha256').update(keyToUse).digest();
};

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', getKey(), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return iv + encrypted text
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decrypt(text: string, customKey?: string): string {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return '';
  }

  const parts = text.split(':');
  if (parts.length !== 2) {
    // Maybe it's already decrypted or in a different format
    return text; // Return as-is if not in encrypted format
  }
  
  try {
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    if (!encryptedText || encryptedText.length === 0) {
      return '';
    }
    
    // Validate IV length
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
    }
    
    const key = getKey(customKey);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: any) {
    // Se falhar na descriptografia, loga detalhes em produção
    if (process.env.NODE_ENV === 'production') {
      console.error('Decryption error:', error.message);
      console.error('Error code:', error.code);
      console.error('Text (first 50 chars):', text.substring(0, 50));
      console.error('ENCRYPTION_KEY presente:', !!ENCRYPTION_KEY);
      if (ENCRYPTION_KEY) {
        console.error('ENCRYPTION_KEY length:', ENCRYPTION_KEY.length);
      }
    }
    throw error;
  }
}
