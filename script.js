document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
});

function showFeed() {
    document.getElementById('main-feed').style.display = 'block';
    document.getElementById('feed-container').style.display = 'block';
    document.getElementById('profile-section').style.display = 'none';
    document.getElementById('nav-home').classList.add('active');
    document.getElementById('nav-profile').classList.remove('active');
}

function showProfile() {
    document.getElementById('main-feed').style.display = 'none';
    document.getElementById('feed-container').style.display = 'none';
    document.getElementById('profile-section').style.display = 'block';
    document.getElementById('nav-home').classList.remove('active');
    document.getElementById('nav-profile').classList.add('active');
}

async function loadUserProfile() {
    const formData = new FormData();
    formData.append('action', 'getUser');

    try {
        const response = await fetch('api.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            document.getElementById('profile-name').textContent = data.data.nombre;
            document.getElementById('profile-email').textContent = data.data.correo;
            if (data.data.imagen) {
                document.getElementById('profile-pic').src = data.data.imagen;
                document.getElementById('modal-profile-pic').src = data.data.imagen;
            }
        } else {
            console.error('Error loading profile:', data.message);
            if (data.message === 'No autorizado') {
                window.location.href = 'index.html';
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function openPhotoModal() {
    document.getElementById('photo-modal').style.display = 'block';
}

function closePhotoModal() {
    document.getElementById('photo-modal').style.display = 'none';
}
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
});

function showFeed() {
    document.getElementById('main-feed').style.display = 'block';
    document.getElementById('feed-container').style.display = 'block';
    document.getElementById('profile-section').style.display = 'none';
    document.getElementById('nav-home').classList.add('active');
    document.getElementById('nav-profile').classList.remove('active');
}

function showProfile() {
    document.getElementById('main-feed').style.display = 'none';
    document.getElementById('feed-container').style.display = 'none';
    document.getElementById('profile-section').style.display = 'block';
    document.getElementById('nav-home').classList.remove('active');
    document.getElementById('nav-profile').classList.add('active');
}

async function loadUserProfile() {
    const formData = new FormData();
    formData.append('action', 'getUser');

    try {
        const response = await fetch('api.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            document.getElementById('profile-name').textContent = data.data.nombre;
            document.getElementById('profile-email').textContent = data.data.correo;
            if (data.data.imagen) {
                document.getElementById('profile-pic').src = data.data.imagen;
                document.getElementById('modal-profile-pic').src = data.data.imagen;
            }
        } else {
            console.error('Error loading profile:', data.message);
            if (data.message === 'No autorizado') {
                window.location.href = 'index.html';
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function openPhotoModal() {
    document.getElementById('photo-modal').style.display = 'block';
}

function closePhotoModal() {
    document.getElementById('photo-modal').style.display = 'none';
}

async function handleProfileUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = async function (e) {
            const base64Image = e.target.result;

            // Update UI immediately
            document.getElementById('profile-pic').src = base64Image;
            document.getElementById('modal-profile-pic').src = base64Image;

            // Send to server
            const formData = new FormData();
            formData.append('action', 'updatePhoto');
            formData.append('imagen', base64Image);

            try {
                const response = await fetch('api.php', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (data.success) {
                    alert('Foto actualizada correctamente');
                    closePhotoModal();
                } else {
                    alert('Error al actualizar la foto: ' + data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al subir la imagen');
            }
        }

        reader.readAsDataURL(file);
    }
}

async function logout() {
    const formData = new FormData();
    formData.append('action', 'logout');

    try {
        const response = await fetch('auth.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            window.location.href = 'index.html';
        } else {
            alert('Error al cerrar sesión');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cerrar sesión');
    }
}

// Expose functions to global scope to ensure HTML onclick works
window.showFeed = showFeed;
window.showProfile = showProfile;
window.openPhotoModal = openPhotoModal;
window.closePhotoModal = closePhotoModal;
window.handleProfileUpload = handleProfileUpload;
window.logout = logout;

// Close modal if clicked outside
window.onclick = function (event) {
    const modal = document.getElementById('photo-modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
