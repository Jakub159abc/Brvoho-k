// Data jsou načtena z data.js
let filteredData = [];

// Funkce pro inicializaci aplikace
function initializeApp() {
    // Počkat, až se načte data.js
    if (typeof allData !== 'undefined' && allData && allData.length > 0) {
        filteredData = allData;
        displayResults(filteredData);
        
        // Nastavení vyhledávání
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase().trim();
                filterProblems(searchTerm);
            });
        }
        console.log('Aplikace úspěšně načtena. Počet záznamů:', allData.length);
    } else {
        const problemsContainer = document.getElementById('problems');
        if (problemsContainer) {
            problemsContainer.innerHTML = '<div class="no-results">Chyba: Data se nepodařilo načíst.<br>Zkontrolujte:<br>1. Zda existuje soubor data.js ve stejném adresáři<br>2. Konzoli prohlížeče (F12) pro více informací</div>';
        }
        console.error('Data nejsou k dispozici.');
        console.error('Zkontrolujte, zda je soubor data.js správně načten a ve stejném adresáři jako index.html');
        
        // Zkusit načíst data.js znovu
        const script = document.createElement('script');
        script.src = 'data.js';
        script.onerror = function() {
            console.error('Nepodařilo se načíst data.js. Zkontrolujte cestu k souboru.');
        };
        document.head.appendChild(script);
    }
}

// Inicializace při načtení stránky
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM je už načten
    initializeApp();
}

// Zkusit také při window.onload pro případ, že data.js se načte později
window.addEventListener('load', function() {
    if (typeof allData !== 'undefined' && allData && allData.length > 0 && filteredData.length === 0) {
        initializeApp();
    }
});

// Filtrování problémů
function filterProblems(searchTerm) {
    if (typeof allData === 'undefined' || !allData) return;
    
    if (searchTerm === '') {
        filteredData = allData;
    } else {
        filteredData = allData.filter(item => {
            // Prohledat všechny hodnoty v objektu
            return Object.values(item).some(value => {
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(searchTerm);
            });
        });
    }
    
    displayResults(filteredData);
}

// Zobrazení výsledků
function displayResults(data) {
    const problemsContainer = document.getElementById('problems');
    
    if (data.length === 0) {
        problemsContainer.innerHTML = '<div class="no-results">Žádné výsledky nenalezeny</div>';
        return;
    }
    
    // Získat názvy sloupců z prvního záznamu
    const columns = Object.keys(data[0]);
    const problemColumn = columns[0]; // První sloupec je PROBLÉM
    
    let html = '';
    data.forEach((item, index) => {
        const problemName = item[problemColumn] || `Záznam ${index + 1}`;
        const problemId = `problem-${index}-${problemName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        
        html += `<div class="problem-card" id="${problemId}" data-problem-name="${escapeHtml(String(problemName))}">`;
        
        // První sloupec jako nadpis (PROBLÉM)
        if (problemName && String(problemName).trim() !== '') {
            html += `<h2>${escapeHtml(String(problemName))}</h2>`;
        }
        
        // Zobrazit ostatní sloupce
        columns.forEach((column, colIndex) => {
            if (colIndex === 0) return; // První sloupec už je v nadpisu
            
            const value = item[column];
            if (value && String(value).trim() !== '') {
                let processedValue = escapeHtml(String(value));
                
                // Pokud je to sloupec "MOŽNÁ PŘÍČINA", zpracuj odkazy "viz (něco)"
                if (column === 'MOŽNÁ PŘÍČINA' || column.includes('PŘÍČINA')) {
                    processedValue = processVizLinks(processedValue, data, problemColumn);
                }
                
                html += `<p><span class="label">${escapeHtml(column)}:</span> <span class="value">${processedValue}</span></p>`;
            }
        });
        
        html += '</div>';
    });
    
    problemsContainer.innerHTML = html;
    
    // Přidat event listenery na odkazy
    attachLinkListeners();
}

// Zpracování odkazů "viz (něco)"
function processVizLinks(text, allData, problemColumn) {
    // Regex pro detekci "viz (něco)" nebo "viz něco"
    const vizPattern = /viz\s+([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ\s]+)/gi;
    
    return text.replace(vizPattern, (match, problemName) => {
        const trimmedName = problemName.trim();
        const upperTrimmed = trimmedName.toUpperCase();
        
        // Najít problém v datech - nejdřív přesná shoda, pak shoda na začátku
        let foundProblem = allData.find(item => {
            const itemProblem = item[problemColumn];
            if (!itemProblem) return false;
            const upperItem = String(itemProblem).trim().toUpperCase();
            return upperItem === upperTrimmed;
        });
        
        // Pokud přesná shoda neexistuje, hledat problém, který začíná hledaným textem
        if (!foundProblem) {
            foundProblem = allData.find(item => {
                const itemProblem = item[problemColumn];
                if (!itemProblem) return false;
                const upperItem = String(itemProblem).trim().toUpperCase();
                return upperItem.startsWith(upperTrimmed + ' ') || upperItem.startsWith(upperTrimmed + '(');
            });
        }
        
        if (foundProblem) {
            const problemIndex = allData.indexOf(foundProblem);
            const actualProblemName = String(foundProblem[problemColumn]).trim();
            const problemId = `problem-${problemIndex}-${actualProblemName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            return `viz <a href="#" class="problem-link" data-target="${problemId}">${trimmedName}</a>`;
        }
        
        // Pokud problém nenalezen, vrátit původní text
        return match;
    });
}

// Přidat event listenery na odkazy
function attachLinkListeners() {
    const links = document.querySelectorAll('.problem-link');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Zvýraznit cílovou kartu
                targetElement.style.transition = 'all 0.3s ease';
                targetElement.style.backgroundColor = '#f1f8f4';
                targetElement.style.borderColor = '#4caf50';
                targetElement.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.4)';
                
                // Scrollovat na kartu
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Po 2 sekundách vrátit původní styl
                setTimeout(() => {
                    targetElement.style.backgroundColor = '';
                    targetElement.style.borderColor = '';
                    targetElement.style.boxShadow = '';
                }, 2000);
            }
        });
    });
}

// Escape HTML pro bezpečnost
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
