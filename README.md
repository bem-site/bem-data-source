bem-data-source
===============

Инструмент для версионированной сборки документации и примеров библиотек для проектов bem-info legoa-www.

### Установка

* клонировать репозиотрий `git clone git://github.com/tormozz48/bem-data-source.git`
* перейти в директорию с выкачанным проектом `cd bem-data-source`
* подключить зависимости `npm install`
* запустить командой `node make.js`

- при запуске инструмента можно указывать разные уровни логирования добавляя флаг `-v` и возможными значениями
`silly`, `debug`, `info`, `warn`, `error`. По умолчанию выставляется уровень логгирования 'info'.

### Конфигурирование

Конфигурация сборки полностью описывается содержимым файла `config/config.json`.

* `contentDirectory` - название директории куда будут выкачиваться библиотеки при сборке
* `outputTargetFile` - имя файлов в которые будут кешироваться промежуточные результаты сборки для одной цели
* `gitAPI` - конфигурация github API для доступа к приватным и публичным репозиториям github.
* `sources` - описание репозиториев содержимое которых попадет в сборку

Объект `sources` делится на 2 группы `private` и `public`. В разделе `private` описываются репозитории, находящиеся
на внутреннем корпоративном github-е `https://github.yandex-team.ru`. В разделе  `public` описываются репозитории, находящиеся
на внешнем публичном github-е `https://github.com`.

Внутри групп `private` и `public` репозитории также группируются по критерию владельца, которыми могут быть как организации `org`
так и отдельные люди `user`.

Библиотека для сборки оисывается в конфигурационном файле объектом вида:

```
{
    "name": "firmCardStory",
    "targetDir": "articles/firm-card-story",
    "type": ["docs"],
    "docDirs": ["docs"],
    "branches": {
        "include": ["master"],
        "exclude": []
    },
    "tags": [
        "include": [],
        "exclude": []
    ]
}
```

Здесь:

* `name` - название репозитория (должно совпадать с названием репозитория на github)
* `targetDir` - название директории куда будет склонирован проект (относительно общей папки `contentDirectory`)
* `type` - массив типов ресурсов, которые будут собраны для данного репозитория. Возможные значения: `libs`, `docs`
* `docDirs` - массив с названиями директорий в которых находятся блоки с документацией. Обычно это `docs`, `doc`, `common.docs` и.т.д
Если блоки с документацией находятся в корне проекта, то массив должен быть пустым.
* `branches` - объект с полями `include` и `exclude`, значеними которых являются массивы с именами веток `branch` которые
будут соответственно включены и исключены из сборки проекта. После успешной сборки конфигурационный файл переписывается и
в массив `exclude` добавляется имя собранной ветки.
* `tags` - объект с полями `include` и `exclude`, значеними которых являются массивы с именами тегов `tag` которые
будут соответственно включены и исключены из сборки проекта. После успешной сборки конфигурационный файл переписывается и
в массив `exclude` добавляется имя собранного тега. Значением поля `include` для тегов могут быть также строки
`all` и `last`. `all` указывает на необходимость сборки всех существующих тегов, а `last` только последнего тега.
(здесь предполагается что теги имеют структуру 0.0.0, что дает возможность их явной сортировки)

Ответственный за разработку @bemer
Вопросы и пожелания присылать по адресу bemer@yandex-team.ru
