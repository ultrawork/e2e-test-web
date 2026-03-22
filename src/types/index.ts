export interface Note {
  id: string;
  title: string;
  content: string;
  isFavorited: boolean;
  categories: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
}
