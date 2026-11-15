import { Icon, type IconName, Spinner } from '@blueprintjs/core';
import './common.scss';

interface Props {
  icon?: IconName;
  loading?: boolean;
  title: string;
  description?: string;
}

/** Loading, empty and error states, sized for reading across a room. */
export const PanelMessage = ({ icon, loading, title, description }: Props) => (
  <div className="panel-message" role="status">
    {loading ? <Spinner size={48} /> : icon && <Icon icon={icon} className="panel-message__icon" />}
    <p className="panel-message__title">{title}</p>
    {description && <p className="panel-message__description">{description}</p>}
  </div>
);
