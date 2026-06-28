# Kefir Betaflight VTX One-Based Online Pack для Betaflight App 2025.12.2

Этот пакет собирает онлайн-версию Betaflight App **2025.12.2 (a2d0f50)** с одной правкой вкладки VTX/«Видеопередатчик».

## Что меняется

Только визуальное отображение `VTX Table -> Power Values`:

```text
Betaflight внутри: 0 1 2 3
Пользователь видит: 1 2 3 4
Сохранить: обратно 0 1 2 3
Сохранить файл: обратно 0 1 2 3
```

Обычные таблицы мощности не меняются:

```text
25 200 500 800 -> 25 200 500 800
```

## Как загрузить через сайт GitHub

1. Открой свой репозиторий `Kefir-betaflight`.
2. Удали старые workflow-файлы в `.github/workflows/`, если они остались.
3. Загрузи содержимое этого архива через `Add file -> Upload files`.
4. Зайди `Settings -> Pages`.
5. В `Build and deployment` выбери `Source: GitHub Actions`.
6. Зайди `Actions`.
7. Запусти `Build online Kefir Betaflight VTX 2025.12.2`.
8. Поля оставь как есть:

```text
upstream_repository = betaflight/betaflight-configurator
upstream_ref = 2025.12.2
```

После зелёной сборки ссылка появится в `Settings -> Pages`.

## Почему теперь должно собраться

Предыдущая ошибка была из-за того, что `master` Betaflight уже новый и там нет старого файла:

```text
app/src/js/tabs/vtx.js
```

В версии `2025.12.2` этот файл есть. Этот workflow по умолчанию берёт именно релиз `2025.12.2`, а не `master`.

## Если снова красная ошибка

Открой лог и проверь строку:

```text
Ref: 2025.12.2
```

Если там `master`, значит запускается старый workflow или в поле `upstream_ref` случайно введён `master`.
