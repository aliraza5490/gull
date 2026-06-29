import { create } from 'zustand';

interface DashboardState {
  selectedWorkspaceId: string;
  showWorkspaceModal: boolean;
  newWorkspaceName: string;

  selectedEndpointId: string;
  showEndpointModal: boolean;
  newEndpointName: string;
  newEndpointSlug: string;
  newEndpointType: 'persistent' | 'temporary';
  newEndpointSecret: string;

  showDestModal: boolean;
  destName: string;
  destUrl: string;
  destMethod: string;
  destAuthType: string;
  destToken: string;
  destUser: string;
  destPass: string;
  destSignatureSecret: string;
  destHeadersInject: string;
  destHeadersStrip: string;
  destTransformTemplate: string;

  selectedPayloadId: string;
  payloadSearch: string;
  payloadMethodFilter: string;
  payloadSuccessFilter: boolean | undefined;

  localPayloads: any[];

  diffSelectMode: boolean;
  diffIds: string[];
  showDiffModal: boolean;

  isEditingReplay: boolean;
  replayCustomBody: string;

  copiedEndpointUrl: boolean;

  // Setters
  setSelectedWorkspaceId: (id: string) => void;
  setShowWorkspaceModal: (show: boolean) => void;
  setNewWorkspaceName: (name: string) => void;

  setSelectedEndpointId: (id: string) => void;
  setShowEndpointModal: (show: boolean) => void;
  setNewEndpointName: (name: string) => void;
  setNewEndpointSlug: (slug: string) => void;
  setNewEndpointType: (type: 'persistent' | 'temporary') => void;
  setNewEndpointSecret: (secret: string) => void;

  setShowDestModal: (show: boolean) => void;
  setDestName: (name: string) => void;
  setDestUrl: (url: string) => void;
  setDestMethod: (method: string) => void;
  setDestAuthType: (authType: string) => void;
  setDestToken: (token: string) => void;
  setDestUser: (user: string) => void;
  setDestPass: (pass: string) => void;
  setDestSignatureSecret: (secret: string) => void;
  setDestHeadersInject: (headers: string) => void;
  setDestHeadersStrip: (headers: string) => void;
  setDestTransformTemplate: (template: string) => void;

  setSelectedPayloadId: (id: string) => void;
  setPayloadSearch: (search: string) => void;
  setPayloadMethodFilter: (filter: string) => void;
  setPayloadSuccessFilter: (filter: boolean | undefined) => void;

  setLocalPayloads: (payloads: any[] | ((prev: any[]) => any[])) => void;
  addLocalPayload: (payload: any) => void;

  setDiffSelectMode: (mode: boolean) => void;
  setDiffIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  toggleDiffSelect: (id: string) => void;
  setShowDiffModal: (show: boolean) => void;

  setIsEditingReplay: (isEditing: boolean) => void;
  setReplayCustomBody: (body: string) => void;

  setCopiedEndpointUrl: (copied: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedWorkspaceId: '',
  showWorkspaceModal: false,
  newWorkspaceName: '',

  selectedEndpointId: '',
  showEndpointModal: false,
  newEndpointName: '',
  newEndpointSlug: '',
  newEndpointType: 'persistent',
  newEndpointSecret: '',

  showDestModal: false,
  destName: '',
  destUrl: '',
  destMethod: 'POST',
  destAuthType: 'None',
  destToken: '',
  destUser: '',
  destPass: '',
  destSignatureSecret: '',
  destHeadersInject: '{}',
  destHeadersStrip: '[]',
  destTransformTemplate: '',

  selectedPayloadId: '',
  payloadSearch: '',
  payloadMethodFilter: '',
  payloadSuccessFilter: undefined,

  localPayloads: [],

  diffSelectMode: false,
  diffIds: [],
  showDiffModal: false,

  isEditingReplay: false,
  replayCustomBody: '',

  copiedEndpointUrl: false,

  // Setters
  setSelectedWorkspaceId: (selectedWorkspaceId) => set({ selectedWorkspaceId }),
  setShowWorkspaceModal: (showWorkspaceModal) => set({ showWorkspaceModal }),
  setNewWorkspaceName: (newWorkspaceName) => set({ newWorkspaceName }),

  setSelectedEndpointId: (selectedEndpointId) => set({ selectedEndpointId }),
  setShowEndpointModal: (showEndpointModal) => set({ showEndpointModal }),
  setNewEndpointName: (newEndpointName) => set({ newEndpointName }),
  setNewEndpointSlug: (newEndpointSlug) => set({ newEndpointSlug }),
  setNewEndpointType: (newEndpointType) => set({ newEndpointType }),
  setNewEndpointSecret: (newEndpointSecret) => set({ newEndpointSecret }),

  setShowDestModal: (showDestModal) => set({ showDestModal }),
  setDestName: (destName) => set({ destName }),
  setDestUrl: (destUrl) => set({ destUrl }),
  setDestMethod: (destMethod) => set({ destMethod }),
  setDestAuthType: (destAuthType) => set({ destAuthType }),
  setDestToken: (destToken) => set({ destToken }),
  setDestUser: (destUser) => set({ destUser }),
  setDestPass: (destPass) => set({ destPass }),
  setDestSignatureSecret: (destSignatureSecret) => set({ destSignatureSecret }),
  setDestHeadersInject: (destHeadersInject) => set({ destHeadersInject }),
  setDestHeadersStrip: (destHeadersStrip) => set({ destHeadersStrip }),
  setDestTransformTemplate: (destTransformTemplate) => set({ destTransformTemplate }),

  setSelectedPayloadId: (selectedPayloadId) => set({ selectedPayloadId }),
  setPayloadSearch: (payloadSearch) => set({ payloadSearch }),
  setPayloadMethodFilter: (payloadMethodFilter) => set({ payloadMethodFilter }),
  setPayloadSuccessFilter: (payloadSuccessFilter) => set({ payloadSuccessFilter }),

  setLocalPayloads: (updater) =>
    set((state) => ({
      localPayloads: typeof updater === 'function' ? updater(state.localPayloads) : updater,
    })),
  addLocalPayload: (payload) =>
    set((state) => ({
      localPayloads: [payload, ...state.localPayloads],
    })),

  setDiffSelectMode: (diffSelectMode) => set({ diffSelectMode }),
  setDiffIds: (updater) =>
    set((state) => ({
      diffIds: typeof updater === 'function' ? updater(state.diffIds) : updater,
    })),
  toggleDiffSelect: (id) =>
    set((state) => {
      const prev = state.diffIds;
      if (prev.includes(id)) {
        return { diffIds: prev.filter((item) => item !== id) };
      }
      if (prev.length >= 2) {
        return { diffIds: [prev[1], id] };
      }
      return { diffIds: [...prev, id] };
    }),
  setShowDiffModal: (showDiffModal) => set({ showDiffModal }),

  setIsEditingReplay: (isEditingReplay) => set({ isEditingReplay }),
  setReplayCustomBody: (replayCustomBody) => set({ replayCustomBody }),

  setCopiedEndpointUrl: (copiedEndpointUrl) => set({ copiedEndpointUrl }),
}));
