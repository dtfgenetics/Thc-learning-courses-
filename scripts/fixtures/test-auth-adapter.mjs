export async function createRequestAuthorizer() {
  return function authorize(req, requiredScope) {
    const header = req.headers?.authorization ?? '';
    if (header !== 'Bearer external-test-token') return { ok: false, status: 401, error: 'invalid-authentication' };
    const scopes = ['admin:read', 'learner:read', 'learner:write'];
    if (requiredScope && !scopes.includes(requiredScope)) return { ok: false, status: 403, error: 'insufficient-scope' };
    return { ok: true, subject: 'external-user-001', scopes };
  };
}
