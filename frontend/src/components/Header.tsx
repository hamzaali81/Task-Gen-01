import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { user, currentWorkspace, workspaces, setCurrentWorkspace, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const workspace = workspaces.find((w) => w.id === e.target.value);
    if (workspace) {
      setCurrentWorkspace(workspace);
      navigate('/events');
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="app-title" onClick={() => navigate('/events')}>
            💰 Event Budgeting
          </h1>
          {currentWorkspace && workspaces.length > 1 && (
            <select
              className="workspace-selector"
              value={currentWorkspace.id}
              onChange={handleWorkspaceChange}
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="header-right">
          {user && (
            <>
              <span className="user-name">
                {user.firstName || user.email}
              </span>
              <button className="btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
