import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

/**
 * Generic data-fetching hook.
 * @param {string} url - API endpoint
 * @param {Object} options - axios config options
 */
const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(url, options);
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch");
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    if (url) fetch();
  }, [fetch, url]);

  return { data, isLoading, error, refetch: fetch };
};

export default useFetch;
