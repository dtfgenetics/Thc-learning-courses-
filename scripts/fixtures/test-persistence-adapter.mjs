export async function createPersistenceAdapters() {
  return {
    credentialStore: {
      kind: 'test-persistent',
      async ping() { return true; },
      async schemaVersion() { return '1'; },
      async getByVerificationId() { return null; },
      async count() { return 0; }
    },
    credentialWriter: { kind: 'test-writer' }
  };
}
