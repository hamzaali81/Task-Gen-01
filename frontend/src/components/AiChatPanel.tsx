import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { chatService, ChatResponse } from '../api/chatService';
import { Event } from '../api/eventService';
import '../styles/AiChat.css';

interface AiChatPanelProps {
  eventId: string;
  event: Event;
}

const AiChatPanel = ({ eventId, event }: AiChatPanelProps) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [proposal, setProposal] = useState<ChatResponse | null>(null);

  const chatMutation = useMutation({
    mutationFn: (msg: string) => chatService.sendMessage(eventId, msg),
    onSuccess: (data) => {
      setProposal(data);
      setMessage('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate proposal');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (proposalId: string) => chatService.approveProposal(eventId, proposalId),
    onSuccess: () => {
      toast.success('Proposal approved! Budget items have been added.');
      setProposal(null);
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['budgetItems', eventId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve proposal');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (proposalId: string) => chatService.rejectProposal(eventId, proposalId),
    onSuccess: () => {
      toast.info('Proposal rejected');
      setProposal(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject proposal');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    chatMutation.mutate(message);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  return (
    <div className="ai-chat-container">
      <div className="chat-header">
        <h3>🤖 AI Budget Assistant</h3>
        <p className="chat-subtitle">Powered by Gemini</p>
      </div>

      <div className="event-context">
        <div className="context-item">
          <span className="context-label">Event:</span>
          <span>{event.title}</span>
        </div>
        <div className="context-item">
          <span className="context-label">Date:</span>
          <span>{new Date(event.date).toLocaleDateString()}</span>
        </div>
        <div className="context-item">
          <span className="context-label">Currency:</span>
          <span className="currency-badge">{event.currency}</span>
        </div>
      </div>

      {proposal ? (
        <div className="proposal-card">
          <div className="proposal-header">
            <h4>Budget Proposal</h4>
            <span className="proposal-status pending">Pending Approval</span>
          </div>

          <div className="proposal-items">
            {proposal.items.map((item, index) => (
              <div key={index} className="proposal-item">
                <div className="item-header">
                  <span className="item-category">{item.category}</span>
                  <span className="item-amount">
                    {formatCurrency(item.amount, item.currency)}
                  </span>
                </div>
                <p className="item-description">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="proposal-total">
            <span>Total:</span>
            <span className="total-amount">
              {formatCurrency(proposal.totalAmount, proposal.currency)}
            </span>
          </div>

          <div className="proposal-actions">
            <button
              className="btn-danger"
              onClick={() => rejectMutation.mutate(proposal.proposalId)}
              disabled={rejectMutation.isPending || approveMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
            </button>
            <button
              className="btn-success"
              onClick={() => approveMutation.mutate(proposal.proposalId)}
              disabled={rejectMutation.isPending || approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </button>
          </div>
        </div>
      ) : (
        <div className="chat-form-container">
          <p className="chat-instructions">
            Describe what you need for your event, and I'll generate a detailed budget proposal for your review.
          </p>

          <form onSubmit={handleSubmit} className="chat-form">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Example: Create a budget for a corporate holiday party for 100 people with dinner, entertainment, and decorations"
              rows={4}
              disabled={chatMutation.isPending}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={chatMutation.isPending || !message.trim()}
            >
              {chatMutation.isPending ? 'Generating Proposal...' : 'Generate Proposal'}
            </button>
          </form>

          <div className="chat-examples">
            <p className="examples-title">Example prompts:</p>
            <button
              className="example-btn"
              onClick={() =>
                setMessage('Create a budget for a wedding reception for 150 guests')
              }
            >
              Wedding reception for 150 guests
            </button>
            <button
              className="example-btn"
              onClick={() =>
                setMessage('Budget for a tech conference with 500 attendees for 2 days')
              }
            >
              Tech conference for 500 people
            </button>
            <button
              className="example-btn"
              onClick={() =>
                setMessage('Budget for a charity fundraising gala with auction and dinner')
              }
            >
              Charity fundraising gala
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiChatPanel;
