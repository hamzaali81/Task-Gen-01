import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { eventService } from '../api/eventService';
import { useSocket } from '../hooks/useSocket';
import Header from '../components/Header';
import BudgetTable from '../components/BudgetTable';
import AiChatPanel from '../components/AiChatPanel';
import '../styles/EventDetail.css';

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [showChat, setShowChat] = useState(true);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventService.getEvent(eventId!),
    enabled: !!eventId,
  });

  // Listen for real-time budget updates
  useEffect(() => {
    if (!socket || !eventId) return;

    const handleBudgetUpdated = (data: { eventId: string }) => {
      if (data.eventId === eventId) {
        // Refetch event data when budget is updated
        queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      }
    };

    socket.on('budgetUpdated', handleBudgetUpdated);

    return () => {
      socket.off('budgetUpdated', handleBudgetUpdated);
    };
  }, [socket, eventId, queryClient]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div>
        <Header />
        <div className="event-detail-container">
          <div className="loading">Loading event...</div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div>
        <Header />
        <div className="event-detail-container">
          <div className="error">Event not found</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="event-detail-container">
        <div className="event-detail-header">
          <button className="btn-back" onClick={() => navigate('/events')}>
            ← Back to Events
          </button>
          <div className="event-info">
            <h1>{event.title}</h1>
            <div className="event-meta">
              <span>{formatDate(event.date)}</span>
              <span className="currency-badge">{event.currency}</span>
            </div>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => setShowChat(!showChat)}
          >
            {showChat ? 'Hide' : 'Show'} AI Assistant
          </button>
        </div>

        <div className="budget-summary">
          <div className="summary-card">
            <h3>Total Spend</h3>
            <p className="summary-amount">
              {formatCurrency(event.budgetSummary?.totalSpend || 0, event.currency)}
            </p>
          </div>
          {event.budgetSummary?.categoryBreakdown && Object.keys(event.budgetSummary.categoryBreakdown).length > 0 && (
            <div className="summary-card">
              <h3>Category Breakdown</h3>
              <div className="category-list">
                {Object.entries(event.budgetSummary.categoryBreakdown).map(([category, amount]) => (
                  <div key={category} className="category-item">
                    <span className="category-name">{category}</span>
                    <span className="category-amount">
                      {formatCurrency(amount as number, event.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="event-detail-content">
          <div className={showChat ? 'content-with-chat' : 'content-full'}>
            <BudgetTable eventId={eventId!} currency={event.currency} />
          </div>
          {showChat && (
            <div className="chat-panel">
              <AiChatPanel eventId={eventId!} event={event} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
