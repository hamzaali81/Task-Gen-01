import { useQuery } from '@tanstack/react-query';
import { eventService } from '../api/eventService';
import '../styles/BudgetTable.css';

interface BudgetTableProps {
  eventId: string;
  currency: string;
}

const BudgetTable = ({ eventId, currency }: BudgetTableProps) => {
  const { data: budgetItems = [], isLoading } = useQuery({
    queryKey: ['budgetItems', eventId],
    queryFn: () => eventService.getBudgetItems(eventId),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return <div className="loading">Loading budget items...</div>;
  }

  if (budgetItems.length === 0) {
    return (
      <div className="budget-table-container">
        <h2>Budget Items</h2>
        <div className="empty-state">
          <p>No budget items yet</p>
          <p className="empty-hint">Use the AI Assistant to generate budget proposals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-table-container">
      <h2>Budget Items ({budgetItems.length})</h2>
      <div className="table-wrapper">
        <table className="budget-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {budgetItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="category-badge">{item.category}</span>
                </td>
                <td>{item.description}</td>
                <td className="amount-cell">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="total-label">
                <strong>Total</strong>
              </td>
              <td className="total-amount">
                <strong>
                  {formatCurrency(budgetItems.reduce((sum, item) => sum + item.amount, 0))}
                </strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default BudgetTable;
