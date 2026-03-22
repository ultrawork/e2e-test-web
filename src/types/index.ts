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
  categories: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  categoryIds?: string[];
}

export interface CreateCategoryInput {
  name: string;
  color: string;
}
