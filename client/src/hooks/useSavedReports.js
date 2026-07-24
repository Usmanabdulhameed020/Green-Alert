import { useCitizen } from '../contexts/CitizenContext';

export function useSavedReports() {
  const { savedReports, toggleSaveReport } = useCitizen();
  return { savedReports, toggleSaveReport };
}
