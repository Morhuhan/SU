document.addEventListener('DOMContentLoaded', function() {
    var field = document.getElementById('edit_calibrationDate');
    var now = new Date();
    var formattedDate = now.getFullYear() + '-' +
                        ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
                        ('0' + now.getDate()).slice(-2) + ' ' +
                        ('0' + now.getHours()).slice(-2) + ':' +
                        ('0' + now.getMinutes()).slice(-2) + ':' +
                        ('0' + now.getSeconds()).slice(-2) + '.' +
                        ('00' + now.getMilliseconds()).slice(-3);
    field.value = formattedDate;
});

document.addEventListener('DOMContentLoaded', function() {
    var field = document.getElementById('create_calibrationDate');
    var now = new Date();
    var formattedDate = now.getFullYear() + '-' +
                        ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
                        ('0' + now.getDate()).slice(-2) + ' ' +
                        ('0' + now.getHours()).slice(-2) + ':' +
                        ('0' + now.getMinutes()).slice(-2) + ':' +
                        ('0' + now.getSeconds()).slice(-2) + '.' +
                        ('00' + now.getMilliseconds()).slice(-3);
    field.value = formattedDate;
});

