document.addEventListener('DOMContentLoaded', function() {
    var mainTable = document.getElementById('mainTable');
    GetPageFromTable(1);
    AddSortingToTableHeaders(mainTable);
});

function AddRowToTable(jsonRow, table) {
    var jsonData = (typeof jsonRow === 'string') ? JSON.parse(jsonRow) : jsonRow;
    var tableBody = table.querySelector('tbody');
    var headers = table.querySelectorAll('th');
    var row = tableBody.insertRow();

    // Проходим по всем заголовкам и заполняем ячейки
    Array.from(headers).forEach(function(header) {
        var cell = row.insertCell();
        // Используем атрибут 'name' заголовка для получения значения из jsonData
        var jsonFieldName = header.getAttribute('name');
        var value = jsonData[jsonFieldName] || '';
        cell.textContent = value;

        // Проверяем наличие атрибута 'data-expanded-source'
        var expandedSource = header.getAttribute('data-expanded-source');
        if (expandedSource) {
            // Вызываем функцию GetExpandedData для этого столбца
            GetExpandedData(cell, header);
        }

        // Проверяем значения данных и устанавливаем цвет ячейки
        if (typeof jsonData[jsonFieldName] !== 'undefined') {
            var item = jsonData[jsonFieldName];
            if (item === true) {
                cell.style.backgroundColor = 'green';
                cell.textContent = '';  // Удаляем textContent если закрашивается зеленым
            } else if (item === false) {
                cell.style.backgroundColor = 'red';
                cell.textContent = '';  // Удаляем textContent если закрашивается красным
            } else {
                cell.textContent = item;
            }
        }
    });

    row.addEventListener('click', TableRowClick);
}

function GetPageFromTable(pageNumber) {
    currentPage = pageNumber;
    UpdateNavigationPanel();
    var itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
    var mainTable = document.getElementById('mainTable');
    var tableName = mainTable.getAttribute('name');
    var tableBody = mainTable.querySelector('tbody');

    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }

    var requestData = {
        tablename: mainTable.getAttribute('name'),
        pagenumber: pageNumber,
        itemsperpage: itemsPerPage
    };

    fetch('/getPage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || 'Network response was not ok');
            });
        }
        return response.json();
    })
    .then(result => {
        result.forEach(jsonRow => {
            AddRowToTable(jsonRow, mainTable);
        });
        SortTable(mainTable, 0);
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
        alert(error.message);
    });
}

function AddSortingToTableHeaders(table) {
    var headers = table.getElementsByTagName("th");
    for (let i = 0; i < headers.length; i++) {
        headers[i].addEventListener("click", function() {
            SortTable(table, i);
        });
    }
}

function SortTable(table, columnIndex) {
    var rows, switching, i, x, y, shouldSwitch, xValue, yValue;
    switching = true;

    while (switching) {
        switching = false;
        rows = table.getElementsByTagName("TR");

        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("TD")[columnIndex];
            y = rows[i + 1].getElementsByTagName("TD")[columnIndex];

            // Проверяем, есть ли у ячеек стиль backgroundColor
            if (x.style.backgroundColor && y.style.backgroundColor) {
                var colorPriority = { "green": 1, "red": 2, "": 3 };
                xValue = x.style.backgroundColor;
                yValue = y.style.backgroundColor;

                if (colorPriority[xValue] > colorPriority[yValue]) {
                    shouldSwitch = true;
                    break;
                }
            } else {
                xValue = isNaN(x.innerHTML) ? x.innerHTML.toLowerCase() : parseFloat(x.innerHTML);
                yValue = isNaN(y.innerHTML) ? y.innerHTML.toLowerCase() : parseFloat(y.innerHTML);

                if (xValue > yValue) {
                    shouldSwitch = true;
                    break;
                }
            }
        }

        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}

function FormatDataWithPrefix(data, prefix) {
    // Если data не массив, превращаем его в массив
    if (!Array.isArray(data)) {
        data = [data];
    }

    // Используем reduce для создания строки с заменой символов * и $ на <br>
    return data.reduce((formattedString, value) => {
        // Заменяем первое вхождение * на текущее значение value
        formattedString = formattedString.replace('*', value);
        // Заменяем все вхождения $ на тег <br> для переноса строки в HTML
        return formattedString.replace(/\$/g, '<br>');
    }, prefix);
}

function GetExpandedData(cell, header) {
    var value = cell.textContent;

    // Установка скрытого атрибута с прочитанным значением
    cell.setAttribute('data-value', value);

    var expandedSource = header.dataset.expandedSource;
    var expandedColumns = header.dataset.expandedColumns.split(', ');
    var columnName = header.getAttribute('name');
    var expandedPrefix = header.dataset.expandedPrefix;

    var dataToSend = {
        value: value,
        columnName: columnName,
        expandedSource: expandedSource,
        expandedColumns: expandedColumns
    };

    var jsonString = JSON.stringify(dataToSend);

    fetch('/getExpandedData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: jsonString
    })
    .then(response => response.json())
    .then(data => {
        // Проверка на пустой массив
        if (Array.isArray(data) && data.length === 0) {
            return;
        }

        // Создаем упорядоченный массив данных
        var orderedData = expandedColumns.map(column => data[column]);

        // Форматируем данные с префиксом
        var formattedData = FormatDataWithPrefix(orderedData, expandedPrefix);

        // Проверяем значения данных и устанавливаем цвет ячейки
        orderedData.forEach(function(item) {
            if (item === true) {
                cell.style.backgroundColor = 'green';
                cell.textContent = '';  // Удаляем textContent если закрашивается зеленым
            } else if (item === false) {
                cell.style.backgroundColor = 'red';
                cell.textContent = '';  // Удаляем textContent если закрашивается красным
            } else {
                cell.innerHTML = formattedData;
            }
        });

    })
    .catch(error => {
        console.error('Error fetching expanded data:', error);
        cell.textContent = 'Error loading data';
    });
}

function UpdateNavigationPanel() {
    var itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
    var navigationPanel = document.getElementById('navigationPanel');
    var mainTable = document.getElementById('mainTable');
    var tableName = mainTable.getAttribute('name');

    navigationPanel.innerHTML = '';

    var url = '/getCount/' + encodeURIComponent(tableName);

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || 'Network response was not ok');
            });
        }
        return response.json();
    })
    .then(data => {
        var totalItems = data;
        var totalPages = Math.ceil(totalItems / itemsPerPage);

        if (totalPages === 0) {
            totalPages = 1;
        }

        if (currentPage > totalPages) {
            currentPage = totalPages;
        } else if (currentPage < 1) {
            currentPage = 1;
        }

        // Добавление кнопки для предыдущей страницы
        var prevButton = document.createElement('button');
        prevButton.innerText = '<';
        prevButton.onclick = function() {
            if (currentPage > 1) {
                currentPage--;
                GetPageFromTable(currentPage);
                updateActivePage();
            }
        };
        navigationPanel.appendChild(prevButton);

        if (totalPages <= 5) {
            for (var i = 1; i <= totalPages; i++) {
                addPageButton(i);
            }
        } else {
            addPageButton(1);

            if (currentPage > 3) {
                var dots = document.createElement('span');
                dots.innerText = '...';
                navigationPanel.appendChild(dots);
            }

            var startPage = Math.max(2, currentPage - 1);
            var endPage = Math.min(totalPages - 1, currentPage + 1);

            for (var i = startPage; i <= endPage; i++) {
                addPageButton(i);
            }

            if (currentPage < totalPages - 2) {
                var dots = document.createElement('span');
                dots.innerText = '...';
                navigationPanel.appendChild(dots);
            }

            addPageButton(totalPages);
        }

        // Добавление кнопки для следующей страницы
        var nextButton = document.createElement('button');
        nextButton.innerText = '>';
        nextButton.onclick = function() {
            if (currentPage < totalPages) {
                currentPage++;
                GetPageFromTable(currentPage);
                updateActivePage();
            }
        };
        navigationPanel.appendChild(nextButton);

        function addPageButton(page) {
            var button = document.createElement('button');
            button.innerText = page;
            button.onclick = function() {
                currentPage = page;
                GetPageFromTable(currentPage);
                updateActivePage();
            };
            if (page === currentPage) {
                button.classList.add('active');
            }
            navigationPanel.appendChild(button);
        }

        function updateActivePage() {
            var buttons = navigationPanel.getElementsByTagName('button');
            for (var j = 0; j < buttons.length; j++) {
                buttons[j].classList.remove('active');
                if (parseInt(buttons[j].innerText) === currentPage) {
                    buttons[j].classList.add('active');
                }
            }
        }
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function TableRowClick() {
    // Убираем выделение со всех строк таблицы
    var tableRows = document.querySelectorAll('#mainTable tr');
    tableRows.forEach(function(row) {
        row.classList.remove("selected");
    });

    // Добавляем класс "selected" к текущей строке, чтобы выделить её
    this.classList.add("selected");
}

function CreateOverlay(modal) {
  // Поиск элемента overlay по id
  let overlay = document.getElementById('overlay');

  // Если элемент overlay не найден, создаем его
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'overlay';
    document.body.appendChild(overlay);
  }

  // Получаем фактически примененные стили к элементу overlay
  let overlayStyle = window.getComputedStyle(overlay);

  // Если display у overlay установлен в 'none', меняем на 'block'
  if (overlayStyle.display === 'none') {
    overlay.style.display = 'block';
  }

  var modalZIndex = window.getComputedStyle(modal).zIndex;

  // Преобразование modalZIndex в число и вычитание 1
  overlay.style.zIndex = parseInt(modalZIndex) - 1;
}

function CloseModal(modal) {
  // Удаление модального окна из документа
  modal.parentNode.removeChild(modal);

  // Поиск всех элементов с классом .modal в документе
  var modals = document.querySelectorAll('.modal');

  // Переменная для хранения максимального z-index среди модальных окон
  var highestZIndex = 0;

  // Перебор всех найденных модальных окон
  for (var i = 0; i < modals.length; i++) {
    // Получение текущего z-index модального окна
    var zIndex = parseInt(window.getComputedStyle(modals[i]).zIndex, 10);

    // Если z-index модального окна больше найденного максимального
    if (zIndex > highestZIndex) {
      highestZIndex = zIndex;
    }
  }

  // Поиск элемента overlay по id
  var overlay = document.getElementById('overlay');

  // Если найден элемент overlay и есть другие модальные окна
  if (overlay && modals.length > 0) {
    // Установка z-index для overlay на 1 меньше максимального среди модальных окон
    overlay.style.zIndex = highestZIndex - 1;
  } else if (overlay) {
    // Если других модальных окон нет, скрываем overlay
    overlay.style.display = 'none';
  }
}

function ParseJsonToTable(jsonData, table) {
    // Очищаем текущие строки таблицы, кроме заголовка
    var tbody = table.querySelector('tbody');
    if (tbody) {
        tbody.innerHTML = '';
    } else {
        // Если tbody нет, создаем его
        tbody = document.createElement('tbody');
        table.appendChild(tbody);
    }

    // Шаг 1: Примитивное мапирование хедеров таблицы
    var headers = table.querySelectorAll('th');
    var headerMap = {};

    headers.forEach(header => {
        var name = header.getAttribute('name');
        var expandedColumns = header.getAttribute('data-expanded-columns');

        if (expandedColumns) {
            headerMap[expandedColumns] = header.cellIndex;
        } else if (name) {
            headerMap[name] = header.cellIndex;
        }
    });

    // Шаг 2: Добавляем строки данных с помощью функции AddRowToTable
    jsonData.forEach(dataRow => {
        AddRowToTable(dataRow, table);
    });
}

function FillSearchSelectOptions(selectElement, table) {
    // Очистим selectElement перед добавлением новых option
    selectElement.innerHTML = '';

    // Получаем все хедеры таблицы
    const headers = table.querySelectorAll('thead th');

    // Проходимся по всем хедерам таблицы
    headers.forEach(header => {
        // Проверяем, что у хедера нет атрибута hidden и его textContent непустой
        if (!header.hasAttribute('hidden') && header.textContent.trim() !== '') {
            // Создаем новый элемент option и задаем ему textContent из хедера
            const option = document.createElement('option');
            option.textContent = header.textContent.trim();
            selectElement.appendChild(option);
        }
    });
}

function MakeSearch(selectElement, table, input) {
    const sourceTableName = table.getAttribute('name');
    const url = '/getAllRecords/' + encodeURIComponent(sourceTableName);

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: null
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.error);
            });
        }
        return response.json();
    })
    .then(jsonData => {
        // Преобразуем каждую строку JSON в объект
        const records = jsonData.map(record => JSON.parse(record));

        const searchValue = input.value.trim().toLowerCase();
        const selectedHeader = selectElement.options[selectElement.selectedIndex].textContent.trim();

        // Получаем индекс столбца с textContent, соответствующим выбранному option
        const headers = Array.from(table.querySelectorAll('thead th'));
        const headerIndex = headers.findIndex(header => header.textContent.trim() === selectedHeader);

        if (headerIndex === -1) {
            throw new Error(`Header with text "${selectedHeader}" not found`);
        }

        const headerName = headers[headerIndex].getAttribute('name');

        // Очищаем текущие строки таблицы, кроме заголовка
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';

        // Фильтруем строки, которые удовлетворяют критериям поиска
        const filteredRecords = records.filter(record => {
            if (record.hasOwnProperty(headerName)) {
                const cellValue = record[headerName].toString().toLowerCase();
                return cellValue.includes(searchValue);
            }
            return false;
        });

        // Передаем отфильтрованные данные в функцию ParseJsonToTable
        ParseJsonToTable(filteredRecords, table);
    })
    .catch(error => {
        alert(error.message);
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function BlockElementInput(element) {
    // Получаем все input элементы (включая radio), которые имеют атрибут data-input-order, исключая те, у которых data-input-order = null
    const inputs = Array.from(element.querySelectorAll('input[data-input-order]'))
        .filter(input => input.getAttribute('data-input-order') !== "null");

    // Сортируем input элементы по data-input-order
    inputs.sort((a, b) => a.getAttribute('data-input-order') - b.getAttribute('data-input-order'));

    // Создаем объект для отслеживания состояния radio-кнопок по группам
    const radioGroups = {};

    // Флаг для проверки, должны ли мы разблокировать следующий input
    let unlockNext = true;

    // Флаг для проверки заполненности всех input элементов
    let allFilled = true;

    // Начинаем с блокировки всех элементов
    inputs.forEach(input => input.disabled = true);

    // Функция для разблокировки следующего инпута
    const unlockNextInput = (currentInputOrder) => {
        const nextInputOrder = currentInputOrder + 1;
        const nextInput = inputs.find(input => input.getAttribute('data-input-order') == nextInputOrder);
        if (nextInput) {
            nextInput.disabled = false;
        }
    };

    // Идем по всем input элементам
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];

        if (input.type === 'radio') {
            const groupName = input.name;

            // Если группа еще не создана, создаем её
            if (!radioGroups[groupName]) {
                radioGroups[groupName] = {
                    inputs: [],
                    anyChecked: false,
                    inputOrder: input.getAttribute('data-input-order') // сохраняем data-input-order группы
                };
            }

            // Добавляем радио-кнопку в группу
            radioGroups[groupName].inputs.push(input);

            // Проверяем, выбрана ли хоть одна радио-кнопка в этой группе
            if (input.checked) {
                radioGroups[groupName].anyChecked = true;
            }

            // Проверяем предыдущий input element, если data-input-order не равен 0
            const previousInputOrder = parseInt(input.getAttribute('data-input-order'), 10);
            if (previousInputOrder > 0) {
                const previousInput = inputs.find(input => input.getAttribute('data-input-order') == previousInputOrder - 1);
                if (previousInput && previousInput.value) {
                    // Если предыдущий input заполнен, разблокируем радио-кнопки в группе
                    radioGroups[groupName].inputs.forEach(radioInput => radioInput.disabled = false);
                } else {
                    // Если предыдущий input не заполнен, блокируем радио-кнопки в группе и снимаем выбор
                    radioGroups[groupName].inputs.forEach(radioInput => {
                        radioInput.disabled = true;
                        radioInput.checked = false;
                    });
                    radioGroups[groupName].anyChecked = false;
                }
            }

            // Добавляем обработчик событий для разблокировки следующего input при выборе радио-кнопки
            input.addEventListener('change', (event) => {
                if (event.target.checked) {
                    unlockNextInput(parseInt(event.target.getAttribute('data-input-order'), 10));
                }
            });

        } else {
            if (input.value) {
                // Если input уже заполнен, оставляем его разблокированным
                input.disabled = false;
            } else if (unlockNext) {
                // Если мы должны разблокировать следующий input и он не заполнен
                input.disabled = false;
                unlockNext = false;
                allFilled = false; // Устанавливаем флаг, что не все input элементы заполнены
            } else {
                // Если мы не должны разблокировать следующий input
                input.disabled = true;
                allFilled = false; // Устанавливаем флаг, что не все input элементы заполнены
            }
        }

        // Если текущий input заполнен и это не последний элемент,
        // то разблокируем радио-кнопки с соответствующим порядком
        if (!input.disabled && unlockNext && i + 1 < inputs.length) {
            const nextInputOrder = inputs[i + 1].getAttribute('data-input-order');

            // Разблокируем радио-группы с этим порядком
            for (let groupName in radioGroups) {
                const group = radioGroups[groupName];
                if (group.inputOrder === nextInputOrder) {
                    group.inputs.forEach(radioInput => radioInput.disabled = false);
                    if (!group.anyChecked) {
                        unlockNext = false;
                        allFilled = false; // Устанавливаем флаг, что не все input элементы заполнены
                    }
                }
            }

            // Разблокируем следующий input если он не радиокнопка
            if (i + 1 < inputs.length && inputs[i + 1].type !== 'radio') {
                inputs[i + 1].disabled = false;
            }
        }
    }

    // Проходим по всем радио-группам и обрабатываем логику разблокировки
    for (let groupName in radioGroups) {
        const group = radioGroups[groupName];

        if (!group.anyChecked && unlockNext) {
            // Если ни одна радио-кнопка в группе не выбрана, оставляем их все разблокированными
            group.inputs.forEach(input => input.disabled = false);
        } else if (group.anyChecked) {
            // Если хоть одна радио-кнопка в группе выбрана, оставляем их разблокированными
            group.inputs.forEach(input => input.disabled = false);
        }
    }

    // Находим кнопку с классом greenButton
    const greenButton = element.querySelector('.greenButton');

    if (greenButton) {
        // Если все input элементы заполнены, активируем кнопку, иначе блокируем
        greenButton.disabled = !allFilled;
    }

    // Убедимся, что все элементы с data-canBeNull не заблокированы
    const nullableInputs = element.querySelectorAll('input[data-canBeNull]');
    nullableInputs.forEach(input => input.disabled = false);
}

/////////////////////// DATASOURCE(NEW)

function DataSourceClick(input, mainModal) {
    const sourceTableName = input.getAttribute('data-expanded-source') || '';
    const joinTableName = input.getAttribute('data-jointablename') || '';
    const joinColumnName = input.getAttribute('data-joincolumnname') || '';

    let joinTableValue = null;

    if (joinColumnName) {
        const inputs = mainModal.querySelectorAll('input');
        inputs.forEach(modalInput => {
            if (modalInput.getAttribute('name') === joinColumnName) {
                joinTableValue = modalInput.getAttribute('data-value');
            }
        });
    }

    let url = '/getAllRecordsJoin';
    let body = JSON.stringify({
        tableName: sourceTableName,
        joinTableName: joinTableName,
        joinTableValue: joinTableValue || '',
        joinColumnName: joinColumnName
    });

    if (!joinTableName || !joinTableValue || !joinColumnName) {
        url = `/getAllRecords/${sourceTableName}`;
        body = null;
    }

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: body
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.error);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.length === 0) {
            alert('Не найденно записей');
        } else {
            ModalCreateDataSource(data, input, mainModal);
        }
    })
    .catch(error => {
        alert(error.message);
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function ModalCreateDataSource(data, input, mainModal) {
    // Получаем и разбираем атрибут data-expanded-columns
    const expandedColumns = input.getAttribute('data-expanded-columns').split(',').map(item => item.trim());

    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.id = 'modalDataSource';
    modal.setAttribute('class', 'modal');
    document.body.appendChild(modal);

    // Создаем оверлей
    const overlay = document.createElement('div');
    overlay.setAttribute('class', 'overlay');
    modal.appendChild(overlay);

    // Создаем таблицу и присваиваем ей класс 'table'
    const table = document.createElement('table');
    table.setAttribute('class', 'table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    table.appendChild(thead);
    table.appendChild(tbody);
    modal.appendChild(table);

    // Создаем хедеры таблицы
    const headerRow = document.createElement('tr');
    expandedColumns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column;
        th.setAttribute('name', column);
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Приводим строки data к JSON объектам и заполняем таблицу
    data.forEach(rowData => {
        const row = document.createElement('tr');
        const jsonData = JSON.parse(rowData);

        expandedColumns.forEach(column => {
            const td = document.createElement('td');
            td.textContent = jsonData[column] || '';
            row.appendChild(td);
        });

        // Добавляем обработчик клика для каждой строки
        row.addEventListener('click', function() {
            ModalDataSourceRowClick(input, row, table, modal, mainModal);
        });

        tbody.appendChild(row);
    });

    // Создаем контейнер для кнопок
    const buttonsContainer = document.createElement('div');
    buttonsContainer.setAttribute('class', 'container_buttons');

    // Создаем кнопку закрыть
    const closeButton = document.createElement('button');
    closeButton.setAttribute('class', 'redButton');
    closeButton.textContent = 'Закрыть';
    closeButton.addEventListener('click', function() {
        document.body.removeChild(modal);
    });

    buttonsContainer.appendChild(closeButton);

    // Добавляем контейнер с кнопками в модальное окно
    modal.appendChild(buttonsContainer);

}

function ModalDataSourceRowClick(input, row, table, modal, mainModal) {
    // Получаем значение атрибута name у input
    const inputName = input.getAttribute('name');

    // Ищем индекс столбца с таким хедером, у которого name такой же
    let columnIndex = -1;
    const headers = table.querySelectorAll('th');
    headers.forEach((header, index) => {
        if (header.getAttribute('name') === inputName) {
            columnIndex = index;
        }
    });

    if (columnIndex === -1) {
        console.error('Column with the specified name not found');
        return;
    }

    // Получаем значение textContent из ячейки строки row в найденном столбце
    const cellValue = row.cells[columnIndex].textContent;

    // Записываем значение в атрибут data-value у input
    input.setAttribute('data-value', cellValue);

    // Получаем атрибут data-expanded-columns у input
    const expandedColumns = input.getAttribute('data-expanded-columns').split(', ');

    // Получаем атрибут data-expanded-prefix у input
    const expandedPrefix = input.getAttribute('data-expanded-prefix');

    // Собираем данные для передачи в функцию FormatDataWithPrefix
    const data = expandedColumns.map(columnName => {
        let colIndex = -1;
        headers.forEach((header, index) => {
            if (header.textContent.trim() === columnName) {
                colIndex = index;
            }
        });

        if (colIndex === -1) {
            console.error(`Column with name ${columnName} not found`);
            return '';
        }

        return row.cells[colIndex].textContent;
    });

    // Вызываем функцию FormatDataWithPrefix и записываем результат в input
    const formattedData = FormatDataWithPrefix(data, expandedPrefix);
    input.value = formattedData;

    CloseModal(modal);

    BlockElementInput(mainModal);
}

/////////////////////// УДАЛЕНИЕ/ИЗМЕНЕНИЕ/СОЗДАНИЕ

function CreateRowModal(table) {
  // Получаем значение pageName из элемента с id "pageName"
  const pageNameElement = document.getElementById('pageName');
  let pageName = 'Неизвестная страница';

  if (pageNameElement) {
    pageName = pageNameElement.textContent.trim();

    // Проверка: Если pageNameElement скрыт (`hidden`) и его текст содержит "Учетной Единицы"
    if (pageNameElement.hidden && pageName.includes("Учетной Единицы")) {

      // Retrieve UEMenuNumberValue and check it's not empty
      const UEMenuNumberValue = document.getElementById('UEMenu_number').textContent;
      if (UEMenuNumberValue === "") {
          alert("Сначла выбирите накладную");
          return; // Stop execution if UEMenuNumberValue is empty
      }

      // Создаем окно
      const modal = document.createElement('div');
      modal.id = 'modalCreateRow';
      modal.setAttribute('class', 'modal');
      document.body.appendChild(modal);

      // Создаем оверлей
      CreateOverlay(modal);

      // Создаем заголовок
      const h1 = document.createElement('h1');
      h1.textContent = 'Создание ' + pageName;
      modal.appendChild(h1);

      // Получаем заголовки таблицы
      const headers = table.querySelectorAll('thead th');

      // Проходим по каждому заголовку и создаем соответствующие элементы
      headers.forEach(header => {
        // Проверяем наличие атрибута data-autoIncrement
        const autoIncrement = header.getAttribute('data-autoIncrement');
        if (autoIncrement) {
          return; // Пропускаем этот заголовок, если есть атрибут data-autoIncrement
        }

        const label = document.createElement('label');
        label.textContent = header.textContent + ': ';

        const input = document.createElement('input');
        input.type = 'text';
        input.id = header.getAttribute('name');
        input.setAttribute('name', header.getAttribute('name'));

        const expandedOrder = header.getAttribute('data-input-order');
        input.setAttribute('data-input-order', expandedOrder);

        // Проверяем и присваиваем дополнительные атрибуты
        const expandedSource = header.getAttribute('data-expanded-source');
        if (expandedSource) {
          input.setAttribute('data-expanded-source', expandedSource);

          const expandedColumns = header.getAttribute('data-expanded-columns');
          input.setAttribute('data-expanded-columns', expandedColumns);

          const expandedPrefix = header.getAttribute('data-expanded-prefix');
          input.setAttribute('data-expanded-prefix', expandedPrefix);

          // Настройки для дополнительных атрибутов
          input.classList.add('additionalInput');
          input.readOnly = true;
          input.setAttribute('autocomplete', 'off');

          // Добавляем обработчик клика
          input.addEventListener('click', function () {
            DataSourceClick(input, modal);
          });
        } else {
          // Добавляем обработчик onChange если нет дополнительных атрибутов
          input.addEventListener('change', function() {
            BlockElementInput(modal);
          });
        }

        const joinTableName = header.getAttribute('data-joinTableName');
        if (joinTableName) {
          input.setAttribute('data-joinTableName', joinTableName);

          const joinColumnName = header.getAttribute('data-joinColumnName');
          input.setAttribute('data-joinColumnName', joinColumnName);
        }

        // Проверяем наличие атрибута data-variates и создаем радио-кнопки
        const variates = header.getAttribute('data-variates');
        if (variates) {
          CreateRadioButtonsContainer(header, modal, expandedOrder);
          return; // Пропускаем создание обычного input, так как создаем радио-кнопки
        }

        // Создаем контейнер для label и input
        const inputContainer = document.createElement('div');
        inputContainer.classList.add('inputContainer');
        inputContainer.appendChild(label);

        // Проверяем наличие атрибута data-canBeNull и вызываем AddClearButton
        const canBeNull = header.getAttribute('data-canBeNull');
        if (canBeNull) {
          AddClearButton(modal, inputContainer, input); // Передаем inputContainer и input
        } else {
          inputContainer.appendChild(input);
        }

        // Добавляем inputContainer в модальное окно
        modal.appendChild(inputContainer);
      });

      // Создаем контейнер для кнопок
      const buttonsContainer = document.createElement('div');
      buttonsContainer.setAttribute('class', 'container_buttons');

      // Создаем кнопку ОК
      const okButton = document.createElement('button');
      okButton.textContent = 'Создать';
      okButton.className = 'greenButton';
      // Изменение обработчика события для кнопки "Создать"
      okButton.addEventListener('click', function () {
        SubmitUEClick(modal); // Call SubmitUEClick instead of CreateRowModalSubmit
      });

      // Создаем кнопку закрыть
      const closeButton = document.createElement('button');
      closeButton.setAttribute('class', 'redButton');
      closeButton.textContent = 'Закрыть';
      closeButton.addEventListener('click', function () {
        CloseModal(modal);
      });

      buttonsContainer.appendChild(okButton);
      buttonsContainer.appendChild(closeButton);

      // Добавляем контейнер с кнопками в модальное окно
      modal.appendChild(buttonsContainer);

      BlockElementInput(modal);
    } else {
      // Создаем окно
      const modal = document.createElement('div');
      modal.id = 'modalCreateRow';
      modal.setAttribute('class', 'modal');
      document.body.appendChild(modal);

      // Создаем оверлей
      CreateOverlay(modal);

      // Создаем заголовок
      const h1 = document.createElement('h1');
      h1.textContent = 'Создание ' + pageName;
      modal.appendChild(h1);

      // Получаем заголовки таблицы
      const headers = table.querySelectorAll('thead th');

      // Проходим по каждому заголовку и создаем соответствующие элементы
      headers.forEach(header => {
        // Проверяем наличие атрибута data-autoIncrement
        const autoIncrement = header.getAttribute('data-autoIncrement');
        if (autoIncrement) {
          return; // Пропускаем этот заголовок, если есть атрибут data-autoIncrement
        }

        const label = document.createElement('label');
        label.textContent = header.textContent + ': ';

        const input = document.createElement('input');
        input.type = 'text';
        input.id = header.getAttribute('name');
        input.setAttribute('name', header.getAttribute('name'));

        const expandedOrder = header.getAttribute('data-input-order');
        input.setAttribute('data-input-order', expandedOrder);

        // Проверяем и присваиваем дополнительные атрибуты
        const expandedSource = header.getAttribute('data-expanded-source');
        if (expandedSource) {
          input.setAttribute('data-expanded-source', expandedSource);

          const expandedColumns = header.getAttribute('data-expanded-columns');
          input.setAttribute('data-expanded-columns', expandedColumns);

          const expandedPrefix = header.getAttribute('data-expanded-prefix');
          input.setAttribute('data-expanded-prefix', expandedPrefix);

          // Настройки для дополнительных атрибутов
          input.classList.add('additionalInput');
          input.readOnly = true;
          input.setAttribute('autocomplete', 'off');

          // Добавляем обработчик клика
          input.addEventListener('click', function () {
            DataSourceClick(input, modal);
          });
        } else {
          // Добавляем обработчик onChange если нет дополнительных атрибутов
          input.addEventListener('change', function() {
            BlockElementInput(modal);
          });
        }

        const joinTableName = header.getAttribute('data-joinTableName');
        if (joinTableName) {
          input.setAttribute('data-joinTableName', joinTableName);

          const joinColumnName = header.getAttribute('data-joinColumnName');
          input.setAttribute('data-joinColumnName', joinColumnName);
        }

        // Проверяем наличие атрибута data-variates и создаем радио-кнопки
        const variates = header.getAttribute('data-variates');
        if (variates) {
          CreateRadioButtonsContainer(header, modal, expandedOrder);
          return; // Пропускаем создание обычного input, так как создаем радио-кнопки
        }

        // Создаем контейнер для label и input
        const inputContainer = document.createElement('div');
        inputContainer.classList.add('inputContainer');
        inputContainer.appendChild(label);

        // Проверяем наличие атрибута data-canBeNull и вызываем AddClearButton
        const canBeNull = header.getAttribute('data-canBeNull');
        if (canBeNull) {
          AddClearButton(modal, inputContainer, input); // Передаем inputContainer и input
        } else {
          inputContainer.appendChild(input);
        }

        // Добавляем inputContainer в модальное окно
        modal.appendChild(inputContainer);
      });

      // Создаем контейнер для кнопок
      const buttonsContainer = document.createElement('div');
      buttonsContainer.setAttribute('class', 'container_buttons');

      // Создаем кнопку ОК
      const okButton = document.createElement('button');
      okButton.textContent = 'Создать';
      okButton.className = 'greenButton';
      okButton.addEventListener('click', function () {
        CreateRowModalSubmit(modal, table);
      });

      // Создаем кнопку закрыть
      const closeButton = document.createElement('button');
      closeButton.setAttribute('class', 'redButton');
      closeButton.textContent = 'Закрыть';
      closeButton.addEventListener('click', function () {
        CloseModal(modal);
      });

      buttonsContainer.appendChild(okButton);
      buttonsContainer.appendChild(closeButton);

      // Добавляем контейнер с кнопками в модальное окно
      modal.appendChild(buttonsContainer);

      BlockElementInput(modal);
    }
  } else {
    // Создаем окно
    const modal = document.createElement('div');
    modal.id = 'modalCreateRow';
    modal.setAttribute('class', 'modal');
    document.body.appendChild(modal);

    // Создаем оверлей
    CreateOverlay(modal);

    // Создаем заголовок
    const h1 = document.createElement('h1');
    h1.textContent = 'Создание ' + pageName;
    modal.appendChild(h1);

    // Получаем заголовки таблицы
    const headers = table.querySelectorAll('thead th');

    // Проходим по каждому заголовку и создаем соответствующие элементы
    headers.forEach(header => {
      // Проверяем наличие атрибута data-autoIncrement
      const autoIncrement = header.getAttribute('data-autoIncrement');
      if (autoIncrement) {
        return; // Пропускаем этот заголовок, если есть атрибут data-autoIncrement
      }

      const label = document.createElement('label');
      label.textContent = header.textContent + ': ';

      const input = document.createElement('input');
      input.type = 'text';
      input.id = header.getAttribute('name');
      input.setAttribute('name', header.getAttribute('name'));

      const expandedOrder = header.getAttribute('data-input-order');
      input.setAttribute('data-input-order', expandedOrder);

      // Проверяем и присваиваем дополнительные атрибуты
      const expandedSource = header.getAttribute('data-expanded-source');
      if (expandedSource) {
        input.setAttribute('data-expanded-source', expandedSource);

        const expandedColumns = header.getAttribute('data-expanded-columns');
        input.setAttribute('data-expanded-columns', expandedColumns);

        const expandedPrefix = header.getAttribute('data-expanded-prefix');
        input.setAttribute('data-expanded-prefix', expandedPrefix);

        // Настройки для дополнительных атрибутов
        input.classList.add('additionalInput');
        input.readOnly = true;
        input.setAttribute('autocomplete', 'off');

        // Добавляем обработчик клика
        input.addEventListener('click', function () {
          DataSourceClick(input, modal);
        });
      } else {
        // Добавляем обработчик onChange если нет дополнительных атрибутов
        input.addEventListener('change', function() {
          BlockElementInput(modal);
        });
      }

      const joinTableName = header.getAttribute('data-joinTableName');
      if (joinTableName) {
        input.setAttribute('data-joinTableName', joinTableName);

        const joinColumnName = header.getAttribute('data-joinColumnName');
        input.setAttribute('data-joinColumnName', joinColumnName);
      }

      // Проверяем наличие атрибута data-variates и создаем радио-кнопки
      const variates = header.getAttribute('data-variates');
      if (variates) {
        CreateRadioButtonsContainer(header, modal, expandedOrder);
        return; // Пропускаем создание обычного input, так как создаем радио-кнопки
      }

      // Создаем контейнер для label и input
      const inputContainer = document.createElement('div');
      inputContainer.classList.add('inputContainer');
      inputContainer.appendChild(label);

      // Проверяем наличие атрибута data-canBeNull и вызываем AddClearButton
      const canBeNull = header.getAttribute('data-canBeNull');
      if (canBeNull) {
        AddClearButton(modal, inputContainer, input); // Передаем inputContainer и input
      } else {
        inputContainer.appendChild(input);
      }

      // Добавляем inputContainer в модальное окно
      modal.appendChild(inputContainer);
    });

    // Создаем контейнер для кнопок
    const buttonsContainer = document.createElement('div');
    buttonsContainer.setAttribute('class', 'container_buttons');

    // Создаем кнопку ОК
    const okButton = document.createElement('button');
    okButton.textContent = 'Создать';
    okButton.className = 'greenButton';
    okButton.addEventListener('click', function () {
      CreateRowModalSubmit(modal, table);
    });

    // Создаем кнопку закрыть
    const closeButton = document.createElement('button');
    closeButton.setAttribute('class', 'redButton');
    closeButton.textContent = 'Закрыть';
    closeButton.addEventListener('click', function () {
      CloseModal(modal);
    });

    buttonsContainer.appendChild(okButton);
    buttonsContainer.appendChild(closeButton);

    // Добавляем контейнер с кнопками в модальное окно
    modal.appendChild(buttonsContainer);

    BlockElementInput(modal);
  }
}

function CreateRadioButtonsContainer(field, modal, inputOrder) {
    const container = document.createElement('div');
    container.setAttribute('class', 'radioButtonsContainer');

    // Создаем заголовок для группы радио-кнопок
    const label = document.createElement('label');
    label.textContent = field.textContent + ': ';
    container.appendChild(label);

    // Получаем массивы значений из атрибутов data-variates и data-values
    const variates = JSON.parse(field.getAttribute('data-variates'));
    const values = JSON.parse(field.getAttribute('data-values'));

    // Создаем радио-кнопки для каждого значения
    variates.forEach((variate, index) => {
        const radioContainer = document.createElement('div');
        radioContainer.setAttribute('class', 'radioContainer');

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = field.getAttribute('name');
        input.value = values[index]; // Используем значение из data-values
        input.id = field.getAttribute('name') + '_' + variate; // Используем название из data-variates
        input.setAttribute('data-input-order', inputOrder); // Присваиваем data-input-order

        const radioLabel = document.createElement('label');
        radioLabel.textContent = variate; // Используем название из data-variates
        radioLabel.setAttribute('for', input.id);

        radioContainer.appendChild(input);
        radioContainer.appendChild(radioLabel);
        container.appendChild(radioContainer);
    });

    // Добавляем контейнер с радио-кнопками в модальное окно
    modal.appendChild(container);
}

function AddClearButton(modal, inputContainer, input) {
    const clearButton = document.createElement('div');
    clearButton.textContent = '✖';
    clearButton.classList.add('clearButton');
    clearButton.addEventListener('click', function () {
        input.value = '';
        input.readOnly = false; // Временно убрать readOnly для очистки
        input.readOnly = true; // Восстановить readOnly

        // Проверяем наличие атрибута data-value и устанавливаем его в null
        if (input.hasAttribute('data-value')) {
            input.setAttribute('data-value', null);
        }
    });

    // Создадим новый контейнер для input и clearButton
    const wrapper = document.createElement('div');
    wrapper.classList.add('inputWrapper');
    wrapper.appendChild(input);
    wrapper.appendChild(clearButton);

    // Добавляем wrapper в inputContainer
    inputContainer.appendChild(wrapper);
}

function CreateRowModalSubmit(modal, table) {
    const inputs = modal.querySelectorAll('input');
    const dataForServer = {};

    // Считываем значения всех инпутов
    inputs.forEach(input => {
        if (input.type !== 'radio' && !input.disabled) {
            const hiddenValue = input.getAttribute('data-hidden');
            const expandedSource = input.getAttribute('data-expanded-source');
            if (expandedSource !== null) {
                dataForServer[input.id] = input.getAttribute('data-value');
            } else {
                dataForServer[input.id] = hiddenValue !== null ? hiddenValue : input.value;
            }
        } else if (input.type === 'radio' && input.checked) {
            // Добавляем значение выбранной радиокнопки в JSON
            dataForServer[input.name] = input.value;
        }
    });

    // Зашифровываем название таблицы из атрибута name
    const tableName = table.getAttribute('name');
    const encodedTableName = encodeURIComponent(tableName);

    // Отправляем fetch запрос
    fetch(`/addData/${encodedTableName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataForServer)
    })
    .then(response => {
        // Проверяем статус ответа
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || 'Network response was not ok');
            });
        }
        return response.json();
    })
    .then(data => {
        alert('Запись успешно создана');
        // Вызов функции для обновления страницы таблицы после успешного запроса
        GetPageFromTable(currentPage);
        CloseModal(modal);
    })
    .catch(error => {
        alert(error.message);
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function EditRowModal(table) {
    // Находим строку с классом 'selected'
    const selectedRow = table.querySelector('tr.selected');
    if (!selectedRow) {
        alert('Выберите строку для редактирования.');
        return;
    }

    // Получаем значение pageName из элемента с id "pageName"
    const pageNameElement = document.getElementById('pageName');
    const pageName = pageNameElement ? pageNameElement.textContent.trim() : 'Неизвестная страница';

    // Создаем окно
    const modal = document.createElement('div');
    modal.id = 'modalEditRow';
    modal.setAttribute('class', 'modal');
    document.body.appendChild(modal);

    // Создаем оверлей
    CreateOverlay(modal);

    // Создаем заголовок
    const h1 = document.createElement('h1');
    h1.textContent = 'Редактирование ' + pageName;
    modal.appendChild(h1);

    // Получаем заголовки таблицы
    const headers = table.querySelectorAll('thead th');
    const cells = selectedRow.querySelectorAll('td');

    // Проходим по каждому заголовку и создаем соответствующие элементы
    headers.forEach((header, index) => {
        const label = document.createElement('label');
        label.textContent = header.textContent + ': ';

        // Проверяем наличие атрибута data-variates и создаем радио-кнопки
        const variates = header.getAttribute('data-variates');
        if (variates) {
            const expandedOrder = header.getAttribute('data-input-order');
            CreateRadioButtonsContainer(header, modal, expandedOrder, cells[index].textContent.trim());
            return; // Пропускаем создание обычного input, так как создаем радио-кнопки
        }

        const input = document.createElement('input');
        input.type = 'text';
        input.id = header.getAttribute('name');
        input.setAttribute('name', header.getAttribute('name'));
        input.value = cells[index] ? cells[index].textContent.trim() : '';

        // Проверяем, можно ли редактировать это поле
        const isEditable = header.getAttribute('data-editable');
        if (isEditable === 'false') {
            input.disabled = true;
        }

        // Проверяем и присваиваем дополнительные атрибуты
        const expandedSource = header.getAttribute('data-expanded-source');
        if (expandedSource) {
            input.setAttribute('data-expanded-source', expandedSource);

            // Добавляем остальные атрибуты
            const dataValue = cells[index].getAttribute('data-value');
            input.setAttribute('data-value', dataValue);

            const expandedColumns = header.getAttribute('data-expanded-columns');
            input.setAttribute('data-expanded-columns', expandedColumns);

            const expandedPrefix = header.getAttribute('data-expanded-prefix');
            input.setAttribute('data-expanded-prefix', expandedPrefix);

            const expandedOrder = header.getAttribute('data-input-order');
            input.setAttribute('data-input-order', expandedOrder);

            // Настройки для дополнительных атрибутов
            input.classList.add('additionalInput');
            input.readOnly = true;
            input.setAttribute('autocomplete', 'off');

            // Добавляем обработчик клика
            input.addEventListener('click', function() {
                DataSourceClick(input, modal);
            });
        }

        // Создаем контейнер для label и input
        const inputContainer = document.createElement('div');
        inputContainer.classList.add('inputContainer');
        inputContainer.appendChild(label);

        // Проверяем наличие атрибута data-canBeNull и вызываем AddClearButton
        const canBeNull = header.getAttribute('data-canBeNull');
        if (canBeNull) {
            AddClearButton(modal, inputContainer, input); // Передаем inputContainer и input
        } else {
            inputContainer.appendChild(input);
        }

        // Добавляем inputContainer в модальное окно
        modal.appendChild(inputContainer);
    });

    // Создаем контейнер для кнопок
    const buttonsContainer = document.createElement('div');
    buttonsContainer.setAttribute('class', 'container_buttons');

    // Создаем кнопку ОК
    const okButton = document.createElement('button');
    okButton.textContent = 'Сохранить';
    okButton.className = 'greenButton';
    okButton.addEventListener('click', function() {
        EditRowModalSubmit(modal, table);
    });

    // Создаем кнопку закрыть
    const closeButton = document.createElement('button');
    closeButton.setAttribute('class', 'redButton');
    closeButton.textContent = 'Закрыть';
    closeButton.addEventListener('click', function() {
        CloseModal(modal);
    });

    buttonsContainer.appendChild(closeButton);
    buttonsContainer.appendChild(okButton);

    // Добавляем контейнер с кнопками в модальное окно
    modal.appendChild(buttonsContainer);
}

function EditRowModalSubmit(modal, table) {
    const inputs = modal.querySelectorAll('input');
    const dataForServer = {};

    // Группируем радио кнопки по атрибуту name
    const radioButtons = {};
    inputs.forEach(input => {
        if (input.type === 'radio') {
            // Если еще нет группы для этого name, создаем
            if (!radioButtons[input.name]) {
                radioButtons[input.name] = [];
            }
            radioButtons[input.name].push(input);
        }
    });

    // Обрабатываем радио кнопки
    for (const groupName in radioButtons) {
        const buttons = radioButtons[groupName];
        buttons.forEach(button => {
            if (button.checked) {
                dataForServer[groupName] = button.value;
            }
        });
    }

    // Обрабатываем остальные инпуты
    inputs.forEach(input => {
        // Пропускаем радио кнопки, так как они уже обработаны
        if (input.type !== 'radio') {
            const hiddenValue = input.getAttribute('data-hidden');
            const expandedSource = input.getAttribute('data-expanded-source');
            if (expandedSource !== null) {
                dataForServer[input.id] = input.getAttribute('data-value');
            } else {
                dataForServer[input.id] = hiddenValue !== null ? hiddenValue : input.value;
            }
        }
    });

    // Зашифровываем название таблицы из атрибута name
    const tableName = table.getAttribute('name');
    const encodedTableName = encodeURIComponent(tableName);

    // Отправляем fetch запрос
    fetch(`/editData/${encodedTableName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataForServer)
    })
    .then(response => {
        // Проверяем статус ответа
        if (!response.ok) {
            return response.json().then(errorBody => {
                throw new Error(errorBody.error);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        // Обновляем содержимое выбранной строки
        const selectedRow = table.querySelector('tr.selected');
        UpdateTableRow(selectedRow, dataForServer, table, modal);
        CloseModal(modal);

        // Добавляем оповещение об успешном изменении записи
        alert('Запись успешно изменена!');
    })
    .catch(error => {
        alert(error.message);
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function UpdateTableRow(row, data, table, modal) {
    const cells = row.querySelectorAll('td');
    const headers = table.querySelectorAll('th'); // Get all headers directly from the table

    Object.keys(data).forEach((key) => {
        const inputElement = modal.querySelector(`#${key}`);

        // Find the corresponding header based on the 'name' attribute
        const matchingHeader = Array.from(headers).find(header => {
            return header.getAttribute('name') === key;
        });

        // Find the corresponding cell based on the header index
        const matchingCell = cells[Array.from(headers).indexOf(matchingHeader)];

        if (matchingCell) {
            if (matchingCell.getAttribute('data-expanded-source') !== null) {
                matchingCell.setAttribute('data-value', inputElement ? inputElement.value : data[key]);
                matchingCell.textContent = inputElement ? inputElement.value : '';
            } else {
                matchingCell.textContent = data[key];
            }
        }
    });
}

function DeleteSelectedRow(table) {
    // Находим строку с классом 'selected'
    const selectedRow = table.querySelector('tr.selected');
    if (!selectedRow) {
        alert('Не выбрана строка для удаления');
        return;
    }

    // Получаем подтверждение от пользователя
    const userConfirmed = confirm('Вы действительно хотите удалить выбранную строку?');
    if (!userConfirmed) {
        return;
    }

   // Получаем заголовки таблицы
    const headers = table.querySelectorAll('thead th');
    const dataForServer = {};

    // Проходим по каждому заголовку и считываем данные из выбранной строки
    headers.forEach((header, index) => {
        const cell = selectedRow.cells[index];
        let cellData = cell.textContent.trim();

        // Проверяем наличие атрибута 'data-value' или 'data-hidden'
        const dataValue = cell.getAttribute('data-value');
        const dataHidden = cell.getAttribute('data-hidden');

        if (dataValue) {
            cellData = dataValue;
        } else if (dataHidden) {
            cellData = dataHidden;
        } else {
            // Проверяем стиль ячейки
            if (cell.style.backgroundColor === 'red') {
                cellData = false;
            } else if (cell.style.backgroundColor === 'green') {
                cellData = true;
            }
        }

        // Используем атрибут name заголовка как ключ для данных
        const key = header.getAttribute('name');
        if (key) {
            dataForServer[key] = cellData;
        }
    });

    // Зашифровываем название таблицы из атрибута name
    const tableName = table.getAttribute('name');
    const encodedTableName = encodeURIComponent(tableName);

    // Отправляем fetch запрос на удаление данных
    fetch(`/deleteData/${encodedTableName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataForServer)
    })
    .then(response => {
        // Проверяем статус ответа
        if (!response.ok) {
            return response.json().then(errorBody => {
                throw new Error(errorBody.error);
            });
        }
        // Удаляем строку из таблицы после успешного запроса
        selectedRow.remove();
        // Вызов функции для обновления страницы таблицы после успешного запроса
        GetPageFromTable(currentPage);
        alert('Запись успешно удалена!');
    })
    .catch(error => {
        alert(error.message);
        console.error('There has been a problem with your fetch operation:', error);
    });
}

/////////////////////// СОЗДАНИЕ НАКЛАДНОЙ

function ModalCreateInvoice() {

    // Создаем окно
    const modal = document.createElement('div');
    modal.id = 'modalInvoice';
    modal.setAttribute('class', 'modal');
    document.body.appendChild(modal);

    // Создаем оверлей
    CreateOverlay(modal);

    // Создаем и добавляем поля ввода для сотрудника
    const employeeInput = document.createElement('input');
    employeeInput.type = 'text';
    employeeInput.id = 'Номер_сотрудника';
    employeeInput.placeholder = 'Подписавший сотрудник';
    employeeInput.setAttribute('name', 'Номер_сотрудника');
    employeeInput.setAttribute('data-source', 'Сотрудник');
    employeeInput.setAttribute('autocomplete', 'off');
    employeeInput.setAttribute('readonly', true);
    employeeInput.setAttribute('data-columns-order', 'Номер_сотрудника, Имя, Фамилия, Отчество');
    employeeInput.setAttribute('data-extended', 'Имя, Фамилия, Отчество');
    employeeInput.onfocus = function() {
        DataSourceRowClick(this);
    };
    modal.appendChild(employeeInput);

    const employeeLabel = document.createElement('label');
    employeeLabel.textContent = 'Подписавший сотрудник: ';
    modal.insertBefore(employeeLabel, employeeInput);

    // Создаем и добавляем поля ввода для даты
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.id = 'Дата_подписания';
    dateInput.placeholder = 'Дата создания накладной';
    modal.appendChild(dateInput);

    const dateLabel = document.createElement('label');
    dateLabel.textContent = 'Дата создания накладной: ';
    modal.insertBefore(dateLabel, dateInput);

    // Создаем и добавляем select поле и его label
    const actSelectLabel = document.createElement('label');
    actSelectLabel.textContent = 'Укажите тип накладной: ';
    modal.appendChild(actSelectLabel);

    const actSelect = document.createElement('select');
    actSelect.id = 'actType';
    const actTypes = ['Акт поступления', 'Акт перемещения', 'Акт отправки'];
    actTypes.forEach((type, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = type;
        actSelect.appendChild(option);
    });
    modal.appendChild(actSelect);

    // Создаем контейнер для кнопок
    const buttonsContainer = document.createElement('div');
    buttonsContainer.setAttribute('class', 'container_buttons');

    // Создаем кнопку закрыть
    var closeButton = document.createElement('button');
    closeButton.setAttribute('class', 'redButton');
    closeButton.textContent = 'Закрыть';
    closeButton.addEventListener('click', function() {
        CloseModal(modal);
    });

    // Создаем кнопку отправки
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Отправить';
    submitButton.className = 'greenButton';
    submitButton.disabled = true;
    submitButton.addEventListener('click', function() {
        const invoiceType = actSelect.value;
        ModalCreateAct(invoiceType);
    });

    buttonsContainer.appendChild(submitButton);
    buttonsContainer.appendChild(closeButton);

    // Добавляем контейнер с кнопками в модальное окно
    modal.appendChild(buttonsContainer);

    // Обработчики событий для проверки заполнения полей
    dateInput.addEventListener('change', () => CheckInputs(modal));
    employeeInput.addEventListener('change', () => CheckInputs(modal));
}

function CheckInputs(modal) {
    const inputs = modal.querySelectorAll('input');
    const allFilled = Array.from(inputs).every(input => input.value);

    // Находим кнопку "Отправить" по классу
    const submitButton = modal.querySelector('.greenButton');

    // Включаем или отключаем кнопку в зависимости от заполненности полей
    if (allFilled) {
        submitButton.disabled = false;
    } else {
        submitButton.disabled = true;
    }
}

function ModalCreateAct(invoiceType) {

  // Создаем окно
  const modal = document.createElement('div');
  let representativeInput = '';
  let authorizingEmployeeInput = '';
  let receivingEmployeeInput = '';
  modal.className = 'modal';
  modal.id = 'modalAct';

  // Заголовок модального окна
  let titleText = '';
  switch (invoiceType) {
    case "1":
      titleText = 'Акт поступления';
      modal.name = 'Акт_поступления';
      break;
    case "2":
      titleText = 'Акт перемещения';
      modal.name= 'Акт_перемещения';
      break;
    case "3":
      titleText = 'Акт отправки';
      modal.name = 'Акт_отправки';
      break;
    default:
      titleText = 'Неизвестный тип акта';
  }

  const title = document.createElement('h2');
  title.textContent = titleText;
  modal.appendChild(title);

  // Поля в зависимости от типа акта
  if (invoiceType === "1" || invoiceType === "3") {
    const representativeLabel = document.createElement('label');
    representativeLabel.textContent = 'Представитель:';
    representativeLabel.setAttribute('for', 'Номер_представителя');

    representativeInput = document.createElement('input');
    representativeInput.type = 'text';
    representativeInput.id = 'Номер_представителя';
    representativeInput.setAttribute('name', 'Номер_представителя');
    representativeInput.setAttribute('data-source', 'Представитель');
    representativeInput.setAttribute('autocomplete', 'off');
    representativeInput.setAttribute('data-extended', 'Имя, Фамилия, Отчество');


    representativeInput.setAttribute('data-columns-order', 'Номер_представителя, Имя, Фамилия, Отчество');
    representativeInput.onfocus = function() {
        DataSourceRowClick(this);
    };

    modal.appendChild(representativeLabel);
    modal.appendChild(representativeInput);

  } else if (invoiceType === "2") {
    const authorizingEmployeeLabel = document.createElement('label');
    authorizingEmployeeLabel.textContent = 'Санкционирующий сотрудник:';
    authorizingEmployeeLabel.setAttribute('for', 'Санкционирующий');

    authorizingEmployeeInput = document.createElement('input');
    authorizingEmployeeInput.type = 'text';
    authorizingEmployeeInput.id = 'Санкционирующий';
    authorizingEmployeeInput.setAttribute('name', 'Номер_сотрудника');
    authorizingEmployeeInput.setAttribute('data-source', 'Сотрудник');
    authorizingEmployeeInput.setAttribute('autocomplete', 'off');
    authorizingEmployeeInput.setAttribute('data-columns-order', 'Номер_сотрудника, Имя, Фамилия, Отчество');
    authorizingEmployeeInput.setAttribute('data-extended', 'Имя, Фамилия, Отчество');

    authorizingEmployeeInput.onfocus = function() {
        DataSourceRowClick(this);
    };

    const receivingEmployeeLabel = document.createElement('label');
    receivingEmployeeLabel.textContent = 'Принимающий сотрудник:';
    receivingEmployeeLabel.setAttribute('for', 'Завершающий');

    receivingEmployeeInput = document.createElement('input');
    receivingEmployeeInput.type = 'text';
    receivingEmployeeInput.id = 'Завершающий';
    receivingEmployeeInput.setAttribute('name', 'Номер_сотрудника');
    receivingEmployeeInput.setAttribute('data-source', 'Сотрудник');
    receivingEmployeeInput.setAttribute('autocomplete', 'off');
    receivingEmployeeInput.setAttribute('data-columns-order', 'Номер_сотрудника, Имя, Фамилия, Отчество');
    receivingEmployeeInput.setAttribute('data-extended', 'Имя, Фамилия, Отчество');
    receivingEmployeeInput.onfocus = function() {
        DataSourceRowClick(this);
    };

    modal.appendChild(authorizingEmployeeLabel);
    modal.appendChild(authorizingEmployeeInput);
    modal.appendChild(receivingEmployeeLabel);
    modal.appendChild(receivingEmployeeInput);
  }

  if (authorizingEmployeeInput) {
    authorizingEmployeeInput.addEventListener('change', () => CheckInputs(modal));
  }
  if (receivingEmployeeInput) {
    receivingEmployeeInput.addEventListener('change', () => CheckInputs(modal));
  }
  if (representativeInput) {
    representativeInput.addEventListener('change', () => CheckInputs(modal));
  }

  // Контейнер для кнопок
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'container_buttons';

  // Кнопка "Отправить"
  const sendButton = document.createElement('button');
  sendButton.textContent = 'Отправить';
  sendButton.className = 'greenButton';
  sendButton.disabled = true;
  sendButton.addEventListener('click', () => {
    SubmitInvoiceData(modal);

  });

  // Создаем кнопку закрыть
  var closeButton = document.createElement('button');
  closeButton.setAttribute('class', 'redButton');
  closeButton.textContent = 'Закрыть';
  closeButton.addEventListener('click', function() {
      CloseModal(modal);
  });

  modal.appendChild(buttonsContainer);
  buttonsContainer.appendChild(sendButton);
  buttonsContainer.appendChild(closeButton);
  document.body.appendChild(modal);
  CreateOverlay(modal);
}

function SubmitInvoiceData(modal) {
    const invoiceDateValue = document.getElementById('Дата_подписания').value;
    const invoiceEmployeeNumberElement = document.getElementById('Номер_сотрудника');
    const invoiceEmployeeNumberValue = invoiceEmployeeNumberElement.getAttribute('data-hidden') || invoiceEmployeeNumberElement.value;

    const authorityCheckData = {
        employeeId: invoiceEmployeeNumberValue,
        authorityName: 'Может_подписать_накладную'
    };

    // Предварительный fetch запрос для проверки полномочий
    return fetch('/checkPowers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(authorityCheckData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || 'Network response was not ok');
            });
        }
        // Если ответ успешен, переход к следующему Promise
        return;
    })
    .then(() => {
        const dataForInvoice = {
            "Дата_подписания": invoiceDateValue,
            "Номер_сотрудника": invoiceEmployeeNumberValue
        };

        const encodedInvoiceWord = encodeURIComponent('Накладная');

        // Отправляем fetch запрос для накладной
        return fetch(`/addData/${encodedInvoiceWord}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataForInvoice)
        });
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || 'Network response was not ok');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Invoice Data Success:', data);
        const invoiceNumber = data["Номер_накладной"];

        return SubmitModalData(modal, invoiceNumber);
    })
    .catch(error => {
        alert(error.message);
    });
}

function SubmitModalData(modal, invoiceNumber) {
    const actTypeElement = document.getElementById('actType');
    const actTypeValue = actTypeElement.value;

    if (actTypeValue === '1') {
        const inputs = modal.querySelectorAll('input');
        const dataForModal = {};

        inputs.forEach(input => {
            if (input.type !== 'radio' && !input.disabled) {
                const hiddenValue = input.getAttribute('data-hidden');
                dataForModal[input.id] = hiddenValue !== null ? hiddenValue : input.value;
            }
        });

        dataForModal["Номер_накладной"] = invoiceNumber;
        handleModalDataSuccess(dataForModal, modal, invoiceNumber);
        return;
    }

    let authorityName;
    if (actTypeValue === '2') {
        authorityName = 'Может_принять_поступление';
    } else if (actTypeValue === '3') {
        authorityName = 'Может_инициировать_акт_отправки';
    }

    const invoiceEmployeeNumberElement = document.getElementById('Номер_сотрудника');
    const invoiceEmployeeNumberValue = invoiceEmployeeNumberElement.getAttribute('data-hidden') || invoiceEmployeeNumberElement.value;

    const authorityCheckData = {
        employeeId: invoiceEmployeeNumberValue,
        authorityName: authorityName
    };

    // Предварительный fetch запрос для проверки полномочий
    fetch('/checkPowers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(authorityCheckData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || 'Network response was not ok');
            });
        }
        // Если ответ успешен, переход к следующему Promise
        return;
    })
    .then(() => {
        const inputs = modal.querySelectorAll('input');
        const dataForModal = {};

        inputs.forEach(input => {
            if (input.type !== 'radio' && !input.disabled) {
                const hiddenValue = input.getAttribute('data-hidden');
                dataForModal[input.id] = hiddenValue !== null ? hiddenValue : input.value;
            }
        });

        dataForModal["Номер_накладной"] = invoiceNumber;
        const modalId = modal.name;

        // Отправляем fetch запрос для модального окна
        return fetch(`/addData/${modalId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataForModal)
        });
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || 'Network response was not ok');
            });
        }
        return response.json();
    })
    .then(data => handleModalDataSuccess(data, modal, invoiceNumber))
    .catch(error => console.error('Error:', error));
}

function handleModalDataSuccess(data, modal, invoiceNumber) {
    console.log('Modal Data Success:', data);
    GetPageFromTable(currentPage);

    const UEMenu_number = document.getElementById('UEMenu_number');
    UEMenu_number.textContent = invoiceNumber;

    const modalInvoice = document.getElementById('modalInvoice');
    CloseModal(modalInvoice);
    CloseModal(modal);
}

/////////////////////// СОЗДАНИЕ УЕ

function AttachInvoiceRowClick() {
    var tables = document.getElementsByName('Накладная');

    if (tables.length > 0) {
        for (var t = 0; t < tables.length; t++) {
            var rows = tables[t].getElementsByTagName('tr');

            for (var i = 1; i < rows.length; i++) {
                rows[i].onclick = function() {
                    InvoiceRowClick(this);
                };
            }
        }
    } else {
        console.log('Таблицы с name "накладная" не найдены.');
    }
}

function InvoiceRowClick(row) {
  // Находим элемент с id UEMenu_number
  var ueMenuNumber = document.getElementById('UEMenu_number');

  // Проверяем, что строка row и элемент UEMenu_number существуют
  if (!row || !ueMenuNumber) {
    console.error('Не удалось найти элемент row или UEMenu_number');
    return;
  }

  // Извлекаем значение из первой ячейки строки
  var firstCellText = row.cells[0].textContent;

  // Помещаем значение в элемент с id UEMenu_number
  ueMenuNumber.textContent = firstCellText;

  // Находим элемент с id UEMenu_table
  var ueMenuTable = document.getElementById('UEMenu_table');

  // Проверяем, что элемент UEMenu_table существует
  if (!ueMenuTable) {
    console.error('Не удалось найти элемент UEMenu_table');
    return;
  }

  // Получаем атрибут name из UEMenu_table
  var tableName = ueMenuTable.getAttribute('name');

  // Находим элемент select с id itemsPerPage
  var itemsPerPageSelect = document.getElementById('itemsPerPage');

  // Получаем значение выбранного количества строк на странице
  var itemsPerPage = itemsPerPageSelect.value;

  // Формируем JSON объект
  var jsonData = {
    tablename: tableName,
    pagenumber: 1,
    itemsperpage: itemsPerPage
  };

  // Отправляем запрос на сервер
  fetch(`/getPage/${firstCellText}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jsonData)
  })
  .then(response => response.json())
  .then(data => {
    // Извлекаем порядок столбцов из заголовков таблицы
    var headers = ueMenuTable.querySelectorAll('thead th');
    var order = Array.from(headers).map(th => th.getAttribute('name'));

    // Добавляем новые строки в таблицу с помощью функции ParseJsonToTable
    ParseJsonToTable(data, ueMenuTable);
  })
  .catch(error => {
    console.error('Ошибка при получении данных с сервера:', error);
  });
}

function SubmitUEClick(modal) {

    let data = {};

    const inputs = modal.querySelectorAll('input');
    inputs.forEach(input => {
        let inputValue = input.value;
        // Check for 'data-value' attribute
        const dataValue = input.getAttribute('data-value');
        if (dataValue) {
            inputValue = dataValue;
        }

        data[input.id] = inputValue;
    });

    const jsonData = JSON.stringify(data);

    fetch('/addData/Учетная_единица', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: jsonData,
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || 'Network response was not ok');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);

        // Retrieve UEMenuNumberValue and check if it's empty
        const UEMenuNumberValue = document.getElementById('UEMenu_number').textContent;
        if (UEMenuNumberValue === "") {
            throw new Error("The 'UEMenu_number' is empty. Please verify the data.");
        }

        const SerialNumberValue = modal.querySelector('#Серийный_номер').value;

        const newData = {
            Номер_накладной: UEMenuNumberValue,
            Серийный_номер: SerialNumberValue
        };

        const newJsonData = JSON.stringify(newData);

        return fetch('/addData/УЕ_Накладная', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: newJsonData,
        });
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || 'Network response was not ok');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);

        // Close the modal using the CloseModal function
        CloseModal(modal);

        // Find the table row with the matching UEMenuNumberValue
        const table = document.getElementById('mainTable');
        const rows = table.querySelectorAll('tr');
        let targetRow = null;

        rows.forEach(row => {
            const firstCell = row.cells[0];
            if (firstCell && firstCell.textContent === UEMenuNumberValue) {
                targetRow = row;
            }
        });

        if (targetRow) {
            InvoiceRowClick(targetRow);
        }
    })
    .catch(error => {
        alert(error.message);
    });
}

/////////////////////// DATA SOURCE

function DataSourceRowClick(element, form) {
    var sourceTableName = element.getAttribute('data-source');
    var joinTableName = element.getAttribute('data-join-source');
    var joinTableColumn = element.getAttribute('data-join-column');
    var joinTableValueId = element.getAttribute('data-join-value');

    var joinTableValue = '';
    if (joinTableValueId) {
        var joinTableValueElement = document.getElementById(joinTableValueId);
        if (joinTableValueElement) {
            joinTableValue = joinTableValueElement.value;
        }
    }

    var url = '/getAllRecords/' + encodeURIComponent(sourceTableName);

    var paramsToJoin = {};
    if (joinTableName && joinTableColumn && joinTableValue) {
        paramsToJoin = {
            joinTable: joinTableName,
            joinColumn: joinTableColumn,
            value: joinTableValue
        };
    }

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(paramsToJoin)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.error);
            });
        }
        return response.json();
    })
    .then(result => {
        CreateModalDataSource(result, element);
    })
    .catch(error => {
        alert(error.message);
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function CreateModalDataSource(data, element) {
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.id = 'modalDataSource';

    // Создаем таблицу
    const table = document.createElement('table');
    table.classList.add('table');

    // Получаем порядок столбцов из data-columns-order у element
    const dataOrder = element.getAttribute('data-columns-order').split(', ');

    // Создаем заголовки таблицы на основе columnsOrder
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    dataOrder.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Создаем тело таблицы
    const tbody = document.createElement('tbody');

    // Добавляем данные в тело таблицы
    AddDataToTable(data, tbody, dataOrder);

    // Добавляем тело таблицы в таблицу
    table.appendChild(tbody);

    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        row.addEventListener('click', function() {
            DataSourceModalRowClick(element, row, modal);
        });
    });

    AddSortingToTableHeaders(table);

    // Добавляем таблицу в модальное окно
    modal.appendChild(table);

    // Создаем кнопку закрыть
    var closeButton = document.createElement('button');
    closeButton.setAttribute('class', 'redButton');
    closeButton.textContent = 'Закрыть';
    closeButton.addEventListener('click', function() {
        CloseModal(modal);
    });

    modal.appendChild(closeButton);

    // Добавляем модальное окно в тело документа
    document.body.appendChild(modal);

    // Вызываем функцию для создания оверлея
    CreateOverlay(modal);
}

function AddDataToTable(data, tbody, dataOrder) {
    // Обрабатываем каждый элемент массива data
    data.forEach(item => {
        // Если элемент является строкой, пытаемся распарсить его как JSON
        if (typeof item === 'string') {
            try {
                item = JSON.parse(item);
            } catch (e) {
                console.error('Item is not valid JSON:', e);
                // Пропускаем текущий элемент, если он не может быть распарсен
                return;
            }
        }

        // Создаем строку таблицы и добавляем в нее данные
        const row = document.createElement('tr');
        dataOrder.forEach(column => {
            const td = document.createElement('td');
            td.textContent = item[column] || '';
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
}

function DataSourceModalRowClick(element, row, modal) {
    // Получаем значение атрибута data-name для input элемента
    var dataName = element.getAttribute('name');

    // Получаем значение атрибута data-extended для input элемента
    var dataExtended = element.getAttribute('data-extended');

    // Находим все заголовки в таблице
    var headers = row.closest('table').querySelectorAll('th');

    // Определяем индекс заголовка, который соответствует dataName
    var columnIndex = Array.from(headers).findIndex(header => header.textContent.trim() === dataName);

    // Проверяем, что индекс найден
    if (columnIndex !== -1) {
        // Находим ячейку в строке по индексу заголовка
        var selectedCell = row.cells[columnIndex];

        // Вставляем текст из ячейки в скрытое поле data-hidden
        element.setAttribute('data-hidden', selectedCell.textContent);
    } else {
        // Если ячейка не найдена, выводим сообщение об ошибке
        console.error('No matching header found for data-name');
        return;
    }

    // Разделяем значение data-extended на отдельные имена заголовков
    var extendedHeaders = dataExtended.split(',').map(header => header.trim());

    var combinedData = extendedHeaders.map(headerName => {
        // Определяем индекс заголовка, который соответствует headerName
        var headerIndex = Array.from(headers).findIndex(header => header.textContent.trim() === headerName);

        // Проверяем, что индекс найден
        if (headerIndex !== -1) {
            // Находим ячейку в строке по индексу заголовка
            var cell = row.cells[headerIndex];
            return cell.textContent;
        } else {
            console.error(`No matching header found for extended data: ${headerName}`);
            return '';
        }
    }).join(' ');

    // Проверяем тип input элемента
    if (element.type === 'number') {
        // Если тип number, пытаемся преобразовать combinedData в число
        const numericValue = parseFloat(combinedData);
        if (!isNaN(numericValue)) {
            element.value = numericValue;
        } else {
            console.error('Combined data is not a valid number:', combinedData);
        }
    } else {
        // Если тип не number, вставляем комбинированные данные как есть
        element.value = combinedData;
    }

    // Ручной вызов события change после программного изменения значения
    const event = new Event('change');
    element.dispatchEvent(event);

    // Вызываем функцию CloseModal с переданным элементом modal
    CloseModal(modal);
}

/////////////////////// СОТРУДНИКИ

function EmployeeRowClick(row) {
  // Находим элемент с id employeeID_display
  var employeeIDDisplay = document.getElementById('UEMenu_number');

  // Проверяем, что строка row и элемент employeeIDDisplay существуют
  if (!row || !employeeIDDisplay) {
    console.error('Не удалось найти элемент row или employeeIDDisplay');
    return;
  }

  // Извлекаем значение из первой ячейки строки
  var firstCellText = row.cells[0].textContent;

  // Помещаем значение в элемент с id employeeIDDisplay
  employeeIDDisplay.textContent = firstCellText;

  // Формируем JSON объект с id сотрудника
  var jsonData = {
    id_employee: firstCellText
  };

  // Отправляем запрос на сервер
  fetch(`/getPowersForEmployee`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jsonData)
  })
  .then(response => response.json())
  .then(data => {
    // Ищем таблицу с id UEMenu_table
    var table = document.getElementById('UEMenu_table');
    if (table) {
      // Добавляем полномочия в таблицу с помощью функции ParseJsonToTable
      ParseJsonToTable(data, table);
    } else {
      console.error('Не удалось найти таблицу с id UEMenu_table');
    }
  })
  .catch(error => {
    console.error('Ошибка при получении полномочий сотрудника:', error);
  });
}