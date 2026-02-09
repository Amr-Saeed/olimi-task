"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ChevronDown,
  Upload,
  X,
  FileText,
  Phone,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { useReferenceData } from "@/hooks/use-reference-data";
import {
  createAgent,
  updateAgent,
  getUploadUrl,
  uploadFileToSignedUrl,
  registerAttachment,
  initiateTestCall,
  type AgentPayload,
} from "@/lib/api";

// ── Types ───────────────────────────────────────────────────────────────────

type FileUploadStatus = "pending" | "uploading" | "done" | "error";

interface UploadedFile {
  name: string;
  size: number;
  file: File;
  status: FileUploadStatus;
  attachmentId?: string;
  error?: string;
}

interface ValidationErrors {
  agentName?: string;
  callType?: string;
  language?: string;
  voice?: string;
  prompt?: string;
  model?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const ACCEPTED_TYPES = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".csv",
  ".xlsx",
  ".xls",
];

// ── Collapsible Section ─────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  description,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  description: string;
  badge?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription className="mt-1">
                    {description}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {badge !== undefined && badge > 0 && (
                  <Badge variant="destructive">{badge} required</Badge>
                )}
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Separator />
          <CardContent className="pt-6">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ── Select Skeleton ─────────────────────────────────────────────────────────

function SelectSkeleton() {
  return (
    <div className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-1">
      <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  );
}

// ── Skeleton field helpers ──────────────────────────────────────────────────

function SkeletonField() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24 rounded" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

function SkeletonCardCollapsed() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      </CardHeader>
    </Card>
  );
}

// ── Full-page skeleton ──────────────────────────────────────────────────────

function AgentFormSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48 rounded" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Basic Settings — expanded */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 rounded" />
                  <Skeleton className="h-4 w-72 rounded" />
                </div>
                <Skeleton className="h-5 w-5 rounded" />
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
                {/* Sliders */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-5 w-full rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-5 w-full rounded-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collapsed sections */}
          <SkeletonCardCollapsed />
          <SkeletonCardCollapsed />
          <SkeletonCardCollapsed />
          <SkeletonCardCollapsed />
        </div>

        {/* Right Column — Test Call card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
              <Skeleton className="mt-2 h-4 w-full rounded" />
              <Skeleton className="h-4 w-48 rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <SkeletonField />
                  <SkeletonField />
                </div>
                <SkeletonField />
                <SkeletonField />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 -mx-6 -mb-6 border-t bg-background px-6 py-4">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// ── Public Interface ────────────────────────────────────────────────────────

export interface AgentFormInitialData {
  agentName?: string;
  description?: string;
  callType?: string;
  language?: string;
  voice?: string;
  prompt?: string;
  model?: string;
  latency?: number;
  speed?: number;
  callScript?: string;
  serviceDescription?: string;
}

interface AgentFormProps {
  mode: "create" | "edit";
  initialData?: AgentFormInitialData;
}

// ── Main Form (inner, needs ToastProvider above) ────────────────────────────

function AgentFormInner({ mode, initialData }: AgentFormProps) {
  const { toast } = useToast();
  const {
    data: refData,
    isLoading: refLoading,
    error: refError,
  } = useReferenceData();

  // ── Form State ──────────────────────────────────────────────────────────
  const [agentName, setAgentName] = useState(initialData?.agentName ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [callType, setCallType] = useState(initialData?.callType ?? "");
  const [language, setLanguage] = useState(initialData?.language ?? "");
  const [voice, setVoice] = useState(initialData?.voice ?? "");
  const [prompt, setPrompt] = useState(initialData?.prompt ?? "");
  const [model, setModel] = useState(initialData?.model ?? "");
  const [latency, setLatency] = useState([initialData?.latency ?? 0.5]);
  const [speed, setSpeed] = useState([initialData?.speed ?? 110]);
  const [callScript, setCallScript] = useState(initialData?.callScript ?? "");
  const [serviceDescription, setServiceDescription] = useState(
    initialData?.serviceDescription ?? "",
  );

  // Tools
  const [allowHangUp, setAllowHangUp] = useState(false);
  const [allowCallback, setAllowCallback] = useState(false);
  const [liveTransfer, setLiveTransfer] = useState(false);

  // Reference Data (file uploads)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Test Call
  const [testFirstName, setTestFirstName] = useState("");
  const [testLastName, setTestLastName] = useState("");
  const [testGender, setTestGender] = useState("");
  const [testPhone, setTestPhone] = useState("");

  // Agent persistence
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  // ── Track unsaved changes ───────────────────────────────────────────────
  const markDirty = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // File upload handler (hook must be before any early return)
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const startIndex = uploadedFiles.length;
      const newFiles: UploadedFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (ACCEPTED_TYPES.includes(ext)) {
          newFiles.push({
            name: file.name,
            size: file.size,
            file,
            status: "pending",
          });
        }
      }

      if (newFiles.length === 0) return;

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Trigger upload for each new file
      newFiles.forEach((f, i) => {
        uploadFile(f.file, startIndex + i);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uploadedFiles.length],
  );

  // ── Full-page skeleton while loading reference data ─────────────────────
  if (refLoading) {
    return <AgentFormSkeleton />;
  }

  // Badge counts for required fields
  const basicSettingsMissing = [
    agentName,
    callType,
    language,
    voice,
    prompt,
    model,
  ].filter((v) => !v).length;

  // ── Validation ──────────────────────────────────────────────────────────
  function validate(): boolean {
    const errors: ValidationErrors = {};
    if (!agentName.trim()) errors.agentName = "Agent name is required";
    if (!callType) errors.callType = "Call type is required";
    if (!language) errors.language = "Language is required";
    if (!voice) errors.voice = "Voice is required";
    if (!prompt) errors.prompt = "Prompt is required";
    if (!model) errors.model = "Model is required";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Clear specific validation error when field is filled
  function clearError(field: keyof ValidationErrors) {
    setValidationErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  // ── Build payload ───────────────────────────────────────────────────────
  function buildPayload(): AgentPayload {
    return {
      name: agentName.trim(),
      description: description.trim(),
      callType,
      language,
      voice,
      prompt,
      model,
      latency: latency[0],
      speed: speed[0],
      callScript,
      serviceDescription,
      attachments: uploadedFiles
        .filter((f) => f.status === "done" && f.attachmentId)
        .map((f) => f.attachmentId!),
      tools: { allowHangUp, allowCallback, liveTransfer },
    };
  }

  // ── Save Agent (Task 3) ─────────────────────────────────────────────────
  async function handleSave(): Promise<string | null> {
    if (!validate()) {
      toast("Please fill in all required fields.", "error");
      return null;
    }

    setIsSaving(true);
    try {
      const payload = buildPayload();
      const saved = agentId
        ? await updateAgent(agentId, payload)
        : await createAgent(payload);

      setAgentId(saved.id);
      setHasUnsavedChanges(false);
      toast(
        agentId ? "Agent updated successfully." : "Agent created successfully.",
        "success",
      );
      return saved.id;
    } catch (err) {
      toast(
        err instanceof Error
          ? err.message
          : "Failed to save agent. Please try again.",
        "error",
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  // ── File Upload (Task 2) ────────────────────────────────────────────────
  async function uploadFile(file: File, index: number) {
    // Mark uploading
    setUploadedFiles((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, status: "uploading" as const } : f,
      ),
    );

    try {
      // Step 1: Get signed URL
      const { key, signedUrl } = await getUploadUrl();

      // Step 2: Upload to signed URL
      await uploadFileToSignedUrl(signedUrl, file);

      // Step 3: Register attachment
      const attachment = await registerAttachment({
        key,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
      });

      // Mark done
      setUploadedFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, status: "done" as const, attachmentId: attachment.id }
            : f,
        ),
      );
      markDirty();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setUploadedFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "error" as const, error: message } : f,
        ),
      );
      toast(`Failed to upload ${file.name}.`, "error");
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // ── Test Call (Task 4) ──────────────────────────────────────────────────
  async function handleTestCall() {
    if (!testPhone) {
      toast("Phone number is required for a test call.", "error");
      return;
    }

    setIsCalling(true);
    try {
      // Auto-save if needed
      let currentAgentId = agentId;
      if (!currentAgentId || hasUnsavedChanges) {
        currentAgentId = await handleSave();
        if (!currentAgentId) {
          setIsCalling(false);
          return; // Save failed — validation error already shown
        }
      }

      const result = await initiateTestCall(currentAgentId, {
        firstName: testFirstName,
        lastName: testLastName,
        gender: testGender,
        phoneNumber: testPhone,
      });

      if (result.success) {
        toast(
          `Test call initiated (ID: ${result.callId.slice(0, 8)}...).`,
          "success",
        );
      }
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to initiate test call.",
        "error",
      );
    } finally {
      setIsCalling(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const heading = mode === "create" ? "Create Agent" : "Edit Agent";
  const saveLabel = mode === "create" ? "Save Agent" : "Save Changes";

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{heading}</h1>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saveLabel}
        </Button>
      </div>

      {/* Reference data fetch error banner */}
      {refError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {refError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Collapsible Sections */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Section 1: Basic Settings */}
          <CollapsibleSection
            title="Basic Settings"
            description="Add some information about your agent to get started."
            badge={basicSettingsMissing}
            defaultOpen
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Agent Name */}
              <div className="space-y-2">
                <Label htmlFor="agent-name">
                  Agent Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="agent-name"
                  placeholder="e.g. Sales Assistant"
                  value={agentName}
                  onChange={(e) => {
                    setAgentName(e.target.value);
                    markDirty();
                    clearError("agentName");
                  }}
                  aria-invalid={!!validationErrors.agentName}
                />
                {validationErrors.agentName && (
                  <p className="text-xs text-destructive">
                    {validationErrors.agentName}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Describe what this agent does..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    markDirty();
                  }}
                />
              </div>

              {/* Call Type — static options */}
              <div className="space-y-2">
                <Label>
                  Call Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={callType}
                  onValueChange={(v) => {
                    setCallType(v);
                    markDirty();
                    clearError("callType");
                  }}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={!!validationErrors.callType}
                  >
                    <SelectValue placeholder="Select call type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">
                      Inbound (Receive Calls)
                    </SelectItem>
                    <SelectItem value="outbound">
                      Outbound (Make Calls)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.callType && (
                  <p className="text-xs text-destructive">
                    {validationErrors.callType}
                  </p>
                )}
              </div>

              {/* Language — from API (Task 1) */}
              <div className="space-y-2">
                <Label>
                  Language <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={language}
                  onValueChange={(v) => {
                    setLanguage(v);
                    markDirty();
                    clearError("language");
                  }}
                  disabled={!!refError}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={!!validationErrors.language}
                  >
                    <SelectValue placeholder={refError ? "Failed to load" : "Select language"} />
                  </SelectTrigger>
                  <SelectContent>
                    {refData.languages.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">No options available</p>
                    ) : (
                      refData.languages.map((lang) => (
                        <SelectItem key={lang.id} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {validationErrors.language && (
                  <p className="text-xs text-destructive">
                    {validationErrors.language}
                  </p>
                )}
              </div>

              {/* Voice — from API with tag badges (Task 1) */}
              <div className="space-y-2">
                <Label>
                  Voice <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={voice}
                  onValueChange={(v) => {
                    setVoice(v);
                    markDirty();
                    clearError("voice");
                  }}
                  disabled={!!refError}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={!!validationErrors.voice}
                  >
                    <SelectValue placeholder={refError ? "Failed to load" : "Select voice"} />
                  </SelectTrigger>
                  <SelectContent>
                    {refData.voices.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">No options available</p>
                    ) : (
                      refData.voices.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          <span className="flex items-center gap-2">
                            {v.name}
                            <Badge
                              variant={
                                v.tag === "Premium" ? "default" : "secondary"
                              }
                              className="text-[10px] px-1.5 py-0"
                            >
                              {v.tag}
                            </Badge>
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {validationErrors.voice && (
                  <p className="text-xs text-destructive">
                    {validationErrors.voice}
                  </p>
                )}
              </div>

              {/* Prompt — from API (Task 1) */}
              <div className="space-y-2">
                <Label>
                  Prompt <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={prompt}
                  onValueChange={(v) => {
                    setPrompt(v);
                    markDirty();
                    clearError("prompt");
                  }}
                  disabled={!!refError}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={!!validationErrors.prompt}
                  >
                    <SelectValue placeholder={refError ? "Failed to load" : "Select prompt"} />
                  </SelectTrigger>
                  <SelectContent>
                    {refData.prompts.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">No options available</p>
                    ) : (
                      refData.prompts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex flex-col">
                            <span>{p.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {p.description}
                            </span>
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {validationErrors.prompt && (
                  <p className="text-xs text-destructive">
                    {validationErrors.prompt}
                  </p>
                )}
              </div>

              {/* Model — from API (Task 1) */}
              <div className="space-y-2">
                <Label>
                  Model <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={model}
                  onValueChange={(v) => {
                    setModel(v);
                    markDirty();
                    clearError("model");
                  }}
                  disabled={!!refError}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={!!validationErrors.model}
                  >
                    <SelectValue placeholder={refError ? "Failed to load" : "Select model"} />
                  </SelectTrigger>
                  <SelectContent>
                    {refData.models.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">No options available</p>
                    ) : (
                      refData.models.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <span className="flex flex-col">
                            <span>{m.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {m.description}
                            </span>
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {validationErrors.model && (
                  <p className="text-xs text-destructive">
                    {validationErrors.model}
                  </p>
                )}
              </div>

              {/* Latency & Speed Sliders */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latency ({latency[0].toFixed(1)}s)</Label>
                  <Slider
                    value={latency}
                    onValueChange={(v) => {
                      setLatency(v);
                      markDirty();
                    }}
                    min={0.3}
                    max={1}
                    step={0.1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.3s</span>
                    <span>1.0s</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Speed ({speed[0]}%)</Label>
                  <Slider
                    value={speed}
                    onValueChange={(v) => {
                      setSpeed(v);
                      markDirty();
                    }}
                    min={90}
                    max={130}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>90%</span>
                    <span>130%</span>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 2: Call Script */}
          <CollapsibleSection
            title="Call Script"
            description="What would you like the AI agent to say during the call?"
          >
            <div className="space-y-2">
              <Textarea
                placeholder="Write your call script here..."
                value={callScript}
                onChange={(e) => {
                  setCallScript(e.target.value);
                  markDirty();
                }}
                rows={6}
                maxLength={20000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {callScript.length}/20000
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 3: Service/Product Description */}
          <CollapsibleSection
            title="Service/Product Description"
            description="Add a knowledge base about your service or product."
          >
            <div className="space-y-2">
              <Textarea
                placeholder="Describe your service or product..."
                value={serviceDescription}
                onChange={(e) => {
                  setServiceDescription(e.target.value);
                  markDirty();
                }}
                rows={6}
                maxLength={20000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {serviceDescription.length}/20000
              </p>
            </div>
          </CollapsibleSection>

          {/* Section 4: Reference Data (Task 2) */}
          <CollapsibleSection
            title="Reference Data"
            description="Enhance your agent's knowledge base with uploaded files."
          >
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept={ACCEPTED_TYPES.join(",")}
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    // Reset input so same file can be re-selected
                    e.target.value = "";
                  }}
                />
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">
                  Drag & drop files here, or{" "}
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    browse
                  </button>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Accepted: .pdf, .doc, .docx, .txt, .csv, .xlsx, .xls
                </p>
              </div>

              {/* File list */}
              {uploadedFiles.length > 0 ? (
                <div className="space-y-2">
                  {uploadedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate">{f.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatFileSize(f.size)}
                        </span>
                        {/* Upload status indicator */}
                        {f.status === "uploading" && (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                        )}
                        {f.status === "done" && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                        )}
                        {f.status === "error" && (
                          <span className="flex items-center gap-1 shrink-0">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-destructive">
                              Failed
                            </span>
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => removeFile(i)}
                        disabled={f.status === "uploading"}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <FileText className="h-10 w-10 mb-2" />
                  <p className="text-sm">No Files Available</p>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 5: Tools */}
          <CollapsibleSection
            title="Tools"
            description="Tools that allow the AI agent to perform call-handling actions and manage session control."
          >
            <FieldGroup className="w-full">
              <FieldLabel htmlFor="switch-hangup">
                <Field orientation="horizontal" className="items-center">
                  <FieldContent>
                    <FieldTitle>Allow hang up</FieldTitle>
                    <FieldDescription>
                      Select if you would like to allow the agent to hang up the
                      call
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="switch-hangup"
                    checked={allowHangUp}
                    onCheckedChange={(v) => {
                      setAllowHangUp(v);
                      markDirty();
                    }}
                  />
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor="switch-callback">
                <Field orientation="horizontal" className="items-center">
                  <FieldContent>
                    <FieldTitle>Allow callback</FieldTitle>
                    <FieldDescription>
                      Select if you would like to allow the agent to make
                      callbacks
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="switch-callback"
                    checked={allowCallback}
                    onCheckedChange={(v) => {
                      setAllowCallback(v);
                      markDirty();
                    }}
                  />
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor="switch-transfer">
                <Field orientation="horizontal" className="items-center">
                  <FieldContent>
                    <FieldTitle>Live transfer</FieldTitle>
                    <FieldDescription>
                      Select if you want to transfer the call to a human agent
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="switch-transfer"
                    checked={liveTransfer}
                    onCheckedChange={(v) => {
                      setLiveTransfer(v);
                      markDirty();
                    }}
                  />
                </Field>
              </FieldLabel>
            </FieldGroup>
          </CollapsibleSection>
        </div>

        {/* Right Column — Sticky Test Call Card (Task 4) */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Test Call
                </CardTitle>
                <CardDescription>
                  Make a test call to preview your agent. Each test call will
                  deduct credits from your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="test-first-name">First Name</Label>
                      <Input
                        id="test-first-name"
                        placeholder="John"
                        value={testFirstName}
                        onChange={(e) => setTestFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="test-last-name">Last Name</Label>
                      <Input
                        id="test-last-name"
                        placeholder="Doe"
                        value={testLastName}
                        onChange={(e) => setTestLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={testGender} onValueChange={setTestGender}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="test-phone">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <PhoneInput
                      defaultCountry="EG"
                      value={testPhone}
                      onChange={(value) => setTestPhone(value)}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleTestCall}
                    disabled={isCalling || isSaving}
                  >
                    {isCalling ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Phone className="mr-2 h-4 w-4" />
                    )}
                    {isCalling ? "Initiating Call..." : "Start Test Call"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky bottom save bar */}
      <div className="sticky bottom-0 -mx-6 -mb-6 border-t bg-background px-6 py-4">
        <div className="flex items-center justify-end gap-3">
          {hasUnsavedChanges && (
            <span className="text-xs text-muted-foreground">
              Unsaved changes
            </span>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Exported wrapper with ToastProvider ──────────────────────────────────────

export function AgentForm(props: AgentFormProps) {
  return (
    <ToastProvider>
      <AgentFormInner {...props} />
    </ToastProvider>
  );
}
