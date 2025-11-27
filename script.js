const API_URL = 'api.php';
let currentView = 'all'; // 'all' or 'my'

document.addEventListener('DOMContentLoaded', () => {
    loadPosts();

    // File input handler to show filename and preview
    document.getElementById('post-image').addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const preview = document.getElementById('image-preview');
                const container = document.getElementById('image-preview-container');
                preview.src = e.target.result;
                container.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });

    // Remove image handler
    document.getElementById('remove-image').addEventListener('click', function () {
        document.getElementById('post-image').value = '';
        document.getElementById('image-preview-container').style.display = 'none';
        document.getElementById('image-preview').src = '';
    });

    // Create Post Handler
    document.getElementById('post-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const content = document.getElementById('post-content').value;
        const image = document.getElementById('post-image').files[0];

        if (!content && !image) return;

        const formData = new FormData();
        formData.append('contenido', content);
        if (image) formData.append('imagen', image);

        try {
            const response = await fetch(`${API_URL}?action=create_post`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                document.getElementById('post-form').reset();
                document.getElementById('image-preview-container').style.display = 'none';
                loadPosts();
            } else {
                alert('Error al publicar: ' + result.error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
});

function showFeed() {
    currentView = 'all';
    document.getElementById('nav-home').classList.add('active');
    document.getElementById('nav-profile').classList.remove('active');
    loadPosts();
}

function showProfile() {
    currentView = 'my';
    document.getElementById('nav-home').classList.remove('active');
    document.getElementById('nav-profile').classList.add('active');
    loadPosts();
}

async function loadPosts() {
    const container = document.getElementById('feed-container');
    container.innerHTML = '<p style="text-align:center; color:#666;">Cargando...</p>';

    try {
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
        ? `<button class="action-btn delete-btn" onclick="deletePost(${post.id})">🗑️ Eliminar</button>`
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
            ${deleteBtn}
        </div>
        <div class="post-content">
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

function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    section.classList.toggle('active');
}

async function deletePost(id) {
    if (!confirm('¿Estás seguro de eliminar esta publicación?')) return;

    try {
        const response = await fetch(`${API_URL}?action=delete_post`, {
            method: 'POST',
            body: JSON.stringify({ id: id }),
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.success) {
            loadPosts();
        }
    } catch (error) {
        console.error('Error deleting post:', error);
    }
}

async function addComment(event, postId) {
    event.preventDefault();
    const input = event.target.querySelector('input');
    const content = input.value;

    try {
        const response = await fetch(`${API_URL}?action=add_comment`, {
            method: 'POST',
            body: JSON.stringify({ post_id: postId, contenido: content }),
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.success) {
            input.value = '';
            loadPosts(); // Reload to show new comment (could be optimized to just append)
        }
    } catch (error) {
        console.error('Error adding comment:', error);
    }
}
