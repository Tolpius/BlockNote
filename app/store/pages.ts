import { create } from "zustand";

export type Page = {
  id: string;
  title: string;
};

interface PagesStore {
  pages: Page[];
  addPage: (title?: string) => void;
  deletePage: (id: string) => void;
  updatePage: (id: string, title: string) => void;
}

let idCounter = 0;
function generateId(): string {
  return `page_${Date.now()}_${++idCounter}`;
}

const initialPages: Page[] = [
  { id: generateId(), title: "Meeting Notes" },
  { id: generateId(), title: "Ideas" },
  { id: generateId(), title: "Shopping List" },
];

export const usePagesStore = create<PagesStore>((set) => ({
  pages: initialPages,
  addPage: (title = "Untitled") =>
    set((state) => ({
      pages: [...state.pages, { id: generateId(), title }],
    })),
  deletePage: (id) =>
    set((state) => ({
      pages: state.pages.filter((page) => page.id !== id),
    })),
  updatePage: (id, title) =>
    set((state) => ({
      pages: state.pages.map((page) =>
        page.id === id ? { ...page, title } : page,
      ),
    })),
}));
