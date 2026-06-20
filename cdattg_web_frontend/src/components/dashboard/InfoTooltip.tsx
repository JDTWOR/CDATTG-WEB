import { InformationCircleIcon } from '@heroicons/react/24/outline';

type InfoTooltipProps = Readonly<{
  text: string;
  id?: string;
}>;

export function InfoTooltip({ text, id }: InfoTooltipProps) {
  return (
    <span className="inline-flex align-middle ml-1">
      <InformationCircleIcon
        className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help"
        aria-hidden={false}
        aria-label={text}
        title={text}
        {...(id ? { 'aria-describedby': id } : {})}
      />
    </span>
  );
}
