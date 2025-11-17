import crypto from 'crypto';

// Use a strong secret key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16; // For AES, this is always 16

// Get a 32-byte key from the string
const getKey = (customKey?: string): Buffer => {
  const keyToUse = customKey || ENCRYPTION_KEY;
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
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input: text is empty or not a string');
    }

    const parts = text.split(':');
    if (parts.length !== 2) {
      // Maybe it's already decrypted or in a different format
      console.warn('Senha não está no formato criptografado esperado (iv:encrypted). Tentando retornar como texto simples.');
      return text; // Return as-is if not in encrypted format
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    if (!encryptedText || encryptedText.length === 0) {
      throw new Error('Encrypted text is empty');
    }
    
    // Validate IV length
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
    }
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', getKey(customKey), iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: any) {
    console.error('Decryption error:', error.message);
    console.error('Error type:', error.constructor.name);
    console.error('Input text (first 50 chars):', text?.substring(0, 50));
    console.error('ENCRYPTION_KEY length:', (customKey || ENCRYPTION_KEY)?.length || 0);
    
    // If decryption fails, throw the error so we know something is wrong
    // Don't return the encrypted text - that's not helpful
    throw new Error(`Failed to decrypt: ${error.message}`);
  }
}
