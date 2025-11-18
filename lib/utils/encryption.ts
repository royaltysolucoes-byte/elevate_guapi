import crypto from 'crypto';

// Use a strong secret key from environment variables
// NUNCA usar fallback - se não tiver chave, deve falhar
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY não está configurada nas variáveis de ambiente!');
}
const IV_LENGTH = 16; // For AES, this is always 16

// Get a 32-byte key from the string
const getKey = (customKey?: string): Buffer => {
  const keyToUse = customKey || ENCRYPTION_KEY;
  
  // Log removido por segurança - não expor informações sobre a chave
  
  // Sempre trata como hex se tiver 64 caracteres
  if (keyToUse && keyToUse.length === 64) {
    // Already hex encoded 32 bytes
    try {
      return Buffer.from(keyToUse, 'hex');
    } catch (e) {
      // Se falhar, hash a chave
      return crypto.createHash('sha256').update(keyToUse).digest();
    }
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
    
    // Logs removidos por segurança
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    // Configurar para não lançar erro em caso de bad decrypt, mas ainda vamos capturar
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: any) {
    // Log apenas erro genérico por segurança
    console.error('Decryption error:', error.message);
    throw error;
  }
}
