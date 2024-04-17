function toggleMenu() {
    var submenu = document.getElementById("submenu");
    if (submenu.style.display === "none" || submenu.style.display === "") {
        submenu.style.display = "block";
    } else {
        submenu.style.display = "none";
    }
}

function ShowDeleteForm() {
    document.getElementById("forms").style.display = "block";
    document.getElementById("deleteForm").style.display = "block";
    document.getElementById("editForm").style.display = "none";
    document.getElementById("createForm").style.display = "none";
}

function ShowEditForm() {
    document.getElementById("forms").style.display = "block";
    document.getElementById("deleteForm").style.display = "none";
    document.getElementById("editForm").style.display = "block";
    document.getElementById("createForm").style.display = "none";
}

function ShowCreateForm() {
    document.getElementById("forms").style.display = "block";
    document.getElementById("deleteForm").style.display = "none";
    document.getElementById("editForm").style.display = "none";
    document.getElementById("createForm").style.display = "block";
}

function checkDataFormat(date) {
    var regex = /^\d{4}\-\d{2}\-\d{2}$/;
    return regex.test(date) ? 1 : 0;
}

function checkTimestampFormat(timestamp) {
    var regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/;
    return regex.test(timestamp) ? 1 : 0;
}

function wrongDateAlert() {
    alert("Неверный формат даты. Пожалуйста, введите дату в правильном формате: YYYY-MM-DD ");
}

function wrongTimestampAlert() {
alert("Неверный формат timestamp. Пожалуйста, введите дату и время в правильном формате: 'YYYY-MM-DD HH:MM:SS.mmm', где YYYY обозначает год, MM — месяц, DD — день, HH — часы, MM — минуты, SS — секунды, а mmm — миллисекунды.");
}

