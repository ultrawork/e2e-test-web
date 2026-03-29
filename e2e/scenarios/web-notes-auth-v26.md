# E2E Scenarios: Web Notes Auth v26

| ID | Название | Предусловия | Действия | Ожидаемый результат |
|---|---|---|---|---|
| TC-001 | Загрузка /notes без токена | localStorage пуст; API возвращает 401 | Открыть /notes | Отображается сообщение об ошибке «Unauthorized» |
| TC-002 | Загрузка /notes с токеном | `localStorage.setItem('token','test-token-v26')`; API возвращает 200 с заметкой | Открыть /notes | Заголовок «Notes» и текст заметки видны |
| TC-003 | Обработка 401 Unauthorized от API | Токен установлен; API возвращает 401 | Открыть /notes | Отображается `[data-testid="error-message"]` с текстом «Unauthorized» |
| TC-004 | Успешный рендер списка заметок | Токен установлен; API возвращает 200 с двумя заметками | Открыть /notes | «Note Alpha» и «Note Beta» видны на странице |
| TC-005 | Показ ошибок сети | API-запрос прерывается (abort) | Открыть /notes | Отображается `[data-testid="error-message"]` |
| TC-006 | Event-driven 401 через dispatchEvent | Токен установлен; API возвращает 200 с заметкой | Открыть /notes, дождаться рендера, вызвать `window.dispatchEvent(new Event('auth:unauthorized'))` | Появляется сообщение «Unauthorized. Please log in.» |
