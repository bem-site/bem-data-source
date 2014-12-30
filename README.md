bem-data-source
===============

[![Build Status](https://travis-ci.org/bem-site/bem-data-source.svg?branch=master)](https://travis-ci.org/bem/bem-data-source)
[![Dependency Status](https://david-dm.org/bem-site/bem-data-source.svg?style=flat)](https://david-dm.org/bem/bem-data-source)
[![devDependency Status](https://david-dm.org/bem-site/bem-data-source/dev-status.svg?style=flat)](https://david-dm.org/bem/bem-data-source#info=devDependencies)

Данный инструмент предназначен для публикации данных документации и примеров по библиотекам блоков.

## Установка

* клонировать репозиторий `git clone git://github.com/bem/bem-data-source.git`
* перейти в директорию со скаченным проектом `cd bem-data-source`
* установить npm зависимости коммандой `npm install`
* сгенерировать приватный конфигурационный файл командой `npm run config`

После выполнения `npm run config` должен появиться новый конфигурационный файл `config/private.json`.

## Конфигурирование

Конфигурация инструмента описывается в файлах `config/public.json`, `config/private.json`.

### Файл config/public.json

* `logLevel` - флаг уровня логгирования. может принимать значения: ("verbose", "debug", "info", "warn", "error")
* `languages` - массив локалей
* `maxOpenFiles` - максимальное количество открытых файлов. Этот параметр также определяет размер
порций файлов которые одновременно записываются в хранилище.
* `storage` - объект хранилища данных, например:

```
"storage": {
    "cocaine": {
        "debug": false
    }
}
```
* `mailer` - объект с настройками почтовой рассылки. Настоятельно рекомендуется выносить данные
настройки в приватный конфигурационный файл `config/private.json`.

### Файл config/private.json

В этом файле настриваются приватные параметры приложения, например пространство имен для хранилища:

```
{
  "storage": {
    "cocaine": {
      "namespace": "your_application_namespace"
    }
  }
}
```

Настройки почтовой рассылки:

```
{
  "mailer": {
    "host": "your e-mail-host",
     "port": 25,
     "from": "john.smith@gmail.com",
     "to": [
       "recepient1@gmail.com",
       "recepient2@gmail.com"
     ]
  }
}
```

### [Декларации для сборки библиотеки](./docs/declarations.md)

## CLI интерфейс

#### Просмотр данных реестра библиотек в хранилище

Выполняется командой `node bin/ds view` с указанием дополнительных опций:

* `-r` или `--repo` - название репозитория (необязательный параметр)
* `-v` или `--version` - название версии (тега или ветки) библиотеки (необязательный параметр)

В случае если указаны оба параметра, то выведется информация по конкретной указанной версии библиотеки.

Если была передана только опция с названием библиотеки, то будет выведен список версий выбранной библиотеки.

Если не был передан ни один из параметров, то будет выведен список библиотек, которые находятся в настоящее
время в реестре.

#### Удаление версии библиотеки из репозитория с собранными данными

Выполняется командой `node bin/ds remove` с указанием дополнительных опций:

* `-r` или `--repo` - название репозитория (обязательный параметр)
* `-v` или `--version` - название версии (тега или ветки) библиотеки (обязательный параметр)
* `-d` или `--dry` - режим тестового запуска. При этом данные не будут удалены а в консоль
будет выведено соответствующее сообщение.

ВНИМАНИЕ! При выполнении этой команды происходит НОБРАТИМОЕ УДАЛЕНИЕ из хранилища!
Будьте внимательными при ее использовании.

#### Замена документа в собранных данных библиотеки

Выполняется командой `node bin/ds replace` с указанием дополнительных опций:

* `-r` или `--repo` - название репозитория (обязательный параметр)
* `-v` или `--version` - название версии (тега или ветки) библиотеки (обязательный параметр)
* `-d` или `--doc` - ключ документа в сборки библиотеки ('readme', 'changelog', 'migration', ...) (обязательный параметр)
* `-l` или `--lang` - языковая версия заменяемого документа. Если этот параметр неуказан, то будут заменены
все яызковые версии документа, указанного в параметре `-d`.
* `-u` или `--url` - url для `*.md` файла источника замены на github, например:

#### Ручная публикация собранных данных библиотеки на удаленный сервер

Находясь в директории целевой библиотеки блоков, после сборки примеров и документации
можно вызвать команду `publish` которая упакует собранные данные документации в формат
необходимый для сайта, проведет архивацию всех примеров, отправит все данные по документации
и примерам библиотеки в хранилище и добавит версию данной библиотеки в реестр собранных данных.

Пример:
```
node {path to bem-data-source}/bin/ds publish [-v version]
```
Где `-v` - необязательный параметр названия версии (ветка, тег, пулл-реквест).
Если этот параметр не будет указан, то название версии будет выбрано из файла `package.json`

#### Просмотр текущей версии приложения.

Посмотреть текущую версию приложения можно выполнив команду: `node bin/ds -v`

## API

Команды `bem-data-source` можно выполнять не только вручную из коммандной строки, но также
с помощью сторонних модулей. Это дает возможность интеграции `bem-data-source`
в различные системы сборки документации и примеров библиотек блоков.

#### View:

Просмотр реестра собранных данных по библиотекам блоков.

```
var ds = require('bem-data-source');
ds.view(repo, version, options);
```

* `repo` - необязательный параметр названия библиотеки (ветка, тег, пулл-реквест)
* `version` - необязательный параметр названия версии (ветка, тег, пулл-реквест)
* `options` - опциональне настройки команды.

Возможные варианты применения:

##### Просмотр списка библиотек в реестре:
```
    ds.view(null, null, options).then(function(libs) {
        console.log(libs);
    });
```

##### Просмотр списка версий библиотеки:
```
    ds.view('bem-core', null, options).then(function(versions) {
        console.log(versions);
    });
```

##### Просмотр информации по отдельной версии библиотеки:
```
    ds.view('bem-core', 'v2.3.0', options).then(function(version) {
        console.log(version.sha);
        console.log(version.date);
    });
```

#### Remove:

Удаление собранных данных версии библиотеки.

```
var ds = require('bem-data-source');
ds.remove(repo, version, options, dryMode);
```

* `repo` - обязательный параметр названия библиотеки (ветка, тег, пулл-реквест)
* `version` - обязательный параметр названия версии (ветка, тег, пулл-реквест)
* `options` - опциональные настройки команды.
* `dryMode` - Тестовое выполнение команды. При включенном флаге `dryMode` в значении `true`,
реального удаления данных не произойдет.

#### Replace:

Замена существующего документа (readme, documentation ...).

```
var ds = require('bem-data-source');
ds.replace(repo, version, options);
```

* `repo` - обязательный параметр названия библиотеки (ветка, тег, пулл-реквест)
* `version` - обязательный параметр названия версии (ветка, тег, пулл-реквест)
* `options` - дополнительные настройки команды. Объект с полями:

- `doc` - название документа. Допустимые значения: ('readme', 'changelog', 'migration', 'notes') (Обязательное поле)
- `lang` - язык документа. Если данный параметр отсутствует, то будут заменены все версии документа для списка
языков указанных в конфигурационном файле.
- `url` - ссылка на `*.md` документ который должен заменить существующий. По своей сути - это
такая ссылка на документ на github которую можно увидеть в браузере при открытии этого файла на github.
Например, для README.md bem-data-source: `https://github.com/bem/bem-data-source/blob/master/README.md`

#### Publish:

Публикация собраных данных.

```
var ds = require('bem-data-source');
ds.publish(version, options, dryMode);
```

* `version` - обязательный параметр названия версии (ветка, тег, пулл-реквест)
* `options` - опциональне настройки команды.
* `dryMode` - Тестовое выполнение команды. При включенном флаге `dryMode` в значении `true`,
реальной публикации данных не произойдет.

ВНИМАНИЕ: при выполнении данной команды `process.cwd()` должен указывать на корневую директорию библиотеки.

#### Init:

Инициализация хранилища данных.

```
var ds = require('bem-data-source');
ds.init(options);
```

Позволяет явно инициализировать хранилище и работать с данными, например:

```
ds.init(options).then(function() {
    ds.view(...);
    ds.replace(...);
    ds.remove(...);
});
```

##### Опциональные настройки для команд:

Помимо специфичных настроек (как например для метода replace), все методы API принимают
объект с общими настройками. Они включают в себя такие поля:

* `debug` - флаг для отслеживания внутренней работы храниища данных (по умолчанию `false`).
* `namespace` - пространство имен для key-value хранилища. (по умолчанию `defaultnamespace`)

## Тестирование

Запуск тестов:

```
npm run mocha
```

Запуск тестов с покрытием:

```
npm run istanbul
```

Запуск проверки codestyle (jshint и jscs)

```
npm test
```

Ответственный за разработку @bemer

Вопросы и пожелания присылать по адресу: bemer@yandex-team.ru
