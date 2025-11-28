// SOLID Principles: Single Responsibility - Handle encryption/decryption
// Password-based AES encryption without login system

import { EncodedData } from '@/types';

export interface IEncryptionService {
  encrypt(data: EncodedData, password: string): Promise<string>;
  decrypt(encryptedData: string, password: string): Promise<EncodedData>;
  validatePassword(password: string): boolean;
}

export class EncryptionService implements IEncryptionService {
  
  // Generate key from password using PBKDF2
  private async deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt data with password
  async encrypt(data: EncodedData, password: string): Promise<string> {
    if (!this.validatePassword(password)) {
      throw new Error('Password must be at least 8 characters long');
    }

    try {
      const encoder = new TextEncoder();
      const dataString = JSON.stringify(data);
      const dataBuffer = encoder.encode(dataString);
      
      // Generate random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Derive key from password
      const key = await this.deriveKey(password, salt.buffer);
      
      // Encrypt data
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        dataBuffer
      );
      
      // Combine salt + iv + encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);
      
      // Convert to base64
      return btoa(String.fromCharCode(...combined));
      
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Decrypt data with password
  async decrypt(encryptedData: string, password: string): Promise<EncodedData> {
    if (!this.validatePassword(password)) {
      throw new Error('Password must be at least 8 characters long');
    }

    try {
      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract salt, iv, and encrypted data
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const encrypted = combined.slice(28);
      
      // Derive key from password
      const key = await this.deriveKey(password, salt.buffer);
      
      // Decrypt data
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );
      
      // Convert back to string and parse JSON
      const decoder = new TextDecoder();
      const dataString = decoder.decode(decrypted);
      const data = JSON.parse(dataString) as EncodedData;
      
      return data;
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('decrypt')) {
        throw new Error('Incorrect password or corrupted data');
      }
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Validate password strength
  validatePassword(password: string): boolean {
    return password.length >= 4;
  }
}

// Factory function
export const createEncryptionService = (): IEncryptionService => {
  return new EncryptionService();
};