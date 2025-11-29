document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');

    
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const formData = new FormData(this);
            formData.append('action', 'register');

            try {
                const response = await fetch('auth.php', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (data.success) {
                    alert('Registro exitoso. Redirigiendo al inicio de sesión...');
                    window.location.href = 'index.html';
                } else {
                    alert('Error en el registro: ' + data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Ocurrió un error al procesar el registro.');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const formData = new FormData(this);
            formData.append('action', 'login');

            try {
                const response = await fetch('auth.php', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (data.success) {
                    window.location.href = 'indexPubli.html';
                } else {
                    if (data.error_code === 'user_not_found') {
                        alert(data.message + ", registrate primero");
                        window.location.href = 'registro.html';
                    } else {
                        alert('Error: ' + data.message);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Ocurrió un error al iniciar sesión.');
            }
        });
    }
});
