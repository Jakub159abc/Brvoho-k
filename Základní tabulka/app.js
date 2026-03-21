// Globální proměnné
let workbook = null;
let worksheet = null;
let headers = [];
let data = [];
let selectedRowIndex = -1;
let originalData = [];

// Načtení souboru
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('fileName').textContent = `Načteno: ${file.name}`;
    document.getElementById('searchInput').disabled = false;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            workbook = XLSX.read(data, { type: 'array' });
            
            // Načtení prvního listu
            const firstSheetName = workbook.SheetNames[0];
            worksheet = workbook.Sheets[firstSheetName];
            
            // Parsování dat
            parseExcelData();
            
            // Zobrazení všech rostlin ze sloupce B
            displayAllHerbsFromColumnB();
            
            // Povolení vyhledávání
            document.getElementById('searchInput').focus();
        } catch (error) {
            alert('Chyba při načítání souboru: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
});

// Parsování Excel dat
function parseExcelData() {
    // Konverze na JSON s hlavičkami
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) {
        alert('Tabulka je prázdná');
        return;
    }

    // První řádek jsou hlavičky
    headers = jsonData[0].filter(h => h !== undefined && h !== null && h !== '');
    data = [];
    originalData = [];

    // Zbytek řádků jsou data
    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row.length === 0 || !row[0]) continue; // Přeskočit prázdné řádky
        
        const rowData = {};
        headers.forEach((header, index) => {
            rowData[header] = row[index] || '';
        });
        data.push(rowData);
        
        // Uložení originálních dat
        originalData.push(JSON.parse(JSON.stringify(rowData)));
    }
}

// Vyhledávání
document.getElementById('searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const resultsContainer = document.getElementById('searchResults');
    
    if (searchTerm.length < 1) {
        // Pokud je pole prázdné, zobrazit všechny rostliny ze sloupce B
        displayAllHerbsFromColumnB();
        return;
    }

    const matches = data.filter(row => {
        const firstColumn = headers[0];
        const value = String(row[firstColumn] || '').toLowerCase();
        return value.includes(searchTerm);
    });

    displaySearchResults(matches);
});

// Zobrazení všech rostlin ze sloupce B
function displayAllHerbsFromColumnB() {
    const resultsContainer = document.getElementById('searchResults');
    
    if (data.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">Žádné data k zobrazení</div>';
        return;
    }

    // Sloupec B je druhý sloupec (index 1)
    const columnBHeader = headers[1];
    
    if (!columnBHeader) {
        resultsContainer.innerHTML = '<div class="no-results">Sloupec B nebyl nalezen</div>';
        return;
    }

    // Získání unikátních hodnot ze sloupce B
    const herbs = data
        .map(row => row[columnBHeader])
        .filter(value => value !== undefined && value !== null && value !== '')
        .map((value, index) => {
            // Najít index řádku, který má tuto hodnotu ve sloupci B
            const rowIndex = data.findIndex(row => row[columnBHeader] === value);
            return { value: value, index: rowIndex };
        })
        .filter((item, index, self) => 
            index === self.findIndex(t => t.value === item.value)
        ); // Odstranit duplicity

    if (herbs.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">Žádné rostliny ve sloupci B</div>';
        return;
    }

    // Najít poslední sloupec (zobrazení)
    const lastColumnHeader = headers[headers.length - 1];
    
    resultsContainer.innerHTML = herbs.map(item => {
        const rowData = data[item.index];
        const zobrazeniValue = rowData[lastColumnHeader] || '';
        const isOn = String(zobrazeniValue).toLowerCase().trim() === 'on';
        const colorClass = isOn ? 'result-item-on' : 'result-item-off';
        return `<div class="result-item ${colorClass}" data-index="${item.index}">${escapeHtml(item.value)}</div>`;
    }).join('');

    // Event listenery pro kliknutí na výsledek
    resultsContainer.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            selectHerb(index);
        });
    });
}

// Zobrazení výsledků vyhledávání
function displaySearchResults(matches) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (matches.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">Žádné výsledky nenalezeny</div>';
        return;
    }

    const firstColumn = headers[0];
    const lastColumnHeader = headers[headers.length - 1];
    
    resultsContainer.innerHTML = matches.slice(0, 10).map((row, index) => {
        const actualIndex = data.findIndex(r => r === row);
        const zobrazeniValue = row[lastColumnHeader] || '';
        const isOn = String(zobrazeniValue).toLowerCase().trim() === 'on';
        const colorClass = isOn ? 'result-item-on' : 'result-item-off';
        return `<div class="result-item ${colorClass}" data-index="${actualIndex}">${row[firstColumn]}</div>`;
    }).join('');

    // Event listenery pro kliknutí na výsledek
    resultsContainer.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            selectHerb(index);
        });
    });
}

// Výběr bylinky
function selectHerb(index) {
    selectedRowIndex = index;
    const selectedRow = data[index];
    const firstColumn = headers[0];
    
    document.getElementById('selectedHerbName').textContent = selectedRow[firstColumn] || '';
    document.getElementById('searchInput').value = selectedRow[firstColumn] || '';
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('formSection').style.display = 'block';
    
    // Generování formulářových polí
    generateFormFields(selectedRow);
    
    // Scroll k formuláři
    document.getElementById('formSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Získání všech unikátních tagů pro daný sloupec
// Čárky a dělící čáry | jsou oddělovače - každé slovo je samostatné tlačítko
function getUniqueTagsForColumn(columnName) {
    // Speciální případ pro sloupec "sběr" - vrátit měsíce a části rostlin ze sloupce I
    if (columnName && columnName.toLowerCase().includes('sběr')) {
        const tags = new Set();
        
        // Přidat všechny měsíce v roce
        const months = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
        months.forEach(month => tags.add(month));
        
        // Najít sloupec I (Cast-rostliny) - index 8 (A=0, B=1, ..., I=8)
        const castRostlinyHeader = headers[8];
        if (castRostlinyHeader) {
            data.forEach(row => {
                const value = row[castRostlinyHeader];
                if (value !== undefined && value !== null && value !== '') {
                    // Rozdělit hodnotu podle čárek
                    const partsArray = String(value).split(',').map(part => part.trim()).filter(part => part !== '');
                    // Každou část rozdělit podle dělící čáry | a přidat každé slovo
                    partsArray.forEach(part => {
                        const words = part.split('|').map(word => word.trim()).filter(word => word !== '');
                        words.forEach(word => tags.add(word));
                    });
                }
            });
        }
        
        return Array.from(tags).sort();
    }
    
    // Standardní zpracování pro ostatní sloupce
    const tags = new Set();
    data.forEach(row => {
        const value = row[columnName];
        if (value !== undefined && value !== null && value !== '') {
            // Rozdělit hodnotu podle čárek
            const tagsArray = String(value).split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            // Každý tag rozdělit podle dělící čáry | a přidat každé slovo jako samostatné tlačítko
            tagsArray.forEach(tag => {
                // Rozdělit podle dělící čáry |
                const words = tag.split('|').map(word => word.trim()).filter(word => word !== '');
                // Každé slovo přidat jako samostatné tlačítko
                words.forEach(word => tags.add(word));
            });
        }
    });
    // Vrátit seřazený seznam jednotlivých slov (každé slovo = jedno tlačítko)
    return Array.from(tags).sort();
}

// Nastavení autocomplete pro input pole
function setupAutocomplete(inputField, header, availableTags) {
    if (!availableTags || availableTags.length === 0) {
        return; // Pokud nejsou žádné tagy, autocomplete není potřeba
    }
    
    const dropdown = document.getElementById(`${inputField.id}-autocomplete`);
    if (!dropdown) {
        return; // Pokud dropdown neexistuje, ukončit
    }
    
    let selectedIndex = -1;
    let filteredTags = [];
    let savedCursorPos = 0; // Uložená pozice kurzoru
    let isDropdownVisible = false; // Sledování, zda je dropdown viditelný
    
    // Funkce pro uložení pozice kurzoru
    function saveCursorPosition() {
        // Použít selectionStart, pokud je dostupný, jinak délku textu
        const pos = inputField.selectionStart;
        if (pos !== null && pos !== undefined) {
            savedCursorPos = pos;
        } else {
            savedCursorPos = inputField.value.length;
        }
    }
    
    // Funkce pro získání aktuální pozice kurzoru
    function getCurrentCursorPosition() {
        const pos = inputField.selectionStart;
        if (pos !== null && pos !== undefined) {
            return pos;
        }
        return inputField.value.length;
    }
    
    // Funkce pro filtrování tagů podle napsaného textu na pozici kurzoru
    function filterTags(searchText, cursorPos) {
        if (!searchText || searchText.trim() === '') {
            return [];
        }
        
        // Získat text kolem kurzoru (poslední slovo před kurzorem)
        const textBeforeCursor = searchText.substring(0, cursorPos);
        const parts = textBeforeCursor.split(/[\s,|]+/);
        const lastPart = parts[parts.length - 1].toLowerCase().trim();
        
        // Pokud není žádná část, vrátit prázdný seznam
        if (!lastPart) {
            return [];
        }
        
        // Filtrovat tagy, které obsahují poslední část textu (case-insensitive)
        return availableTags.filter(tag => {
            const tagLower = String(tag).toLowerCase();
            return tagLower.includes(lastPart);
        }).slice(0, 15); // Maximálně 15 návrhů
    }
    
    // Funkce pro zobrazení dropdownu
    function showDropdown(tags) {
        if (!tags || tags.length === 0) {
            hideDropdown();
            return;
        }
        
        // DŮLEŽITÉ: Uložit pozici kurzoru PŘED zobrazením dropdownu
        // Tato pozice se použije při vložení tagu
        saveCursorPosition();
        
        filteredTags = tags;
        selectedIndex = -1;
        isDropdownVisible = true;
        
        dropdown.innerHTML = tags.map((tag, index) => 
            `<div class="autocomplete-item" data-index="${index}">${escapeHtml(tag)}</div>`
        ).join('');
        
        dropdown.style.display = 'block';
        
        // Event listenery pro kliknutí na položku
        dropdown.querySelectorAll('.autocomplete-item').forEach((item, index) => {
            // Při najetí myší na položku - uložit pozici (pro případ, že uživatel klikne)
            item.addEventListener('mouseenter', function() {
                selectedIndex = index;
                updateHighlight();
                // Uložit pozici kurzoru, pokud je input stále v fokusu
                if (document.activeElement === inputField) {
                    saveCursorPosition();
                }
            });
            
            // Při stisknutí myši - zachytit pozici a zabránit ztrátě fokusu
            item.addEventListener('mousedown', function(e) {
                e.preventDefault(); // Zabránit ztrátě fokusu
                e.stopPropagation();
                // Uložit pozici kurzoru PŘED kliknutím
                if (document.activeElement === inputField) {
                    saveCursorPosition();
                }
            });
            
            // Při kliknutí - vložit tag
            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // VŽDY použít uloženou pozici kurzoru
                // Obnovit fokus na input pole
                inputField.focus();
                
                // Po obnovení fokusu nastavit kurzor na uloženou pozici a vložit tag
                setTimeout(() => {
                    // Nastavit kurzor na uloženou pozici
                    if (savedCursorPos >= 0 && savedCursorPos <= inputField.value.length) {
                        inputField.setSelectionRange(savedCursorPos, savedCursorPos);
                    }
                    // Vložit tag
                    selectTag(tags[index]);
                }, 0);
            });
        });
    }
    
    // Funkce pro skrytí dropdownu
    function hideDropdown() {
        dropdown.style.display = 'none';
        selectedIndex = -1;
        filteredTags = [];
        isDropdownVisible = false;
    }
    
    // Funkce pro výběr tagu - vloží tag na pozici kurzoru nebo přidá jako nový tag
    function selectTag(tag) {
        // Zkontrolovat, zda existuje vizuální input pole
        const tagsInputContainer = document.getElementById(`${inputField.id}-tags-input`);
        if (tagsInputContainer) {
            // Pokud existuje vizuální input, přidat tag jako nový tag do seznamu
            const header = inputField.name;
            const currentTags = parseTags(inputField.value, header);
            if (!currentTags.includes(tag)) {
                currentTags.push(tag);
                updateInputFromTags(inputField, currentTags, header);
                // Aktualizovat vizuální zobrazení
                const visualInput = tagsInputContainer.querySelector('.tags-input-visual');
                if (visualInput) {
                    const header = inputField.name;
                    updateTagVisualInput(visualInput, currentTags, header);
                    // Nastavit fokus na text input
                    setTimeout(() => {
                        const textInput = visualInput.querySelector('.tag-input-text');
                        if (textInput) {
                            textInput.focus();
                        }
                    }, 0);
                }
            }
            hideDropdown();
            return;
        }
        
        // Původní chování pro standardní input pole
        const currentValue = inputField.value;
        
        // Zajistit, že input má fokus
        if (document.activeElement !== inputField) {
            inputField.focus();
        }
        
        // VŽDY použít uloženou pozici kurzoru (byla uložena před zobrazením dropdownu)
        let cursorPos;
        if (savedCursorPos >= 0 && savedCursorPos <= currentValue.length) {
            cursorPos = savedCursorPos;
        } else {
            // Fallback: použít aktuální pozici nebo konec textu
            cursorPos = getCurrentCursorPosition();
            if (cursorPos > currentValue.length) {
                cursorPos = currentValue.length;
            }
            savedCursorPos = cursorPos;
        }
        
        const selectionEnd = inputField.selectionEnd || cursorPos;
        
        // Text před a za kurzorem
        const textBeforeCursor = currentValue.substring(0, cursorPos);
        const textAfterCursor = currentValue.substring(selectionEnd);
        
        // Zjistit, zda je potřeba přidat mezeru před nebo za tag
        const charBefore = textBeforeCursor.slice(-1);
        const charAfter = textAfterCursor.charAt(0);
        const needsSpaceBefore = textBeforeCursor.length > 0 && 
                                 charBefore !== ' ' && 
                                 charBefore !== '|' && 
                                 charBefore !== ',';
        const needsSpaceAfter = textAfterCursor.length > 0 && 
                                charAfter !== ' ' && 
                                charAfter !== '|' && 
                                charAfter !== ',';
        
        // Sestavit novou hodnotu
        let newValue = textBeforeCursor;
        if (needsSpaceBefore) {
            newValue += ' ';
        }
        newValue += tag;
        if (needsSpaceAfter) {
            newValue += ' ';
        }
        newValue += textAfterCursor;
        
        // Nastavit novou hodnotu
        inputField.value = newValue;
        
        // Nastavit kurzor za vložený tag
        const newCursorPos = cursorPos + (needsSpaceBefore ? 1 : 0) + tag.length + (needsSpaceAfter ? 1 : 0);
        inputField.setSelectionRange(newCursorPos, newCursorPos);
        
        // Obnovit fokus a pozici kurzoru
        setTimeout(() => {
            inputField.focus();
            inputField.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
        
        hideDropdown();
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Funkce pro aktualizaci zvýraznění
    function updateHighlight() {
        dropdown.querySelectorAll('.autocomplete-item').forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('autocomplete-item-selected');
            } else {
                item.classList.remove('autocomplete-item-selected');
            }
        });
    }
    
    // Uložit pozici kurzoru při různých událostech
    // DŮLEŽITÉ: Při každém kliknutí do pole uložit pozici kurzoru
    inputField.addEventListener('click', function(e) {
        // Použít setTimeout, aby se pozice zachytila po dokončení kliknutí
        setTimeout(() => {
            saveCursorPosition();
        }, 0);
    });
    
    inputField.addEventListener('mousedown', function(e) {
        // Uložit pozici při stisknutí myši
        setTimeout(() => {
            saveCursorPosition();
        }, 0);
    });
    
    inputField.addEventListener('keyup', function() {
        saveCursorPosition();
    });
    
    // Zachytit změnu pozice kurzoru pomocí selectionchange
    document.addEventListener('selectionchange', function() {
        if (document.activeElement === inputField && !isDropdownVisible) {
            // Uložit pozici pouze pokud dropdown není viditelný
            // (aby se nepřepisovala pozice při zobrazení dropdownu)
            saveCursorPosition();
        }
    });
    
    // Zachytit změnu pozice při pohybu kurzoru
    inputField.addEventListener('select', function() {
        if (!isDropdownVisible) {
            saveCursorPosition();
        }
    });
    
    // Event listener pro input - hlavní funkce pro vyhledávání
    inputField.addEventListener('input', function(e) {
        // Uložit pozici kurzoru před zobrazením dropdownu
        saveCursorPosition();
        const searchText = this.value;
        const cursorPos = this.selectionStart || searchText.length;
        const tags = filterTags(searchText, cursorPos);
        showDropdown(tags);
    });
    
    // Event listener pro klávesnici
    inputField.addEventListener('keydown', function(e) {
        saveCursorPosition(); // Uložit pozici při každém stisku klávesy
        if (dropdown.style.display === 'none' || filteredTags.length === 0) {
            return;
        }
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, filteredTags.length - 1);
            updateHighlight();
            // Scroll k vybrané položce
            const selectedItem = dropdown.querySelector(`[data-index="${selectedIndex}"]`);
            if (selectedItem) {
                selectedItem.scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateHighlight();
            // Scroll k vybrané položce
            if (selectedIndex >= 0) {
                const selectedItem = dropdown.querySelector(`[data-index="${selectedIndex}"]`);
                if (selectedItem) {
                    selectedItem.scrollIntoView({ block: 'nearest' });
                }
            }
        } else if (e.key === 'Enter' && selectedIndex >= 0 && filteredTags[selectedIndex]) {
            e.preventDefault();
            selectTag(filteredTags[selectedIndex]);
        } else if (e.key === 'Escape') {
            hideDropdown();
        }
    });
    
    // Skrýt dropdown při kliknutí mimo
    document.addEventListener('click', function(e) {
        if (!inputField.contains(e.target) && !dropdown.contains(e.target)) {
            // Uložit pozici před skrytím (pokud je input v fokusu)
            if (document.activeElement === inputField) {
                saveCursorPosition();
            }
            hideDropdown();
        }
    });
    
    // Skrýt dropdown při ztrátě fokusu (s malým zpožděním, aby se stihlo kliknout na položku)
    inputField.addEventListener('blur', function(e) {
        // Pokud kliknutí bylo na dropdown item, neukládat pozici
        // (pozice byla uložena před zobrazením dropdownu)
        if (dropdown.contains(e.relatedTarget)) {
            return;
        }
        // Uložit pozici před ztrátou fokusu
        saveCursorPosition();
        setTimeout(() => {
            if (!dropdown.matches(':hover') && document.activeElement !== inputField) {
                hideDropdown();
            }
        }, 200);
    });
    
    // Nastavit autocomplete pro vizuální input pole, pokud existuje
    const tagsInputContainer = document.getElementById(`${inputField.id}-tags-input`);
    if (tagsInputContainer) {
        const visualInput = tagsInputContainer.querySelector('.tags-input-visual');
        if (visualInput) {
            // Event listener pro psaní v text input části
            visualInput.addEventListener('input', function(e) {
                const textInput = this.querySelector('.tag-input-text');
                if (textInput) {
                    const searchText = textInput.textContent.trim();
                    if (searchText) {
                        const cursorPos = searchText.length;
                        const tags = filterTags(searchText, cursorPos);
                        showDropdown(tags);
                    } else {
                        hideDropdown();
                    }
                }
            });
            
            // Event listener pro klávesnici v text input části
            visualInput.addEventListener('keydown', function(e) {
                const textInput = this.querySelector('.tag-input-text');
                if (textInput && dropdown.style.display !== 'none' && filteredTags.length > 0) {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        selectedIndex = Math.min(selectedIndex + 1, filteredTags.length - 1);
                        updateHighlight();
                        const selectedItem = dropdown.querySelector(`[data-index="${selectedIndex}"]`);
                        if (selectedItem) {
                            selectedItem.scrollIntoView({ block: 'nearest' });
                        }
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        selectedIndex = Math.max(selectedIndex - 1, -1);
                        updateHighlight();
                        if (selectedIndex >= 0) {
                            const selectedItem = dropdown.querySelector(`[data-index="${selectedIndex}"]`);
                            if (selectedItem) {
                                selectedItem.scrollIntoView({ block: 'nearest' });
                            }
                        }
                    } else if (e.key === 'Enter' && selectedIndex >= 0 && filteredTags[selectedIndex]) {
                        e.preventDefault();
                        selectTag(filteredTags[selectedIndex]);
                    } else if (e.key === 'Escape') {
                        hideDropdown();
                    }
                }
            });
            
            // Přesunout dropdown pod vizuální input
            tagsInputContainer.style.position = 'relative';
            const wrapper = inputField.parentElement;
            wrapper.style.position = 'relative';
            dropdown.style.position = 'absolute';
            dropdown.style.top = '100%';
            dropdown.style.left = '0';
            dropdown.style.right = '0';
            dropdown.style.zIndex = '1000';
        }
    }
}

// Funkce pro parsování tagů z hodnoty (podle čárek a dělících čar)
function parseTags(value, header = '') {
    if (!value || value.trim() === '') {
        return [];
    }
    
    // Speciální případ pro sloupec "sběr" - rozdělit na všechny části včetně oddělovačů
    if (header && header.toLowerCase().includes('sběr')) {
        const tags = [];
        if (!value || value.trim() === '') {
            return [];
        }
        
        // Rozdělit text na všechny části - slova a oddělovače (|, ;, ,)
        // Zachovat slova spojená spodní spojovací čárou _ jako jeden tag
        // Pattern: slova (mohou obsahovat _ a alfanumerické znaky) nebo oddělovače (|, ;, ,)
        // [^\s,;|]+ zachytí všechno kromě mezer, čárek, středníků a dělících čar - včetně _
        const parts = value.match(/([^\s,;|]+|[,;|])/g) || [];
        
        parts.forEach(part => {
            const trimmed = part.trim();
            if (trimmed !== '' && trimmed !== '_') {
                tags.push(trimmed);
            }
        });
        
        return tags;
    }
    
    // Standardní parsování pro ostatní sloupce
    // Rozdělit na všechny části včetně oddělovačů (|, ,)
    // DŮLEŽITÉ: Zachovat slova spojená spodní spojovací čárou _ jako jeden tag
    const tags = [];
    if (!value || value.trim() === '') {
        return [];
    }
    
    // Rozdělit text na části podle mezer a oddělovačů (|, ,)
    // Ale spojit části, které obsahují _ dohromady
    let currentWord = '';
    for (let i = 0; i < value.length; i++) {
        const char = value[i];
        
        if (char === ' ' || char === ',' || char === '|') {
            // Pokud máme nějaké slovo, přidat ho
            if (currentWord.trim() !== '') {
                tags.push(currentWord.trim());
                currentWord = '';
            }
            // Přidat oddělovač jako samostatný tag
            if (char === ',' || char === '|') {
                tags.push(char);
            }
        } else {
            // Přidat znak do aktuálního slova
            currentWord += char;
        }
    }
    
    // Přidat poslední slovo, pokud existuje
    if (currentWord.trim() !== '') {
        tags.push(currentWord.trim());
    }
    
    return tags;
}

// Funkce pro sestavení hodnoty z tagů
function buildValueFromTags(tags, header = '') {
    if (tags.length === 0) {
        return '';
    }
    
    // Speciální případ pro sloupec "sběr" - spojit všechny tagy včetně oddělovačů
    if (header && header.toLowerCase().includes('sběr')) {
        // Spojit tagy s mezerami, ale pokud je tag oddělovač, přidat mezeru jen před ním (ne za ním)
        let result = '';
        tags.forEach((tag, index) => {
            const isSeparator = tag === '|' || tag === ';' || tag === ',';
            const prevTag = index > 0 ? tags[index - 1] : null;
            const prevIsSeparator = prevTag && (prevTag === '|' || prevTag === ';' || prevTag === ',');
            
            if (index > 0) {
                // Přidat mezeru před tagem, pokud:
                // - aktuální tag není oddělovač, nebo
                // - předchozí tag není oddělovač
                if (!isSeparator || !prevIsSeparator) {
                    result += ' ';
                }
            }
            result += tag;
        });
        return result;
    }
    
    // Standardní spojení pro ostatní sloupce - spojit s mezerami, ale pokud je tag oddělovač, přidat mezeru jen před ním
    let result = '';
    tags.forEach((tag, index) => {
        const isSeparator = tag === '|' || tag === ',';
        const prevTag = index > 0 ? tags[index - 1] : null;
        const prevIsSeparator = prevTag && (prevTag === '|' || prevTag === ',');
        
        if (index > 0) {
            // Přidat mezeru před tagem, pokud:
            // - aktuální tag není oddělovač, nebo
            // - předchozí tag není oddělovač
            if (!isSeparator || !prevIsSeparator) {
                result += ' ';
            }
        }
        result += tag;
    });
    return result;
}

// Funkce pro nastavení přepínače zobrazení
function setupViewToggle(inputField, header) {
    const fieldId = inputField.id;
    const bubblesBtn = document.querySelector(`[data-view="bubbles"][data-field="${fieldId}"]`);
    const textBtn = document.querySelector(`[data-view="text"][data-field="${fieldId}"]`);
    const tagsInputContainer = document.getElementById(`${fieldId}-tags-input`);
    const textInput = inputField;
    
    if (!bubblesBtn || !textBtn) {
        return;
    }
    
    // Funkce pro přepnutí na zobrazení s bublinami
    function showBubblesView() {
        if (tagsInputContainer) {
            tagsInputContainer.style.display = 'block';
        }
        textInput.style.display = 'none';
        bubblesBtn.classList.add('active');
        textBtn.classList.remove('active');
    }
    
    // Funkce pro přepnutí na klasické textové zobrazení
    function showTextView() {
        if (tagsInputContainer) {
            tagsInputContainer.style.display = 'none';
        }
        textInput.style.display = 'block';
        textBtn.classList.add('active');
        bubblesBtn.classList.remove('active');
        
        // Zajistit, aby textový input měl aktuální hodnotu
        // (hodnota se už aktualizuje automaticky při změnách v bublinách)
    }
    
    // Synchronizace hodnot - když se změní textový input, aktualizovat bubliny
    textInput.addEventListener('input', function() {
        if (tagsInputContainer && tagsInputContainer.style.display !== 'none') {
            // Pokud jsou bubliny zobrazené, aktualizovat je
            const visualInput = tagsInputContainer.querySelector('.tags-input-visual');
            if (visualInput) {
                const value = inputField.value;
                const tags = parseTags(value, header);
                updateTagVisualInput(visualInput, tags, header);
            }
        }
    });
    
    // Synchronizace hodnot - když se změní bubliny, aktualizovat textový input
    // (to už se děje v updateInputFromTags, ale pro jistotu)
    if (tagsInputContainer) {
        const visualInput = tagsInputContainer.querySelector('.tags-input-visual');
        if (visualInput) {
            visualInput.addEventListener('input', function() {
                // Hodnota se už aktualizuje automaticky
            });
        }
    }
    
    // Event listenery pro tlačítka
    bubblesBtn.addEventListener('click', function() {
        showBubblesView();
    });
    
    textBtn.addEventListener('click', function() {
        showTextView();
    });
    
    // Výchozí zobrazení je s bublinami
    showBubblesView();
}

// Funkce pro vytvoření vlastního input pole s tagy
function createTagInput(inputField, header) {
    const wrapper = inputField.parentElement;
    const tagsInputContainer = document.createElement('div');
    tagsInputContainer.className = 'tags-input-container';
    tagsInputContainer.id = `${inputField.id}-tags-input`;
    
    // Skrýt původní input pole
    inputField.style.display = 'none';
    
    // Vytvořit vizuální input pole
    const visualInput = document.createElement('div');
    visualInput.className = 'tags-input-visual';
    visualInput.contentEditable = 'true';
    visualInput.setAttribute('role', 'textbox');
    visualInput.setAttribute('aria-label', `Zadejte hodnotu pro ${header}`);
    
    // Přidat placeholder
    const placeholder = document.createElement('span');
    placeholder.className = 'tags-input-placeholder';
    placeholder.textContent = `Zadejte hodnotu pro ${header}`;
    visualInput.appendChild(placeholder);
    
    tagsInputContainer.appendChild(visualInput);
    wrapper.insertBefore(tagsInputContainer, inputField);
    
    // Funkce pro aktualizaci zobrazení
    function updateVisualInput() {
        const value = inputField.value;
        const tags = parseTags(value, header);
        
        // Vyčistit obsah
        visualInput.innerHTML = '';
        
        if (tags.length === 0) {
            // Zobrazit placeholder
            const placeholder = document.createElement('span');
            placeholder.className = 'tags-input-placeholder';
            placeholder.textContent = `Zadejte hodnotu pro ${header}`;
            visualInput.appendChild(placeholder);
        } else {
            // Zobrazit tagy
            const isSber = header && header.toLowerCase().includes('sběr');
            tags.forEach((tag, index) => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag-chip';
                if (isSber) {
                    tagElement.classList.add('tag-chip-sber');
                }
                tagElement.draggable = true;
                tagElement.setAttribute('data-index', index);
                tagElement.setAttribute('data-tag', tag);
                
                // Zvýraznit oddělovače (pro všechny sloupce)
                let displayText = escapeHtml(tag);
                const isSeparator = tag === '|' || tag === ';' || tag === ',';
                
                if (isSeparator) {
                    displayText = `<span class="tag-separator">${escapeHtml(tag)}</span>`;
                    tagElement.classList.add('tag-chip-separator');
                }
                
                // Pro sloupec "sběr" - přidat speciální třídu
                if (isSber) {
                    tagElement.classList.add('tag-chip-sber');
                }
                
                tagElement.innerHTML = `
                    <span class="tag-chip-text">${displayText}</span>
                    <span class="tag-chip-remove" data-index="${index}">×</span>
                `;
                visualInput.appendChild(tagElement);
            });
            
            // Přidat input pro psaní nového tagu
            const textInput = document.createElement('span');
            textInput.className = 'tag-input-text';
            textInput.contentEditable = 'true';
            textInput.setAttribute('data-placeholder', '');
            visualInput.appendChild(textInput);
            
            // Nastavit fokus na text input
            setTimeout(() => {
                textInput.focus();
            }, 0);
        }
        
        // Nastavit drag and drop
        setupTagDragAndDrop(inputField, visualInput, tags);
        
        // Nastavit event listenery pro odstranění
        visualInput.querySelectorAll('.tag-chip-remove').forEach(removeBtn => {
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const index = parseInt(this.getAttribute('data-index'));
                const currentTags = parseTags(inputField.value, header);
                const newTags = currentTags.filter((_, i) => i !== index);
                updateInputFromTags(inputField, newTags, header);
                updateVisualInput();
            });
        });
    }
    
    // Event listenery pro psaní
    visualInput.addEventListener('input', function(e) {
        const textInput = this.querySelector('.tag-input-text');
        if (textInput) {
            const text = textInput.textContent.trim();
            
            // Aktualizovat skrytý input pole pro autocomplete
            const currentTags = parseTags(inputField.value, header);
            const searchText = text;
            if (searchText) {
                // Simulovat psaní v input poli pro autocomplete
                const separator = header && header.toLowerCase().includes('sběr') ? ' ; ' : ', ';
                inputField.value = buildValueFromTags(currentTags, header) + (currentTags.length > 0 ? separator : '') + searchText;
                inputField.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                // Pokud není žádný text, aktualizovat jen hodnotu bez textu
                inputField.value = buildValueFromTags(currentTags, header);
            }
        }
    });
    
    visualInput.addEventListener('keydown', function(e) {
        // Získat aktuálně psaný text z text input části
        const textInput = this.querySelector('.tag-input-text');
        let currentText = '';
        
        if (textInput) {
            currentText = textInput.textContent.trim();
        } else {
            // Pokud není textInput element, zkusit získat text z celého visualInput
            // a odečíst text z tagů
            const allNodes = Array.from(this.childNodes);
            let textNodes = [];
            allNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    textNodes.push(node.textContent);
                } else if (node.classList && !node.classList.contains('tag-chip')) {
                    // Pokud je to element, který není tag-chip, zkusit získat jeho text
                    const text = node.textContent || '';
                    if (text.trim()) {
                        textNodes.push(text);
                    }
                }
            });
            currentText = textNodes.join(' ').trim();
        }
        
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            
            if (currentText && currentText.length > 0) {
                const currentTags = parseTags(inputField.value, header);
                // Zkontrolovat, zda tag už neexistuje
                if (!currentTags.includes(currentText)) {
                    currentTags.push(currentText);
                    updateInputFromTags(inputField, currentTags, header);
                    updateVisualInput();
                } else {
                    // Pokud tag už existuje, jen vyčistit text
                    updateVisualInput();
                }
            }
        } else if (e.key === ',' || (e.key === ';' && header && header.toLowerCase().includes('sběr'))) {
            e.preventDefault();
            if (currentText && currentText.length > 0) {
                const currentTags = parseTags(inputField.value, header);
                if (!currentTags.includes(currentText)) {
                    currentTags.push(currentText);
                    updateInputFromTags(inputField, currentTags, header);
                    updateVisualInput();
                } else {
                    updateVisualInput();
                }
            }
        } else if (e.key === 'Backspace') {
            // Pokud je text input prázdný a jsou nějaké tagy, odstranit poslední tag
            if ((!currentText || currentText === '') && document.getSelection().toString() === '') {
                const currentTags = parseTags(inputField.value, header);
                if (currentTags.length > 0) {
                    // Zkontrolovat, zda je kurzor na začátku text input části
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        const textInput = this.querySelector('.tag-input-text');
                        if (textInput && range.startContainer === textInput && range.startOffset === 0) {
                            e.preventDefault();
                            currentTags.pop();
                            updateInputFromTags(inputField, currentTags, header);
                            updateVisualInput();
                        }
                    }
                }
            }
        }
    });
    
    // Aktualizovat při změně hodnoty v původním input poli
    inputField.addEventListener('input', function() {
        updateVisualInput();
    });
    
    // Počáteční aktualizace
    updateVisualInput();
    
    return tagsInputContainer;
}

// Funkce pro nastavení drag and drop pro tagy v input poli
function setupTagDragAndDrop(inputField, container, tags) {
    container.querySelectorAll('.tag-chip').forEach((tagElement) => {
        tagElement.addEventListener('dragstart', function(e) {
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        tagElement.addEventListener('dragend', function(e) {
            this.classList.remove('dragging');
            container.querySelectorAll('.tag-chip').forEach(t => {
                t.classList.remove('drag-over');
            });
            
            // Aktualizovat pořadí
            const newTags = [];
            container.querySelectorAll('.tag-chip').forEach(tagEl => {
                const tagText = tagEl.getAttribute('data-tag');
                if (tagText) {
                    newTags.push(tagText);
                }
            });
            
            const header = inputField.name;
            updateInputFromTags(inputField, newTags, header);
            
            // Znovu vykreslit
            const tagsInputContainer = document.getElementById(`${inputField.id}-tags-input`);
            if (tagsInputContainer) {
                const visualInput = tagsInputContainer.querySelector('.tags-input-visual');
                if (visualInput) {
                    const currentTags = parseTags(inputField.value, header);
                    updateTagVisualInput(visualInput, currentTags, header);
                }
            }
        });
        
        tagElement.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const draggedElement = container.querySelector('.dragging');
            if (draggedElement && draggedElement !== this) {
                const afterElement = getDragAfterElement(container, e.clientY);
                
                if (afterElement == null) {
                    container.appendChild(draggedElement);
                } else {
                    container.insertBefore(draggedElement, afterElement);
                }
            }
        });
        
        tagElement.addEventListener('dragenter', function(e) {
            e.preventDefault();
            if (container.querySelector('.dragging') && container.querySelector('.dragging') !== this) {
                this.classList.add('drag-over');
            }
        });
        
        tagElement.addEventListener('dragleave', function(e) {
            this.classList.remove('drag-over');
        });
        
        tagElement.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
        });
    });
}

// Funkce pro aktualizaci vizuálního input pole s tagy
function updateTagVisualInput(visualInput, tags, header) {
    visualInput.innerHTML = '';
    
    if (tags.length === 0) {
        const placeholder = document.createElement('span');
        placeholder.className = 'tags-input-placeholder';
        placeholder.textContent = `Zadejte hodnotu pro ${header}`;
        visualInput.appendChild(placeholder);
    } else {
        tags.forEach((tag, index) => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag-chip';
            tagElement.draggable = true;
            tagElement.setAttribute('data-index', index);
            tagElement.setAttribute('data-tag', tag);
            tagElement.innerHTML = `
                <span class="tag-chip-text">${escapeHtml(tag)}</span>
                <span class="tag-chip-remove" data-index="${index}">×</span>
            `;
            visualInput.appendChild(tagElement);
        });
        
        const textInput = document.createElement('span');
        textInput.className = 'tag-input-text';
        textInput.contentEditable = 'true';
        textInput.setAttribute('data-placeholder', '');
        visualInput.appendChild(textInput);
    }
}

// Funkce pro nastavení drag and drop
function setupDragAndDrop(inputField, container, tags) {
    let draggedElement = null;
    
    container.querySelectorAll('.draggable-tag').forEach((tagElement) => {
        tagElement.addEventListener('dragstart', function(e) {
            draggedElement = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', this.innerHTML);
        });
        
        tagElement.addEventListener('dragend', function(e) {
            this.classList.remove('dragging');
            container.querySelectorAll('.draggable-tag').forEach(t => {
                t.classList.remove('drag-over');
            });
            
            // Po dokončení přetahování aktualizovat pořadí
            if (draggedElement) {
                const newTags = [];
                container.querySelectorAll('.draggable-tag').forEach(tagEl => {
                    const tagText = tagEl.getAttribute('data-tag');
                    if (tagText) {
                        newTags.push(tagText);
                    }
                });
                
                // Aktualizovat input pole
                updateInputFromTags(inputField, newTags);
                
                // Znovu vykreslit tagy s novými indexy
                const header = inputField.name;
                renderDraggableTags(inputField, header);
            }
        });
        
        tagElement.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            if (draggedElement && draggedElement !== this) {
                const afterElement = getDragAfterElement(container, e.clientY);
                
                if (afterElement == null) {
                    container.appendChild(draggedElement);
                } else {
                    container.insertBefore(draggedElement, afterElement);
                }
            }
        });
        
        tagElement.addEventListener('dragenter', function(e) {
            e.preventDefault();
            if (draggedElement && draggedElement !== this) {
                this.classList.add('drag-over');
            }
        });
        
        tagElement.addEventListener('dragleave', function(e) {
            this.classList.remove('drag-over');
        });
        
        tagElement.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
        });
    });
}

// Pomocná funkce pro zjištění, kam vložit přetahovaný element
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.draggable-tag:not(.dragging)')];
    
    if (draggableElements.length === 0) {
        return null;
    }
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Funkce pro aktualizaci input pole z tagů
function updateInputFromTags(inputField, tags, header = '') {
    const newValue = buildValueFromTags(tags, header);
    inputField.value = newValue;
    inputField.dispatchEvent(new Event('input', { bubbles: true }));
    inputField.dispatchEvent(new Event('change', { bubbles: true }));
}

// Generování formulářových polí
function generateFormFields(rowData) {
    const formFieldsContainer = document.getElementById('formFields');
    const firstColumn = headers[0];
    
    formFieldsContainer.innerHTML = headers
        .filter(header => header !== firstColumn) // Vynechat sloupec s názvem bylinky
        .map(header => {
            const value = rowData[header] || '';
            const uniqueTags = getUniqueTagsForColumn(header);
            const fieldId = `field-${header}`;
            const tagsId = `tags-${header}`;
            
            const toggleId = `toggle-${header}`;
            return `
                <div class="form-field">
                    <div class="form-field-header">
                        <label for="${fieldId}">${header}</label>
                        <div class="view-toggle">
                            <button type="button" class="view-toggle-btn active" data-view="bubbles" data-field="${fieldId}" title="Zobrazení s bublinami">
                                <span>🔵</span>
                            </button>
                            <button type="button" class="view-toggle-btn" data-view="text" data-field="${fieldId}" title="Klasické textové zobrazení">
                                <span>📝</span>
                            </button>
                        </div>
                    </div>
                    <div class="tag-selector-container">
                        <div class="autocomplete-wrapper">
                            <input 
                                type="text" 
                                id="${fieldId}" 
                                name="${header}" 
                                value="${escapeHtml(value)}"
                                placeholder="Zadejte hodnotu pro ${header}"
                                autocomplete="off"
                                class="text-view-input"
                                style="display: none;"
                            >
                            <div class="autocomplete-dropdown" id="${fieldId}-autocomplete" style="display: none;"></div>
                        </div>
                        ${uniqueTags.length > 0 ? `
                            <button type="button" class="tag-toggle-btn" id="${toggleId}" data-header="${header}">
                                <span class="tag-toggle-text">Zobrazit existující tagy (${uniqueTags.length})</span>
                                <span class="tag-toggle-icon">▼</span>
                            </button>
                            <div class="tag-selector" id="tag-selector-${header}" style="display: none;">
                                <div class="tag-selector-label">Kliknutím přidat existující tag:</div>
                                <div class="tag-list" id="${tagsId}">
                                    <span class="tag-item tag-divider" data-tag-divider="|">|</span>
                                    <span class="tag-item" data-tag="_">_</span>
                                    <span class="tag-item" data-tag=" ; "> ; </span>
                                    ${uniqueTags.map(tag => `
                                        <span class="tag-item" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="form-field-divider"></div>
            `;
        }).join('');
    
    // Přidání event listenerů pro rozbalení/zabalení a klikání na tagy
    headers
        .filter(header => header !== firstColumn)
        .forEach(header => {
            const toggleBtn = document.getElementById(`toggle-${header}`);
            const tagSelector = document.getElementById(`tag-selector-${header}`);
            const tagsContainer = document.getElementById(`tags-${header}`);
            const inputField = document.getElementById(`field-${header}`);
            
            // Event listener pro tlačítko rozbalení/zabalení
            if (toggleBtn && tagSelector) {
                toggleBtn.addEventListener('click', function() {
                    const isVisible = tagSelector.style.display !== 'none';
                    const toggleText = this.querySelector('.tag-toggle-text');
                    const toggleIcon = this.querySelector('.tag-toggle-icon');
                    
                    if (isVisible) {
                        tagSelector.style.display = 'none';
                        toggleText.textContent = `Zobrazit existující tagy (${getUniqueTagsForColumn(header).length})`;
                        toggleIcon.textContent = '▼';
                        toggleIcon.style.transform = 'rotate(0deg)';
                    } else {
                        tagSelector.style.display = 'block';
                        toggleText.textContent = `Skrýt existující tagy`;
                        toggleIcon.textContent = '▲';
                        toggleIcon.style.transform = 'rotate(0deg)';
                    }
                });
            }
            
            // Event listenery pro klikání na tagy
            if (tagsContainer && inputField) {
                tagsContainer.querySelectorAll('.tag-item').forEach(tagItem => {
                    tagItem.addEventListener('click', function() {
                        const currentValue = inputField.value;
                        
                        // Vizualní zpětná vazba
                        this.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            this.style.transform = '';
                        }, 150);
                        
                        // Speciální případ pro dělící čáru
                        if (this.classList.contains('tag-divider')) {
                            // Přidat mezeru, dělící čáru a mezeru
                            inputField.value = currentValue + ' | ';
                            inputField.focus();
                            // Nastavit kurzor za dělící čáru
                            const cursorPos = inputField.value.length;
                            inputField.setSelectionRange(cursorPos, cursorPos);
                        } else {
                            // Standardní chování pro ostatní tagy
                            const tag = this.getAttribute('data-tag');
                            
                            // Přidat tag na konec hodnoty, bez čárky
                            if (currentValue === '') {
                                inputField.value = tag;
                            } else {
                                // Zkontrolovat, zda je na konci mezera nebo dělící čára
                                const lastChar = currentValue.trim().slice(-1);
                                if (lastChar === '|' || currentValue.endsWith(' ')) {
                                    // Pokud je na konci dělící čára nebo mezera, přidat jen tag
                                    inputField.value = currentValue + tag;
                                } else {
                                    // Jinak přidat mezeru a tag
                                    inputField.value = currentValue + ' ' + tag;
                                }
                            }
                            inputField.focus();
                            // Nastavit kurzor za přidaný tag
                            const cursorPos = inputField.value.length;
                            inputField.setSelectionRange(cursorPos, cursorPos);
                        }
                        
                        // Trigger change event pro případné další validace
                        inputField.dispatchEvent(new Event('input', { bubbles: true }));
                    });
                });
            }
            
            // Autocomplete funkce pro input pole
            if (inputField) {
                const uniqueTagsForAutocomplete = getUniqueTagsForColumn(header);
                setupAutocomplete(inputField, header, uniqueTagsForAutocomplete);
                
                // Vytvořit vlastní input pole s tagy (bubliny)
                createTagInput(inputField, header);
                
                // Nastavit přepínač zobrazení
                setupViewToggle(inputField, header);
            }
        });
}

// Escape HTML pro bezpečnost
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Zrušení editace
document.getElementById('cancelBtn').addEventListener('click', function() {
    document.getElementById('formSection').style.display = 'none';
    document.getElementById('searchInput').value = '';
    displayAllHerbsFromColumnB(); // Zobrazit znovu všechny rostliny ze sloupce B
    selectedRowIndex = -1;
});

// Odeslání formuláře
document.getElementById('tagForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (selectedRowIndex === -1) {
        alert('Není vybrána žádná bylinka');
        return;
    }

    // Získání hodnot z formuláře
    const formData = new FormData(this);
    const firstColumn = headers[0];
    
    headers.forEach(header => {
        if (header !== firstColumn) {
            const input = document.getElementById(`field-${header}`);
            if (input) {
                data[selectedRowIndex][header] = input.value;
            }
        }
    });

    // Zobrazení tlačítka pro stažení
    document.getElementById('downloadSection').style.display = 'block';
    
    alert('Změny byly uloženy! Stáhněte si upravený soubor.');
    document.getElementById('formSection').style.display = 'none';
    document.getElementById('searchInput').value = '';
    displayAllHerbsFromColumnB(); // Zobrazit znovu všechny rostliny ze sloupce B
    selectedRowIndex = -1;
});

// Stažení upraveného souboru
document.getElementById('downloadBtn').addEventListener('click', function() {
    if (!workbook || !worksheet) {
        alert('Nejprve načtěte soubor');
        return;
    }

    try {
        // Převod dat zpět do Excel formátu
        const jsonData = [headers]; // První řádek jsou hlavičky
        
        data.forEach(row => {
            const rowData = headers.map(header => row[header] || '');
            jsonData.push(rowData);
        });

        // Vytvoření nového worksheet
        const newWorksheet = XLSX.utils.aoa_to_sheet(jsonData);
        
        // Aktualizace workbooku
        workbook.Sheets[workbook.SheetNames[0]] = newWorksheet;
        
        // Generování souboru
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        
        // Vytvoření blob a stažení
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Finální_upravený.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
    } catch (error) {
        alert('Chyba při ukládání souboru: ' + error.message);
    }
});
