const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

// ── Types ───────────────────────────────────────────────────────────────────

export interface Language {
  id: string;
  name: string;
  code: string;
}

export interface Voice {
  id: string;
  name: string;
  tag: string;
  language: string;
}

export interface Prompt {
  id: string;
  name: string;
  description: string;
}

export interface Model {
  id: string;
  name: string;
  description: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  callType: string;
  language: string;
  voice: string;
  prompt: string;
  model: string;
  latency: number;
  speed: number;
  callScript: string;
  serviceDescription: string;
  attachments: string[];
  tools: {
    allowHangUp: boolean;
    allowCallback: boolean;
    liveTransfer: boolean;
  };
}

export interface AgentPayload {
  name: string;
  description: string;
  callType: string;
  language: string;
  voice: string;
  prompt: string;
  model: string;
  latency: number;
  speed: number;
  callScript: string;
  serviceDescription: string;
  attachments: string[];
  tools: {
    allowHangUp: boolean;
    allowCallback: boolean;
    liveTransfer: boolean;
  };
}

export interface Attachment {
  id: string;
  key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface UploadUrlResponse {
  key: string;
  signedUrl: string;
  expiresIn: number;
}

export interface UploadResponse {
  success: boolean;
  key: string;
  message: string;
}

export interface TestCallPayload {
  firstName: string;
  lastName: string;
  gender: string;
  phoneNumber: string;
}

export interface TestCallResponse {
  success: boolean;
  callId: string;
  agentId: string;
  status: string;
}

// ── API Error ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(
      `Request failed: ${response.statusText}`,
      response.status,
    );
  }
  return response.json() as Promise<T>;
}

// ── Reference Data ──────────────────────────────────────────────────────────

export async function fetchLanguages(): Promise<Language[]> {
  const res = await fetch(`${API_BASE_URL}/languages`);
  return handleResponse<Language[]>(res);
}

export async function fetchVoices(): Promise<Voice[]> {
  const res = await fetch(`${API_BASE_URL}/voices`);
  return handleResponse<Voice[]>(res);
}

export async function fetchPrompts(): Promise<Prompt[]> {
  const res = await fetch(`${API_BASE_URL}/prompts`);
  return handleResponse<Prompt[]>(res);
}

export async function fetchModels(): Promise<Model[]> {
  const res = await fetch(`${API_BASE_URL}/models`);
  return handleResponse<Model[]>(res);
}

// ── Agent CRUD ──────────────────────────────────────────────────────────────

export async function createAgent(data: AgentPayload): Promise<Agent> {
  const res = await fetch(`${API_BASE_URL}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Agent>(res);
}

export async function updateAgent(
  id: string,
  data: AgentPayload,
): Promise<Agent> {
  const res = await fetch(`${API_BASE_URL}/agents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Agent>(res);
}

// ── File Upload (3-step) ────────────────────────────────────────────────────

export async function getUploadUrl(): Promise<UploadUrlResponse> {
  const res = await fetch(`${API_BASE_URL}/attachments/upload-url`, {
    method: "POST",
  });
  return handleResponse<UploadUrlResponse>(res);
}

export async function uploadFileToSignedUrl(
  signedUrl: string,
  file: File,
): Promise<UploadResponse> {
  const res = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
  return handleResponse<UploadResponse>(res);
}

export async function registerAttachment(data: {
  key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}): Promise<Attachment> {
  const res = await fetch(`${API_BASE_URL}/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Attachment>(res);
}

// ── Test Call ────────────────────────────────────────────────────────────────

export async function initiateTestCall(
  agentId: string,
  data: TestCallPayload,
): Promise<TestCallResponse> {
  const res = await fetch(`${API_BASE_URL}/agents/${agentId}/test-call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<TestCallResponse>(res);
}
