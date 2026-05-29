import { apiFetch } from './apiFetch';

export type ChatbotCategory = {
  label: string;
  questions: string[];
};

export type UserMessage = {
  id: number;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'answered';
  adminReply: string | null;
  repliedAt: string | null;
  replyReadAt: string | null;
  createdAt: string;
};

export const CONTACT_SUBJECTS = [
  'Problème technique',
  'Question abonnement',
  'Assistance générale',
  'Autre',
] as const;

export type ContactSubject = typeof CONTACT_SUBJECTS[number];

export const contactApi = {
  send: (data: { email: string; subject: string; message: string }) =>
    apiFetch<{ message: string }>('/contact', { method: 'POST', body: data }),

  suggestions: () =>
    apiFetch<ChatbotCategory[]>('/chatbot/suggestions'),

  chat: (data: { sessionId: string; message: string; email?: string }) =>
    apiFetch<{ reply: string; matched: boolean }>('/chatbot/message', {
      method: 'POST',
      body: data,
    }),

  myMessages: () =>
    apiFetch<UserMessage[]>('/my-messages'),

  markRead: () =>
    apiFetch<{ ok: boolean }>('/my-messages/mark-read', { method: 'POST' }),
};
