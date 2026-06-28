# Andrian Betaflight VTX One-Based Online Pages Pack

Этот пакет предназначен для пустого GitHub-репозитория.
Он сам скачивает официальный `betaflight/betaflight-configurator`, применяет визуальную правку VTX и публикует онлайн-версию через GitHub Pages.

## Что меняется

Только визуальное отображение в VTX Table Power Values:

- в Betaflight хранится: `0 1 2 3`
- пользователь видит: `1 2 3 4`
- при `Save` / `Сохранить`: обратно уходит `0 1 2 3`
- при `Save file` / `Сохранить файл`: файл остаётся совместимым с Betaflight

Обычные значения мощности в mW, например `25 200 500 800`, не сдвигаются.

## Что лежит в пакете

- `.github/workflows/build-online-betaflight.yml` — автоматическая сборка и публикация сайта.
- `tools/apply_andrian_vtx_ui_patch.mjs` — применяет правку к `src/js/tabs/vtx.js`.
- `tools/test_vtx_visual_conversion.mjs` — проверяет, что конвертация визуальная и обратимая.
- `docs/WHAT_WAS_CHECKED.md` — краткая проверка логики.

## Как получить онлайн-ссылку без командной строки

1. Создай пустой репозиторий на GitHub.
2. Распакуй этот архив на компьютере.
3. В репозитории нажми `Add file` → `Upload files`.
4. Перетащи в окно GitHub содержимое распакованной папки, включая папки `.github`, `tools`, `docs`.
5. Нажми зелёную кнопку `Commit changes`.
6. Открой вкладку `Settings` → `Pages`.
7. В `Build and deployment` выбери `Source: GitHub Actions`.
8. Открой вкладку `Actions`.
9. Выбери workflow `Build online Andrian Betaflight VTX`.
10. Нажми `Run workflow`.
11. После зелёной галочки зайди в `Settings` → `Pages`; там будет ссылка вида:
    `https://ТВОЙ_НИК.github.io/ИМЯ_РЕПОЗИТОРИЯ/`

## Если не появляется кнопка Run workflow

Открой `Actions` и нажми `I understand my workflows, go ahead and enable them`.
Потом вернись к workflow и запусти его.

## Если сайт открылся, но не видит COM-порт

Открывай через Chrome или Edge. Онлайн-версия работает через Web Serial, поэтому сайт должен быть открыт по HTTPS. GitHub Pages даёт HTTPS.
