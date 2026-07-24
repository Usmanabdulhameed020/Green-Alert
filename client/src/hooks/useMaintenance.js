import { useState, useEffect } from 'react';
import axios from 'axios';

export default function useMaintenance() {
  const [maintenance, setMaintenance] = useState(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const { data } = await axios.get('/api/v1/system/settings');
        if (mounted && data.success && data.data?.maintenanceMode) {
          setMaintenance(data.data);
        } else if (mounted) {
          setMaintenance(null);
        }
      } catch {
        if (mounted) setMaintenance(null);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return maintenance;
}
