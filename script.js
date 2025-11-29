const API_URL = 'api.php';
let currentView = 'all';

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadPosts();



    // Setup image preview
    const imageInput = document.getElementById('post-image');
    if (imageInput) {
        imageInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    document.getElementById('image-preview').src = e.target.result;
                    document.getElementById('image-preview-container').style.display = 'block';
                    document.getElementById('file-name').textContent = file.name;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // Setup remove image button
    const removeImageBtn = document.getElementById('remove-image');
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', function () {
            document.getElementById('post-image').value = '';
            document.getElementById('image-preview-container').style.display = 'none';
            document.getElementById('file-name').textContent = '';
        });
    }

    // Setup post form submission
    const postForm = document.getElementById('post-form');
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const content = document.getElementById('post-content').value;
            const imageFile = document.getElementById('post-image').files[0];

            if (!content.trim() && !imageFile) {
                alert('Escribe algo o sube una imagen');
                return;
            }

            const formData = new FormData();
            formData.append('action', 'create_post');
            formData.append('contenido', content);
            if (imageFile) {
                formData.append('imagen', imageFile);
            }

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                if (result.success) {
                    document.getElementById('post-content').value = '';
                    document.getElementById('post-image').value = '';
                    document.getElementById('image-preview-container').style.display = 'none';
                    document.getElementById('file-name').textContent = '';
                    loadPosts();
                } else {
                    alert('Error al publicar: ' + (result.error || 'Desconocido'));
                }
            } catch (error) {
                console.error('Error creating post:', error);
                alert('Error al publicar');
            }
        });
    }

    // Setup logout button
    const logoutBtn = document.getElementById('nav-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});

function showFeed() {
    document.getElementById('main-feed').style.display = 'block';
    document.getElementById('feed-container').style.display = 'block';
    document.getElementById('profile-section').style.display = 'none';
    document.getElementById('nav-home').classList.add('active');
    document.getElementById('nav-profile').classList.remove('active');
    currentView = 'all';
    loadPosts();
}

function showProfile() {
    // Show create post box in profile too, as per user request
    document.getElementById('main-feed').style.display = 'block';
    document.getElementById('feed-container').style.display = 'block';
    document.getElementById('profile-section').style.display = 'block';
    document.getElementById('nav-home').classList.remove('active');
    document.getElementById('nav-profile').classList.add('active');
    currentView = 'my';
    loadPosts();
}

async function loadUserProfile() {
    const formData = new FormData();
    formData.append('action', 'getUser');

    try {
        const response = await fetch(API_URL, {
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

async function loadPosts() {
    const container = document.getElementById('feed-container');

    try {
        const response = await fetch(`${API_URL}?action=get_posts&filter=${currentView}`);
        const text = await response.text();

        // Check if server returned raw PHP code
        if (text.trim().startsWith('<?php')) {
            alert('ERROR: PHP no ejecutado.');
            return;
        }

        let posts;
        try {
            posts = JSON.parse(text);
        } catch (e) {
            console.error('Invalid JSON:', text);
            return;
        }

        container.innerHTML = '';

        if (!Array.isArray(posts) || posts.length === 0) {
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

    // Escape content for safety
    const safeContent = post.contenido.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeContentForEdit = post.contenido.replace(/'/g, "\\'");

    const deleteBtn = post.es_mio
        ? `
            <button class="action-btn" onclick="editPost(${post.id}, '${safeContentForEdit}')">✏️ Editar</button>
            <button class="action-btn delete-btn" onclick="deletePost(${post.id})">🗑️ Eliminar</button>
          `
        : '';

    const imageHtml = post.imagen
        ? `<img src="${post.imagen}" class="post-image" alt="Post image">`
        : '';

    let commentsHtml = '';
    if (post.comentarios) {
        post.comentarios.forEach(comment => {
            commentsHtml += `
                <div class="comment">
                    <img src="https://ui-avatars.com/api/?name=${comment.usuario_nombre}&background=random" class="comment-avatar">
                    <div class="comment-body">
                        <div class="comment-author">${comment.usuario_nombre}</div>
                        <div class="comment-text">${comment.contenido.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                    </div>
                </div>
            `;
        });
    }

    const avatarSrc = post.usuario_imagen
        ? post.usuario_imagen
        : `https://ui-avatars.com/api/?name=${post.usuario_nombre}&background=random`;

    div.innerHTML = `
        <div class="post-header">
            <img src="${avatarSrc}" class="avatar">
            <div class="post-info">
                <h3>${post.usuario_nombre}</h3>
                <span class="post-time">${timeAgo(post.fecha_publicacion)}</span>
            </div>
            <div style="margin-left: auto; display: flex; gap: 10px;">
                ${deleteBtn}
            </div>
        </div>
        <div class="post-content" id="post-content-${post.id}">
            ${safeContent}
        </div>
        ${imageHtml}
        <div class="post-actions">
            <button class="action-btn" onclick="toggleComments(${post.id})">💬 Comentarios (${post.comentarios ? post.comentarios.length : 0})</button>
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

    contentDiv.innerHTML = `
        <textarea id="edit-textarea-${id}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ddd;">${currentContent}</textarea>
        <div style="margin-top: 5px; text-align: right;">
            <button class="btn btn-secondary" onclick="loadPosts()" style="padding: 4px 8px; font-size: 0.8rem;">Cancelar</button>
            <button class="btn" onclick="saveEdit(${id})" style="padding: 4px 8px; font-size: 0.8rem;">Guardar</button>
        </div>
    `;
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

async function addComment(event, postId) {
    event.preventDefault();
    const form = event.target;
    const input = form.querySelector('input');
    const content = input.value;

    try {
        const response = await fetch(`${API_URL}?action=add_comment`, {
            method: 'POST',
            body: JSON.stringify({ post_id: postId, contenido: content }),
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.success) {
            loadPosts(); // Reload to show new comment
        } else {
            alert('Error al comentar');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
    }
}

async function deletePost(id) {
    if (!confirm('¿Estás seguro de eliminar esta publicación?')) return;

    try {
        const response = await fetch(`${API_URL}?action=delete_post`, {
            method: 'POST',
            body: JSON.stringify({ id: id }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        if (data.success) {
            loadPosts();
        } else {
            alert('Error al eliminar');
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
                const response = await fetch(API_URL, {
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
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error:', error);
        window.location.href = 'index.html'; // Fallback
    }
}

// Expose functions to global scope
window.showFeed = showFeed;
window.showProfile = showProfile;
window.openPhotoModal = openPhotoModal;
window.closePhotoModal = closePhotoModal;
window.handleProfileUpload = handleProfileUpload;
window.logout = logout;
window.editPost = editPost;
window.saveEdit = saveEdit;
window.deletePost = deletePost;
window.toggleComments = toggleComments;
window.addComment = addComment;

// Close modal if clicked outside
window.onclick = function (event) {
    const modal = document.getElementById('photo-modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
