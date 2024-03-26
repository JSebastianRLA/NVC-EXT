// Variables globales para almacenar las credenciales
let dns, apiPass, username, password;

document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.createElement("button");
  toggleButton.textContent = "Mostrar/Ocultar";
  toggleButton.id = "toggleButton";
  document.body.insertBefore(
    toggleButton,
    document.getElementById("formContainer")
  );

  toggleButton.addEventListener("click", function () {
    const formContainer = document.getElementById("formContainer");
    if (formContainer.style.display === "none") {
      formContainer.style.display = "block";
    } else {
      formContainer.style.display = "none";
    }
  });

  const checkButton = document.getElementById("checkButton");
  const resultDiv = document.getElementById("result");

  // Función para guardar las credenciales en el almacenamiento local
  function saveCredentials() {
    dns = document.getElementById("dns").value;
    apiPass = document.getElementById("apiPass").value;
    username = document.getElementById("username").value;
    password = document.getElementById("password").value;

    // Almacenar las credenciales en el almacenamiento local
    chrome.storage.local.set({
      dns: dns,
      apiPass: apiPass,
      username: username,
      password: password,
    });
  }

  // Recuperar las credenciales almacenadas del almacenamiento local y establecerlas en los campos de entrada
  chrome.storage.local.get(
    ["dns", "apiPass", "username", "password"],
    function (items) {
      dns = items.dns || "";
      apiPass = items.apiPass || "";
      username = items.username || "";
      password = items.password || "";

      document.getElementById("dns").value = dns;
      document.getElementById("apiPass").value = apiPass;
      document.getElementById("username").value = username;
      document.getElementById("password").value = password;
    }
  );

  checkButton.addEventListener("click", function () {
    // Guardar las credenciales antes de realizar la verificación de la API
    saveCredentials();

    resultDiv.innerText = "Verificando API...";

    // Envía un mensaje al script de fondo con los valores de los campos de entrada
    chrome.runtime.sendMessage(
      {
        action: "saveCredentials", // Cambiado a "saveCredentials"
        credentials: {
          // Envía las credenciales como objeto
          dns: dns,
          apiPass: apiPass,
          username: username,
          password: password,
        },
      },
      function (response) {
        if (response && response.success) {
          // Verifica si response está definido
          resultDiv.innerText = "¡API verificada con éxito!";
        } else {
          resultDiv.innerText = "Error al verificar la API.";
        }
      }
    );
  });

  // Agregar event listener a los botones de validar eventos
  document.querySelectorAll(".validate-button").forEach((item) => {
    item.addEventListener("click", (event) => {
      const idEvento = item.getAttribute("data-id");
      imprimirMensaje(idEvento); // Llama a la función imprimirMensaje con el ID del evento
    });
  });
});

// Función para imprimir un mensaje con el ID del evento
function imprimirMensaje(idEvento) {
  console.log("Hola mundo " + idEvento);
}

// Escuchar mensajes del script de fondo
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "apiData") {
    // Procesar los datos recibidos de la API
    const eventData = message.eventos;

    // Filtrar los eventos según las condiciones especificadas
    const filteredEvents = eventData.filter((event) => {
      const event_type = event.evento;
      const estado = event.estado;
      return (
        (event.event_type === "going_up_warning" ||
          event.event_type === "going_down_warning" ||
          event.event_type === "going_down_critical" ||
          event.event_type === "going_up_critical") &&
        event.estado === "0"
      );
    });

    // Construir la tabla HTML con los eventos filtrados
    let tableHTML = '<table class="event-table">';
    tableHTML +=
      "<tr><th>Evento</th><th>ID del Agente</th><th>ID del Evento</th></tr>";
    filteredEvents.forEach((event) => {
      tableHTML += `<tr><td>${event.evento}</td><td>${event.id_agente}</td><td><button class="validate-button" data-id="${event.id_evento}">Validar</button></td></tr>`;
    });
    tableHTML += "</table>";

    // Agregar la tabla al div resultDiv
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = tableHTML;
  }
});
