document.addEventListener('DOMContentLoaded', function() {
    GetPageFromTable(1);
    UpdateNavigationPanel();
});

function UpdateNavigationPanel() {

    var itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
    var navigationPanel = document.getElementById('navigationPanel');

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

        if (currentPage > totalPages) {
            currentPage = totalPages;
            GetPageFromTable(currentPage);
        }

        for (var i = 1; i <= totalPages; i++) {
            var button = document.createElement('button');
            button.innerText = i;
            button.onclick = (function(i) {
                return function() {
                    GetPageFromTable(i);
                };
            })(i);
            navigationPanel.appendChild(button);
        }
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function SubmitDeleteForm(event) {
    event.preventDefault();

    var formData = new FormData(document.getElementById('deleteForm'));
    var jsonString = CreateFetchJson(formData);

    var url = '/deleteData/' + encodeURIComponent(tableName);

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: jsonString
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.error);
            });
        }
        else {
            GetPageFromTable(currentPage);
            UpdateNavigationPanel();
        }
    })
    .catch(error => {
        alert(error.message);
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function SubmitEditForm(event) {
    event.preventDefault();

    var formData = new FormData(document.getElementById('editForm'));
    var jsonString = CreateFetchJson(formData);

    var url = '/editData/' + encodeURIComponent(tableName);

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: jsonString
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.error);
            });
        }
        else {
            GetPageFromTable(currentPage);
        }
    })
    .catch(error => {
        alert(error.message);
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function SubmitCreateForm(event) {
    event.preventDefault();

    var formData = new FormData(document.getElementById('createForm'));
    var objectData = {};

    formData.forEach(function(value, key){
        objectData[key] = value;
    });

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
        return response.json();
    })
    .then(data => {
        GetPageFromTable(currentPage);
        UpdateNavigationPanel();
    })
    .catch(error => {
        alert(error.message);
        console.error('There has been a problem with your fetch operation:', error);
    });
}

function CreateFetchJson(formData) {
    var objectData = {};
    var uniqueKeys = {};

    formData.forEach(function(value, key){
        if(uniqueKeysArray.includes(key)) {
            uniqueKeys[key] = value;
        } else {
            objectData[key] = value;
        }
    });

    return JSON.stringify({ data: objectData, uniqueKeys: uniqueKeys });
}

function GetPageFromTable(pageNumber) {

    currentPage = pageNumber;

    var itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
    var tableBody = document.querySelector('#table table tbody');

    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }

    var requestData = {
        table: tableName,
        page: pageNumber,
        itemsPerPage: itemsPerPage
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
        var parsedData = result.data.map(jsonRow => JSON.parse(jsonRow));

        if (uniqueKeysArray.length > 0 && parsedData.length > 0) {
            var sortKey = uniqueKeysArray[0];
            parsedData.sort(function(a, b) {
                if (a[sortKey] < b[sortKey]) {
                    return -1;
                }
                if (a[sortKey] > b[sortKey]) {
                    return 1;
                }
                return 0;
            });
        }

        parsedData.forEach(jsonRow => {
            AddRowToTable(jsonRow);
        });
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
        alert(error.message);
    });
}

function TableRowClick() {
    var cells = this.cells;
    var editForm = document.getElementById("editForm");
    var deleteForm = document.getElementById("deleteForm");

    if (editForm.style.display === 'block') {
        editForm.querySelectorAll("input").forEach(function(input) {
            var fieldName = input.name; // Используем атрибут name вместо data-edit-field
            var cell = Array.from(cells).find(cell => cell.getAttribute("data-field-name") === fieldName);
            if (cell) {
                input.value = cell.textContent;
            }
        });
    } else if (deleteForm.style.display === 'block') {
        var deleteField = deleteForm.querySelector("[data-delete-field]");
        if (deleteField) {
            var fieldName = deleteField.getAttribute("data-delete-field");
            var cell = Array.from(cells).find(cell => cell.getAttribute("data-field-name") === fieldName);
            if (cell) {
                deleteField.value = cell.textContent;
            }
        }
    }

    var tableRows = document.querySelectorAll('#table table tr');
    tableRows.forEach(function(otherRow) {
        otherRow.classList.remove("selected");
    });
    this.classList.add("selected");
}

function AddRowToTable(jsonRow) {
    var jsonData = (typeof jsonRow === 'string') ? JSON.parse(jsonRow) : jsonRow;

    var tableBody = document.querySelector('#table table tbody');
    var row = tableBody.insertRow();

    order.forEach(function(key) {
        var value = jsonData[key];
        var cell = row.insertCell();
        cell.textContent = value || '';
        cell.setAttribute('data-field-name', key);
    });

    row.addEventListener('click', TableRowClick);
}




