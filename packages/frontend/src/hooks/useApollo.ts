import { createSignal, createEffect } from "solid-js";
import { graphqlClient } from "../services/apolloClient";
import { RequestDocument, Variables } from "graphql-request";

// Query Hook
export function useQuery<TData = any, TVariables extends Variables = Variables>(
  query: RequestDocument,
  variables?: TVariables,
  options?: { enabled?: boolean }
) {
  const [data, setData] = createSignal<TData | undefined>();
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<Error | undefined>();

  const executeQuery = async () => {
    try {
      setLoading(true);
      setError(undefined);

      const result = await graphqlClient.request<TData, TVariables>(
        query,
        variables
      );
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    if (options?.enabled !== false) {
      executeQuery();
    }
  });

  const refetch = () => executeQuery();

  return {
    data,
    loading,
    error,
    refetch,
  };
}

// Lazy Query Hook
export function useLazyQuery<
  TData = any,
  TVariables extends Variables = Variables
>(query: RequestDocument) {
  const [data, setData] = createSignal<TData | undefined>();
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<Error | undefined>();

  const execute = async (variables?: TVariables) => {
    try {
      setLoading(true);
      setError(undefined);

      const result = await graphqlClient.request<TData, TVariables>(
        query,
        variables
      );
      setData(result);
      return { data: result };
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    execute,
    data,
    loading,
    error,
  };
}

// Mutation Hook
export function useMutation<
  TData = any,
  TVariables extends Variables = Variables
>(mutation: RequestDocument) {
  const [data, setData] = createSignal<TData | undefined>();
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<Error | undefined>();

  const mutate = async (options?: { variables?: TVariables }) => {
    try {
      setLoading(true);
      setError(undefined);

      const result = await graphqlClient.request<TData, TVariables>(
        mutation,
        options?.variables
      );
      setData(result);
      return { data: result };
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    mutate,
    data,
    loading,
    error,
  };
}
