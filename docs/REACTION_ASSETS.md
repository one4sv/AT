# Иллюстрированные реакции

В `src/components/ts/ReactionIcon.tsx` используются PNG-изображения набора **Fluent Emoji 3D** (Microsoft) через CDN из проекта `shuding/fluentui-emoji-unicode`, основанного на `microsoft/fluentui-emoji`.

- Оригинальные изображения: https://github.com/microsoft/fluentui-emoji
- Каталог по кодам Unicode: https://github.com/shuding/fluentui-emoji-unicode
- Лицензия: MIT. Исходные идентификаторы реакций на сервере не меняются.
- При недоступности CDN компонент показывает запасной символ реакции.

## MIT License

Copyright (c) Microsoft Corporation.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Поведение в чате

- Один пользователь — одна реакция на сообщение. Выбор другого эмодзи заменяет прежний, повторный выбор снимает реакцию; сервер также обеспечивает это через `POST /reactions`.
- Выбор реакций живёт в отдельном `.reactionPopover` вне `.ContextMenuWrapper`: ПКМ и long-press сообщения показывают меню действий и самостоятельную панель; обычная кнопка открывает только панель.
- У исходящих сообщений справа налево идут галочки, время, «изменено», затем остальные метаданные и реакции. Аватарки до четырёх пользователей стоят справа от эмодзи и счётчика на одной линии.
- QA: разные/повторная реакции, ошибка API, несколько участников и realtime, личный/групповой чат, свои/чужие сообщения, медиа, ПКМ, long-press 350 мс, закрытие вне панели.
