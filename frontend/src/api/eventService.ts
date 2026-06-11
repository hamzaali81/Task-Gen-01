import api from './axios';

export interface Event {
  id: string;
  title: string;
  date: string;
  currency: string;
  totalBudget?: number;
  budgetSummary?: {
    totalSpend: number;
    categoryBreakdown: Record<string, number>;
  };
  budgetItems?: BudgetItem[];
}

export interface BudgetItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface CreateEventDto {
  title: string;
  date: string;
  currency: string;
}

export interface UpdateEventDto {
  title?: string;
  date?: string;
  currency?: string;
}

export const eventService = {
  // Events
  getEvents: async (): Promise<Event[]> => {
    const response = await api.get('/events');
    return response.data;
  },

  getEvent: async (id: string): Promise<Event> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  createEvent: async (data: CreateEventDto): Promise<Event> => {
    const response = await api.post('/events', data);
    return response.data;
  },

  updateEvent: async (id: string, data: UpdateEventDto): Promise<Event> => {
    const response = await api.patch(`/events/${id}`, data);
    return response.data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  // Budget Items
  getBudgetItems: async (eventId: string): Promise<BudgetItem[]> => {
    const response = await api.get(`/events/${eventId}/budget-items`);
    return response.data;
  },

  createBudgetItem: async (eventId: string, data: Omit<BudgetItem, 'id' | 'createdAt'>): Promise<BudgetItem> => {
    const response = await api.post(`/events/${eventId}/budget-items`, data);
    return response.data;
  },

  updateBudgetItem: async (
    eventId: string,
    itemId: string,
    data: Partial<Omit<BudgetItem, 'id' | 'createdAt'>>
  ): Promise<BudgetItem> => {
    const response = await api.patch(`/events/${eventId}/budget-items/${itemId}`, data);
    return response.data;
  },

  deleteBudgetItem: async (eventId: string, itemId: string): Promise<void> => {
    await api.delete(`/events/${eventId}/budget-items/${itemId}`);
  },
};
