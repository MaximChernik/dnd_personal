<?php
// Путь к файлу на сервере
$filePath = $_SERVER['DOCUMENT_ROOT'] . '/files/sessions.json';

// Получение времени последней модификации файла
$lastModifiedTime = filemtime($filePath);

// Получение времени последней проверки пользователя
$userLastCheckedTime = isset($_SESSION['lastCheckedTime']) ? $_SESSION['lastCheckedTime'] : 0;

// Сравнение времени последней модификации файла и времени последней проверки пользователя
if ($lastModifiedTime > $userLastCheckedTime) {
    $_SESSION['lastCheckedTime'] = time(); // Обновляем время последней проверки пользователя
    echo json_encode(['needsUpdate' => true]);
} else {
    echo json_encode(['needsUpdate' => false]);
}
?>