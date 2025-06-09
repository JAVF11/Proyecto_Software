// Configuración global
const CONFIG = {
    rutaBase: 'contenido/',
    tiempoEspera: 5000, // 5 segundos de timeout
    clases: {
        activo: 'active',
        seccion: 'seccion-cargada',
        carga: 'estado-carga',
        error: 'error-carga'
    }
};

// Controlador principal de carga
async function cargarSeccion(idSeccion) {
    const contenedor = document.getElementById('contenido-dinamico');

    try {
        mostrarEstadoCarga(contenedor, idSeccion);

        const url = `${CONFIG.rutaBase}${idSeccion}.html`;
        const html = await cargarHTML(url);

        // Cargar CSS dinámico
        await cargarCSSDinamico(idSeccion);

        await mostrarContenido(contenedor, html);
        actualizarEstadoAplicacion(idSeccion);

    } catch (error) {
        manejarError(contenedor, error, idSeccion);
    }
}

//Carga de CSS
function cargarCSSDinamico(nombreSeccion) {
    return new Promise((resolve, reject) => {
        // Eliminar CSS anterior dinámico si existe
        const estiloAnterior = document.querySelector('link[data-dinamico="true"]');
        if (estiloAnterior) estiloAnterior.remove();

        // Crear nuevo <link> con el CSS correspondiente
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${CONFIG.rutaBase}${nombreSeccion}.css`;
        link.dataset.dinamico = 'true';

        // Resolver cuando cargue correctamente o ignorar si no existe el archivo
        link.onload = () => resolve();
        link.onerror = () => {
            console.warn(`CSS opcional no encontrado: ${link.href}`);
            resolve(); // No se rechaza, para que no detenga el flujo
        };

        document.head.appendChild(link);
    });
}


// Función para mostrar estado de carga
function mostrarEstadoCarga(contenedor, idSeccion) {
    contenedor.innerHTML = `
        <div class="${CONFIG.clases.carga}">
            <div class="loader"></div>
            <p>Cargando ${idSeccion.replace(/-/g, ' ')}...</p>
        </div>
    `;
}

// Función para cargar HTML externo
async function cargarHTML(url) {
    const controlador = new AbortController();
    const timeoutId = setTimeout(() => controlador.abort(), CONFIG.tiempoEspera);
    
    const respuesta = await fetch(url, {
        signal: controlador.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!respuesta.ok) {
        throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
    }
    
    return await respuesta.text();
}

// Función para procesar y mostrar contenido
async function mostrarContenido(contenedor, html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const seccion = doc.querySelector(`.${CONFIG.clases.seccion}`);
    
    if (!seccion) {
        throw new Error('Estructura de sección inválida');
    }
    
    // Animación de transición
    contenedor.style.opacity = '0';
    await new Promise(resolve => setTimeout(resolve, 300));
    
    contenedor.innerHTML = seccion.outerHTML;
    contenedor.style.opacity = '1';
}

// Función para actualizar el estado de la aplicación
function actualizarEstadoAplicacion(idSeccion) {
    // Actualizar navegación
    window.history.replaceState({ id: idSeccion }, '', `#${idSeccion}`);
    
    // Actualizar enlace activo
    document.querySelectorAll('nav a').forEach(enlace => {
        const esActivo = enlace.getAttribute('href') === `#${idSeccion}`;
        enlace.classList.toggle(CONFIG.clases.activo, esActivo);
    });
}

// Función para manejar errores
function manejarError(contenedor, error, idSeccion) {
    console.error(`Error en ${idSeccion}:`, error);
    
    contenedor.innerHTML = `
        <div class="${CONFIG.clases.error}">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error cargando ${idSeccion}</h3>
            <p>${error.message}</p>
            <button class="boton-reintentar" onclick="cargarSeccion('${idSeccion}')">
                Reintentar
            </button>
        </div>
    `;
}

// Manejadores de eventos
function manejarNavegacion() {
    const seccion = window.location.hash.substring(1) || 'presentacion';
    
    // Validar secciones permitidas
    const seccionesValidas = [
        'presentacion', 'temario', 'objetivo', 
        'introduccion', 'antecedentes', 'definiciones', 'presentaciones', 
        'video', 'cuestionario', 'sopa_letras', 'descargables', 'bibliografia'
    ];
    
    if (seccionesValidas.includes(seccion)) {
        cargarSeccion(seccion);
    } else {
        window.location.hash = '#presentacion';
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Configurar eventos de navegación
    window.addEventListener('hashchange', manejarNavegacion);
    window.addEventListener('popstate', manejarNavegacion);
    
    // Delegación de eventos para los enlaces
    document.querySelector('nav').addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            window.location.hash = e.target.getAttribute('href');
        }
    });

    // Carga inicial
    manejarNavegacion();
});


//Cuestionario

function calculateScore() {
    const questions = document.querySelectorAll(".question");
    let score = 0;

    questions.forEach((question) => {
        // Limpiar estilos anteriores
        question.classList.remove("correct-border", "incorrect-border");

        const selected = question.querySelector("input[type='radio']:checked");

        if (selected) {
            const selectedLabel = selected.closest("label");
            const isCorrect = selectedLabel.dataset.correct === "true";

            if (isCorrect) {
                question.classList.add("correct-border");
                score++;
            } else {
                question.classList.add("incorrect-border");
            }
        } else {
            question.classList.add("incorrect-border");
        }
    });

    // Mostrar resultado
    const resultBox = document.getElementById("result");
    resultBox.textContent = `Respuestas correctas: ${score} de ${questions.length}`;
}

//Sopa de Letras 

// Variables globales para la sopa de letras
let selectedCells = [];
let foundWords = [];
let isMouseDown = false;

// Palabras y configuración de la sopa de letras
const WORD_SEARCH_CONFIG = {
    words: [
        "REQUISITOS", "ARQUITECTURA", "CONSTRUCCION", "PRUEBAS", "OPERACIONES", 
        "MANTENIMIENTO", "GESTIONCONFIGURACION", "GESTIONDEINGENIERIA",
        "PROCESODEINGENIERIA", "MODELOSYMETODOS", "SEGURIDAD", 
        "PRACTICAPROFESIONAL", "ECONOMIA", "INFORMATICA", "MATEMATICOS"
    ],
    displayNames: {
        "GESTIONCONFIGURACION": "GEST. CONFIGURACIÓN",
        "GESTIONDEINGENIERIA": "GEST. INGENIERÍA",
        "PROCESODEINGENIERIA": "PROC. INGENIERÍA",
        "MODELOSYMETODOS": "MODELOS Y MÉTODOS",
        "PRACTICAPROFESIONAL": "PRÁCTICA PROFESIONAL"
    },
    grid: [
        ['O','N','W','I','A','E','X','A','R','B','Ó','M','Ñ','R','Q','A','H','S','A','P'],
        ['P','Ó','T','T','I','H','M','D','G','I','C','Ñ','É','E','A','C','Z','O','Í','R'],
        ['E','I','É','Ñ','R','D','S','M','H','W','I','K','R','Q','I','I','É','C','R','Á'],
        ['R','C','M','V','E','G','Ó','N','A','B','T','B','H','U','P','T','O','I','E','C'],
        ['A','A','A','S','I','J','M','A','Í','N','J','R','G','I','É','Á','D','T','I','T'],
        ['C','R','N','P','N','I','O','Í','R','M','H','X','Z','S','Í','M','T','Á','N','I'],
        ['I','U','T','N','E','Ñ','D','M','E','K','S','T','L','I','Z','R','A','M','E','C'],
        ['O','G','E','Ó','G','C','E','O','I','U','L','Y','Ú','T','É','O','J','E','G','A'],
        ['N','I','N','I','N','C','L','N','N','K','I','C','Ú','O','X','F','Ó','T','N','P'],
        ['E','F','I','C','I','D','O','O','E','C','L','M','I','S','T','N','Z','A','I','R'],
        ['S','N','M','C','E','A','S','C','G','U','A','G','G','Ó','N','I','A','M','E','O'],
        ['Q','O','I','U','D','D','Y','E','N','U','W','L','O','W','É','I','P','É','D','F'],
        ['T','C','E','R','N','I','M','Q','I','Á','G','J','I','Ñ','Í','C','H','Y','O','E'],
        ['R','N','N','T','Ó','R','É','L','Á','N','Q','G','U','D','E','Z','D','O','S','S'],
        ['M','Ó','T','S','I','U','T','H','C','S','S','F','U','R','A','S','Ú','K','E','I'],
        ['É','I','O','N','T','G','O','K','S','A','B','E','U','R','P','D','I','É','C','O'],
        ['F','T','Q','O','S','E','D','Ú','T','O','Q','S','Z','Y','Í','Z','V','D','O','N'],
        ['W','S','P','C','E','S','O','I','Ú','D','C','Á','Ñ','Ú','É','R','E','Z','R','A'],
        ['Ü','E','P','P','G','S','S','Á','B','Ú','Í','G','E','T','L','C','F','C','P','L'],
        ['R','G','Í','A','R','U','T','C','E','T','I','U','Q','R','A','M','Í','W','R','D']
    ]
};

// Inicializar la sopa de letras cuando se cargue la sección
function iniciarSopaLetras() {
    initializeGrid();
    initializeWordList();
    updateStats();
    
    // Evento para el botón de reinicio
    document.getElementById('resetButton').addEventListener('click', resetGame);
}

// Inicializar la cuadrícula
function initializeGrid() {
    const table = document.getElementById('wordGrid');
    table.innerHTML = '';
    
    for (let i = 0; i < WORD_SEARCH_CONFIG.grid.length; i++) {
        const row = document.createElement('tr');
        
        for (let j = 0; j < WORD_SEARCH_CONFIG.grid[i].length; j++) {
            const cell = document.createElement('td');
            cell.textContent = WORD_SEARCH_CONFIG.grid[i][j];
            cell.dataset.row = i;
            cell.dataset.col = j;
            
            // Eventos para selección de celdas
            cell.addEventListener('mousedown', handleMouseDown);
            cell.addEventListener('mouseenter', handleMouseEnter);
            cell.addEventListener('mouseup', handleMouseUp);
            
            row.appendChild(cell);
        }
        
        table.appendChild(row);
    }
}

// Inicializar la lista de palabras
function initializeWordList() {
    const wordList = document.getElementById('wordList');
    
    // Limpiar el contenedor (excepto el título)
    const title = wordList.querySelector('h3');
    wordList.innerHTML = '';
    wordList.appendChild(title);
    
    // Crear elementos para cada palabra
    WORD_SEARCH_CONFIG.words.forEach(word => {
        const wordDiv = document.createElement('div');
        wordDiv.textContent = WORD_SEARCH_CONFIG.displayNames[word] || word;
        wordDiv.dataset.word = word;
        wordDiv.addEventListener('click', () => highlightWord(word));
        wordList.appendChild(wordDiv);
    });
}

// Manejar evento de clic inicial
function handleMouseDown(e) {
    isMouseDown = true;
    selectedCells = [];
    clearSelections();
    toggleCellSelection(e.target);
    e.preventDefault();
}

// Manejar evento de arrastre
function handleMouseEnter(e) {
    if (isMouseDown) {
        toggleCellSelection(e.target);
    }
}

// Manejar evento de liberación del clic
function handleMouseUp() {
    isMouseDown = false;
    checkSelectedWord();
}

// Seleccionar/deseleccionar celda
function toggleCellSelection(cell) {
    if (!cell.classList.contains('found')) {
        const index = selectedCells.findIndex(c => 
            c.row == cell.dataset.row && c.col == cell.dataset.col);
        
        if (index === -1) {
            selectedCells.push({
                row: parseInt(cell.dataset.row),
                col: parseInt(cell.dataset.col),
                letter: cell.textContent
            });
            cell.classList.add('selected');
        } else {
            selectedCells.splice(index, 1);
            cell.classList.remove('selected');
        }
    }
}

// Limpiar selecciones
function clearSelections() {
    document.querySelectorAll('.selected').forEach(cell => {
        cell.classList.remove('selected');
    });
    selectedCells = [];
}

// Verificar si la selección forma una palabra válida
function checkSelectedWord() {
    if (selectedCells.length < 3) {
        clearSelections();
        return;
    }
    
    // Ordenar celdas seleccionadas
    selectedCells.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
    });
    
    // Construir palabra seleccionada
    let selectedWordForward = '';
    let selectedWordReverse = '';
    
    selectedCells.forEach(cell => {
        selectedWordForward += cell.letter;
    });
    
    for (let i = selectedCells.length - 1; i >= 0; i--) {
        selectedWordReverse += selectedCells[i].letter;
    }
    
    // Normalizar palabras
    const normalizedForward = selectedWordForward.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const normalizedReverse = selectedWordReverse.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    
    // Verificar coincidencia
    const matchedWord = WORD_SEARCH_CONFIG.words.find(word => 
        word === normalizedForward || 
        word === normalizedReverse);
    
    if (matchedWord && !foundWords.includes(matchedWord)) {
        foundWords.push(matchedWord);
        markWordAsFound(matchedWord);
        updateStats();
        clearSelections();
    } else {
        clearSelections();
    }
}

// Marcar palabra como encontrada
function markWordAsFound(word) {
    // Marcar en la lista
    document.querySelectorAll(`#wordList div[data-word="${word}"]`).forEach(div => {
        div.classList.add('found');
    });
    
    // Buscar y marcar en la cuadrícula
    findWordInGrid(word);
}

// Buscar palabra en la cuadrícula
function findWordInGrid(word) {
    const directions = [
        { dr: 0, dc: 1 }, { dr: 0, dc: -1 },
        { dr: 1, dc: 0 }, { dr: -1, dc: 0 }
    ];
    
    const normalizedWord = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const wordLength = normalizedWord.length;
    
    for (let row = 0; row < WORD_SEARCH_CONFIG.grid.length; row++) {
        for (let col = 0; col < WORD_SEARCH_CONFIG.grid[row].length; col++) {
            for (const dir of directions) {
                let possibleWord = '';
                const cells = [];
                
                for (let i = 0; i < wordLength; i++) {
                    const r = row + i * dir.dr;
                    const c = col + i * dir.dc;
                    
                    if (r >= 0 && r < WORD_SEARCH_CONFIG.grid.length && c >= 0 && c < WORD_SEARCH_CONFIG.grid[r].length) {
                        const letter = WORD_SEARCH_CONFIG.grid[r][c];
                        possibleWord += letter;
                        cells.push({ row: r, col: c });
                    } else {
                        break;
                    }
                }
                
                const normalizedPossible = possibleWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
                
                if (normalizedPossible === normalizedWord) {
                    // Marcar celdas como encontradas
                    cells.forEach(cell => {
                        const cellElement = document.querySelector(
                            `td[data-row="${cell.row}"][data-col="${cell.col}"]`);
                        if (cellElement) {
                            cellElement.classList.add('found');
                            cellElement.classList.remove('selected');
                        }
                    });
                    return;
                }
            }
        }
    }
}

// Resaltar palabra en la cuadrícula
function highlightWord(word) {
    clearSelections();
    findWordInGrid(word);
    setTimeout(clearSelections, 2000);
}

// Actualizar contador
function updateStats() {
    document.getElementById('foundCount').textContent = foundWords.length;
}

// Reiniciar juego
function resetGame() {
    selectedCells = [];
    foundWords = [];
    clearSelections();
    document.querySelectorAll('.found').forEach(el => {
        el.classList.remove('found');
    });
    updateStats();
}

// Modificar la función mostrarContenido para inicializar componentes específicos
async function mostrarContenido(contenedor, html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const seccion = doc.querySelector(`.${CONFIG.clases.seccion}`);
    
    if (!seccion) {
        throw new Error('Estructura de sección inválida');
    }
    
    // Animación de transición
    contenedor.style.opacity = '0';
    await new Promise(resolve => setTimeout(resolve, 300));
    
    contenedor.innerHTML = seccion.outerHTML;
    contenedor.style.opacity = '1';

    // Inicializar componentes específicos de la sección
    const idSeccion = window.location.hash.substring(1);
    
    if (idSeccion === 'sopa_letras') {
        iniciarSopaLetras();
    }
    else if (idSeccion === 'cuestionario') {
        // Inicialización para cuestionario si es necesario
    }
}