// Approval checks removed — admin can supervise but does not block access.
// All functions return approved: true so existing call sites continue to work.

export const checkApprovalStatus = async () => ({ approved: true, status: 'approved' });

export const requireApproval = async () => true;

export const withApprovalCheck = (handler) => handler;
