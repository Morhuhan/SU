function toggleMenu(visible) {
    var menu = document.querySelector(".menu");
    menu.style.visibility = visible ? 'visible' : 'hidden';
}

function toggleSubMenu(element, visible) {
    var submenu = element.querySelector(".submenu");
    if (submenu) {
        submenu.style.visibility = visible ? 'visible' : 'hidden';
    }
}