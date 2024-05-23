document.addEventListener('DOMContentLoaded', function() {
    var mainTable = document.getElementById('mainTable');
    UpdateNavigationPanel();
    GetPageFromTable(1);
    AttachDataSourceRowClick();
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
    });

    row.addEventListener('click', TableRowClick);
}

function GetPageFromTable(pageNumber) {
    currentPage = pageNumber;
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
        AttachInvoiceRowClick();
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
    var rows, switching, i, x, y, shouldSwitch;
    switching = true;
    // Продолжаем цикл до тех пор, пока не будет выполнено ни одной перестановки
    while (switching) {
        switching = false;
        rows = table.getElementsByTagName("TR");
        // Проходим по всем строкам таблицы, кроме заголовка
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            // Получаем сравниваемые элементы
            x = rows[i].getElementsByTagName("TD")[columnIndex];
            y = rows[i + 1].getElementsByTagName("TD")[columnIndex];
            // Проверяем, являются ли значения числами
            var xValue = isNaN(x.innerHTML) ? x.innerHTML.toLowerCase() : parseFloat(x.innerHTML);
            var yValue = isNaN(y.innerHTML) ? y.innerHTML.toLowerCase() : parseFloat(y.innerHTML);
            // Определяем, должны ли элементы поменяться местами
            if (xValue > yValue) {
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            // Если элементы должны поменяться местами, выполняем перестановку и помечаем, что была выполнена перестановка
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}

function formatDataWithPrefix(data, prefix) {
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
    var expandedColumns = header.dataset.expendedColumns.split(', ');
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
        // Создаем упорядоченный массив данных
        var orderedData = expandedColumns.map(column => data[column]);

        // Форматируем данные с префиксом
        var formattedData = formatDataWithPrefix(orderedData, expandedPrefix);

        // Устанавливаем отформатированные данные в ячейку
        cell.innerHTML  = formattedData;
    })
    .catch(error => {
        console.error('Error fetching expanded data:', error);
        cell.textContent = 'Error loading data';
    });
}

function SubmitCreateForm(event) {
    event.preventDefault();

    var form = document.getElementById('createForm');
    var inputs = form.getElementsByTagName('input');

    var objectData = {};
    var mainTable = document.getElementById('mainTable');
    var tableName = mainTable.getAttribute('name');

    for (var i = 0; i < inputs.length; i++) {
        objectData[inputs[i].name] = inputs[i].value;
    }

    var jsonData = JSON.stringify(objectData);
    var url = '/addData/' + encodeURIComponent(tableName);

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: jsonData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.error);
            });
        }
        GetPageFromTable(currentPage, mainTable);
        UpdateNavigationPanel();
    })
    .catch(error => {
        alert(error.message);
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function EditButtonClick(table) {
    // Найти строку с классом selected
    const selectedRow = table.querySelector('tr.selected');
    if (!selectedRow) {
        console.error('No row selected');
        return;
    }

    // Получить заголовки таблицы (th)
    const headers = table.querySelectorAll('th');
    if (headers.length === 0) {
        console.error('No headers found');
        return;
    }

    // Получить имя таблицы из атрибута name
    const tableName = table.getAttribute('name');
    if (!tableName) {
        console.error('Table name attribute is missing');
        return;
    }

    // Создание модального окна
    const { modal, submitButton, editRow } = CreateModalEdit(headers, selectedRow);

    // Обработка кнопки отправить
    submitButton.onclick = function() {
        const jsonData = {};
        headers.forEach((header, index) => {
            const key = header.getAttribute('name');
            if (key) {
                const cell = editRow.cells[index];
                if (cell) {
                    jsonData[key] = cell.textContent;
                }
            }
        });

        // Подтверждение изменений
        const userConfirmed = confirm("Вы уверены, что хотите изменить выбранную строку?");
        if (!userConfirmed) {
            return;
        }

        const url = `/editData/${encodeURIComponent(tableName)}`;
        fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        })
        .then(response => {
            if (response.ok) {
                console.log('Data edited successfully');
                modal.style.display = 'none';
                document.body.removeChild(modal);
            } else {
                return response.json().then(errData => {
                    throw new Error(errData.error || 'Failed to edit data');
                });
            }
        })
        .catch(error => {
            alert(error.message);
        });
    };
}

function CreateModalEdit(headers, selectedRow) {
    // Создание модального окна
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.id = 'editModal';

    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');

    const closeButton = document.createElement('span');
    closeButton.classList.add('close-button');
    closeButton.innerHTML = '&times;';
    modalContent.appendChild(closeButton);

    const editTable = document.createElement('table');
    editTable.id = 'editTable';

    const editTableHead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.textContent;
        headerRow.appendChild(th);
    });
    editTableHead.appendChild(headerRow);
    editTable.appendChild(editTableHead);

    const editTableBody = document.createElement('tbody');
    const editRow = document.createElement('tr');

    // Преобразование HTMLCollection в массив
    Array.from(selectedRow.cells).forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell.getAttribute('data-value') !== null ? cell.getAttribute('data-value') : cell.textContent;
        td.contentEditable = true; // Сделать ячейки редактируемыми
        editRow.appendChild(td);
    });
    editTableBody.appendChild(editRow);
    editTable.appendChild(editTableBody);

    modalContent.appendChild(editTable);

    const submitButton = document.createElement('button');
    submitButton.id = 'submitChanges';
    submitButton.textContent = 'Отправить';
    modalContent.appendChild(submitButton);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Показать модальное окно
    modal.style.display = 'block';

    CreateOverlay(modal);

    // Закрытие модального окна
    closeButton.onclick = CloseModal(modal);

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
            document.body.removeChild(modal);
        }
    }

    return { modal, submitButton, editRow };
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
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        var totalItems = data;
        var totalPages = Math.ceil(totalItems / itemsPerPage);

        // Установка currentPage в 1, если totalPages равно 0
        if (totalPages === 0) {
            totalPages = 1;
        }

        if (currentPage > totalPages) {
            currentPage = totalPages;
        } else if (currentPage < 1) {
            currentPage = 1;
        }

        for (var i = 1; i <= totalPages; i++) {
            (function(i) {
                var button = document.createElement('button');
                button.innerText = i;
                button.onclick = function() {
                    currentPage = i; // Обновление currentPage при клике
                    GetPageFromTable(i, mainTable);
                    var buttons = navigationPanel.getElementsByTagName('button');
                    for (var j = 0; j < buttons.length; j++) {
                        buttons[j].classList.remove('active');
                    }
                    button.classList.add('active');
                };
                // Установка класса active для кнопки, соответствующей текущей странице
                if (i === currentPage) {
                    button.classList.add('active');
                }
                navigationPanel.appendChild(button);
            })(i);
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

function AttachDataSourceRowClick() {
    // Получаем все формы на странице
    var forms = document.querySelectorAll('form');

    // Перебираем каждую форму
    forms.forEach(function(form) {
        // Находим все элементы внутри формы с атрибутом data-source
        var elementsWithDataSources = form.querySelectorAll('[data-source]');

        // Перебираем найденные элементы
        elementsWithDataSources.forEach(function(element) {
            // Навешиваем событие onClick на каждый элемент
            element.onclick = function() {
                // Вызываем функцию DataSourceRowClick с аргументом - значением атрибута data-source
                DataSourceRowClick(element, form);
            };
        });
    });
}

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

    // Находим все заголовки в таблице
    var headers = row.closest('table').querySelectorAll('th');

    // Определяем индекс заголовка, который соответствует dataName
    var columnIndex = Array.from(headers).findIndex(header => header.textContent.trim() === dataName);

    // Проверяем, что индекс найден
    if (columnIndex !== -1) {
        // Находим ячейку в строке по индексу заголовка
        var selectedCell = row.cells[columnIndex];

        // Вставляем текст из ячейки в input элемент
        element.value = selectedCell.textContent;

        // Ручной вызов события change после программного изменения значения
        const event = new Event('change');
        element.dispatchEvent(event);

        // Вызываем функцию CloseModal с переданным элементом modal
        CloseModal(modal);
    } else {
        // Если ячейка не найдена, выводим сообщение об ошибке
        console.error('No matching header found for data-name');
    }
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

function BlockElementInput(element) {
    // Получаем все дочерние элементы input у element с атрибутом data-input-order
    const inputs = Array.from(element.querySelectorAll('input[data-input-order]'));

    // Сортируем input элементы по dataInputOrder
    inputs.sort((a, b) => a.getAttribute('data-input-order') - b.getAttribute('data-input-order'));

    // Переменная для отслеживания, должны ли мы разблокировать следующий input
    let unlockNext = true;

    // Флаг для проверки заполненности всех input элементов
    let allFilled = true;

    // Идем по всем input элементам
    for (let input of inputs) {
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

    // Находим кнопку с классом greenButton
    const greenButton = element.querySelector('.greenButton');

    if (greenButton) {
        // Если все input элементы заполнены, активируем кнопку, иначе блокируем
        greenButton.disabled = !allFilled;
    }
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
    employeeInput.type = 'number';
    employeeInput.id = 'Номер_сотрудника';
    employeeInput.placeholder = 'Подписавший сотрудник';
    employeeInput.setAttribute('name', 'Номер_сотрудника');
    employeeInput.setAttribute('data-source', 'Сотрудник');
    employeeInput.setAttribute('autocomplete', 'off');
    employeeInput.setAttribute('readonly', true);
    employeeInput.setAttribute('data-columns-order', 'Номер_сотрудника, Имя, Фамилия, Отчество');
    employeeInput.onfocus = function() {
        DataSourceRowClick(this);
    };
    modal.appendChild(employeeInput);

    const employeeLabel = document.createElement('label');
    employeeLabel.textContent = 'Подписавший сотрудник: ';
    employeeLabel.htmlFor = 'Номер_сотрудника';
    modal.insertBefore(employeeLabel, employeeInput);

    // Создаем и добавляем поля ввода для даты
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.id = 'Дата_подписания';
    dateInput.placeholder = 'Дата создания накладной';
    modal.appendChild(dateInput);

    const dateLabel = document.createElement('label');
    dateLabel.textContent = 'Дата создания накладной: ';
    dateLabel.htmlFor = 'Дата_подписания';
    modal.insertBefore(dateLabel, dateInput);

    // Создаем и добавляем select поле и его label
    const actSelectLabel = document.createElement('label');
    actSelectLabel.textContent = 'Укажите тип накладной: ';
    actSelectLabel.htmlFor = 'actType';
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

    buttonsContainer.appendChild(closeButton);
    buttonsContainer.appendChild(submitButton);

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
    SubmitActClick(modal);
    CloseModal(modal);
  });

  // Создаем кнопку закрыть
  var closeButton = document.createElement('button');
  closeButton.setAttribute('class', 'redButton');
  closeButton.textContent = 'Закрыть';
  closeButton.addEventListener('click', function() {
      CloseModal(modal);
  });

  modal.appendChild(buttonsContainer);
  buttonsContainer.appendChild(closeButton);
  buttonsContainer.appendChild(sendButton);
  document.body.appendChild(modal);
  CreateOverlay(modal);
}

function SubmitActClick(modal) {

    // Шаг 1: Получаем значения по id и отправляем fetch запрос
    const invoiceDateValue = document.getElementById('Дата_подписания').value;
    const invoiceEmployeeNumberValue = document.getElementById('Номер_сотрудника').value;

    const dataForInvoice = {
        "Дата_подписания": invoiceDateValue,
        "Номер_сотрудника": invoiceEmployeeNumberValue
    };

    // Зашифровываем слово "Накладная"
    const encodedInvoiceWord = encodeURIComponent('Накладная');

    // Отправляем fetch запрос
    fetch(`/addData/${encodedInvoiceWord}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataForInvoice)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        // После успешного создания накладной добавляем "Номер_накладной" в dataForModal
        const invoiceNumber = data["Номер_накладной"];
        if (invoiceNumber) {
            // Шаг 2: Извлекаем все input из modal, которые не являются radio и не disabled, и формируем JSON
            const inputs = modal.querySelectorAll('input');
            const dataForModal = {};

            inputs.forEach(input => {
                if (input.type !== 'radio' && !input.disabled) {
                    dataForModal[input.id] = input.value;
                }
            });

            // Добавляем "Номер_накладной" в dataForModal
            dataForModal["Номер_накладной"] = invoiceNumber;

            // Получаем id модального окна
            const modalId = modal.name;

            // Отправляем fetch запрос
            fetch(`/addData/${modalId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataForModal)
            })
            .then(response => response.json())
            .then(data => {
                GetPageFromTable(currentPage);
                console.log('Success:', data);
            })
            .catch(error => {
                alert(error.message);
                console.error('There has been a problem with your fetch operation:', error);
            });
        }
    })
    .catch(error => {
        alert(error.message);
        console.error('There has been a problem with your fetch operation:', error);
    });
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

    // Очищаем текущие строки таблицы
    while (ueMenuTable.rows.length > 1) {
      ueMenuTable.deleteRow(1);
    }

    // Добавляем новые строки в таблицу
    data.forEach(rowDataStr => {
      var rowData = JSON.parse(rowDataStr);  // Преобразуем строку JSON в объект
      var newRow = ueMenuTable.insertRow();

      order.forEach(columnName => {
        var newCell = newRow.insertCell();
        newCell.textContent = rowData[columnName] || '';
      });
    });
  })
  .catch(error => {
    console.error('Ошибка при получении данных с сервера:', error);
  });
}

function ModalCreateUE() {
    // Создаем окно
    const modal = document.createElement('div');
    modal.id = 'modalInvoice';
    modal.setAttribute('class', 'modal');
    document.body.appendChild(modal);

    CreateOverlay(modal);

    // Создаем и добавляем поля ввода для серийного номера
    const serialNumberInput = document.createElement('input');
    serialNumberInput.type = 'text';
    serialNumberInput.id = 'Серийный_номер';
    serialNumberInput.setAttribute('name', 'Серийный_номер');
    modal.appendChild(serialNumberInput);

    const serialNumberLabel = document.createElement('label');
    serialNumberLabel.textContent = 'Серийный номер: ';
    serialNumberLabel.htmlFor = 'Серийный_номер';
    modal.insertBefore(serialNumberLabel, serialNumberInput);

    // Создаем контейнер для кнопок
    const buttonsContainer = document.createElement('div');
    buttonsContainer.setAttribute('class', 'container_buttons');

    // Создаем кнопку закрыть
    const closeButton = document.createElement('button');
    closeButton.setAttribute('class', 'redButton');
    closeButton.textContent = 'Закрыть';
    closeButton.addEventListener('click', function() {
        CloseModal(modal);
    });

    // Создаем кнопку отправки
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Отправить';
    submitButton.className = 'greenButton';
    submitButton.addEventListener('click', function() {
        SubmitUEClick(modal);
    });

    // Добавляем кнопки в контейнер
    buttonsContainer.appendChild(closeButton);
    buttonsContainer.appendChild(submitButton);

    // Добавляем контейнер с кнопками в модальное окно
    modal.appendChild(buttonsContainer);
}

function SubmitUEClick(modal) {
  let data = {};

  const inputs = modal.querySelectorAll('input');
  inputs.forEach(input => {
    data[input.id] = input.value;
  });

  const jsonData = JSON.stringify(data);

  fetch('/addData/Учетная_единица', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: jsonData,
  })
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);

    const SerialNumberValue = modal.querySelector('#Серийный_номер').value;

    const newData = {
      Номер_накладной: document.getElementById('UEMenu_number').textContent,
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
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);

    // Close the modal using the CloseModal function
    CloseModal(modal);

    // Retrieve UEMenuNumberValue again
    const UEMenuNumberValue = document.getElementById('UEMenu_number').textContent;

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

    // Call the InvoiceRowClick function with the found row
    if (targetRow) {
      InvoiceRowClick(targetRow);
    }
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}





