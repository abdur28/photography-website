// Getting hamburguer menu in small screens
const menu = document.getElementById("menu");
const ulMenu = document.getElementById("ulMenu");

function menuToggle() {
  menu.classList.toggle("h-32");
}

// Browser resize listener
window.addEventListener("resize", menuResize);

// Resize menu if user changing the width with responsive menu opened
function menuResize() {
  // First get the size from the window
  const window_size = window.innerWidth || document.body.clientWidth;
  if (window_size > 640) {
    menu.classList.remove("h-32");
  }
}

var logo = document.getElementById('logo');

if (window.location.pathname !== '/') {
  // Create a new anchor element
  var anchorElement = document.createElement('a');
  anchorElement.href = '/';
  anchorElement.className = 'text-2xl font-dancingscript font-bold';
  anchorElement.textContent = 'Jerry J photography';

  // Append the anchor element to the logo
  logo.appendChild(anchorElement);
} else {
  // Create a new h1 element
  var headingElement = document.createElement('h1');
  headingElement.className = 'text-2xl font-dancingscript font-bold opacity-0';
  headingElement.textContent = 'Jerry J photography';

  // Append the h1 element to the logo
  logo.appendChild(headingElement);
}



