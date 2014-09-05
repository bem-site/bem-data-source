bem-data-source
===============

Инструмент для версионированной сборки документации и примеров библиотек для проектов bem-info.

## Установка

* клонировать репозиторий `git clone git://github.com/bem/bem-data-source.git`
* перейти в директорию со скаченным проектом `cd bem-data-source`
* установить npm зависимости коммандой `npm install`

После установки зависимостей конфигурационный файл `config/credentials.json`.

## Конфигурирование

Конфигурация инструмента описывается в файлах `config/config.json`, `config/credentials.json`.

### Файл config/config.json

* `logLevel` - флаг уровня логгирования. может принимать значения: ("verbose", "debug", "info", "warn", "error")
* `languages` - массив локалей

### Файл config/credentials.json

Файл с токенами доступа к публичным и приватным репозиториям (github.com и github.yandex-team.ru соответственно)
Необходимо сгенерировать токены доступа в настройках профиля пользователя на github.com и github.yandex.team.ru
и вставить как значения соответствующих token-полей в данном файле.

```
"credentials": {
    "public": "",
    "private": ""
}
```

Также в этом файле настраивается конфигурация для доступа целевому репозиторию
в который будет помещен результат сборки, например:

```
"dataConfig": {
    "private": false,
    "user": "bem",
    "repo": "bem-info-libs",
    "ref": "master"
}
```
Здесь: 

* `private` - обозначает приватность github хоста на котором хранится репозиторий. 

`false` - для публичного гитхаба `github.com`
`true` - для корпоративного гитхаба.

* `user` - имя пользователя или название организации.
* `repo` - название рапозитория
* `ref` - название ветки (по умолчанию "master")

### Декларации для сборки библиотеки

Для каждой библиотеки можно указать ее собственные персональные настройки для сборки.

Для этого в папке 'declaration' необходимо создать js файл, 
название которого совпадает с названием библиотеки которую необходимо собрать, например `bem-components.js`.

Простейшая структура такого файла должна иметь вид:

```
module.exports = {
    default: {}
};
```

Для библиотеки bem-components:
 
```
module.exports = {
    default: {
        builder: 'enb',
        command: 'YENV=production enb make __magic__ desktop.examples desktop.tests desktop.docs touch-pad.examples touch-pad.tests touch-pad.docs touch-phone.examples touch-phone.tests touch-phone.docs && enb make *.pages/*',
        copy: ['*.docs', '*.tests', '*.examples'],
        docs: {
            readme: {
                folder: '',
                pattern: 'README.md'
            },
            changelog: {
                folder: '',
                pattern: 'CHANGELOG.md'
            },
            migration: {
                folder: '',
                pattern: 'MIGRATION.md'
            }
        },
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.html'
        },
        tasks: [
            require('../src/tasks/remove-output'),
            require('../src/tasks/create-output'),
            require('../src/tasks/git-clone'),
            require('../src/tasks/git-checkout'),
            require('../src/tasks/npm-install'),
            require('../src/tasks/npm-run-deps'),
            require('../src/tasks/copy-borschik'),
            require('../src/tasks/npm-run-build'),
            require('../src/tasks/copy-sets'),
            require('../src/tasks/collect-sets')
        ]
    }
}
```



Здесь:

#### builder 
Название инструмента с помощью которого будет выполняться сборка документации и примеров.

Допустимые значения `enb` и `bem-tools`. 
Значение по умолчанию `bem-tools`.
 
#### command 
Cтрока с названием команды для запуска сборки. 
Значение по умолчанию `npm run build`

#### copy 
Массив с шаблонами названий директорий с файлами документации и примеров, 
которые должны попасть в финальный результат сборки. 
Первым элементом данного массива должен быть шаблон директорий
которые содержат файлы с документацией по блокам.

Значение по умолчанию `['*.sets']`

#### docs

Объект с полями, которые в свою очередь также являются объектами.
Позволяет задавать произвольный набор документов которые должны попасть в сборку библиотеки

```
docs: {
    readme: {
        folder: '',
        pattern: 'README.md'
    },
    changelog: {
        folder: 'docs',
        pattern: {
            en: 'CHANGELOG.en.md',
            ru: 'CHANGELOG.en.md'
        }
    },
    migration: {
        pattern: 'https://github.com/bem/bem-core/tree/v2/MIGRATION.md'
    }
    ...
}    
```
Здесь 'README.md' - загружается из корня проекта. Файлы changelog-ов будут загружены из директории 'docs',
по маске 'CHANGELOG.en.md' и 'CHANGELOG.ru.md' соответственно. При этом будут выбраны последние версии таких файлов,
в случае когда в данной директории хранится несколько changelog - файлов и их названия содержат номер версии библиотеки.
Файл миграции напрямую загружается с гитхаба с помощью github API с указанного адреса.

Из данного примера видно, что можно задавать разные файлы для различных языков, а также указывать
произвольный url к файлу как адрес данного файла в браузере.

#### pattern 
Объект с полями `data` и `jsdoc` в котором можно указать шаблоны файлов с документацией и js документацией к блокам. 

Значение по умолчанию:

```
pattern: {
    data: '%s.data.json',
    jsdoc: '%s.jsdoc.json'
}
```

#### tasks 

Массив с модулями код которых будет выполнен для данной цели сборки 
в таком же порядке в каком  подключение этих модулей указано в массиве. 

### Описание модулей для сборки:

Примечание: `{lib}` - название библиотеки, `{ref}` - тег или ветка.

* `require('../src/tasks/remove-output')` - удаляет папку `/output/{lib}/{ref}`.
* `require('../src/tasks/create-output')` - создает папку `/output/{lib}/{ref}`.
* `require('../src/tasks/git-clone')` - клонирует проект из гитхаба в директорию `/content/{lib}/{ref}`. 
* `require('../src/tasks/git-checkout')` - переключает git на ветку или тег `{ref}`. 
* `require('../src/tasks/npm-cache-clean')` - отчищает кеш npm.
* `require('../src/tasks/npm-install')` - устанавливает npm зависимости.
* `require('../src/tasks/npm-run-bem-sets')` - устанавливает актуальную версию bem-sets.
* `require('../src/tasks/npm-install-bem')` - устанавливает актуальную версию bem-tools.
* `require('../src/tasks/npm-run-deps')` - запускает скрипт с алиасом 'npm run deps' в `package.json` файле.
* `require('../src/tasks/copy-borschik')` - копирует файл `.borschik` в `/content/{lib}/{ref}`.
* `require('../src/tasks/npm-run-build')` - запускает скрипт указанный в параметре `command` декларации для данной библотеки.
По умолчанию запускает скрипт с алиасом 'npm run build' в `package.json` файле.
* `require('../src/tasks/copy-sets')` - копирует папки с собранными файлами в `/output/{lib}/{ref}`
* `require('../src/tasks/collect-sets')` - собирает данные в единый файл `/output/{lib}/{ref}/data.json`

## Запуск

Запуск выполняется командой `ds make` с указанием дополнительных опций:

* `-p` или `--private`, если репозиторий внутренний
* `-u` или `--user` - имя пользователя или название организации (обязательный параметр)
* `-r` или `--repo` - название репозитория (обязательный параметр)
* `-t` или `--tags` - название версии (тега) библиотеки
* `-b` или `--branches` - название ветки библиотеки

## Дополнительные комманды

### Замена документа в собранных данных библиотеки

Выполняется командой `ds replace-doc` с указанием дополнительных опций:

* `-r` или `--repo` - название репозитория (обязательный параметр)
* `-v` или `--version` - название версии (тега или ветки) библиотеки (обязательный параметр)
* `-d` или `--doc` - ключ документа в сборки библиотеки ('readme', 'changelog', 'migration', ...) (обязательный параметр)
* `-l` или `--lang` - языковая версия заменяемого документа. Если этот параметр неуказан, то будут заменены
все яызковые версии документа, указанного в параметре `-d`.
* `-u` или `--url` - url для `*.md` файла источника замены на github, например: 

### Удаление версии библиотеки из репозитория с собранными данными

Выполняется командой `ds remove` с указанием дополнительных опций:

* `-r` или `--repo` - название репозитория (обязательный параметр)
* `-v` или `--version` - название версии (тега или ветки) библиотеки (обязательный параметр)

Посмотреть текущую версию приложения можно выполнив команду: `node index.js -v`

Ответственный за разработку @bemer

Вопросы и пожелания присылать по адресу: bemer@yandex-team.ru
