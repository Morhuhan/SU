document.addEventListener('DOMContentLoaded', function() {
    var mainTable = document.getElementById('mainTable');
    GetPageFromTable(1);
    AddSortingToTableHeaders(mainTable);
});

/////////////////////// Утилити

function InputTodayDate(input) {
    // Проверяем, что переданный элемент является элементом ввода и что его тип - date
    if (input && input.tagName === 'INPUT' && input.type === 'date') {
        // Получаем сегодняшнюю дату
        const today = new Date();

        // Форматируем дату в строку YYYY-MM-DD
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');  // Месяца считаются от 0 до 11
        const day = String(today.getDate()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day}`;

        // Устанавливаем сегодняшнюю дату в input
        input.value = formattedDate;
    } else {
        console.error('Передан некорректный элемент ввода или его тип не является date.');
    }
}

function AddCheckboxColumn(table) {
    const thead = table.querySelector('thead tr');
    let checkboxColumnIndex = -1;
    let checkboxColumn = thead.querySelector('th[name="checkBoxColumn"]');

    // Если колонка не существует, создаем новую
    if (!checkboxColumn) {
        checkboxColumn = document.createElement('th');
        checkboxColumn.setAttribute('name', 'checkBoxColumn');
        thead.appendChild(checkboxColumn);
        checkboxColumnIndex = thead.children.length - 1;
    } else {
        checkboxColumnIndex = Array.from(thead.children).indexOf(checkboxColumn);
    }

    // Добавляем или обновляем чекбоксы в каждой строке таблицы
    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        // Удаляем содержимое существующей ячейки чекбокса, если оно есть
        const existingCheckboxCell = row.children[checkboxColumnIndex];
        if (existingCheckboxCell) {
            existingCheckboxCell.remove();
        }

        // Создаем новую ячейку с чекбоксом
        const newTd = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        newTd.appendChild(checkbox);

        // Вставляем новую ячейку на правильное место
        if (checkboxColumnIndex >= row.children.length) {
            row.appendChild(newTd);
        } else {
            row.insertBefore(newTd, row.children[checkboxColumnIndex]);
        }
    });
}

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
    var tableRowsMoving = document.querySelectorAll('#movingTable tr');
    var tableRowsDispatch = document.querySelectorAll('#modalDispatchUE tr');

    tableRows.forEach(function(row) {
        row.classList.remove("selected");
    });

    tableRowsMoving.forEach(function(row) {
        row.classList.remove("selected");
    });

    tableRowsDispatch.forEach(function(row) {
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

    // Создаем и диспатчим событие change
    const changeEvent = new Event('change', {
        bubbles: true,
        cancelable: true,
    });

    input.dispatchEvent(changeEvent);
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
        const receiptTable = document.getElementById('receiptTable');
        SubmitUEClick(modal, receiptTable);
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

/////////////////////// СОЗДАНИЕ УЕ (новое)

// Накладная

async function CheckEmployeePowers(employeeId, authorityName) {
  const authorityCheckData = {
    employeeId,
    authorityName
  };

  try {
    const response = await fetch('/checkPowers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(authorityCheckData)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Network response was not ok');
    }
    return;
  } catch (error) {
    alert(error.message);
    throw error;
  }
}

function ModalCreateInvoice() {
  // Создаем модальное окно
  const modal = document.createElement('div');
  modal.id = 'modalInvoice';
  modal.setAttribute('class', 'modal');
  document.body.appendChild(modal);

  // Создаем оверлей
  CreateOverlay(modal);

  // Создаем заголовок
  const h1 = document.createElement('h1');
  h1.textContent = 'Создание накладной';
  modal.appendChild(h1);

  const employeeInputContainer = document.createElement('div');
  employeeInputContainer.classList.add('inputContainer');
  const employeeLabel = document.createElement('label');
  employeeLabel.textContent = 'Подписавший сотрудник';
  const employeeInput = document.createElement('input');
  employeeInput.type = 'text';
  employeeInput.id = 'invoiceEmployee';
  employeeInput.setAttribute('data-input-order', '1');

  employeeInput.setAttribute('name', 'Номер_сотрудника');
  employeeInput.setAttribute('data-source', 'Сотрудник');
  employeeInput.setAttribute('autocomplete', 'off');
  employeeInput.setAttribute('readonly', true);
  employeeInput.setAttribute('data-columns-order', 'Номер_сотрудника, Имя, Фамилия, Отчество');
  employeeInput.setAttribute('data-extended', 'Имя, Фамилия, Отчество');
  employeeInput.onfocus = function() {
      DataSourceRowClick(this);
  };
  employeeInput.addEventListener('change', function() {
    BlockElementInput(modal);
  });

  employeeInputContainer.appendChild(employeeLabel);
  employeeInputContainer.appendChild(employeeInput);
  modal.appendChild(employeeInputContainer);


  // Создаем инпут для даты подписания
  const dateInputContainer = document.createElement('div');
  dateInputContainer.classList.add('inputContainer');
  const dateLabel = document.createElement('label');
  dateLabel.textContent = 'Дата подписания';
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.id = 'invoiceDate';
  dateInput.setAttribute('name', 'signingDate');
  dateInputContainer.appendChild(dateLabel);
  dateInputContainer.appendChild(dateInput);
  modal.appendChild(dateInputContainer);
  InputTodayDate(dateInput);

  // Создаем селект для типа накладной
  const typeInputContainer = document.createElement('div');
  typeInputContainer.classList.add('inputContainer');
  const typeLabel = document.createElement('label');
  typeLabel.textContent = 'Тип накладной';
  const typeSelect = document.createElement('select');
  typeSelect.id = 'invoiceType';
  typeSelect.setAttribute('name', 'invoiceType');
  const option1 = document.createElement('option');
  option1.value = 'Поступление';
  option1.textContent = 'Поступление';
  const option2 = document.createElement('option');
  option2.value = 'Отправка';
  option2.textContent = 'Отправка';
  const option3 = document.createElement('option');
  option3.value = 'Перемещение';
  option3.textContent = 'Перемещение';
  typeSelect.appendChild(option1);
  typeSelect.appendChild(option3);
  typeSelect.appendChild(option2);
  typeInputContainer.appendChild(typeLabel);
  typeInputContainer.appendChild(typeSelect);
  modal.appendChild(typeInputContainer);

  // Создаем контейнер для кнопок
  const buttonsContainer = document.createElement('div');
  buttonsContainer.setAttribute('class', 'container_buttons');

  // Создаем кнопку "Создать"
  const createButton = document.createElement('button');
  createButton.textContent = 'Продолжить';
  createButton.className = 'greenButton';
  createButton.addEventListener('click', async function () {
      const hiddenValue = employeeInput.getAttribute('data-hidden');
      try {
          await CheckEmployeePowers(hiddenValue, 'Может_подписать_накладную');
          ModalInvoiceSubmitClick(modalInvoice);
      } catch (error) {
          // Обрабатываем ошибку, если CheckEmployeePowers завершилась с ошибкой
          console.error('Ошибка проверки полномочий:', error);
      }
  });

  // Создаем кнопку "Закрыть"
  const closeButton = document.createElement('button');
  closeButton.setAttribute('class', 'redButton');
  closeButton.textContent = 'Закрыть';
  closeButton.addEventListener('click', function () {
    CloseModal(modal);
  });


  buttonsContainer.appendChild(createButton);
  buttonsContainer.appendChild(closeButton);

  // Добавляем контейнер с кнопками в модальное окно
  modal.appendChild(buttonsContainer);

  BlockElementInput(modal);

}

function ModalInvoiceSubmitClick(modalInvoice) {
    // Находим элемент с id invoiceType внутри modalInvoice
    const invoiceTypeSelect = modalInvoice.querySelector('#invoiceType');

    // Получаем значение выбранного элемента в select
    const invoiceType = invoiceTypeSelect.value;

    // В зависимости от значения вызываем соответствующую функцию
    if (invoiceType === 'Поступление') {
        ModalCreateReceipt(modalInvoice);
    } else if (invoiceType === 'Отправка') {
        ModalCreateDispatch(modalInvoice);
    } else if (invoiceType === 'Перемещение') {
        ModalCreateMoving(modalInvoice);
    } else {
        console.error('Неизвестный тип накладной: ' + invoiceType);
    }
}

// Поступление

function ModalCreateReceipt(modalInvoice) {
  // Создаем модальное окно
  const receiptModal = document.createElement('div');
  receiptModal.id = 'modalReceipt';
  receiptModal.setAttribute('class', 'modal');
  document.body.appendChild(receiptModal);

  // Создаем оверлей
  CreateOverlay(receiptModal);

  // Создаем заголовок
  const h1 = document.createElement('h1');
  h1.textContent = 'Поступление';
  receiptModal.appendChild(h1);

  // Создаем инпут для подписавшего сотрудника
  const employeeInputContainer = document.createElement('div');
  employeeInputContainer.classList.add('inputContainer');
  const employeeLabel = document.createElement('label');
  employeeLabel.textContent = 'Ответственный представитель';
  const employeeInput = document.createElement('input');
  employeeInput.type = 'text';
  employeeInput.id = 'receiptRepresent';
  employeeInput.setAttribute('data-input-order', '1');

  employeeInput.setAttribute('name', 'Номер_представителя');
  employeeInput.setAttribute('data-source', 'Представитель');
  employeeInput.setAttribute('autocomplete', 'off');
  employeeInput.setAttribute('readonly', true);
  employeeInput.setAttribute('data-columns-order', 'Номер_представителя, Имя, Фамилия, Отчество');
  employeeInput.setAttribute('data-extended', 'Имя, Фамилия, Отчество');
  employeeInput.onfocus = function() {
      DataSourceRowClick(this);
  };
  employeeInput.addEventListener('change', function() {
    BlockElementInput(receiptModal);
  });

  employeeInputContainer.appendChild(employeeLabel);
  employeeInputContainer.appendChild(employeeInput);
  receiptModal.appendChild(employeeInputContainer);

  // Создаем контейнер для кнопок
  const buttonsContainer = document.createElement('div');
  buttonsContainer.setAttribute('class', 'container_buttons');

  // Создаем кнопку "Создать"
  const createButton = document.createElement('button');
  createButton.textContent = 'Создать';
  createButton.className = 'greenButton';
  createButton.addEventListener('click', function () {
    ModalCreateReceiptUE(modalInvoice, receiptModal);
  });

  // Создаем кнопку "Закрыть"
  const closeButton = document.createElement('button');
  closeButton.setAttribute('class', 'redButton');
  closeButton.textContent = 'Закрыть';
  closeButton.addEventListener('click', function () {
    CloseModal(receiptModal);
  });

  buttonsContainer.appendChild(createButton);
  buttonsContainer.appendChild(closeButton);

  // Добавляем контейнер с кнопками в модальное окно
  receiptModal.appendChild(buttonsContainer);

  BlockElementInput(receiptModal);
}

function ModalCreateReceiptUE(modalInvoice, receiptModal) {
  // Создаем модальное окно
  const receiptUEModal = document.createElement('div');
  receiptUEModal.id = 'modalReceiptUE';
  receiptUEModal.setAttribute('class', 'modal');
  document.body.appendChild(receiptUEModal);

  // Создаем контейнер для верхней части модального окна
  const topContainer = document.createElement('div');
  topContainer.setAttribute('class', 'modal-top-container');

  // Создаем заголовок h1 для нового модального окна
  const h1 = document.createElement('h1');
  h1.textContent = 'Поступившие Учетные Единицы';
  h1.id = 'receipth1';
  topContainer.appendChild(h1);

  // Создаем кнопку "Создать"
  const createButton = document.createElement('button');
  createButton.textContent = 'Создать';
  createButton.className = 'greenButton';
  createButton.addEventListener('click', function () {
    CreateRowModal(table);
  });
  topContainer.appendChild(createButton);

  // Добавляем верхний контейнер в модальное окно
  receiptUEModal.appendChild(topContainer);

  // Создаем таблицу
  const table = document.createElement('table');
  table.id = 'receiptTable';

  // Копируем шапку таблицы из UEMenu_table
  const UEMenuTable = document.getElementById('UEMenu_table');
  if (UEMenuTable) {
    const tableHead = UEMenuTable.querySelector('thead');
    if (tableHead) {
      table.appendChild(tableHead.cloneNode(true));
    }
  }

  // Добавляем пустое tbody в таблицу
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  // Добавляем таблицу в модальное окно
  receiptUEModal.appendChild(table);

  // Создаем контейнер для кнопок
  const buttonsContainer = document.createElement('div');
  buttonsContainer.setAttribute('class', 'container_buttons');

  // Создаем кнопку "Отправить"
  const sendButton = document.createElement('button');
  sendButton.textContent = 'Отправить';
  sendButton.className = 'greenButton';
  sendButton.addEventListener('click', function () {
    // Вызываем CheckUECreation и затем CreateReceiptInvoice
    CheckUECreation(table)
      .then(() => {
        // Если CheckUECreation завершилось успешно, вызываем CreateReceiptInvoice
        CreateReceiptInvoice(modalInvoice, receiptModal, modalReceiptUE);
      })
      .catch((error) => {
        // Обработка ошибок
        console.error(error);
        alert('Ошибка при проверке учетных единиц: ' + error.message);
      });
  });

  // Создаем кнопку "Закрыть"
  const closeButton = document.createElement('button');
  closeButton.setAttribute('class', 'redButton');
  closeButton.textContent = 'Закрыть';
  closeButton.addEventListener('click', function () {
    CloseModal(receiptUEModal);
  });

  // Добавляем кнопки в контейнер
  buttonsContainer.appendChild(sendButton);
  buttonsContainer.appendChild(closeButton);

  // Добавляем контейнер с кнопками в модальное окно
  receiptUEModal.appendChild(buttonsContainer);
}

function SubmitUEClick(modal, table) {
    const inputs = modal.querySelectorAll('input');
    const dataForTable = {};

    // Считываем значения всех инпутов
    inputs.forEach(input => {
        if (input.type !== 'radio' && !input.disabled) {
            const hiddenValue = input.getAttribute('data-hidden');
            const expandedSource = input.getAttribute('data-expanded-source');
            if (expandedSource !== null) {
                dataForTable[input.id] = input.getAttribute('data-value');
            } else {
                dataForTable[input.id] = hiddenValue !== null ? hiddenValue : input.value;
            }
        } else if (input.type === 'radio' && input.checked) {
            dataForTable[input.name] = input.value;
        }
    });

    // Создаем новую строку в таблице
    const newRow = document.createElement('tr');

    // Получаем заголовки таблицы
    const headers = table.querySelectorAll('thead th');

    // Заполняем строку данными
    headers.forEach(header => {
        const cell = document.createElement('td');
        const cellName = header.getAttribute('name');
        if (cellName in dataForTable) {
            cell.textContent = dataForTable[cellName];
        }
        newRow.appendChild(cell);
    });

    // Добавляем новую строку в таблицу
    const tbody = table.querySelector('tbody');
    tbody.appendChild(newRow);

    // Закрываем модальное окно
    CloseModal(modal);
}

function CheckUECreation(receiptTable) {
  // Получаем заголовки таблицы
  const headers = Array.from(receiptTable.querySelectorAll('thead th')).map(th => th.getAttribute('name'));

  // Получаем данные из tbody
  const rows = Array.from(receiptTable.querySelectorAll('tbody tr'));
  const data = rows.map(row => {
    const rowData = {};
    Array.from(row.cells).forEach((cell, index) => {
      const key = headers[index]; // Имя ключа берем из заголовка таблицы
      rowData[key] = cell.textContent.trim(); // Значение берем из текстового содержимого ячейки
    });
    return rowData;
  });

  // Отправляем данные на сервер
  return fetch('/checkUE', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(errData => {
        throw new Error(errData.error || 'Network response was not ok');
      });
    }
  })
  .catch(error => {
    // Возвращаем ошибку для обработки в вызвавшей функции
    return Promise.reject(error);
  });
}

function CreateReceiptInvoice(modalInvoice, receiptModal, modalReceiptUE) {
  // Считываем значения инпутов из modalInvoice
  const invoiceEmployeeInput = modalInvoice.querySelector('#invoiceEmployee');
  const invoiceDateInput = modalInvoice.querySelector('#invoiceDate');

  if (!invoiceEmployeeInput || !invoiceDateInput) {
    alert('Ошибка: Не удалось найти необходимые поля в модальном окне накладной.');
    return;
  }

  const invoiceEmployeeNumberValue = invoiceEmployeeInput.getAttribute('data-hidden');
  const invoiceDateValue = invoiceDateInput.value.trim();

  // Проверяем, что значения не пусты
  if (!invoiceEmployeeNumberValue || !invoiceDateValue) {
    alert('Ошибка: Пожалуйста, заполните все поля накладной.');
    return;
  }

  const dataForInvoice = {
    "Дата_подписания": invoiceDateValue,
    "Номер_сотрудника": invoiceEmployeeNumberValue
  };

  const encodedInvoiceWord = encodeURIComponent('Накладная');

  // Отправляем fetch запрос для накладной
  fetch(`/addData/${encodedInvoiceWord}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dataForInvoice)
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

    // Переходим к обработке таблицы receiptTable
    const receiptTable = modalReceiptUE.querySelector('#receiptTable');
    if (!receiptTable) {
      alert('Ошибка: Не удалось найти таблицу накладных.');
      return;
    }

    // Находим индекс столбца с заголовком, имеющим атрибут name="Серийный_номер"
    const headers = Array.from(receiptTable.querySelectorAll('thead th'));
    const serialNumberIndex = headers.findIndex(th => th.getAttribute('name') === 'Серийный_номер');

    if (serialNumberIndex === -1) {
      alert('Ошибка: Не удалось найти столбец "Серийный_номер" в таблице.');
      return;
    }

    // Формируем JSON для каждой строки таблицы и отправляем его
    const rows = Array.from(receiptTable.querySelectorAll('tbody tr'));
    const encodedUEInvoiceWord = encodeURIComponent('УЕ_Накладная');

    const rowPromises = rows.map(row => {
      const cells = row.querySelectorAll('td');
      const serialNumber = cells[serialNumberIndex].textContent.trim();

      if (!serialNumber) {
        console.warn('Внимание: Пустой серийный номер в строке, пропускаем её.');
        return Promise.resolve(); // Пропускаем эту строку, чтобы не прерывать весь процесс
      }

      const dataForUEInvoice = {
        "Серийный_номер": serialNumber,
        "Номер_накладной": invoiceNumber
      };

      // Отправляем данные по каждой строке таблицы
      return fetch(`/addData/${encodedUEInvoiceWord}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataForUEInvoice)
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
        console.log('Row Data Success:', data);
      })
      .catch(error => {
        alert('Ошибка при отправке данных УЕ: ' + error.message);
      });
    });

    // Ждем завершения всех запросов
    return Promise.all(rowPromises);
  })
  .then(() => {
    alert('Все данные успешно отправлены.');
    CloseModal(modalInvoice);
    CloseModal(receiptModal);
    CloseModal(modalReceiptUE);
    GetPageFromTable(1);
  })
  .catch(error => {
    alert('Ошибка при создании накладной: ' + error.message);
    CloseModal(modalInvoice);
    CloseModal(receiptModal);
    CloseModal(modalReceiptUE);
  });
}

// Отправка

function ModalCreateDispatch(invoiceModal) {

  // Создаем модальное окно
  const dispatchModal = document.createElement('div');
  dispatchModal.id = 'modalDispatch';
  dispatchModal.setAttribute('class', 'modal');
  document.body.appendChild(dispatchModal);

  // Создаем оверлей
  CreateOverlay(dispatchModal);

  // Создаем заголовок
  const h1 = document.createElement('h1');
  h1.textContent = 'Отправка';
  dispatchModal.appendChild(h1);

  // Создаем инпут для отправляющего сотрудника
  const senderInputContainer = document.createElement('div');
  senderInputContainer.classList.add('inputContainer');
  const senderLabel = document.createElement('label');
  senderLabel.textContent = 'Отправляющий сотрудник';
  const senderInput = document.createElement('input');
  senderInput.type = 'text';
  senderInput.id = 'dispatchSender';
  senderInputContainer.appendChild(senderLabel);
  senderInputContainer.appendChild(senderInput);

  senderInput.setAttribute('name', 'Номер_сотрудника');
  senderInput.setAttribute('data-source', 'Сотрудник');
  senderInput.setAttribute('autocomplete', 'off');
  senderInput.setAttribute('readonly', true);
  senderInput.setAttribute('data-columns-order', 'Номер_сотрудника, Имя, Фамилия, Отчество');
  senderInput.setAttribute('data-extended', 'Имя, Фамилия, Отчество');
  senderInput.setAttribute('data-input-order', '0');
  senderInput.onfocus = function() {
      DataSourceRowClick(this);
  };
  senderInput.addEventListener('change', function() {
    BlockElementInput(dispatchModal);
  });


  dispatchModal.appendChild(senderInputContainer);

  // Создаем инпут для ответственного представителя
  const responsibleInputContainer = document.createElement('div');
  responsibleInputContainer.classList.add('inputContainer');
  const responsibleLabel = document.createElement('label');
  responsibleLabel.textContent = 'Ответственный представитель';
  const responsibleInput = document.createElement('input');
  responsibleInput.type = 'text';
  responsibleInput.id = 'dispatchRepresent';
  responsibleInput.setAttribute('name', 'dispatchRepresent');
  responsibleInputContainer.appendChild(responsibleLabel);
  responsibleInputContainer.appendChild(responsibleInput);
  dispatchModal.appendChild(responsibleInputContainer);

  responsibleInput.setAttribute('name', 'Номер_представителя');
  responsibleInput.setAttribute('data-source', 'Представитель');
  responsibleInput.setAttribute('autocomplete', 'off');
  responsibleInput.setAttribute('readonly', true);
  responsibleInput.setAttribute('data-columns-order', 'Номер_представителя, Имя, Фамилия, Отчество');
  responsibleInput.setAttribute('data-extended', 'Имя, Фамилия, Отчество');
  responsibleInput.setAttribute('data-input-order', '1');
  responsibleInput.onfocus = function() {
      DataSourceRowClick(this);
  };
  responsibleInput.addEventListener('change', function() {
    BlockElementInput(dispatchModal);
  });

  // Создаем контейнер для кнопок
  const buttonsContainer = document.createElement('div');
  buttonsContainer.setAttribute('class', 'container_buttons');

  // Создаем кнопку "Создать"
  const createButton = document.createElement('button');
  createButton.textContent = 'Создать';
  createButton.className = 'greenButton';
  createButton.addEventListener('click', async function () {
    try {
      const hiddenValue = senderInput.getAttribute('data-hidden');
      await CheckEmployeePowers(hiddenValue, 'Может_инициировать_акт_отправки');
      ModalCreateDispatchUE(invoiceModal, dispatchModal);
    } catch (error) {
      CloseModal(dispatchModal);
    }
  });

  // Создаем кнопку "Закрыть"
  const closeButton = document.createElement('button');
  closeButton.setAttribute('class', 'redButton');
  closeButton.textContent = 'Закрыть';
  closeButton.addEventListener('click', function () {
    CloseModal(dispatchModal);
  });

  buttonsContainer.appendChild(createButton);
  buttonsContainer.appendChild(closeButton);

  // Добавляем контейнер с кнопками в модальное окно
  dispatchModal.appendChild(buttonsContainer);

  BlockElementInput(dispatchModal);
}

function ModalCreateDispatchUE(modalInvoice, dispatchModal) {
  // Создаем модальное окно
  const dispatchUEModal = document.createElement('div');
  dispatchUEModal.id = 'modalDispatchUE';
  dispatchUEModal.setAttribute('class', 'modal');
  document.body.appendChild(dispatchUEModal);

  CreateOverlay(modalDispatchUE);

  // Создаем контейнер для верхней части модального окна
  const topContainer = document.createElement('div');
  topContainer.setAttribute('class', 'modal-top-container');

  // Создаем заголовок h1 для нового модального окна
  const h1 = document.createElement('h1');
  h1.textContent = 'Отправленные Учетные Единицы';
  h1.id = 'dispatchh1';
  topContainer.appendChild(h1);

  // Добавляем верхний контейнер в модальное окно
  dispatchUEModal.appendChild(topContainer);

  // Создаем таблицу
  const table = document.createElement('table');
  table.id = 'dispatchTable';
  table.setAttribute('name', 'Учетная_единица');
  table.setAttribute('class', 'table');

  // Копируем шапку таблицы из UEMenu_table
  const UEMenuTable = document.getElementById('UEMenu_table');
  if (UEMenuTable) {
    const tableHead = UEMenuTable.querySelector('thead');
    if (tableHead) {
      table.appendChild(tableHead.cloneNode(true));
    }
  }

  // Добавляем пустое tbody в таблицу
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  // Добавляем таблицу в модальное окно
  dispatchUEModal.appendChild(table);

  // Создаем контейнер для кнопок
  const buttonsContainer = document.createElement('div');
  buttonsContainer.setAttribute('class', 'container_buttons');

  // Создаем кнопку "Отправить"
  const sendButton = document.createElement('button');
  sendButton.textContent = 'Отправить';
  sendButton.className = 'greenButton';
  sendButton.addEventListener('click', function () {
    ModalDispatchSubmitClick(modalInvoice, dispatchModal, modalDispatchUE);
  });

  // Создаем кнопку "Закрыть"
  const closeButton = document.createElement('button');
  closeButton.setAttribute('class', 'redButton');
  closeButton.textContent = 'Закрыть';
  closeButton.addEventListener('click', function () {
    CloseModal(dispatchUEModal);
  });

  // Добавляем кнопки в контейнер
  buttonsContainer.appendChild(sendButton);
  buttonsContainer.appendChild(closeButton);

  // Добавляем контейнер с кнопками в модальное окно
  dispatchUEModal.appendChild(buttonsContainer);

  // Получаем данные с сервера и заполняем таблицу
  const url = '/getAllUE';
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: null
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
      if (result.length === 0) {
        alert('Не найдено записей');
        CloseModal(dispatchUEModal);
        return;
      } else {
        result.forEach(jsonRow => {
          AddRowToTable(jsonRow, table);
        });
        SortTable(table, 0);
        AddCheckboxColumn(table);
      }
    })
    .catch(error => {
      console.error('There has been a problem with your fetch operation:', error);
      alert(error.message);
    });
}

function ModalDispatchSubmitClick(modalInvoice, dispatchModal, modalDispatchUE) {
  // Находим таблицу dispatchTable внутри modalReceiptUE
  const dispatchTable = modalDispatchUE.querySelector('#dispatchTable');

  if (!dispatchTable) {
    console.error('Таблица dispatchTable не найдена');
    return;
  }

  // Получаем все строки таблицы (tbody > tr)
  const rows = dispatchTable.querySelectorAll('tbody > tr');

  // Получаем заголовки таблицы (thead > tr > th) для определения ключей
  const headers = dispatchTable.querySelectorAll('thead > tr > th');

  // Инициализируем массив для хранения данных строк
  const data = [];

  // Получаем заголовок модального окна
  const modalTitle = modal.querySelector('h1').textContent;

  // Извлекаем число из заголовка с помощью регулярного выражения
  const serialNumberMatch = modalTitle.match(/№\s*(\d+)/);
  const serialNumber = serialNumberMatch ? serialNumberMatch[1] : null;

  // Добавляем серийный номер в данные
  if (serialNumber) {
    data['Серийный_номер'] = serialNumber;
  }

  // Проходим по всем строкам таблицы
  rows.forEach(row => {
    const checkbox = row.querySelector('input[type="checkbox"]');

    // Проверяем, отмечен ли чекбокс
    if (checkbox && checkbox.checked) {
      const rowData = {};

      // Проходим по всем ячейкам строки
      row.querySelectorAll('td').forEach((cell, index) => {
        const header = headers[index];

        if (header) {
          const key = header.getAttribute('name');

          if (key && key !== 'checkBoxColumn') {
            if (cell.dataset.value) {
              rowData[key] = cell.dataset.value;
            } else {
              rowData[key] = cell.textContent.trim();
            }
          }
        }
      });

      data.push(rowData);
    }
  });

  // URL для отправки данных
  const url = '/dispatchUE';

  // Отправляем данные на сервер с помощью fetch
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errData => {
          throw new Error(errData.error || 'Network response was not ok');
        });
      }

      CreateDispatchInvoice(modalInvoice, dispatchModal, modalDispatchUE)

    })
    .catch(error => {
      console.error('There has been a problem with your fetch operation:', error);
      alert(error.message);
    });
}

function CreateMovingInvoice(modalInvoice, modalMoving, modalMovingUE) {
  // Считываем значения инпутов из modalInvoice
  const invoiceEmployeeInput = modalInvoice.querySelector('#invoiceEmployee');
  const invoiceDateInput = modalInvoice.querySelector('#invoiceDate');

  if (!invoiceEmployeeInput || !invoiceDateInput) {
    alert('Ошибка: Не удалось найти необходимые поля в модальном окне накладной.');
    return;
  }

  const invoiceEmployeeNumberValue = invoiceEmployeeInput.getAttribute('data-hidden');
  const invoiceDateValue = invoiceDateInput.value.trim();

  // Проверяем, что значения не пусты
  if (!invoiceEmployeeNumberValue || !invoiceDateValue) {
    alert('Ошибка: Пожалуйста, заполните все поля накладной.');
    return;
  }

  const dataForInvoice = {
    "Дата_подписания": invoiceDateValue,
    "Номер_сотрудника": invoiceEmployeeNumberValue
  };

  const encodedInvoiceWord = encodeURIComponent('Накладная');

  // Отправляем fetch запрос для накладной
  fetch(`/addData/${encodedInvoiceWord}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dataForInvoice)
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

    // Находим таблицу movingTable
    const movingTable = modalMovingUE.querySelector('#movingTable');
    if (!movingTable) {
      alert('Ошибка: Не удалось найти таблицу movingTable.');
      return;
    }

    // Находим выбранную строку
    const selectedRow = movingTable.querySelector('tr.selected');
    if (!selectedRow) {
      alert('Ошибка: Не выбрана строка в таблице movingTable.');
      return;
    }

    // Находим индекс столбца с заголовком "Серийный_номер"
    const headers = Array.from(movingTable.querySelectorAll('thead th'));
    const serialNumberColumnIndex = headers.findIndex(th => th.getAttribute('name') === 'Серийный_номер');

    if (serialNumberColumnIndex === -1) {
      alert('Ошибка: Не удалось найти столбец "Серийный_номер" в таблице.');
      return;
    }

    // Получаем серийный номер из выбранной строки
    const serialNumber = selectedRow.cells[serialNumberColumnIndex].textContent.trim();

    if (!serialNumber) {
      alert('Ошибка: Не удалось получить серийный номер из выбранной строки.');
      return;
    }

    const dataForUEInvoice = {
      "Серийный_номер": serialNumber,
      "Номер_накладной": invoiceNumber
    };

    const encodedUEInvoiceWord = encodeURIComponent('УЕ_Накладная');

    // Отправляем данные в таблицу УЕ_Накладная
    return fetch(`/addData/${encodedUEInvoiceWord}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataForUEInvoice)
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
    console.log('UE_Invoice Data Success:', data);
    alert('Накладная и данные УЕ успешно созданы.');

    // Закрываем все модальные окна
    CloseModal(modalInvoice);
    CloseModal(modalMoving);
    CloseModal(modalMovingUE);

    // Обновляем страницу или выполняем другие необходимые действия
    GetPageFromTable(1);
  })
  .catch(error => {
    alert('Ошибка при создании накладной или данных УЕ: ' + error.message);

    // Закрываем все модальные окна даже в случае ошибки
    CloseModal(modalInvoice);
    CloseModal(modalMoving);
    CloseModal(modalMovingUE);
  });
}

// Перемещение

function ModalCreateMoving(invoiceModal) {
  // Создаем модальное окно
  const modalMoving = document.createElement('div');
  modalMoving.id = 'modalMoving';
  modalMoving.setAttribute('class', 'modal');
  document.body.appendChild(modalMoving);

  // Создаем оверлей
  CreateOverlay(modalMoving);

  // Создаем заголовок
  const h1 = document.createElement('h1');
  h1.textContent = 'Перемещение';
  modalMoving.appendChild(h1);

  // Создаем инпут для инициирующего сотрудника
  const initiatorInputContainer = document.createElement('div');
  initiatorInputContainer.classList.add('inputContainer');
  const initiatorLabel = document.createElement('label');
  initiatorLabel.textContent = 'Инициирующий сотрудник';
  const initiatorInput = document.createElement('input');
  initiatorInput.type = 'text';
  initiatorInput.id = 'movingInitiator';
  initiatorInput.setAttribute('name', 'movingInitiator');
  initiatorInputContainer.appendChild(initiatorLabel);
  initiatorInputContainer.appendChild(initiatorInput);

  initiatorInput.setAttribute('name', 'Номер_сотрудника');
  initiatorInput.setAttribute('data-source', 'Сотрудник');
  initiatorInput.setAttribute('autocomplete', 'off');
  initiatorInput.setAttribute('readonly', true);
  initiatorInput.setAttribute('data-columns-order', 'Номер_сотрудника, Имя, Фамилия, Отчество');
  initiatorInput.setAttribute('data-extended', 'Имя, Фамилия, Отчество');
  initiatorInput.setAttribute('data-input-order', '0');
  initiatorInput.onfocus = function() {
      DataSourceRowClick(this);
  };
  initiatorInput.addEventListener('change', function() {
    BlockElementInput(modalMoving);
  });

  modalMoving.appendChild(initiatorInputContainer);

  // Создаем инпут для принимающего сотрудника
  const receiverInputContainer = document.createElement('div');
  receiverInputContainer.classList.add('inputContainer');
  const receiverLabel = document.createElement('label');
  receiverLabel.textContent = 'Приемающий сотрудник';
  const receiverInput = document.createElement('input');
  receiverInput.type = 'text';
  receiverInput.id = 'movingReceiver';
  receiverInput.setAttribute('name', 'movingReceiver');
  receiverInputContainer.appendChild(receiverLabel);
  receiverInputContainer.appendChild(receiverInput);

  receiverInput.setAttribute('name', 'Номер_сотрудника');
  receiverInput.setAttribute('data-source', 'Сотрудник');
  receiverInput.setAttribute('autocomplete', 'off');
  receiverInput.setAttribute('readonly', true);
  receiverInput.setAttribute('data-columns-order', 'Номер_сотрудника, Имя, Фамилия, Отчество');
  receiverInput.setAttribute('data-extended', 'Имя, Фамилия, Отчество');
  receiverInput.setAttribute('data-input-order', '0');
  receiverInput.onfocus = function() {
      DataSourceRowClick(this);
  };
  receiverInput.addEventListener('change', function() {
    BlockElementInput(modalMoving);
  });

  modalMoving.appendChild(receiverInputContainer);

  // Создаем контейнер для кнопок
  const buttonsContainer = document.createElement('div');
  buttonsContainer.setAttribute('class', 'container_buttons');

  // Создаем кнопку "Создать"
  const createButton = document.createElement('button');
  createButton.textContent = 'Создать';
  createButton.className = 'greenButton';
  createButton.addEventListener('click', async function () {
    try {
      const initiatorId = initiatorInput.getAttribute('data-hidden');
      const receiverId = receiverInput.getAttribute('data-hidden');

      await CheckEmployeePowers(initiatorId, 'Может_начать_акт_перемещения');
      await CheckEmployeePowers(receiverId, 'Может_завершить_акт_перемещения');

      ModalCreateMovingUE(invoiceModal, modalMoving);
    } catch (error) {
      CloseModal(modalMoving);
    }
  });

  // Создаем кнопку "Закрыть"
  const closeButton = document.createElement('button');
  closeButton.setAttribute('class', 'redButton');
  closeButton.textContent = 'Закрыть';
  closeButton.addEventListener('click', function () {
    CloseModal(modalMoving);
  });

  buttonsContainer.appendChild(createButton);
  buttonsContainer.appendChild(closeButton);

  // Добавляем контейнер с кнопками в модальное окно
  modalMoving.appendChild(buttonsContainer);
}

function ModalCreateMovingUE(modalInvoice, modalMoving) {
  // Создаем модальное окно
  const modalMovingUE = document.createElement('div');
  modalMovingUE.id = 'modalMovingUE';
  modalMovingUE.setAttribute('class', 'modal');
  document.body.appendChild(modalMovingUE);

  CreateOverlay(modalMovingUE); // Исправлено с modalDispatchUE на modalMovingUE

  // Создаем контейнер для верхней части модального окна
  const topContainer = document.createElement('div');
  topContainer.setAttribute('class', 'modal-top-container');

  // Создаем заголовок h1 для нового модального окна
  const h1 = document.createElement('h1');
  h1.textContent = 'Перемещение Учетных Единиц';
  h1.id = 'receipth1';
  topContainer.appendChild(h1);

  // Создаем кнопку "Переместить"
  const createButton = document.createElement('button');
  createButton.textContent = 'Переместить';
  createButton.className = 'greenButton';
  createButton.addEventListener('click', function () {
    ModalCreateMovingClick(modalInvoice, modalMoving, modalMovingUE);
  });
  topContainer.appendChild(createButton);

  // Добавляем верхний контейнер в модальное окно
  modalMovingUE.appendChild(topContainer);

  // Создаем таблицу
  const table = document.createElement('table');
  table.id = 'movingTable';
  table.setAttribute('name', 'Учетная_единица');
  table.setAttribute('class', 'table');

  // Копируем шапку таблицы из UEMenu_table
  const UEMenuTable = document.getElementById('UEMenu_table');
  if (UEMenuTable) {
    const tableHead = UEMenuTable.querySelector('thead');
    if (tableHead) {
      table.appendChild(tableHead.cloneNode(true));
    }
  }

  // Добавляем пустое tbody в таблицу
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  // Добавляем таблицу в модальное окно
  modalMovingUE.appendChild(table);

  // Создаем контейнер для кнопок
  const buttonsContainer = document.createElement('div');
  buttonsContainer.setAttribute('class', 'container_buttons');

  // Создаем кнопку "Закрыть"
  const closeButton = document.createElement('button');
  closeButton.setAttribute('class', 'redButton');
  closeButton.textContent = 'Закрыть';
  closeButton.addEventListener('click', function () {
    CloseModal(modalMovingUE);
  });

  // Добавляем кнопки в контейнер
  buttonsContainer.appendChild(closeButton);

  // Добавляем контейнер с кнопками в модальное окно
  modalMovingUE.appendChild(buttonsContainer);

  // Получаем данные с сервера и заполняем таблицу
  const url = '/getAllUE';
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: null
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
      if (result.length === 0) {
        alert('Не найдено записей');
        CloseModal(modalMovingUE);
        return;
      } else {
        result.forEach(jsonRow => {
          AddRowToTable(jsonRow, table);
        });
        SortTable(table, 0);
      }
    })
    .catch(error => {
      console.error('There has been a problem with your fetch operation:', error);
      alert(error.message);
    });
}

function ModalCreateMovingClick(modalInvoice, modalMoving, modalMovingUE) {
  // Находим таблицу в модальном окне modalMovingUE
  const table = modalMovingUE.querySelector('table');

  if (!table) {
    console.error('Таблица не найдена в модальном окне');
    return;
  }

  // Находим выбранную строку с классом "selected"
  const selectedRow = table.querySelector('tbody tr.selected');

  if (!selectedRow) {
    alert('Пожалуйста, выберите строку для перемещения.');
    return;
  }

  // Извлекаем данные из выбранной строки
  const cells = selectedRow.querySelectorAll('td');
  const headers = table.querySelectorAll('thead th');

  // Найдем индекс колонки "Серийный_номер"
  let serialNumber = '';
  headers.forEach((header, index) => {
    if (header.getAttribute('name') === 'Серийный_номер') {
      serialNumber = cells[index].textContent;
    }
  });

  // Создаем новое модальное окно для перемещения УЕ
  const modal = document.createElement('div');
  modal.id = 'modalMovingUESubmit';
  modal.setAttribute('class', 'modal');
  document.body.appendChild(modal);

  // Создаем оверлей
  CreateOverlay(modal);

  // Создаем заголовок
  const h1 = document.createElement('h1');
  h1.textContent = `Перемещение УЕ № ${serialNumber}`;
  modal.appendChild(h1);

  let zbmInput, buildingInput, roomInput;

  // Проходим по каждому заголовку и создаем соответствующие элементы
  headers.forEach((header, index) => {
    // Создаем элементы только для указанных полей
    const editableFields = ['Номер_ЗБМ', 'Номер_здания', 'Номер_помещения'];
    if (editableFields.includes(header.getAttribute('name'))) {
      if (index >= cells.length) {
        return;
      }

      const label = document.createElement('label');
      label.textContent = header.textContent + ': ';

      const input = document.createElement('input');
      input.type = 'text';
      input.id = header.getAttribute('name');
      input.setAttribute('name', header.getAttribute('name'));
      input.value = cells[index].textContent;

      // Устанавливаем атрибут data-value из ячейки
      input.setAttribute('data-value', cells[index].getAttribute('data-value') || '');

      input.setAttribute('autocomplete', 'off');

      // Копируем все атрибуты из заголовка в input
      Array.from(header.attributes).forEach(attr => {
        input.setAttribute(attr.name, attr.value);
      });

      // Добавляем обработчик события onfocus для редактируемых полей
      input.onfocus = function() {
        DataSourceClick(this, modal);
      };

      // Сохраняем ссылки на редактируемые поля
      if (input.getAttribute('name') === 'Номер_ЗБМ') zbmInput = input;
      if (input.getAttribute('name') === 'Номер_здания') buildingInput = input;
      if (input.getAttribute('name') === 'Номер_помещения') roomInput = input;

      // Добавляем обработчик события onchange
      input.onchange = function() {
        if (this.getAttribute('name') === 'Номер_ЗБМ') {
          if (buildingInput) buildingInput.value = '';
          if (roomInput) roomInput.value = '';
        } else if (this.getAttribute('name') === 'Номер_здания') {
          if (roomInput) roomInput.value = '';
        }

        BlockElementInput(modalMovingUESubmit);
      };

      // Создаем контейнер для label и input
      const inputContainer = document.createElement('div');
      inputContainer.classList.add('inputContainer');
      inputContainer.appendChild(label);
      inputContainer.appendChild(input);

      // Добавляем inputContainer в модальное окно
      modal.appendChild(inputContainer);
    }
  });

  // Создаем контейнер для кнопок
  const buttonsContainer = document.createElement('div');
  buttonsContainer.setAttribute('class', 'container_buttons');

  // Создаем кнопку "Отправить"
  const sendButton = document.createElement('button');
  sendButton.textContent = 'Отправить';
  sendButton.className = 'greenButton';
  sendButton.addEventListener('click', function () {
    ModalSubmitMovingClick(modal, modalInvoice, modalMoving, modalMovingUE);
  });

  // Создаем кнопку "Закрыть"
  const closeButton = document.createElement('button');
  closeButton.setAttribute('class', 'redButton');
  closeButton.textContent = 'Закрыть';
  closeButton.addEventListener('click', function () {
    CloseModal(modal);
  });

  buttonsContainer.appendChild(sendButton);
  buttonsContainer.appendChild(closeButton);

  // Добавляем контейнер с кнопками в модальное окно
  modal.appendChild(buttonsContainer);
}

function ModalSubmitMovingClick(modalMovingUESubmit, modalInvoice, modalMoving, modalMovingUE) {
  // Собираем все инпуты внутри модального окна
  const inputs = modalMovingUESubmit.querySelectorAll('input');

  // Формируем JSON объект из атрибутов name и data-value инпутов
  const data = {};
  inputs.forEach(input => {
    const name = input.getAttribute('name');
    const value = input.getAttribute('data-value') || '';
    if (name) {
      data[name] = value;
    }
  });

  // Получаем заголовок модального окна
  const header = modalMovingUESubmit.querySelector('h1');
  if (header) {
    // Извлекаем серийный номер из заголовка
    const headerText = header.textContent;
    const match = headerText.match(/№\s*(\d+)/);
    if (match && match[1]) {
      // Добавляем серийный номер в объект data
      data['Серийный_номер'] = match[1];
    }
  }

  // URL для отправки данных
  const url = '/movingUE';

  // Отправляем данные на сервер с помощью fetch
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errData => {
          throw new Error(errData.error || 'Network response was not ok');
        });
      }

      CloseModal(modalMovingUESubmit);
      CreateMovingInvoice(modalInvoice, modalMoving, modalMovingUE);
    })
    .catch(error => {
      console.error('There has been a problem with your fetch operation:', error);
      alert(error.message);
    });
}

function CreateMovingInvoice(modalInvoice, modalMoving, modalMovingUE) {
  // Считываем значения инпутов из modalInvoice
  const invoiceEmployeeInput = modalInvoice.querySelector('#invoiceEmployee');
  const invoiceDateInput = modalInvoice.querySelector('#invoiceDate');

  if (!invoiceEmployeeInput || !invoiceDateInput) {
    alert('Ошибка: Не удалось найти необходимые поля в модальном окне накладной.');
    return;
  }

  const invoiceEmployeeNumberValue = invoiceEmployeeInput.getAttribute('data-hidden');
  const invoiceDateValue = invoiceDateInput.value.trim();

  // Проверяем, что значения не пусты
  if (!invoiceEmployeeNumberValue || !invoiceDateValue) {
    alert('Ошибка: Пожалуйста, заполните все поля накладной.');
    return;
  }

  const dataForInvoice = {
    "Дата_подписания": invoiceDateValue,
    "Номер_сотрудника": invoiceEmployeeNumberValue
  };

  const encodedInvoiceWord = encodeURIComponent('Накладная');

  // Отправляем fetch запрос для накладной
  fetch(`/addData/${encodedInvoiceWord}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dataForInvoice)
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

    // Переходим к обработке таблицы movingTable
    const movingTable = modalMovingUE.querySelector('#movingTable');
    if (!movingTable) {
      alert('Ошибка: Не удалось найти таблицу movingTable.');
      return;
    }

    // Находим индекс столбца с заголовком, имеющим атрибут name="Серийный_номер"
    const headers = Array.from(movingTable.querySelectorAll('thead th'));
    const serialNumberColumnIndex = headers.findIndex(th => th.getAttribute('name') === 'Серийный_номер');

    if (serialNumberColumnIndex === -1) {
      alert('Ошибка: Не удалось найти столбец "Серийный_номер" в таблице.');
      return;
    }

    // Находим строку с классом selected
    const selectedRow = movingTable.querySelector('tbody tr.selected');
    if (!selectedRow) {
      alert('Ошибка: Не удалось найти строку с классом "selected" в таблице.');
      return;
    }

    // Получаем серийный номер из выбранной строки
    const cells = selectedRow.querySelectorAll('td');
    const serialNumber = cells[serialNumberColumnIndex].textContent.trim();

    if (!serialNumber) {
      alert('Ошибка: Пустой серийный номер в выбранной строке.');
      return;
    }

    const dataForUEInvoice = {
      "Серийный_номер": serialNumber,
      "Номер_накладной": invoiceNumber
    };

    const encodedUEInvoiceWord = encodeURIComponent('УЕ_Накладная');

    // Отправляем данные по выбранной строке таблицы
    return fetch(`/addData/${encodedUEInvoiceWord}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataForUEInvoice)
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
      console.log('Row Data Success:', data);
      alert('Все данные успешно отправлены.');
      CloseModal(modalInvoice);
      CloseModal(modalMoving);
      CloseModal(modalMovingUE);
      GetPageFromTable(1);
    })
    .catch(error => {
      alert('Ошибка при отправке данных УЕ: ' + error.message);
      CloseModal(modalInvoice);
      CloseModal(modalMoving);
      CloseModal(modalMovingUE);
    });
  })
  .catch(error => {
    alert('Ошибка при создании накладной: ' + error.message);
    CloseModal(modalInvoice);
    CloseModal(modalMoving);
    CloseModal(modalMovingUE);
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



