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
  const form = document.getElementById('quizForm');
  const totalQuestions = 10; // número total de preguntas
  let score = 0;

  for (let i = 1; i <= totalQuestions; i++) {
    const options = form['q' + i];
    let selectedValue = null;

    // 'options' puede ser una colección de radios, iteramos para saber cuál está seleccionado
    for (let option of options) {
      if (option.checked) {
        selectedValue = option.value;
        break;
      }
    }

    if (selectedValue === 'correct') {
      score++;
    }
  }

  const resultDiv = document.getElementById('result');
  resultDiv.textContent = `Tu puntuación es ${score} de ${totalQuestions}.`;
}
