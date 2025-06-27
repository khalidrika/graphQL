let usernameInput = document.querySelector('.username');
let passwordInput = document.querySelector('.password');
let showPasswordButton = document.querySelector('.password-button');
let face = document.querySelector('.face');

passwordInput.addEventListener('focus', () => {
    document.querySelectorAll('.hand').forEach(hand => hand.classList.add('hide'));
    // document.querySelector('.tongue').classList.remove('breath');
});

passwordInput.addEventListener('blur', () => {
    document.querySelectorAll('.hand').forEach(hand => hand.classList.remove('hide', 'peek'));
    // document.querySelector('.tongue').classList.add('breath');
});

// usernameInput.addEventListener('focus', () => {
//     let length = Math.min(usernameInput.value.length - 16, 19);
//     face.style.setProperty('--rotate-head', `${-length}deg`);
// });

usernameInput.addEventListener('blur', () => {
    face.style.setProperty('--rotate-head', '0deg');
});

// usernameInput.addEventListener('input', event => {
//     let length = Math.min(event.target.value.length - 16, 19);
//     face.style.setProperty('--rotate-head', `${-length}deg`);
// });

showPasswordButton.addEventListener('click', () => {
    const type = passwordInput.type === 'text' ? 'password' : 'text';
    passwordInput.type = type;
    document.querySelectorAll('.hand').forEach(hand => {
        hand.classList.toggle('hide', type === 'password');
        hand.classList.toggle('peek', type === 'text');
    });
});
