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
<<<<<<< HEAD
        const response = await fetch('api.php', {
=======
        const response = await fetch(`${API_URL}?action=get_posts&filter=${currentView}`);
        const text = await response.text();

        // Check if server returned raw PHP code
        if (text.trim().startsWith('<?php')) {
            alert('ERROR: El servidor no está ejecutando PHP. \n\nAsegúrate de abrir este proyecto a través de localhost (XAMPP), no abriendo el archivo index.html directamente.');
            container.innerHTML = '<p style="text-align:center; color:red;">Error: PHP no se está ejecutando.</p>';
            return;
        }

        let posts;
        try {
            posts = JSON.parse(text);
        } catch (e) {
            console.error('Invalid JSON:', text);
            throw new Error('Respuesta del servidor no válida');
        }

        container.innerHTML = '';

        if (posts.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#666;">No hay publicaciones aún.</p>';
            return;
        }

        posts.forEach(post => {
            const postElement = createPostElement(post);
            container.appendChild(postElement);
        });

    } catch (error) {
        console.error('Error loading posts:', error);
        container.innerHTML = '<p style="text-align:center; color:red;">Error al cargar publicaciones.</p>';
    }
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return "hace " + Math.floor(interval) + " años";
    interval = seconds / 2592000;
    if (interval > 1) return "hace " + Math.floor(interval) + " meses";
    interval = seconds / 86400;
    if (interval > 1) return "hace " + Math.floor(interval) + " días";
    interval = seconds / 3600;
    if (interval > 1) return "hace " + Math.floor(interval) + " horas";
    interval = seconds / 60;
    if (interval > 1) return "hace " + Math.floor(interval) + " minutos";
    return "hace unos segundos";
}

function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'post';

    const deleteBtn = post.es_mio
        ? `
            <button class="action-btn" onclick="editPost(${post.id}, '${post.contenido.replace(/'/g, "\\'")}')">✏️ Editar</button>
            <button class="action-btn delete-btn" onclick="deletePost(${post.id})">🗑️ Eliminar</button>
          `
        : '';

    const imageHtml = post.imagen
        ? `<img src="${post.imagen}" class="post-image" alt="Post image">`
        : '';

    let commentsHtml = '';
    post.comentarios.forEach(comment => {
        commentsHtml += `
            <div class="comment">
                <img src="https://ui-avatars.com/api/?name=${comment.usuario_nombre}&background=random" class="comment-avatar">
                <div class="comment-body">
                    <div class="comment-author">${comment.usuario_nombre}</div>
                    <div class="comment-text">${comment.contenido}</div>
                </div>
            </div>
        `;
    });

    div.innerHTML = `
        <div class="post-header">
            <img src="https://ui-avatars.com/api/?name=${post.usuario_nombre}&background=random" class="avatar">
            <div class="post-info">
                <h3>${post.usuario_nombre}</h3>
                <span class="post-time">${timeAgo(post.fecha_publicacion)}</span>
            </div>
            <div style="margin-left: auto; display: flex; gap: 10px;">
                ${deleteBtn}
            </div>
        </div>
        <div class="post-content" id="post-content-${post.id}">
            ${post.contenido}
        </div>
        ${imageHtml}
        <div class="post-actions">
            <button class="action-btn" onclick="toggleComments(${post.id})">💬 Comentarios (${post.comentarios.length})</button>
        </div>
        <div class="comments-section" id="comments-${post.id}">
            <div class="comments-list">
                ${commentsHtml}
            </div>
            <form class="comment-form" onsubmit="addComment(event, ${post.id})">
                <input type="text" class="comment-input" placeholder="Escribe un comentario..." required>
                <button type="submit" class="btn" style="padding: 8px 12px;">Enviar</button>
            </form>
        </div>
    `;
    return div;
}

function editPost(id, currentContent) {
    const contentDiv = document.getElementById(`post-content-${id}`);
    const originalHtml = contentDiv.innerHTML;

    contentDiv.innerHTML = `
        <textarea id="edit-textarea-${id}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ddd;">${currentContent}</textarea>
        <div style="margin-top: 5px; text-align: right;">
            <button class="btn btn-secondary" onclick="cancelEdit(${id}, '${currentContent.replace(/'/g, "\\'")}')" style="padding: 4px 8px; font-size: 0.8rem;">Cancelar</button>
            <button class="btn" onclick="saveEdit(${id})" style="padding: 4px 8px; font-size: 0.8rem;">Guardar</button>
        </div>
    `;
}

function cancelEdit(id, originalContent) {
    const contentDiv = document.getElementById(`post-content-${id}`);
    contentDiv.innerHTML = originalContent;
}

async function saveEdit(id) {
    const newContent = document.getElementById(`edit-textarea-${id}`).value;

    try {
        const response = await fetch(`${API_URL}?action=edit_post`, {
            method: 'POST',
            body: JSON.stringify({ id: id, contenido: newContent }),
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.success) {
            loadPosts();
        } else {
            alert('Error al editar: ' + (result.error || 'Desconocido'));
        }
    } catch (error) {
        console.error('Error editing post:', error);
    }
}

function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    section.classList.toggle('active');
}

async function deletePost(id) {
    if (!confirm('¿Estás seguro de eliminar esta publicación?')) return;

    try {
        const response = await fetch(`${API_URL}?action=delete_post`, {
>>>>>>> 01f4a77bc7b466f4a156fde1cd91fc5b87ed8791
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
