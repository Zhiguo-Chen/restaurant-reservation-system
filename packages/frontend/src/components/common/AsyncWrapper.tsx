import {
  Component,
  JSX,
  createSignal,
  createEffect,
  Show,
  onCleanup,
} from "solid-js";
import { ErrorMessage } from "./ErrorMessage";
import { LoadingSpinner } from "./LoadingSpinner";
import { clientLogger } from "../../services/clientLogger";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface AsyncWrapperProps<T> {
  asyncFn: () => Promise<T>;
  children: (data: T) => JSX.Element;
  loadingComponent?: JSX.Element;
  errorComponent?: (error: Error, retry: () => void) => JSX.Element;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retryDelay?: number;
  maxRetries?: number;
  timeout?: number;
  dependencies?: any[];
  fallback?: JSX.Element;
  className?: string;
}

export function createAsyncState<T>(
  asyncFn: () => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    retryDelay?: number;
    maxRetries?: number;
    timeout?: number;
  } = {}
) {
  const [state, setState] = createSignal<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const [retryCount, setRetryCount] = createSignal(0);
  let timeoutId: number | undefined;

  const execute = async (isRetry = false) => {
    if (state().loading) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const startTime = Date.now();

    try {
      // Set up timeout if specified
      let timeoutPromise: Promise<never> | undefined;
      if (options.timeout) {
        timeoutPromise = new Promise((_, reject) => {
          timeoutId = window.setTimeout(() => {
            reject(new Error(`Operation timed out after ${options.timeout}ms`));
          }, options.timeout);
        });
      }

      // Execute the async function with optional timeout
      const result = timeoutPromise
        ? await Promise.race([asyncFn(), timeoutPromise])
        : await asyncFn();

      const duration = Date.now() - startTime;

      setState({ data: result, loading: false, error: null });

      if (isRetry) {
        clientLogger.info("Async operation retry succeeded", {
          retryCount: retryCount(),
          duration,
        });
      }

      clientLogger.logPerformance("Async operation", duration);
      options.onSuccess?.(result);

      // Reset retry count on success
      setRetryCount(0);
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      setState((prev) => ({ ...prev, loading: false, error: err }));

      clientLogger.error("Async operation failed", {
        error: err.message,
        stack: err.stack,
        duration,
        retryCount: retryCount(),
        isRetry,
      });

      options.onError?.(err);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  const retry = async () => {
    const maxRetries = options.maxRetries || 3;
    const currentRetryCount = retryCount();

    if (currentRetryCount >= maxRetries) {
      clientLogger.warn("Max retries exceeded", {
        maxRetries,
        currentRetryCount,
      });
      return;
    }

    setRetryCount((prev) => prev + 1);

    const delay =
      options.retryDelay ||
      Math.min(1000 * Math.pow(2, currentRetryCount), 10000);

    clientLogger.info("Retrying async operation", {
      retryCount: currentRetryCount + 1,
      delay,
    });

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    await execute(true);
  };

  const reset = () => {
    setState({ data: null, loading: false, error: null });
    setRetryCount(0);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return {
    state,
    execute,
    retry,
    reset,
    retryCount,
  };
}

export const AsyncWrapper: Component<AsyncWrapperProps<any>> = (props) => {
  const asyncState = createAsyncState(props.asyncFn, {
    onSuccess: props.onSuccess,
    onError: props.onError,
    retryDelay: props.retryDelay,
    maxRetries: props.maxRetries,
    timeout: props.timeout,
  });

  // Execute on mount and when dependencies change
  createEffect(() => {
    // Track dependencies
    if (props.dependencies) {
      props.dependencies.forEach(() => {}); // Access dependencies to track them
    }

    asyncState.execute();
  });

  // Cleanup on unmount
  onCleanup(() => {
    asyncState.reset();
  });

  const DefaultLoadingComponent = () => (
    <div class="flex items-center justify-center p-8">
      <LoadingSpinner size="md" />
    </div>
  );

  const DefaultErrorComponent = (error: Error, retry: () => void) => (
    <ErrorMessage
      error={error}
      title="Failed to load data"
      onRetry={retry}
      retryText={`Retry ${
        asyncState.retryCount() > 0 ? `(${asyncState.retryCount()})` : ""
      }`}
      dismissible={false}
      showDetails={true}
      variant="card"
    />
  );

  return (
    <div class={props.className}>
      <Show
        when={
          !asyncState.state().loading &&
          !asyncState.state().error &&
          asyncState.state().data
        }
        fallback={
          <Show
            when={asyncState.state().loading}
            fallback={
              <Show when={asyncState.state().error} fallback={props.fallback}>
                {(props.errorComponent || DefaultErrorComponent)(
                  asyncState.state().error!,
                  asyncState.retry
                )}
              </Show>
            }
          >
            {props.loadingComponent || <DefaultLoadingComponent />}
          </Show>
        }
      >
        {props.children(asyncState.state().data!)}
      </Show>
    </div>
  );
};
