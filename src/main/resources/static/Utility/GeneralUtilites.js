function toggleMenu(display) {
    var submenu = document.getElementById("submenu");
    submenu.style.display = display;
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

function enableStickyScrolling(elements) {
    elements.forEach(function(element) {
        var rect = element.getBoundingClientRect();
        var originalOffsetY = rect.top + window.pageYOffset;
        var originalOffsetX = rect.left + window.pageXOffset;

        var placeholder = document.createElement('div');
        placeholder.style.width = rect.width + 'px';
        placeholder.style.height = rect.height + 'px';
        placeholder.style.display = 'none';

        window.addEventListener('scroll', function() {
            if (window.pageYOffset > originalOffsetY) {
                if (!element.classList.contains('sticky')) {
                    element.classList.add('sticky');
                    element.style.left = originalOffsetX + 'px';
                    element.style.width = rect.width + 'px';
                    element.parentNode.insertBefore(placeholder, element);
                    placeholder.style.display = 'block';
                }
            } else {
                if (element.classList.contains('sticky')) {
                    element.classList.remove('sticky');
                    element.style.left = '';
                    element.style.width = '';
                    element.parentNode.removeChild(placeholder);
                    placeholder.style.display = 'none';
                }
            }
        });
    });
}







