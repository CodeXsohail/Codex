
let menuIcon = document.querySelector('#menu-icon');
let navlist = document.querySelector('.navlist');

menuIcon.onclick = () => {
    menuIcon.classList.toggle('bx-x');
    navlist.classList.toggle('show');
}

const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
  input.addEventListener('focus', () => {
    setTimeout(() => {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300); 
  });
});