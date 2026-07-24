import { useCitizen } from '../contexts/CitizenContext';

export function useNotifications() {
  const { notifications, addNotificationFromSocket } = useCitizen();
  return { notifications, addNotificationFromSocket };
}
