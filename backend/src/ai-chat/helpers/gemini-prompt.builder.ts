/**
 * Gemini prompt builder for budget proposals
 * Encapsulates prompt engineering logic
 */
export class GeminiPromptBuilder {
  /**
   * Build a structured prompt for budget proposal generation
   * 
   * @param eventTitle - Event name for context
   * @param eventDate - Event date for seasonal/timing context
   * @param currency - Required currency for all items
   * @param userMessage - User's natural language request
   * @returns Structured prompt string
   */
  static buildBudgetProposalPrompt(
    eventTitle: string,
    eventDate: Date | string,
    currency: string,
    userMessage: string,
  ): string {
    return `You are a professional event budget assistant with expertise in cost estimation and event planning.

EVENT CONTEXT:
- Title: ${eventTitle}
- Date: ${eventDate}
- Currency: ${currency}

USER REQUEST: ${userMessage}

TASK:
Generate a comprehensive budget proposal for this event. Return ONLY a valid JSON array with NO additional text, markdown, or formatting.

REQUIRED JSON FORMAT:
[
  {
    "category": "string",
    "description": "string (detailed explanation)",
    "amount": number (positive, realistic),
    "currency": "${currency}"
  }
]

MANDATORY RULES:
1. ALL items MUST use currency: "${currency}" (NO exceptions)
2. Return ONLY the JSON array (no markdown, no code blocks, no explanations)
3. Include 5-12 realistic budget items
4. Categories should include: Venue, Catering, Entertainment, Decorations, Staff, Marketing, Equipment, Permits, Contingency
5. Descriptions must be detailed and specific to the event
6. Amounts must be realistic for the event type and scale
7. Consider the event date for seasonal pricing
8. Include a 10-15% contingency line item

OUTPUT EXAMPLE:
[{"category":"Venue","description":"Grand ballroom rental for 200 guests","amount":5000.00,"currency":"${currency}"}]`;
  }

  /**
   * Validate that prompt inputs are safe and valid
   */
  static validateInputs(
    eventTitle: string,
    currency: string,
    userMessage: string,
  ): void {
    if (!eventTitle || eventTitle.trim().length === 0) {
      throw new Error('Event title is required');
    }
    if (!currency || currency.trim().length !== 3) {
      throw new Error('Invalid currency code');
    }
    if (!userMessage || userMessage.trim().length === 0) {
      throw new Error('User message is required');
    }
    if (userMessage.length > 1000) {
      throw new Error('User message too long (max 1000 characters)');
    }
  }
}
