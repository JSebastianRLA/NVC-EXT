// Definir una variable global para almacenar los eventos
var eventosAnteriores = [];
const maxEventosAlmacenados = 10; // Definir el máximo de eventos almacenados

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "checkAPI") {
        // Recuperar las credenciales almacenadas del almacenamiento local
        chrome.storage.local.get(["dns", "apiPass", "username", "password"], function(items) {
            const dns = items.dns;
            const apiPass = items.apiPass;
            const username = items.username;
            const password = items.password;

            // Verificar que todas las credenciales estén presentes antes de realizar la verificación de la API
            if (dns && apiPass && username && password) {
                // Construir la URL de la API utilizando los valores recuperados
                const apiUrl = `https://${dns}/pandora_console/include/api.php?op=get&op2=events&return_type=json&apipass=${apiPass}&user=${username}&pass=${password}`;

                // Obtener los datos de la API y verificar los cambios
                checkAPIForChanges(apiUrl, sendResponse);
            } else {
                // Enviar una respuesta indicando que faltan credenciales
                sendResponse({ success: false, error: "Faltan credenciales" });
            }
        });

        // Necesario para mantener la conexión abierta mientras se espera la respuesta
        return true;
    }
});

function checkAPIForChanges(apiUrl, callback) {
    // Obtener los datos de la API
    fetch(apiUrl)
        .then((response) => {
            if (!response.ok) {
                throw new Error("La solicitud a la API falló: " + response.statusText);
            }
            return response.text();
        })
        .then((text) => {
            const data = JSON.parse(text);
            // Verificar si la respuesta contiene un mensaje de error
            if (text.includes("auth error")) {
                throw new Error("Error de autenticación en la API: " + text);
            }
            // Obtener la lista de eventos
            console.log(data);
            const nuevosEventos = data.data;
            const event = data.data.length;
            const idagent = data.data.id_agente;
            console.log("Eventos nuevos recibidos:", event);

            // Filtrar los eventos que no estén en la lista de eventos almacenados
            const eventosNuevos = nuevosEventos.filter((evento) => {
                return !eventosAnteriores.some(
                    (eventoAnterior) => eventoAnterior.id_evento === evento.id_evento
                );
            });

            // Mostrar solo los eventos más recientes
            const eventosRecientes = eventosNuevos.slice(-maxEventosAlmacenados);
            console.log("Eventos más recientes:", eventosRecientes);

            // Crear y mostrar notificaciones para los eventos más recientes
            eventosRecientes.forEach((evento) => {
                let mensaje = "";
                if (evento.event_type === "going_up_critical") {
                    mensaje = "Hay un nuevo evento crítico.";
                } else if (evento.event_type === "going_down_warning") {
                    mensaje = "Hay un nuevo evento peligroso.";
                }
                // Obtener la fecha y hora actual
                const fechaHoraActual = new Date().toLocaleString();
                // Crear y mostrar la notificación con la fecha y hora actual
                chrome.notifications.create(null, {
                    type: "basic",
                    iconUrl: "images/icon128.png",
                    title: "¡Nuevo evento!",
                    message:
                        mensaje +
                        ", en el agente con id de agente" +
                        idagent +
                        ", con fecha y hora: " +
                        fechaHoraActual,
                });
            });

            // Actualizar los eventos almacenados
            eventosAnteriores = nuevosEventos;

            // Envía una respuesta al popup
            callback({ success: true });
        })
        .catch((error) => {
            console.error("Error al obtener datos de la API:", error);
            callback({ success: false });
        });
}

function callAPIRepeatedly() {
    // Llamar a la función por primera vez
    checkAPIForChanges();

    // Establecer intervalo para llamar a la función cada minuto
    setInterval(() => {
        checkAPIForChanges((response) => {
            if (response.success) {
                console.log("Llamada al API realizada exitosamente.");
            } else {
                console.error("Error al realizar la llamada al API.");
            }
        });
    }, 10000); // 10000 milisegundos = 10 segundos
}

// Llamar a la función para iniciar la llamada periódica al API
callAPIRepeatedly();
