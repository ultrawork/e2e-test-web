// TODO: Вынести константы валидации (ограничения по длине name, формат цвета)
// в отдельный модуль (e.g., src/constants/validation.ts) при появлении логики валидации

/** Категория заметки */
export interface Category {
  id: number;
  name: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

// TODO: Рассмотреть расширение полей Note (title и/или content) для редактора и отображения
// TODO: Возможное добавление поля categoryIds: number[] для удобства работы с API (создание/редактирование заметок)

/** Заметка */
export interface Note {
  id: number;
  text: string;
  categories: Category[];
  createdAt?: string;
  updatedAt?: string;
}
