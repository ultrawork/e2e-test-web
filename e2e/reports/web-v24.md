# E2E-отчёт: Web Notes v24

## Информация о прогоне

| Параметр | Значение |
|----------|----------|
| **Дата** | 2026-03-28 |
| **Версия** | v24 |
| **Платформа** | Web (Next.js 15 + React 19) |
| **Инструмент** | Playwright 1.52+ |
| **BASE_URL** | from playwright.config.ts |

## Вердикт

**PASS** — 6 из 6 сценариев пройдены.

## Матрица прохождения

| ID | Сценарий | Статус | Время |
|----|----------|--------|-------|
| SC-001 | /notes page renders initial state correctly | PASS | <1s |
| SC-002 | Adding note via Enter key submits form | PASS | <1s |
| SC-003 | Input field clears after adding a note | PASS | <1s |
| SC-004 | Delete specific note preserves other notes | PASS | <1s |
| SC-005 | Search + delete interaction updates counter | PASS | <1s |
| SC-006 | Delete button aria-label verification | PASS | <1s |

## Детали сценариев

### SC-001: /notes page renders initial state correctly
- **Шаги:** Переход на `/notes`
- **Результат:** Heading, input, button, counter, search bar — всё отображается корректно

### SC-002: Adding note via Enter key submits form
- **Шаги:** Ввод текста → нажатие Enter
- **Результат:** Заметка появляется, счётчик = 1

### SC-003: Input field clears after adding a note
- **Шаги:** Ввод текста → клик "Add"
- **Результат:** Заметка в списке, input пуст

### SC-004: Delete specific note preserves other notes
- **Шаги:** Добавление 3 заметок → удаление средней
- **Результат:** Удалённая заметка исчезла, остальные на месте, счётчик = 2

### SC-005: Search + delete interaction updates counter correctly
- **Шаги:** 3 заметки → поиск "Купить" → удаление одной
- **Результат:** Счётчик корректно обновляется при delete в фильтрованном режиме

### SC-006: Delete button aria-label verification
- **Шаги:** 2 заметки → проверка aria-label → удаление первой
- **Результат:** Кнопки имеют корректные aria-label, удаление работает точечно

## Найденные баги

Нет.

## Окружение тестирования

- **OS:** Linux
- **Node.js:** 18+
- **Browser:** Chromium (Playwright default)
