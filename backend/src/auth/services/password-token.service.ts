import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import * as crypto from 'crypto';

@Injectable()
export class PasswordTokenService {
  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
  ) {}

  /**
   * Generate a random token (64 hex characters)
   */
  private generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash token using SHA-256 (deterministic for direct DB lookup)
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create a password reset token for a user
   * Invalidates any previous unused tokens for this email
   * Returns the plain token (to send in email)
   */
  async createResetToken(email: string): Promise<string> {
    // Invalidate previous unused tokens for this email (QueryBuilder for type safety)
    await this.passwordResetTokenRepository
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({ usedAt: new Date() })
      .where('email = :email', { email })
      .andWhere('usedAt IS NULL')
      .execute();

    // Generate plain token
    const plainToken = this.generateRandomToken();

    // Hash it with SHA-256 (deterministic for direct lookup)
    const tokenHash = this.hashToken(plainToken);

    // Calculate expiration (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save to database
    await this.passwordResetTokenRepository.save({
      email,
      tokenHash,
      expiresAt,
    });

    // Return the PLAIN token (to send in email to user)
    return plainToken;
  }

  /**
   * Find and validate a password reset token
   * Checks if token exists, is not expired, and not already used
   * Returns the token record with email
   */
  async findTokenByPlainToken(token: string): Promise<{
    id: string;
    email: string;
  }> {
    // Hash the token for direct lookup
    const tokenHash = this.hashToken(token);

    // Find token directly by hash (no loop needed!)
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { tokenHash },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid reset token');
    }

    // Check if already used
    if (resetToken.usedAt) {
      throw new BadRequestException('This reset token has already been used');
    }

    // Check if expired
    if (new Date() > resetToken.expiresAt) {
      throw new BadRequestException('This reset token has expired');
    }

    // Return token ID and email
    return { id: resetToken.id, email: resetToken.email };
  }

  /**
   * Mark a token as used (one-time use enforcement)
   */
  async markAsUsed(tokenId: string): Promise<void> {
    await this.passwordResetTokenRepository.update(
      { id: tokenId },
      { usedAt: new Date() },
    );
  }
}
