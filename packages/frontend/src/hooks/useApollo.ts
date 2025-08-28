import { createSignal } from "solid-js";
import {
  DocumentNode,
  OperationVariables,
  ApolloError,
  FetchResult,
} from "@apollo/client";
import { apolloClient } from "../services/apolloClient";

// 简化的 Query Hook
export function useQuery<TData = any>(
  query: DocumentNode,
  options?: {
    variables?: OperationVariables;
    fetchPolicy?: string;
  }
) {
  const [data, setData] = createSignal<TData | undefined>();
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<ApolloError | undefined>();

  // 立即执行查询
  apolloClient
    .query<TData>({
      query,
      variables: options?.variables,
      fetchPolicy: options?.fetchPolicy as any,
    })
    .then((result) => {
      setData(() => result.data);
      setLoading(false);
      if (result.error) {
        setError(result.error);
      }
    })
    .catch((err) => {
      setError(err);
      setLoading(false);
    });

  const refetch = (variables?: OperationVariables) => {
    setLoading(true);
    return apolloClient
      .query<TData>({
        query,
        variables: variables || options?.variables,
        fetchPolicy: "network-only",
      })
      .then((result) => {
        setData(() => result.data);
        setLoading(false);
        return result;
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
        throw err;
      });
  };

  return {
    data,
    loading,
    error,
    refetch,
  };
}

// 简化的 Mutation Hook
export function useMutation<TData = any>(mutation: DocumentNode) {
  const [data, setData] = createSignal<TData | undefined>();
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<ApolloError | undefined>();

  const mutate = async (mutationOptions?: {
    variables?: OperationVariables;
    refetchQueries?: any[];
  }): Promise<FetchResult<TData>> => {
    setLoading(true);
    setError(undefined);

    try {
      const result = await apolloClient.mutate<TData>({
        mutation,
        variables: mutationOptions?.variables,
        refetchQueries: mutationOptions?.refetchQueries,
      });

      setData(() => result.data);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err as ApolloError);
      setLoading(false);
      throw err;
    }
  };

  return {
    mutate,
    data,
    loading,
    error,
  };
}

// 简化的 Lazy Query Hook
export function useLazyQuery<TData = any>(query: DocumentNode) {
  const [data, setData] = createSignal<TData | undefined>();
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<ApolloError | undefined>();

  const execute = async (executeOptions?: {
    variables?: OperationVariables;
    fetchPolicy?: string;
  }) => {
    setLoading(true);
    setError(undefined);

    try {
      const result = await apolloClient.query<TData>({
        query,
        variables: executeOptions?.variables,
        fetchPolicy: executeOptions?.fetchPolicy as any,
      });

      setData(() => result.data);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err as ApolloError);
      setLoading(false);
      throw err;
    }
  };

  return {
    execute,
    data,
    loading,
    error,
  };
}
