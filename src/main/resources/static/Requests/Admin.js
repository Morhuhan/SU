function ListFaultySeats() {
    fetch('/admin/ListFaultySeats', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        createModalTable(data);
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function ListFaultyEquipment() {
    fetch('/admin/ListFaultyEquipment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        createModalTable(data);
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function ListSeatsByEquipmentType() {

    var idEquipmentType = document.getElementById('idEquipmentType').value;

    fetch('/admin/' + idEquipmentType + '/ListSeatsByEquipmentType', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        createModalTable(data);
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });
}


function createModalTable(data) {
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.style.display = 'block';
    modal.style.position = 'fixed';
    modal.style.zIndex = '1';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.overflow = 'auto';
    modal.style.backgroundColor = 'rgba(0,0,0,0.4)';

    // Создаем контейнер для модального содержимого
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fefefe';
    modalContent.style.margin = '15% auto';
    modalContent.style.padding = '20px';
    modalContent.style.border = '1px solid #888';
    modalContent.style.width = '80%';

    // Создаем таблицу для данных
    const table = document.createElement('table');
    table.style.width = '100%';
    table.border = '1';

    // Создаем заголовки таблицы
    const thead = document.createElement('thead');
    let headerRow = document.createElement('tr');
    Object.keys(data[0]).forEach(key => {
        let th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Заполняем таблицу данными
    const tbody = document.createElement('tbody');
    data.forEach(item => {
        let row = document.createElement('tr');
        Object.values(item).forEach(value => {
            let td = document.createElement('td');
            td.textContent = value;
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // Добавляем таблицу в модальное окно
    modalContent.appendChild(table);
    modal.appendChild(modalContent);

    // Добавляем модальное окно в body
    document.body.appendChild(modal);

    // Добавляем возможность закрыть модальное окно
    modal.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
}