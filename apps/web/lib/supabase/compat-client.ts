import { createClient } from "@/lib/supabase/server";

export type CompatError = { message: string; code?: string } | null;
export type CompatResult<T = unknown> = { data: T; error: CompatError; count?: number };

export type CompatRow = Record<string, unknown>;
export type CompatRows = CompatRow[];

export interface CompatSelectBuilder extends PromiseLike<CompatResult<CompatRows>> {
  eq(column: string, value: unknown): CompatSelectBuilder;
  neq(column: string, value: unknown): CompatSelectBuilder;
  in(column: string, values: unknown[]): CompatSelectBuilder;
  ilike(column: string, pattern: string): CompatSelectBuilder;
  order(column: string, options?: { ascending?: boolean }): CompatSelectBuilder;
  limit(size: number): CompatSelectBuilder;
  single(): Promise<CompatResult<CompatRow>>;
}

export interface CompatMutationBuilder extends PromiseLike<CompatResult<CompatRow>> {
  eq(column: string, value: unknown): CompatMutationBuilder;
  neq(column: string, value: unknown): CompatMutationBuilder;
  in(column: string, values: unknown[]): CompatMutationBuilder;
  ilike(column: string, pattern: string): CompatMutationBuilder;
  order(column: string, options?: { ascending?: boolean }): CompatMutationBuilder;
  limit(size: number): CompatMutationBuilder;
  single(): Promise<CompatResult<CompatRow>>;
}

export interface CompatTableClient {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): CompatSelectBuilder;
  insert(data: Record<string, unknown>): PromiseLike<CompatResult<CompatRow>>;
  update(data: Record<string, unknown>): CompatMutationBuilder;
  delete(): CompatMutationBuilder;
}

export interface CompatSupabaseClient {
  auth: {
    getUser(): Promise<CompatResult<{ user: { id: string; role?: string } | null }>>;
  };
  from(table: string): CompatTableClient;
  rpc(
    fn: string,
    params?: Record<string, unknown>
  ): Promise<CompatResult<Record<string, unknown> | null>>;
}

export async function createCompatClient(): Promise<CompatSupabaseClient> {
  return (await createClient()) as unknown as CompatSupabaseClient;
}
