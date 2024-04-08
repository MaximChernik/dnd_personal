let charactersCharacteristics = {};
let characterIdCounter = generateUUID();
let currentEditId = null;
let currentEditField = null;
let globalItems = [];

loadGlobalItems();

document.getElementById('charImageInput').addEventListener('change', function() {
    // Здесь можно добавить логику обработки выбранного файла, если нужно
    console.log('Файл выбран:', this.files[0]);
});

function readImageFile(input) {
    const file = input.files[0];
    if (file) {
        document.getElementById('selectCharLabel').textContent = 'Портрет: ' + file.name;
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageBase64 = e.target.result;
            const characterImage = document.getElementById('charImageInput');
            characterImage.src = imageBase64;
        };
        reader.readAsDataURL(file);
    }
}

function openFilePicker() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const characterData = JSON.parse(e.target.result);
            loadCharacterFromFile(characterData);
        };
        reader.readAsText(file);
    });
    fileInput.click();
}

function generateUUID() {
  let dt = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  return uuid;
}

function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

// Закрытие модального окна при клике на крестик
document.getElementsByClassName('close')[0].onclick = function() {
    const modal = document.getElementById('editModal');
    modal.style.display = 'none';
}

// Закрытие модального окна при клике вне его области
// window.onclick = function(event) {
//     const modal = document.getElementById('editModal');
//     if (event.target == modal) {
//         modal.style.display = 'none';
//     }
// }

function loadGlobalItems(path) {
    fetch('files/globalInventory.json')
        .then(response => response.json())
        .then(data => {
            globalItems = data.items;
        })
        .catch(error => 
            console.error('Ошибка загрузки файла globalInventory.json:', 
            error));
}

function openModal() {
    document.getElementById('modal').style.display = 'block';
    playSound("coinAudio", 1);
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

function playSound(elementName, volume) {
    var audio = document.getElementById(elementName);
    audio.volume = volume;
    audio.play();
}

function matchItemIcon(firstObject, secondObject) {
    // Перебор элементов в массиве items первого объекта
firstObject.items.forEach(item => {
    // Поиск соответствующего элемента во втором объекте по id
    let matchedItem = secondObject.find(i => i.id === item.id);
  
    // Если найден элемент во втором объекте, присвоить его значение iconBase64 элементу в первом объекте
    if (matchedItem) {
      item.iconBase64 = matchedItem.iconBase64;
    }
});
  
return firstObject;
}

function addCharacter() {
    const charName = document.getElementById('charNameInput').value;
    let charHp = parseInt(document.getElementById('charHpInput').value);
    let charMaxHp = parseInt(document.getElementById('charMaxHpInput').value);
    const charShield = parseInt(document.getElementById('charMaxHpInput').value);
    
    if (charName && !isNaN(charHp) && !isNaN(charMaxHp) && charHp <= charMaxHp) {
        const charactersContainer = document.getElementById('charactersContainer');
        const characterBox = document.createElement('div');
        characterBox.classList.add('character-box', 'fade-in-animation');
        characterBox.id = 'character' + characterIdCounter;
        characterIdCounter = generateUUID();
        charactersContainer.appendChild(characterBox);

        const characterBorder = document.createElement('div');
        characterBorder.classList.add('character-border');
        characterBox.appendChild(characterBorder);

        characterBorder.appendChild(createNameBlock(charName, characterBox));
        characterBorder.appendChild(createIconBlock(charName));
        characterBorder.appendChild(createHealthBlock(charHp, charMaxHp, characterBox));
        characterBorder.appendChild(createCharacteristicsBlock(characterBox));
        characterBorder.appendChild(createShieldBlock(characterBox, charShield));
        characterBorder.appendChild(createSaveButton(characterBox));
        characterBorder.appendChild(createDeleteButton(characterBox));
        characterBorder.appendChild(createInventoryButton(characterBox));
        
        updateHPProgress(characterBox);
        saveCharacteristics(characterBox.id);
        playSound("cardAudio", 1);
        closeModal();
    } else {
        alert('Пожалуйста, заполните все поля корректно.');
    }
}

// Функция создания кнопки "Открыть инвентарь" в виде иконки
function createInventoryButton(characterBox) {
    const openInventoryButton = document.createElement('button');
    openInventoryButton.classList.add('open-inventory-button');
    openInventoryButton.addEventListener('click', function() {
        playSound("inventoryAudio", 1);
        openInventory(characterBox.id); // Вызываем функцию открытия инвентаря для соответствующей карточки
    });

    // Создаем иконку для кнопки (вместо "path/to/icon.png" подставьте путь к вашей иконке)
    const icon = document.createElement('img');
    icon.src = 'img/inventory.png'; // Путь к иконке
    icon.alt = 'Inventory Icon'; // Альтернативный текст для иконки
    openInventoryButton.appendChild(icon);

    return openInventoryButton;
}

// Функция открытия модального окна с инвентарем для конкретной карточки
function openInventory(characterId) {
    const inventoryModal = document.getElementById('inventoryModal');
    const inventoryContent = document.getElementById('inventoryContent');
    // Получаем список айтемов из charactersCharacteristics[charackterId][items]
    const itemsList = charactersCharacteristics[characterId].items || [];

    // Очищаем содержимое инвентаря перед загрузкой новых данных
    inventoryContent.innerHTML = '';

    // Отображаем список айтемов в инвентаре
    itemsList.forEach(item => {
        const itemElement = document.createElement('div');

        // Создаем элемент для иконки айтема
        const iconElement = document.createElement('img');
        iconElement.src = item.iconBase64; // Предполагается, что в объекте айтема есть свойство "iconBase64"
        iconElement.alt = item.name; // Альтернативный текст для иконки
        iconElement.classList.add('item-icon'); // Добавляем класс для стилизации иконки
        itemElement.appendChild(iconElement);

        // Добавляем название и описание айтема
        const itemName = document.createElement('p');
        itemName.textContent = item.name;
        const itemDescription = document.createElement('p');
        itemDescription.textContent = item.description;

        itemElement.appendChild(itemName);
        itemElement.appendChild(itemDescription);

        // Создаем кнопку удаления айтема
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('modal-btn', 'inventory-btn');
        deleteBtn.textContent = 'Удалить';
        deleteBtn.onclick = function() {
            removeItemFromInventory(characterId, item.id); // Вызываем функцию удаления айтема из инвентаря
        };
        itemElement.appendChild(deleteBtn);

        inventoryContent.appendChild(itemElement);
    });

    inventoryModal.style.display = 'block'; // Показываем модальное окно при открытии инвентаря

    // Кнопка для закрытия модального окна
    const closeBtn = document.getElementsByClassName('close-modal')[0];
    closeBtn.onclick = function() {
        playSound("inventoryAudio", 1);
        inventoryModal.style.display = 'none'; // Закрываем модальное окно при нажатии на кнопку закрытия
    };

    // Кнопка "Добавить предмет"
    const addItemBtn = document.getElementById('addItemBtn');
    addItemBtn.classList.add('modal-btn');
    addItemBtn.onclick = function() {
        // Открываем модальное окно с глобальными айтемами для выбора
        openGlobalItemsModal(characterId);
    };

    // Закрытие модального окна при клике вне контента
    window.onclick = function(event) {
        if (event.target === inventoryModal) {
            playSound("inventoryAudio", 1);
            inventoryModal.style.display = 'none';
        }
    };
}

// Функция для удаления айтема из инвентаря по его ID
function removeItemFromInventory(characterId, itemId) {
    const characterInventory = charactersCharacteristics[characterId].items;
    const index = characterInventory.findIndex(item => item.id === itemId);
    if (index !== -1) {
        characterInventory.splice(index, 1);
        updateInventory(characterId); // Обновляем инвентарь после удаления айтема
    }
}

// Функция открытия модального окна с глобальными айтемами для выбора
function openGlobalItemsModal(characterId) {
    const globalItemsModal = document.getElementById('globalItemsModal');
    const globalItemsContent = document.getElementById('globalItemsContent');

    // Очищаем содержимое модального окна перед загрузкой списка глобальных айтемов
    globalItemsContent.innerHTML = '';
    globalItems = globalItems || [];

    // Отображаем список глобальных айтемов в модальном окне
    globalItems.forEach(item => {
        const itemElement = document.createElement('div');

        // Создаем элемент для иконки айтема
        const iconElement = document.createElement('img');
        iconElement.src = item.iconBase64;
        iconElement.alt = item.name;
        iconElement.classList.add('item-icon');
        itemElement.appendChild(iconElement);

        // Добавляем название и описание айтема
        const itemName = document.createElement('p');
        itemName.textContent = item.name;
        const itemDescription = document.createElement('p');
        itemDescription.textContent = item.description;

        itemElement.appendChild(itemName);
        itemElement.appendChild(itemDescription);

        // Добавляем кнопку "Выбрать предмет" для каждого айтема
        const selectItemBtn = document.createElement('button');
        selectItemBtn.classList.add('modal-btn', 'inventory-btn');
        selectItemBtn.textContent = 'Добавить';
        selectItemBtn.onclick = function() {
            // Добавляем выбранный айтем в временную переменную
            charactersCharacteristics[characterId].items = charactersCharacteristics[characterId].items || [];
            charactersCharacteristics[characterId].items.push(item);
            // Обновляем инвентарь после добавления айтема
            updateInventory(characterId);
            // Закрываем модальное окно с глобальными айтемами
            globalItemsModal.style.display = 'none';
        };

        itemElement.appendChild(selectItemBtn);
        globalItemsContent.appendChild(itemElement);
    });

    globalItemsModal.style.display = 'block'; // Показываем модальное окно с глобальными айтемами

    // Кнопка для закрытия модального окна
    const closeBtn = document.getElementsByClassName('close-modal')[1];
    closeBtn.onclick = function() {
        globalItemsModal.style.display = 'none'; // Закрываем модальное окно при нажатии на кнопку закрытия
    };
}

// Функция для обновления инвентаря после добавления айтема
function updateInventory(characterId) {
    // Обновляем содержимое инвентаря на странице
    const inventoryContent = document.getElementById('inventoryContent');
    inventoryContent.innerHTML = ''; // Очищаем содержимое

    // Отображаем список временных айтемов в инвентаре
    charactersCharacteristics[characterId].items.forEach(item => {
        const itemElement = document.createElement('div');

        // Создаем элемент для иконки айтема
        const iconElement = document.createElement('img');
        iconElement.src = item.iconBase64;
        iconElement.alt = item.name;
        iconElement.classList.add('item-icon');
        itemElement.appendChild(iconElement);

        // Добавляем название и описание айтема
        const itemName = document.createElement('p');
        itemName.textContent = item.name;
        const itemDescription = document.createElement('p');
        itemDescription.textContent = item.description;

        // Создаем кнопку удаления айтема
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('modal-btn', 'inventory-btn');
        deleteBtn.textContent = 'Удалить';
        deleteBtn.onclick = function() {
            removeItemFromInventory(characterId, item.id); // Вызываем функцию удаления айтема из инвентаря
        };

        itemElement.appendChild(itemName);
        itemElement.appendChild(itemDescription);
        itemElement.appendChild(deleteBtn);

        inventoryContent.appendChild(itemElement);
    });
}

// Функция для создания кнопки сохранения
function createSaveButton(characterBox) {
    const saveBtn = document.createElement('button');
    saveBtn.classList.add('save-btn');
    saveBtn.onclick = function() {
        saveCharacterToFile(characterBox.id);
    };

    const saveBtnImg = document.createElement('img');
    saveBtnImg.src = 'img/save_icon.png';
    saveBtnImg.alt = 'Save';
    saveBtnImg.width = '20';
    saveBtnImg.height = '20';
    saveBtn.appendChild(saveBtnImg);

    return saveBtn;
}

// Функция для создания кнопки удаления
function createDeleteButton(characterBox) {
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.onclick = function() {
        deleteCharacter(characterBox);
    };

    const deleteImg = document.createElement('img');
    deleteImg.src = 'img/delete_icon.png';
    deleteImg.alt = 'Delete';
    deleteImg.width = '20';
    deleteImg.height = '20';
    deleteBtn.appendChild(deleteImg);

    return deleteBtn;
}

// Функция для создания блока с именем персонажа
function createNameBlock(charName, characterBox) {
    const nameLabel = document.createElement('span');
    nameLabel.classList.add('name-label');
    nameLabel.textContent = charName;
    nameLabel.onclick = function() {
        openEditModal(characterBox.id, ".name-label", "Изменить имя персонажа");
    };
    return nameLabel;
}

// Функция для создания блока с портретом персонажа
function createIconBlock(charName) {
    const characterIconContainer = document.createElement('div');
    characterIconContainer.classList.add('character-icon-container');

    const characterImage = document.createElement('img');
    characterImage.src = document.getElementById('charImageInput').src;
    characterImage.base64 = document.getElementById('charImageInput').src;
    characterImage.alt = charName;
    characterImage.classList.add('character-image');
    characterIconContainer.appendChild(characterImage);

    return characterIconContainer;
}

// Функция для создания блока здоровья
function createHealthBlock(charHp, charMaxHp, characterBox) {
    // Создаем элементы блока здоровья
    const hpBar = document.createElement('div');
    hpBar.classList.add('hp-bar');
    const hpProgress = document.createElement('div');
    hpProgress.classList.add('hp-progress');
    hpBar.appendChild(hpProgress);

    const hpContainer = document.createElement('div');
    hpContainer.classList.add('hp-container');

    const hpRow = document.createElement('div');
    hpRow.classList.add('hp-row');

    const heartIconCol = document.createElement('div');
    heartIconCol.classList.add('hp-col');
    const heartIcon = document.createElement('img');
    heartIcon.src = 'img/heart_icon.png';
    heartIcon.alt = 'Сердце';
    heartIcon.classList.add('heart-icon');
    heartIcon.onclick = function() {
        openEditModal(characterBox.id, ".hp-column-value", "Изменить значение ХП");
    };
    heartIconCol.appendChild(heartIcon);
    hpRow.appendChild(heartIconCol);

    const hpValueCol = document.createElement('div');
    hpValueCol.classList.add('hp-col', 'hp-value-wrap');
    const hpValue = document.createElement('div');
    hpValue.classList.add('hp-value');
    hpValue.textContent = 'ХП: ';
    hpValue.onclick = function() {
        openEditModal(characterBox.id, ".hp-column-value", "Изменить значение ХП");
    };
    hpValueCol.appendChild(hpValue);
    const hpValueInput = document.createElement('div');
    hpValueInput.classList.add('hp-column-value');
    hpValueInput.innerText = charHp;
    hpValueInput.onclick = function() {
        openEditModal(characterBox.id, ".hp-column-value", "Изменить значение ХП");
    };
    hpValueCol.appendChild(hpValueInput);
    hpRow.appendChild(hpValueCol);

    const hpBtnsCol = document.createElement('div');
    hpBtnsCol.classList.add('hp-col', 'hp-btn-wrap');

    const hpDecreaseBtn = document.createElement('button');
    hpDecreaseBtn.textContent = '-';
    hpDecreaseBtn.classList.add('hp-btn');
    hpDecreaseBtn.onclick = function() {
        if (charHp > 0) {
            charHp--;
            hpValue.textContent = 'ХП: ';
            hpValueInput.textContent = charHp;
            updateHPProgress(characterBox);
            playSound("slashAudio", 0.3);
        }
    };
    hpBtnsCol.appendChild(hpDecreaseBtn);

    const hpIncreaseBtn = document.createElement('button');
    hpIncreaseBtn.textContent = '+';
    hpIncreaseBtn.classList.add('hp-btn');
    hpIncreaseBtn.onclick = function() {
        charHp = parseInt(characterBox.querySelector('.hp-column-value').textContent);
        charMaxHp = parseInt(characterBox.querySelector('.maxhp-column-value').textContent)
        charHp++;
        hpValue.textContent = 'ХП: ';
        hpValueInput.textContent = charHp;
        if (charHp > charMaxHp) {
            charHp = charMaxHp;
            hpValue.textContent = 'ХП: ';
            hpValueInput.textContent = charHp;
        }
        playSound("potionAudio", 1);
        updateHPProgress(characterBox);
    };
    hpBtnsCol.appendChild(hpIncreaseBtn);
    hpRow.appendChild(hpBtnsCol);
    hpContainer.appendChild(hpRow);

    const maxHpRow = document.createElement('div');
    maxHpRow.classList.add('hp-row');

    const maxHpLabelCol = document.createElement('div');
    maxHpLabelCol.classList.add('hp-col', 'max-hp-label-wrap');

    const maxHpLabel = document.createElement('div');
    maxHpLabel.classList.add('max-hp-label');
    maxHpLabel.textContent = 'Макс ХП: ';
    maxHpLabel.onclick = function() {
        openEditModal(characterBox.id, ".maxhp-column-value", "Изменить макс. значение ХП");
    };
    maxHpLabelCol.appendChild(maxHpLabel);
    const  maxHpValueInput = document.createElement('div');
    maxHpValueInput.classList.add('maxhp-column-value');
    maxHpValueInput.innerText = charMaxHp;
    maxHpValueInput.onclick = function() {
        openEditModal(characterBox.id, ".maxhp-column-value", "Изменить макс. значение ХП");
    };
    maxHpLabelCol.appendChild(maxHpValueInput);
    maxHpRow.appendChild(maxHpLabelCol);

    const maxHpBtnsCol = document.createElement('div');
    maxHpBtnsCol.classList.add('hp-col', 'max-hp-btn-warp');

    const maxHpDecreaseBtn = document.createElement('button');
    maxHpDecreaseBtn.textContent = '-';
    maxHpDecreaseBtn.classList.add('hp-btn');
    maxHpDecreaseBtn.onclick = function() {
        if (charMaxHp > 0) {
            charMaxHp--;
            maxHpLabel.textContent = 'Макс ХП: ';
            maxHpValueInput.textContent = charMaxHp;

            if (charHp > charMaxHp) {
                charHp = charMaxHp;
                hpValueInput.textContent = charHp;
            }
            updateHPProgress(characterBox);
        }
    };
    maxHpBtnsCol.appendChild(maxHpDecreaseBtn);

    const maxHpIncreaseBtn = document.createElement('button');
    maxHpIncreaseBtn.textContent = '+';
    maxHpIncreaseBtn.classList.add('hp-btn');
    maxHpIncreaseBtn.onclick = function() {
        charMaxHp++;
        maxHpLabel.textContent = 'Макс ХП: ';
        maxHpValueInput.textContent = charMaxHp;
        updateHPProgress(characterBox);
    };
    maxHpBtnsCol.appendChild(maxHpIncreaseBtn);

    maxHpRow.appendChild(maxHpBtnsCol);
    hpContainer.appendChild(maxHpRow);

    // Добавляем блок здоровья в блок персонажа
    const characterBorder = characterBox.querySelector('.character-border');
    characterBorder.appendChild(hpContainer);
    characterBorder.appendChild(hpBar);

    return hpContainer;
}

// Функция для создания блока характеристик
function createCharacteristicsBlock(characterBox) {
    const characteristicsContainer = document.createElement('div');
    characteristicsContainer.classList.add('characteristic-container');
    
    const characteristicsIcon = document.createElement('img');
    characteristicsIcon.src = 'img/char_icon.png';
    characteristicsIcon.alt = 'Характеристики';
    characteristicsIcon.classList.add('characteristics-icon');
    characteristicsIcon.onclick = function() {
        openCharacteristicsModal(characterBox.id);
    };
    characteristicsContainer.appendChild(characteristicsIcon);

    const characteristicsButton = document.createElement('label');
    characteristicsButton.classList.add('characteristic-label');
    characteristicsButton.textContent = 'Характеристики';
    characteristicsButton.onclick = function() {
        openCharacteristicsModal(characterBox.id);
    };
    characteristicsContainer.appendChild(characteristicsButton);
    
    return characteristicsContainer;
}

// Функция для создания блока с иконкой щита
function createShieldBlock(characterBox, charShield) {
    const shieldIconContainer = document.createElement('div');
    shieldIconContainer.classList.add('shield-icon-container');

    const shieldIcon = document.createElement('img');
    shieldIcon.classList.add('shield-icon');
    shieldIcon.src = 'img/shield_icon.png';
    shieldIcon.alt = 'Щит';
    shieldIcon.style.width = '100%';
    shieldIcon.onclick = function() {
        openEditModal(characterBox.id, ".shield-value", "Изменить значение КБ");
    };
    shieldIconContainer.appendChild(shieldIcon);

    const shieldValue = document.createElement('div');
    shieldValue.classList.add('shield-value');
    shieldValue.textContent = charShield;
    shieldValue.onclick = function() {
        openEditModal(characterBox.id, ".shield-value", "Изменить значение КБ");
    };
    shieldIconContainer.appendChild(shieldValue);

    const shieldInput = document.createElement('input');
    shieldInput.type = 'number';
    shieldInput.classList.add('shield-input');
    shieldInput.value = charShield;
    shieldInput.min = '1';
    shieldInput.step = '1';
    shieldInput.style.display = 'none';
    shieldIconContainer.appendChild(shieldInput);

    return shieldIconContainer;
}

function loadCharacterFromFile(characterData) {
    const charNameInput = document.getElementById('charNameInput');
    const charHpInput = document.getElementById('charHpInput');
    const charMaxHpInput = document.getElementById('charMaxHpInput');
    const charShieldInput = document.getElementById('charShieldInput');
    const imageInput = document.getElementById('charImageInput');
    const base64Data = characterData.image;

    charNameInput.value = characterData.name || '';
    charHpInput.value = characterData.hp || '';
    charMaxHpInput.value = characterData.maxHp || '';
    charShieldInput.value = characterData.shield || '';
    imageInput.src = base64Data;

    const characterId = 'character' + characterIdCounter;
    if (!charactersCharacteristics[characterId]) {
        charactersCharacteristics[characterId] = {};
    }

    for (const characteristic in characterData) {
        if (characteristic !== 'name' && 
            characteristic !== 'hp' && 
            characteristic !== 'maxHp' && 
            characteristic !== 'image' && 
            characteristic !== 'shield') {
                charactersCharacteristics[characterId][characteristic] = characterData[characteristic];
        }
    }

    addCharacter();
    saveCharacteristics(characterId, characterData);
}

function saveCharacterToFile(characterId) {
    const characterName = document.getElementById(characterId).querySelector('.name-label').textContent;
    const characterHp = parseInt(document.getElementById(characterId).querySelector('.hp-column-value').textContent);
    const characterMaxHp = parseInt(document.getElementById(characterId).querySelector('.maxhp-column-value').textContent);
    const characterShield = parseInt(document.getElementById(characterId).querySelector('.shield-value').textContent);
    const characterImage = document.getElementById(characterId).querySelector('.character-image').base64;

    const characterData = {
        name: characterName,
        hp: characterHp,
        maxHp: characterMaxHp,
        shield: characterShield,
        strength: charactersCharacteristics[characterId]?.strength || '',
        dexterity: charactersCharacteristics[characterId]?.dexterity || '',
        constitution: charactersCharacteristics[characterId]?.constitution || '',
        intelligence: charactersCharacteristics[characterId]?.intelligence || '',
        wisdom: charactersCharacteristics[characterId]?.wisdom || '',
        charisma: charactersCharacteristics[characterId]?.charisma || '',
        notes: charactersCharacteristics[characterId]?.notes || '',
        image: characterImage,
        items: charactersCharacteristics[characterId]?.items || []
    };

    // Проход по элементам массива items и присвоение значений
    characterData.items.forEach(item => {
        item.iconBase64 = ""; // Проставляем пустое значение для iconBase64
    });

    const blob = new Blob([JSON.stringify(characterData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = characterId + '.json';
    a.click();
    URL.revokeObjectURL(url);
    playSound("diceAudio", 1);
    charactersCharacteristics[characterId] = matchItemIcon(charactersCharacteristics[characterId], globalItems);
}

function openCharacteristicsModal(characterId) {
    const modal = document.getElementById('characteristicsModal');
    modal.style.display = 'block';

    // Устанавливаем атрибут onclick для кнопки "Сохранить"
    const saveCharacteristicsButton = document.getElementById('saveCharacteristicsButton');
    saveCharacteristicsButton.setAttribute('onclick', `saveCharacteristics('${characterId}')`);

    // Заполняем поля модального окна с данными из charactersCharacteristics для указанного персонажа
    document.getElementById('strengthInput').value = charactersCharacteristics[characterId]?.strength || '';
    document.getElementById('dexterityInput').value = charactersCharacteristics[characterId]?.dexterity || '';
    document.getElementById('constitutionInput').value = charactersCharacteristics[characterId]?.constitution || '';
    document.getElementById('intelligenceInput').value = charactersCharacteristics[characterId]?.intelligence || '';
    document.getElementById('wisdomInput').value = charactersCharacteristics[characterId]?.wisdom || '';
    document.getElementById('charismaInput').value = charactersCharacteristics[characterId]?.charisma || '';
    document.getElementById('notesInput').value = charactersCharacteristics[characterId]?.notes || '';
    playSound("paperAudio", 1);
}

// Функция для сохранения характеристик и заметок персонажа
function saveCharacteristics(characterId, characterData) {
    // Получаем значения характеристик из модального окна
    const strength = characterData ? characterData.strength : document.getElementById('strengthInput').value;
    const dexterity = characterData ? characterData.dexterity : document.getElementById('dexterityInput').value;
    const constitution = characterData ? characterData.constitution : document.getElementById('constitutionInput').value;
    const intelligence = characterData ? characterData.intelligence : document.getElementById('intelligenceInput').value;
    const wisdom =  characterData ? characterData.wisdom : document.getElementById('wisdomInput').value;
    const charisma = characterData ? characterData.charisma : document.getElementById('charismaInput').value;
    const notes = characterData ? characterData.notes : document.getElementById('notesInput').value;
    const items = characterData && characterData.items  
        ? characterData.items 
        : charactersCharacteristics[characterId]
            ? charactersCharacteristics[characterId].items ? charactersCharacteristics[characterId].items: []
            : [];
        ;
    // Сохраняем характеристики в объекте charactersCharacteristics для данного персонажа
    charactersCharacteristics[characterId] = {
        strength,
        dexterity,
        constitution,
        intelligence,
        wisdom,
        charisma,
        notes,
        items
    };
    charactersCharacteristics[characterId] = matchItemIcon(charactersCharacteristics[characterId], globalItems);
    calculateAndDisplayModifiers(charactersCharacteristics[characterId], characterId);
    playSound("diceAudio", 1);
    closeModal();
}

function calculateAndDisplayModifiers(characteristics, characterId) {
    if (characteristics) {
        let characterBox = document.getElementById(characterId);
        const modifiers = calculateModifiers(characteristics);

        displayModifiers(modifiers, characterBox);
    }
}

function calculateModifiers(characteristics) {
    // Вычисляем модификаторы
    const strengthModifier = { 
        name: "Сила",
        value: Math.floor((characteristics.strength - 10) / 2)
    };
    const dexterityModifier = { 
        name: "Ловкость",
        value: Math.floor((characteristics.dexterity - 10) / 2)
    };
    const constitutionModifier = { 
        name: "Выносливость",
        value: Math.floor((characteristics.constitution - 10) / 2)
    };
    const intelligenceModifier = { 
        name: "Интеллект",
        value: Math.floor((characteristics.intelligence - 10) / 2)
    };
    const wisdomModifier = { 
        name: "Мудрость",
        value: Math.floor((characteristics.wisdom - 10) / 2)
    };
    const charismaModifier = { 
        name: "Харизма",
        value: Math.floor((characteristics.charisma - 10) / 2)
    };

    return { 
        strengthModifier, 
        dexterityModifier, 
        constitutionModifier, 
        intelligenceModifier, 
        wisdomModifier,
        charismaModifier
    };
}

// Функция для отображения модификаторов на карточке персонажа
function displayModifiers(modifiers, characterBox) {
    if (characterBox) {
        // Удаляем существующий блок с модификаторами, если он есть
        const existingModifiersBlock = characterBox.querySelector('.modifiers-container');
        if (existingModifiersBlock) {
            existingModifiersBlock.remove();
        }

        // Создаем контейнер для модификаторов
        const modifiersContainer = document.createElement('div');
        modifiersContainer.classList.add('modifiers-container');
        
        // Добавляем элементы с модификаторами в контейнер
        for (const modifier in modifiers) {
            const modifierElement = document.createElement('div');
            modifierElement.classList.add('modifier');
            
            if (modifiers[modifier].name === 'Харизма') {
                    modifierElement.classList.add('modifier-move');
            }
            
            modifierElement.textContent = `${modifiers[modifier].name}: ${modifiers[modifier].value}`;
            modifiersContainer.appendChild(modifierElement);
        }

        // Добавляем контейнер с модификаторами к карточке персонажа
        characterBox.appendChild(modifiersContainer);
    }
}

function deleteCharacter(element) {
    const characterBox = element.closest('.character-box');
    characterBox.classList.add('fade-out-animation'); // Добавляем класс анимации
    characterBox.addEventListener('animationend', () => {
        characterBox.remove(); // Удаляем карточку после завершения анимации
    });
    playSound("deleteAudio", 1);
    playSound("cardAudio", 1);
}

function updateHPProgress(characterBox) {
    const hpProgress = characterBox.querySelector('.hp-progress');
    const charHp = parseInt(characterBox.querySelector('.hp-column-value').textContent);
    const charMaxHp = parseInt(characterBox.querySelector('.maxhp-column-value').textContent);
    const percent = (charHp / charMaxHp) * 100;
    hpProgress.style = `width: ${percent}%`;
}

function openEditModal(id, field, title) {
    currentEditId = id;
    currentEditField = field;
    const modal = document.getElementById('editModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalInput = document.getElementById('modalInput');

    modalTitle.textContent = title;
    modalInput.value = document.getElementById(id).querySelector(field).textContent;
    playSound("paperAudio", 1);
    modal.style.display = 'block';
}

// Функция для увеличения значения инпута на 1
function incrementValue(inputId) {
    const input = document.getElementById(inputId);
    input.value = parseInt(input.value) + 1;
}

// Функция для уменьшения значения инпута на 1
function decrementValue(inputId) {
    const input = document.getElementById(inputId);
    const currentValue = parseInt(input.value);
    if (currentValue > 0) {
        input.value = currentValue - 1;
    }
}

// Сохранение данных из модального окна
function saveModalData() {
    const modalInput = document.getElementById('modalInput').value;

    document.getElementById(currentEditId).querySelector(currentEditField).textContent = modalInput;
    updateHPProgress(document.getElementById(currentEditId));
    playSound("diceAudio", 1);
    closeModal();
}