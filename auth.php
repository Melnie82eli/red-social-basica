<?php
header('Content-Type: application/json');
include 'conexion.php';

$action = $_POST['action'] ?? '';
$response = array();

if ($action === 'register') {
    $nombre = $_POST['nombre'] ?? '';
    $correo = $_POST['correo'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($nombre) || empty($correo) || empty($password)) {
        $response['success'] = false;
        $response['message'] = "Todos los campos son obligatorios";
    } else {
        $stmt = $conn->prepare("INSERT INTO usuarios (nombre, correo, password) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $nombre, $correo, $password);

        if ($stmt->execute()) {
            $response['success'] = true;
            $response['message'] = "Registro exitoso";
        } else {
            $response['success'] = false;
            $response['message'] = "Error: " . $stmt->error;
        }
        $stmt->close();
    }
} elseif ($action === 'login') {
    $correo = $_POST['correo'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($correo) || empty($password)) {
        $response['success'] = false;
        $response['message'] = "Correo y contraseña son obligatorios";
    } else {
        $stmt = $conn->prepare("SELECT id, nombre FROM usuarios WHERE correo = ? AND password = ?");
        $stmt->bind_param("ss", $correo, $password);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            $response['success'] = true;
            $response['message'] = "Inicio exitoso";
        } else {
            $response['success'] = false;
            $response['message'] = "Usuario o contraseña incorrectos";
        }
        $stmt->close();
    }
} else {
    $response['success'] = false;
    $response['message'] = "Acción no válida";
}

$conn->close();
echo json_encode($response);
?>
