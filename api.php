<?php
session_start();

// CONFIGURACIÓN DE BASE DE DATOS
$host = 'localhost';
$dbname = 'redsocial';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['error' => "Error de conexión: " . $e->getMessage()]));
}

// SIMULACIÓN DE SESIÓN (Usuario ID 1)
if (!isset($_SESSION['usuario_id'])) {
    $_SESSION['usuario_id'] = 1;
}
$current_user_id = $_SESSION['usuario_id'];

header('Content-Type: application/json');

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
}
?>
