<?php
header('Content-Type: application/json');
session_start();
include 'db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

$current_user_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    if ($action === 'get_posts') {
        $filter = $_GET['filter'] ?? 'all';
        $sql = "SELECT p.*, u.nombre as usuario_nombre, u.imagen as usuario_imagen 
                FROM publicaciones p 
                JOIN usuarios u ON p.usuario_id = u.id";
        
        if ($filter === 'my') {
            $sql .= " WHERE p.usuario_id = ?";
            $stmt = $pdo->prepare($sql . " ORDER BY p.fecha_publicacion DESC");
            $stmt->execute([$current_user_id]);
        } else {
            $stmt = $pdo->prepare($sql . " ORDER BY p.fecha_publicacion DESC");
            $stmt->execute();
        }
        
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Obtener comentarios para cada post
        foreach ($posts as &$post) {
            $post['es_mio'] = ($post['usuario_id'] == $current_user_id);
            
            $stmt_c = $pdo->prepare("SELECT c.*, u.nombre as usuario_nombre 
                                     FROM comentarios c 
                                     JOIN usuarios u ON c.usuario_id = u.id 
                                     WHERE c.publicacion_id = ? 
                                     ORDER BY c.fecha_comentario ASC");
            $stmt_c->execute([$post['id']]);
            $post['comentarios'] = $stmt_c->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode($posts);

    } elseif ($action === 'create_post' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $contenido = $_POST['contenido'] ?? '';
        $imagen = null;

        if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === 0) {
            $type = $_FILES['imagen']['type'];
            $data = file_get_contents($_FILES['imagen']['tmp_name']);
            $imagen = 'data:' . $type . ';base64,' . base64_encode($data);
        }

        if ($contenido || $imagen) {
            $stmt = $pdo->prepare("INSERT INTO publicaciones (usuario_id, contenido, imagen) VALUES (?, ?, ?)");
            $stmt->execute([$current_user_id, $contenido, $imagen]);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Contenido vacío']);
        }

    } elseif ($action === 'edit_post' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $post_id = $data['id'] ?? 0;
        $contenido = $data['contenido'] ?? '';

        if ($post_id && $contenido) {
            $stmt = $pdo->prepare("UPDATE publicaciones SET contenido = ? WHERE id = ? AND usuario_id = ?");
            $stmt->execute([$contenido, $post_id, $current_user_id]);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
        }

    } elseif ($action === 'delete_post' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $post_id = $data['id'] ?? 0;

        $stmt = $pdo->prepare("DELETE FROM publicaciones WHERE id = ? AND usuario_id = ?");
        $stmt->execute([$post_id, $current_user_id]);
        echo json_encode(['success' => true]);

    } elseif ($action === 'add_comment' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $post_id = $data['post_id'] ?? 0;
        $contenido = $data['contenido'] ?? '';

        if ($post_id && $contenido) {
            $stmt = $pdo->prepare("INSERT INTO comentarios (publicacion_id, usuario_id, contenido) VALUES (?, ?, ?)");
            $stmt->execute([$post_id, $current_user_id, $contenido]);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false]);
        }

    } elseif ($action === 'getUser') {
        $stmt = $pdo->prepare("SELECT nombre, correo, imagen FROM usuarios WHERE id = ?");
        $stmt->execute([$current_user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            echo json_encode(['success' => true, 'data' => $user]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        }

    } elseif ($action === 'updatePhoto') {
        $imagen = $_POST['imagen'] ?? '';
        
        if (empty($imagen)) {
            echo json_encode(['success' => false, 'message' => 'No se recibió ninguna imagen']);
        } else {
            $stmt = $pdo->prepare("UPDATE usuarios SET imagen = ? WHERE id = ?");
            if ($stmt->execute([$imagen, $current_user_id])) {
                echo json_encode(['success' => true, 'message' => 'Foto actualizada correctamente']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error al actualizar la foto']);
            }
        }

    } else {
        echo json_encode(['error' => 'Acción no válida']);
    }

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
