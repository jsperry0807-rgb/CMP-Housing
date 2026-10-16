import { useEffect, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Runs an async loader whenever `deps` changes, ignoring results from a
 * request that was superseded (e.g. the user changed a filter mid-flight).
 */
export function useAsyncData<T>(
  load: () => Promise<T>,
  deps: unknown[],
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    setState({ data: null, error: null, loading: true });

    load()
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          data: null,
          error:
            error instanceof Error ? error.message : "Something went wrong",
          loading: false,
        });
      });

    return () => {
      active = false;
    };
  }, deps);

  return state;
}
