export interface Statement {
  bind(...values: (string | number | null)[]): Statement;
  run(): Promise<unknown>;
  all<T>(): Promise<{ results: T[] }>;
  first<T>(): Promise<T | null>;
}
export interface Database {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<unknown>;
}
export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB?: Database;
  EXPERIMENT_SIGNING_KEY?: string;
  EXPERIMENT_ADMIN_EMAIL?: string;
}
