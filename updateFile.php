<?php
// Получение данных из AJAX запроса
$data = json_decode(file_get_contents("php://input"), true);

// Путь к файлу на сервере
$filePath = $_SERVER['DOCUMENT_ROOT'] . '/files/sessions.json';

// Проверка наличия данных и запись их в файл
if ($data && isset($data['newContent'])) {
    $newContent = $data['newContent'];
    file_put_contents($filePath, $newContent);
    echo json_encode(array('success' => true));
} else {
    echo json_encode(array('success' => false, 'error' => 'Data not provided.'));
}
?>