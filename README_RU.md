# Kefir Betaflight VTX One-Based Online Pack

Это маленький проект для GitHub Pages. Он сам скачивает официальный `betaflight/betaflight-configurator`, применяет визуальную правку вкладки VTX и публикует онлайн-версию.

## Что исправлено в этой версии пакета

Если раньше в Actions была ошибка:

```text
Cannot find .../app/src/js/tabs/vtx.js
Run this script from the root of betaflight-configurator.
```

то этот пакет исправляет запуск: Betaflight скачивается в папку `app`, а патч запускается уже изнутри `app`. Также добавлена проверка/вывод найденных VTX-файлов перед патчем.

## Что меняет патч

Только визуальное отображение VTX Table Power Values:

```text
Внутри Betaflight: 0 1 2 3
В интерфейсе:      1 2 3 4
При Save:          0 1 2 3
При Save File:     0 1 2 3
При Save Lua:      0 1 2 3
```

Обычные значения мощности не трогаются:

```text
25 200 500 800 -> 25 200 500 800
```

## Как использовать через сайт GitHub

1. Открой свой репозиторий, например `Kefir-betaflight`.
2. Удали старые файлы пакета или загрузи новые поверх старых.
3. Нажми `Add file` → `Upload files`.
4. Перетащи содержимое этой папки в репозиторий:

```text
.github
README_RU.md
docs
tools
KEFIR_ONLINE_PAGES_SUMMARY.txt
```

5. Нажми `Commit changes`.
6. Открой `Settings` → `Pages`.
7. В `Build and deployment` выбери `Source: GitHub Actions`.
8. Открой `Actions`.
9. Выбери `Build online Kefir Betaflight VTX`.
10. Нажми `Run workflow`.
11. Поля оставь по умолчанию:

```text
upstream_repository = betaflight/betaflight-configurator
upstream_ref = master
```

12. После зелёной сборки ссылка будет в `Settings` → `Pages`.

Обычно ссылка будет такого вида:

```text
https://ТВОЙ_НИК.github.io/Kefir-betaflight/
```

## Если сборка снова упадёт

Открой красный лог и посмотри шаг `Download Betaflight App source`. Там теперь печатается список найденных файлов `*vtx*.js`, чтобы было видно, скачался ли настоящий Betaflight и где лежит вкладка VTX.
