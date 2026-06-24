import { ApiLog } from '../types';

type Listener = (logs: ApiLog[]) => void;

class ApiLogger {
  private logs: ApiLog[] = [];
  private listeners: Set<Listener> = new Set();

  log(operation: string, input: any): string {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const logEntry: ApiLog = {
      id,
      timestamp: Date.now(),
      operation,
      input,
    };
    this.logs = [logEntry, ...this.logs];
    this.notify();
    return id;
  }

  update(id: string, output?: any, error?: string) {
    const index = this.logs.findIndex((l) => l.id === id);
    if (index !== -1) {
      const logEntry = this.logs[index];
      this.logs[index] = {
        ...logEntry,
        output,
        error,
        durationMs: Date.now() - logEntry.timestamp,
      };
      // To trigger re-render
      this.logs = [...this.logs];
      this.notify();
    }
  }

  clear() {
    this.logs = [];
    this.notify();
  }

  getLogs() {
    return this.logs;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.logs);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.logs));
  }
}

export const apiLogger = new ApiLogger();
