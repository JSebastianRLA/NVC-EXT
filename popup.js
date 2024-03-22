document.addEventListener("DOMContentLoaded", function () {
  const checkButton = document.getElementById("checkButton");
  const resultDiv = document.getElementById("result");

  // Función para guardar las credenciales en el almacenamiento local
  function saveCredentials() {
    const dns = document.getElementById("dns").value;
    const apiPass = document.getElementById("apiPass").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

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
      document.getElementById("dns").value = items.dns || "";
      document.getElementById("apiPass").value = items.apiPass || "";
      document.getElementById("username").value = items.username || "";
      document.getElementById("password").value = items.password || "";
    }
  );

  checkButton.addEventListener("click", function () {
    // Guardar las credenciales antes de realizar la verificación de la API
    saveCredentials();

    // Obtener los valores de los campos de entrada
    const dns = document.getElementById("dns").value;
    const apiPass = document.getElementById("apiPass").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

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
});

// Escuchar mensajes del script de fondo
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "apiData") {
    // Procesar los datos recibidos de la API
    const eventData = message.eventos;

    // Construir la tabla HTML
    let tableHTML = '<table class="event-table">';
    tableHTML +=
      "<tr><th>Evento</th><th>ID del Agente</th><th>ID del Evento</th></tr>";
    eventData.forEach((event) => {
      tableHTML += `<tr><td>${event.evento}</td><td>${event.id_agente}</td><td>${event.id_evento}</td></tr>`;
    });
    tableHTML += "</table>";

    // Agregar la tabla al div resultDiv
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = tableHTML;
  }
});
