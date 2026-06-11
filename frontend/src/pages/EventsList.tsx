import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { eventService, Event } from '../api/eventService';
import { useAuthStore } from '../store/authStore';
import Header from '../components/Header';
import EventModal from '../components/EventModal';
import '../styles/EventsList.css';

const EventsList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', currentWorkspace?.id],
    queryFn: eventService.getEvents,
    enabled: !!currentWorkspace,
  });

  const deleteMutation = useMutation({
    mutationFn: eventService.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

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

  if (!currentWorkspace) {
    return (
      <div>
        <Header />
        <div className="events-list-container">
          <div className="no-workspace">
            <h2>No Workspace Selected</h2>
            <p>Please select a workspace to view events.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="events-list-container">
        <div className="events-list-header">
          <div>
            <h1>Events</h1>
            <p className="workspace-name">Workspace: {currentWorkspace.name}</p>
          </div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + New Event
          </button>
        </div>

        {isLoading ? (
          <div className="loading">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <h3>No events yet</h3>
            <p>Create your first event to start budgeting</p>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              Create Event
            </button>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event: Event) => (
              <div key={event.id} className="event-card" onClick={() => navigate(`/events/${event.id}`)}>
                <div className="event-card-header">
                  <h3>{event.title}</h3>
                  <span className="currency-badge">{event.currency}</span>
                </div>
                <p className="event-date">{formatDate(event.date)}</p>
                <div className="event-budget">
                  <span className="budget-label">Total Budget:</span>
                  <span className="budget-amount">
                    {formatCurrency(event.totalBudget || 0, event.currency)}
                  </span>
                </div>
                <div className="event-card-actions">
                  <button
                    className="btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/events/${event.id}`);
                    }}
                  >
                    View Details
                  </button>
                  <button
                    className="btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(event.id, event.title);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isModalOpen && (
          <EventModal onClose={() => setIsModalOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default EventsList;
