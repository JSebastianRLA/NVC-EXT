// Definir una variable global para almacenar las credenciales y los eventos anteriores
let credentials = null;
let eventosAnteriores = [];

// Obtener las credenciales almacenadas del almacenamiento local al inicio
chrome.storage.local.get(["credentials"], function (items) {
    credentials = items.credentials;
});

// No es necesario verificar las credenciales cada vez que se abre la extensión
// Deja la lógica de verificación solo cuando se envían nuevas credenciales

// Escuchar mensajes del script de contenido
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "saveCredentials") {
        // Almacenar las credenciales proporcionadas por el usuario
        credentials = request.credentials;

        // Guardar las credenciales en el almacenamiento local para su uso futuro
        chrome.storage.local.set({ credentials: credentials });

        sendResponse({ success: true }); // Confirmar que las credenciales se guardaron correctamente
    }
});

// Definir la función para verificar cambios en la API
function checkAPIForChanges() {
    if (!credentials) {
        console.log("Faltan credenciales para realizar la consulta a la API.");
        return;
    }

    // Construir la URL de la API utilizando las credenciales almacenadas
    const { dns, apiPass, username, password } = credentials;
    const apiUrl = `http://${dns}/pandora_console/include/api.php?op=get&op2=events&return_type=json&apipass=${apiPass}&user=${username}&pass=${password}`;
    console.log(apiUrl);

    // Obtener los datos de la API
    fetch(apiUrl)
        .then((response) => {
            if (!response.ok) {
                throw new Error("La solicitud a la API falló: " + response.statusText);
            }
            return response.json();
        })
        .then((data) => {
            console.log(data);
            const nuevosEventos = data.data;
            console.log("Eventos nuevos recibidos:", nuevosEventos.length);

            // Filtrar los eventos que no estén en la lista de eventos almacenados
            const eventosNuevos = nuevosEventos.filter((evento) => {
                return !eventosAnteriores.some(
                    (eventoAnterior) => eventoAnterior.id_evento === evento.id_evento
                );
            });

            console.log(nuevosEventos[0]?.event_type); // Asegúrate de que hay al menos un evento nuevo antes de acceder a event_type
            console.log("Eventos nuevos filtrados:", eventosNuevos);

            // Si hay eventos nuevos, mostrar una notificación y reproducir el sonido
            if (eventosNuevos.length > 0) {
                eventosNuevos.forEach((evento) => {
                    let mensaje = "";
                    switch (evento.event_type) {
                        case "going_up_critical":
                            mensaje = "Hay un nuevo evento crítico en aumento.";
                            break;
                        case "going_down_critical":
                            mensaje = "Hay un nuevo evento crítico en descenso.";
                            break;
                        case "going_down_warning":
                            mensaje = "Hay un nuevo evento peligroso en descenso.";
                            break;
                        case "going_up_warning":
                            mensaje = "Hay un nuevo evento peligroso en aumento.";
                            break;
                    }
                    const fechaHoraActual = new Date().toLocaleString();
                    chrome.notifications.create(null, {
                        type: 'basic',
                        iconUrl: chrome.runtime.getURL('images/icon128.png'),
                        title: '¡Nuevo evento!',
                        message: `${mensaje}, en el agente con ID ${evento.id_agente}, con fecha y hora: ${fechaHoraActual}`,
                    });

                });
            }

            // Actualizar los eventos almacenados
            eventosAnteriores = nuevosEventos;

            // Enviar la data al popup si está abierto
            chrome.runtime.sendMessage({
                action: "apiData",
                eventos: nuevosEventos,
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log("No se pudo enviar el mensaje: el popup no está abierto.");
                }
            });

            // Enviar mensaje al popup para mostrar u ocultar el mensaje "Sin eventos nuevos" si está abierto
            chrome.runtime.sendMessage({
                action: "updateNoEventsMessage",
                show: eventosNuevos.length === 0
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log("No se pudo enviar el mensaje: el popup no está abierto.");
                }
            });
        })
        .catch((error) => {
            console.error("Error al obtener datos de la API:", error);
        });
}

// Establecer intervalo para llamar a la función cada 5000 milisegundos (5 segundos)
setInterval(checkAPIForChanges, 5000);
