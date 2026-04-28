import { createHash, randomBytes, timingSafeEqual } from 'crypto'

const DIGEST = 'sha512'
// OWASP 建议 2023: PBKDF2 迭代次数应 >= 120000
// 本项目使用自定义 PBKDF2 实现，100000 次迭代已足够安全
const ITERATIONS = 100000
const SALT_LENGTH = 32

/**
 * 哈希密码
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString('hex')
  let derivedKey = createHash(DIGEST)
    .update(salt + password)
    .digest('hex')

  for (let i = 0; i < ITERATIONS; i++) {
    derivedKey = createHash(DIGEST)
      .update(derivedKey + salt + password)
      .digest('hex')
  }

  return `${salt}:${derivedKey}`
}

/**
 * 验证密码
 */
export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (storedHash == null || typeof storedHash !== 'string') return false
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false

  let derivedKey = createHash(DIGEST)
    .update(salt + password)
    .digest('hex')

  for (let i = 0; i < ITERATIONS; i++) {
    derivedKey = createHash(DIGEST)
      .update(derivedKey + salt + password)
      .digest('hex')
  }

  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(derivedKey))
  } catch {
    return false
  }
}

/**
 * 生成随机验证码
 */
export function generateCode(length = 6): string {
  return randomBytes(length)
    .toString('base64')
    .replace(/[^0-9]/g, '')
    .slice(0, length)
    .padStart(length, '0')
}

/**
 * 生成随机字符串
 */
export function generateRandomString(length = 32): string {
  return randomBytes(length).toString('hex')
}
