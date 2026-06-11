import { BusinessException } from '../../common/exceptions/business.exception';
import { ERROR_MESSAGES } from '../../common/constants';

interface ProposalItem {
  category: string;
  description: string;
  amount: number;
  currency: string;
}

/**
 * Validator for AI-generated budget proposals
 * Ensures data integrity and business rule compliance
 */
export class ProposalValidator {
  /**
   * Validate that all items use the correct currency
   * 
   * @param items - Proposal items to validate
   * @param expectedCurrency - Event's currency
   * @throws BusinessException if currency mismatch found
   */
  static validateCurrency(items: ProposalItem[], expectedCurrency: string): void {
    const invalidItem = items.find(
      (item) => item.currency !== expectedCurrency,
    );

    if (invalidItem) {
      throw new BusinessException(
        `${ERROR_MESSAGES.INVALID_CURRENCY}. Expected ${expectedCurrency}, got ${invalidItem.currency} for ${invalidItem.category}`,
      );
    }
  }

  /**
   * Validate proposal item structure
   * 
   * @param items - Proposal items to validate
   * @throws BusinessException if structure is invalid
   */
  static validateStructure(items: ProposalItem[]): void {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BusinessException('Proposal must contain at least one item');
    }

    if (items.length > 50) {
      throw new BusinessException('Proposal cannot exceed 50 items');
    }

    for (const [index, item] of items.entries()) {
      // Required fields
      if (!item.category || typeof item.category !== 'string') {
        throw new BusinessException(`Item ${index + 1}: category is required`);
      }

      if (!item.description || typeof item.description !== 'string') {
        throw new BusinessException(`Item ${index + 1}: description is required`);
      }

      if (typeof item.amount !== 'number' || item.amount <= 0) {
        throw new BusinessException(
          `Item ${index + 1}: amount must be a positive number`,
        );
      }

      if (!item.currency || typeof item.currency !== 'string') {
        throw new BusinessException(`Item ${index + 1}: currency is required`);
      }

      // Reasonable limits
      if (item.category.length > 100) {
        throw new BusinessException(`Item ${index + 1}: category too long`);
      }

      if (item.description.length > 500) {
        throw new BusinessException(`Item ${index + 1}: description too long`);
      }

      if (item.amount > 10_000_000) {
        throw new BusinessException(
          `Item ${index + 1}: amount exceeds maximum (10M)`,
        );
      }
    }
  }

  /**
   * Validate total proposal amount is reasonable
   * 
   * @param items - Proposal items
   * @param maxTotal - Maximum allowed total (default 50M)
   * @throws BusinessException if total exceeds limit
   */
  static validateTotal(items: ProposalItem[], maxTotal = 50_000_000): void {
    const total = items.reduce((sum, item) => sum + item.amount, 0);

    if (total > maxTotal) {
      throw new BusinessException(
        `Total budget (${total}) exceeds maximum allowed (${maxTotal})`,
      );
    }

    if (total === 0) {
      throw new BusinessException('Total budget cannot be zero');
    }
  }

  /**
   * Run all validations on a proposal
   */
  static validateProposal(
    items: ProposalItem[],
    expectedCurrency: string,
  ): void {
    this.validateStructure(items);
    this.validateCurrency(items, expectedCurrency);
    this.validateTotal(items);
  }
}
