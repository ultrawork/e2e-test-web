export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
  /** Frontend-only extension, not persisted on backend. */
  isFavorited: boolean;
}

export interface CreateNoteDto {
  title: string;
  content: string;
  categoryIds?: string[];
}
