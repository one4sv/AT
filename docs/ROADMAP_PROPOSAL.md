# Roadmap AchieveTogether: состояние и дальнейшее развитие

**Страница уже реализована:** [achievetogether.vercel.app/info/roadmap](https://achievetogether.vercel.app/info/roadmap). Этот MD фиксирует существующую функциональность и отдельно — дальнейшие планы. Референс истории: [Miro Updates RoadMap](https://miro.com/app/board/uXjVGNsgP9E=/); скриншоты предоставлены пользователем, полная объектная структура Miro не импортировалась.

## Что находится в `main`

- `src/pages/Info/Info.tsx` — кнопка дорожной карты в том же стиле, что остальные кнопки Info, и маршрут `/info/roadmap`.
- `src/pages/Info/tabs/RoadmapTab.tsx` — один контейнер `infoText` и общая **вертикальная линия слева**. Будущие обновления сверху, текущее `dev 0.6.5 Mosaic` посередине, старые снизу; история по умолчанию свернута.
- `src/pages/Info/roadmapData.ts` — статические данные исторических версий и планов; RU/EN в `RoadmapText`. У крупных `0.x` есть названия и градиентные плашки, у патчей `0.x.x` могут быть собственные английские названия, как Songbird, Waypoint и Mosaic.
- `src/pages/Info/scss/roadmap.scss` — прошедшая линия `--accent`, будущая `--borderWh`, у текущего обновления увеличенный маркер и `border: var(--accent)`, фон из `--accent_hov` → `--grad_hov`.
- `src/pages/Info/RoadmapArt.tsx` / `SectionArt theme="roadmap"` — отдельный рисунок в общей системе иллюстраций.
- `src/pages/Info/tabs/AboutTab.tsx` — версия **dev 0.6.5** с ссылкой на roadmap; FAQ содержит внутреннюю ссылку на страницу.

## Версии и источники

Текущая версия — dev 0.6.5 Mosaic. Waypoint входит в историю. Английские названия версий одинаковы в RU и EN, пункты описания переводятся. Краткий состав версий приведён в [CHANGELOG.md](CHANGELOG.md). Даты, отображаемые на сайте, относятся к данным дорожной карты.

Данные обновляются вручную. Автоматическая проверка сверяет версию пакета, roadmap, экран About и ключи локалей. Живая синхронизация с Linear остаётся отдельной задачей [ONE4SV-50](https://linear.app/atone4sv/issue/ONE4SV-50).
