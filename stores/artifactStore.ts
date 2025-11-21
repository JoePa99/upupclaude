import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Artifact } from '@/types';

interface ArtifactStore {
  artifacts: Artifact[];
  isPanelOpen: boolean;
  activeArtifactId: string | null;
  addArtifact: (input: { content: string; title?: string; sourceMessageId?: string }) => Artifact;
  updateArtifact: (id: string, changes: Partial<Pick<Artifact, 'title' | 'content'>>) => void;
  removeArtifact: (id: string) => void;
  openPanel: () => void;
  closePanel: () => void;
  setActiveArtifact: (id: string | null) => void;
}

const createArtifact = ({ content, title, sourceMessageId }: { content: string; title?: string; sourceMessageId?: string }): Artifact => {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title: title?.trim() || 'New Artifact',
    content,
    sourceMessageId,
    createdAt: now,
    updatedAt: now,
  };
};

export const useArtifactStore = create<ArtifactStore>()(
  persist(
    (set, _get) => ({
      artifacts: [],
      isPanelOpen: false,
      activeArtifactId: null,

      addArtifact: (input) => {
        const artifact = createArtifact(input);

        set((state) => ({
          artifacts: [artifact, ...state.artifacts],
          isPanelOpen: true,
          activeArtifactId: artifact.id,
        }));

        return artifact;
      },

      updateArtifact: (id, changes) => {
        set((state) => ({
          artifacts: state.artifacts.map((artifact) =>
            artifact.id === id
              ? {
                  ...artifact,
                  ...changes,
                  updatedAt: new Date().toISOString(),
                }
              : artifact
          ),
        }));
      },

      removeArtifact: (id) => {
        set((state) => ({
          artifacts: state.artifacts.filter((artifact) => artifact.id !== id),
          activeArtifactId: state.activeArtifactId === id ? null : state.activeArtifactId,
        }));
      },

      openPanel: () => set({ isPanelOpen: true }),
      closePanel: () => set({ isPanelOpen: false }),
      setActiveArtifact: (id) => set({ activeArtifactId: id }),
    }),
    { name: 'artifact-store' }
  )
);
