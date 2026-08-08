import EmptyState from '../../components/ui/EmptyState';
import { FiTool } from 'react-icons/fi';

function AdminPlaceholder({ title = 'Coming soon' }) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">{title}</h1>
      <EmptyState
        icon={FiTool}
        title="Module placeholder"
        description="This admin section is reserved for a later phase. The dashboard UI is ready."
        actionLabel="Back to dashboard"
        actionTo="/admin"
      />
    </div>
  );
}

export default AdminPlaceholder;
