import api from './axios';
import { BudgetItem } from './eventService';

export interface ChatResponse {
  proposalId: string;
  status: string;
  items: BudgetItem[];
  totalAmount: number;
  currency: string;
  message: string;
}

export const chatService = {
  sendMessage: async (eventId: string, message: string): Promise<ChatResponse> => {
    const response = await api.post(`/events/${eventId}/ai-chat`, { message });
    return response.data;
  },

  approveProposal: async (eventId: string, proposalId: string): Promise<{ message: string; itemsCreated: number }> => {
    const response = await api.patch(`/events/${eventId}/ai-chat/proposals/${proposalId}/approve`);
    return response.data;
  },

  rejectProposal: async (eventId: string, proposalId: string, reason?: string): Promise<{ message: string }> => {
    const response = await api.patch(`/events/${eventId}/ai-chat/proposals/${proposalId}/reject`, { reason });
    return response.data;
  },
};
