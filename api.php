<?php
header('Content-Type: application/json');
session_start();
include 'conexion.php';

<<<<<<< HEAD
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
=======
$action = $_GET['action'] ?? '';

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
            // Ya no calculamos fecha relativa aquí, lo hará JS
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
    } else {
        echo json_encode(['error' => 'Acción no válida']);
    }
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
>>>>>>> 01f4a77bc7b466f4a156fde1cd91fc5b87ed8791
}

$user_id = $_SESSION['user_id'];
$action = $_POST['action'] ?? '';
$response = array();

if ($action === 'getUser') {
    $stmt = $conn->prepare("SELECT nombre, correo, imagen FROM usuarios WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $response['success'] = true;
        $response['data'] = $row;
    } else {
        $response['success'] = false;
        $response['message'] = 'Usuario no encontrado';
    }
    $stmt->close();

} elseif ($action === 'updatePhoto') {
    $imagen = $_POST['imagen'] ?? '';
    
    if (empty($imagen)) {
        $response['success'] = false;
        $response['message'] = 'No se recibió ninguna imagen';
    } else {
        $stmt = $conn->prepare("UPDATE usuarios SET imagen = ? WHERE id = ?");
        $stmt->bind_param("si", $imagen, $user_id);
        
        if ($stmt->execute()) {
            $response['success'] = true;
            $response['message'] = 'Foto actualizada correctamente';
        } else {
            $response['success'] = false;
            $response['message'] = 'Error al actualizar la foto: ' . $stmt->error;
        }
        $stmt->close();
    }
} else {
    $response['success'] = false;
    $response['message'] = 'Acción no válida';
}

$conn->close();
echo json_encode($response);
?>
