// aspnet‐identity‐hasher.js
import { randomBytes, pbkdf2Sync } from 'crypto';

const ITERATIONS = 10_000;
const SALT_SIZE = 16;
const SUBKEY_SIZE = 32;

/**
 * Hash a UTF-8 password into the ASP.NET Core Identity v3 format
 * so that PasswordHasher.VerifyHashedPassword will accept it.
 */
export function hashPassword(password) {
  // 1) generate 16-byte salt
  const salt = randomBytes(SALT_SIZE);

  // 2) derive a 32-byte subkey
  const subkey = pbkdf2Sync(
    Buffer.from(password, 'utf8'),
    salt,
    ITERATIONS,
    SUBKEY_SIZE,
    'sha256'
  );

  // 3) build header: [0x01][PRF=1][iter][saltLen]
  const header = Buffer.alloc(1 + 4 + 4 + 4);
  let offset = 0;
  header.writeUInt8(0x01, offset); offset += 1;             // format marker
  header.writeUInt32LE(1, offset);    offset += 4;          // HMACSHA256
  header.writeUInt32LE(ITERATIONS, offset); offset += 4;    // iteration count
  header.writeUInt32LE(SALT_SIZE, offset); offset += 4;     // salt length

  // 4) concat header||salt||subkey and Base64-encode
  return Buffer.concat([header, salt, subkey]).toString('base64');
}

/**
 * Verify a hash (in ASP.NET Core Identity v3 format) against a UTF-8 password.
 */
export function verifyPassword(storedHash, password) {
  try {
    const full = Buffer.from(storedHash, 'base64');
    let offset = 0;

    // parse header
    if (full.readUInt8(offset++) !== 0x01) {
      return { success: false, message: 'Invalid format' };
    }

    // Try Little Endian first (standard for ASP.NET Core)
    let prf = full.readUInt32LE(offset);
    if (prf !== 1) {
      // Try Big Endian as fallback
      prf = full.readUInt32BE(offset);
      if (prf !== 1) {
        return { success: false, message: 'Unknown PRF' };
      }
    }

    offset += 4;
    const iter    = full.readUInt32LE(offset); offset += 4;
    const saltLen = full.readUInt32LE(offset); offset += 4;

    // extract salt + stored subkey
    const salt      = full.slice(offset, offset + saltLen); offset += saltLen;
    const storedSub = full.slice(offset, offset + SUBKEY_SIZE);

    // derive a subkey from the candidate password
    const derivedSub = pbkdf2Sync(
      Buffer.from(password, 'utf8'),
      salt,
      iter,
      storedSub.length,
      'sha256'
    );

    // constant-time compare
    if (derivedSub.length !== storedSub.length) {
      return { success: false, message: 'Length mismatch' };
    }

    let diff = 0;
    for (let i = 0; i < derivedSub.length; i++) {
      diff |= derivedSub[i] ^ storedSub[i];
    }

    const isMatch = diff === 0;
    return { success: isMatch, message: isMatch ? 'Password verified' : 'Password mismatch' };

  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
}

