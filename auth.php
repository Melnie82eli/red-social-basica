<?php
// Iniciar buffer de salida para capturar cualquier error o texto no deseado
ob_start();

// Configuración de errores
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
// ini_set('error_log', 'php_errors.log'); // Log errores to file

header('Content-Type: application/json');
session_start();


// Incluir conexión (cualquier output aquí será capturado por ob_start)
include 'conexion.php';

$response = array();
$action = $_POST['action'] ?? '';

try {
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

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
                session_start();
                $_SESSION['user_id'] = $stmt->insert_id;
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
            // Primero verificamos si el correo existe
            $stmt = $conn->prepare("SELECT id, nombre, password FROM usuarios WHERE correo = ?");
            $stmt->bind_param("s", $correo);
            $stmt->execute();
            $stmt->store_result();

            if ($stmt->num_rows > 0) {
                $stmt->bind_result($id, $nombre, $stored_password);
                $stmt->fetch();
                
                // Aquí deberíamos usar password_verify si las contraseñas estuvieran hasheadas
                // Como están en texto plano (según el esquema anterior), comparamos directamente
                if ($password === $stored_password) {
                    session_start();
                    $_SESSION['user_id'] = $id;
                    $response['success'] = true;
                    $response['message'] = "Inicio exitoso";
                } else {
                    $response['success'] = false;
                    $response['message'] = "Contraseña incorrecta";
                    $response['error_code'] = "wrong_password";
                }
            } else {
                $response['success'] = false;
                $response['message'] = "No se tiene ninguna cuenta registrada con este correo";
                $response['error_code'] = "user_not_found";
            }
            $stmt->close();
        }
    } elseif ($action === 'logout') {
        session_start();
        session_destroy();
        $response['success'] = true;
        $response['message'] = "Sesión cerrada";
    } else {
        $response['success'] = false;
        $response['message'] = "Acción no válida";
    }
    
    $conn->close();

} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = "Error del servidor: " . $e->getMessage();
    error_log($e->getMessage());
}

// Limpiar el buffer de salida (eliminar cualquier HTML/error previo)
ob_end_clean();

// Enviar respuesta JSON limpia
echo json_encode($response);
?>
