export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Note {
  id: number;
  text: string;
  categories: Category[];
}
