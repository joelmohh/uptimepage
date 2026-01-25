const loginButton = document.getElementById('loginButton');
if (loginButton) {
    loginButton.addEventListener('click', () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        async function login() {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
        })
        .then(async response => {
            if (!response.ok) {
                const errorData = await response.json();
                console.log(errorData);
                document.querySelector('.pass-incorect').style.display = 'block';
            }
            return response.json();
        })
        .then(data => {
            localStorage.setItem('token', data.token);
            window.location.href = '/dashboard';
        })
        .catch(err => {
            console.error('Login error:', err);
        });
        }

        login();
    });
}