/** Category entity returned from the API. */
export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

/** Note entity returned from the API. */
export interface Note {
  id: string;
  title: string;
  content: string;
  categories: Category[];
  createdAt: string;
  updatedAt: string;
}

/** DTO for creating a new note. */
export interface CreateNoteDto {
  title: string;
  content: string;
  categoryIds: string[];
}

/** DTO for updating an existing note. */
export interface UpdateNoteDto {
  title?: string;
  content?: string;
  categoryIds?: string[];
}

/** DTO for creating a new category. */
export interface CreateCategoryDto {
  name: string;
  color: string;
}

/** DTO for updating an existing category. */
export interface UpdateCategoryDto {
  name?: string;
  color?: string;
}
