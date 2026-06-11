/**
 * Application-wide constants
 * Centralized configuration for magic numbers and strings
 */

export const BCRYPT_SALT_ROUNDS = 10;

export const WORKSPACE_HEADER = 'x-workspace-id';

export const DEFAULT_WORKSPACE_ROLE = 'member';
export const ADMIN_WORKSPACE_ROLE = 'admin';

export const PROPOSAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const GEMINI_MODEL = 'gemini-pro';

export const SOCKET_EVENTS = {
  JOIN_WORKSPACE: 'joinWorkspace',
  LEAVE_WORKSPACE: 'leaveWorkspace',
  BUDGET_UPDATED: 'budgetUpdated',
  WORKSPACE_JOINED: 'workspaceJoined',
  WORKSPACE_LEFT: 'workspaceLeft',
} as const;

export const ERROR_MESSAGES = {
  WORKSPACE_REQUIRED: 'x-workspace-id header is required',
  WORKSPACE_ACCESS_DENIED: 'You do not have access to this workspace',
  PENDING_PROPOSAL_EXISTS: 'There is already a pending proposal for this event. Please approve or reject it first.',
  INVALID_CURRENCY: 'AI proposal contains invalid currency',
  GEMINI_KEY_MISSING: 'GEMINI_API_KEY is not configured',
  INVALID_JSON_RESPONSE: 'AI response was not in the expected format',
} as const;

export type ProposalStatus = typeof PROPOSAL_STATUS[keyof typeof PROPOSAL_STATUS];
export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
