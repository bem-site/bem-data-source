# Описание модулей для сборки

Примечание: `{lib}` - название библиотеки, `{ref}` - тег или ветка.

#### Удаление папки /output/{lib}/{ref}. [код](../src/tasks/remove-output.js)

Подключение в декларации: `require('../src/tasks/remove-output')`

#### Создание папки /output/{lib}/{ref}. [код](../src/tasks/create-output.js)

Подключение в декларации: `require('../src/tasks/create-output')`

#### Клонирование проекта [код](../src/tasks/git-clone.js)

Подключение в декларации: `require('../src/tasks/git-clone')`

#### Переключение git на ветку или тег {ref} [код](../src/tasks/git-checkout.js)

Подключение в декларации: `require('../src/tasks/git-checkout')`

#### Очистка кеша npm [код](../src/tasks/npm-cache-clean.js)

Подключение в декларации: `require(../src/tasks/npm-cache-clean)`

#### Установка npm зависимостей [код](../src/tasks/npm-install.js)

Подключение в декларации: `require(../src/tasks/npm-install)`

#### Установка акутальной версии [bem-sets](https://github.com/bem/bem-sets) [код](../src/tasks/npm-install-bem-sets.js)

Подключение в декларации: `require('../src/tasks/npm-install-bem-sets')`

#### Установка акутальной версии [bem-tools](https://github.com/bem/bem-tools) [код](../src/tasks/npm-install-bem.js)

Подключение в декларации: `require('../src/tasks/npm-install-bem')`

#### Запуск скрипта с алиасом 'npm run deps' в package.json файл [код](../src/tasks/npm-run-deps.js)

Подключение в декларации: `require('../src/tasks/npm-run-deps')`

#### Копирование файла .borschik в директорию /content/{lib}/{ref} [код](../src/tasks/copy-borschik.js)

Подключение в декларации: `require('../src/tasks/copy-borschik')`

#### Запуск сборки документации и примеров [код](../src/tasks/npm-run-build.js)

Подключение в декларации: `require('../src/tasks/npm-run-build')`
Примечание: запускает скрипт указанный в параметре `command` декларации для данной библотеки.
            По умолчанию запускает скрипт с алиасом 'npm run build' в `package.json` файле.

#### Копирование собранных данных [код](../src/tasks/copy-sets.js)

Подключение в декларации: `require('../src/tasks/copy-sets')`
Примечание: происходит копирование папок, суффиксы названий которых указаны в параметре `copy` в декларации библиотеки
из папки `/content/{lib}/{ref}` в `/output/{lib}/{ref}`

#### Пост-обработка и сборка в единый файл /output/{lib}/{ref}/data.json [код](../src/tasks/collect-sets.js)

Подключение в декларации: `require('../src/tasks/collect-sets')`


## Создание собственного модуля для сборки

Архитектура bem-data-source позволяет создавать собственные шаги или модули сборки.

Для этого, в папке [tasks](../src/tasks) необходимо создать js файл, название которого может быть произвольным
но рекоммендуется выбрать его так, чтобы оно отражало суть того, что будет делать данный модуль при сборке.

В созданный файл скопируйте код:

```
'use strict';

var vow = require('vow');

/**
 * @param target - {Target} target objects
 * @returns {defer.promise|*}
 */
module.exports = function(target) {
    //TODO you can right your own custom actions here
    return vow.resolve(target);
};
```

Модуль должен экспортировать функцию аргументом которой является объект класса [Target](../src/target.js).

