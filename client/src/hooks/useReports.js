import { useCitizen } from '../contexts/CitizenContext';

export function useReports() {
  const { reports, setReports, reportsLoading, getMyReports, getReportDetails, createReport, deleteReport } = useCitizen();
  return { reports, setReports, reportsLoading, getMyReports, getReportDetails, createReport, deleteReport };
}
