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
  
  // Log para debug (apenas em produção para identificar problema)
  if (process.env.NODE_ENV === 'production' && !customKey) {
    console.log('[PROD] ENCRYPTION_KEY configurada:', ENCRYPTION_KEY ? 'SIM' : 'NÃO');
    console.log('[PROD] ENCRYPTION_KEY length:', ENCRYPTION_KEY?.length || 0);
    if (ENCRYPTION_KEY) {
      console.log('[PROD] ENCRYPTION_KEY (primeiros 10 chars):', ENCRYPTION_KEY.substring(0, 10));
      console.log('[PROD] ENCRYPTION_KEY (últimos 10 chars):', ENCRYPTION_KEY.substring(ENCRYPTION_KEY.length - 10));
      // Verifica se começa com o valor esperado
      const expectedStart = '4595b50d7e';
      if (ENCRYPTION_KEY.substring(0, 10) === expectedStart) {
        console.log('[PROD] ✅ ENCRYPTION_KEY parece estar correta (começa com valor esperado)');
      } else {
        console.log('[PROD] ⚠️ ENCRYPTION_KEY pode estar incorreta (não começa com valor esperado)');
      }
    }
  }
  
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
    
    // Log em produção para debug
    if (process.env.NODE_ENV === 'production' && !customKey) {
      console.log('[PROD] Tentando descriptografar com chave:', ENCRYPTION_KEY.substring(0, 10) + '...');
      console.log('[PROD] Key buffer length:', key.length);
      console.log('[PROD] IV length:', iv.length);
      console.log('[PROD] Encrypted text length:', encryptedText.length);
    }
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    // Configurar para não lançar erro em caso de bad decrypt, mas ainda vamos capturar
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: any) {
    // Se falhar na descriptografia, loga detalhes em produção
    if (process.env.NODE_ENV === 'production') {
      console.error('[PROD] Decryption error:', error.message);
      console.error('[PROD] Error code:', error.code);
      console.error('[PROD] Error name:', error.name);
      console.error('[PROD] Text (first 50 chars):', text.substring(0, 50));
      console.error('[PROD] ENCRYPTION_KEY presente:', !!ENCRYPTION_KEY);
      if (ENCRYPTION_KEY) {
        console.error('[PROD] ENCRYPTION_KEY length:', ENCRYPTION_KEY.length);
        console.error('[PROD] ENCRYPTION_KEY (primeiros 10):', ENCRYPTION_KEY.substring(0, 10));
      }
    }
    throw error;
  }
}
