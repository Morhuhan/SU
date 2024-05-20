function toggleMenu(display) {
    var submenu = document.getElementById("submenu");
    submenu.style.display = display;
}

function setupFormToggle(formId) {
    var forms = document.querySelectorAll('#forms form');
    forms.forEach(function(form) {
        form.style.display = 'none';
    });
    document.getElementById(formId).style.display = 'block';
}











