import Header from '../components/layout/Header';
import DashboardOverview from '../components/layout/DashboardOverview';

const OverviewPage = ({ avatarLabel, userEmail, onCreateTicket, onLogout, tickets, loading }) => (
  <>
    <Header
      avatarLabel={avatarLabel}
      userEmail={userEmail}
      onCreateTicket={onCreateTicket}
      onLogout={onLogout}
      showCreateButton={false}
    />
    <DashboardOverview tickets={tickets} loading={loading} />
  </>
);

export default OverviewPage;
