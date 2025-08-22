interface TagProps {
  label: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  size?: 'sm' | 'md' | 'lg';
}

export default function Tag({ label, color = 'blue', size = 'md' }: TagProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${colorClasses[color]} ${sizeClasses[size]}`}
    >
      {label}
    </span>
  );
} 