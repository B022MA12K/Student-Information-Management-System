import { AcademicCapIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const STATUS = {
  Active: { icon: CheckCircleIcon, tone: 'ok' },
  Inactive: { icon: ClockIcon, tone: 'warn' },
  Graduated: { icon: AcademicCapIcon, tone: 'info' },
};

export default function StatusBadge({ status }) {
  const { icon: Icon, tone } = STATUS[status] ?? STATUS.Active;
  return (
    <span className={`badge badge-${tone}`}>
      <Icon className="icon-sm" />
      {status}
    </span>
  );
}
