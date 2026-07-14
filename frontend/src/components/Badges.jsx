export function StatusBadge({ status }) {
  const cls = {
    'Open': 'badge-open',
    'In Progress': 'badge-inprogress',
    'Resolved': 'badge-resolved',
  }[status] || 'badge-open'
  return <span className={`badge ${cls}`}>{status}</span>
}

export function PriorityBadge({ priority }) {
  const cls = {
    'High': 'badge-priority-high',
    'Medium': 'badge-priority-medium',
    'Low': 'badge-priority-low',
  }[priority] || 'badge-priority-medium'
  return <span className={`badge ${cls}`}>{priority}</span>
}

export function OverdueBadge() {
  return <span className="badge badge-overdue">⚠ Overdue</span>
}
