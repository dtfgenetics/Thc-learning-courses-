export class PersistenceUnavailableError extends Error {
  constructor(message = 'persistence-unavailable', options = {}) {
    super(message, options);
    this.name = 'PersistenceUnavailableError';
    this.code = 'PERSISTENCE_UNAVAILABLE';
  }
}

export function isPersistenceUnavailableError(error) {
  return error instanceof PersistenceUnavailableError || error?.code === 'PERSISTENCE_UNAVAILABLE';
}
