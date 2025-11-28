<?php
header('Content-Type: application/json');
session_start();
include 'conexion.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
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
