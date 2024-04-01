// Variables globales para almacenar las credenciales
let dns, apiPass, username, password;

document.addEventListener("DOMContentLoaded", function () {
  const buttonContainer = document.getElementById("buttonContainer");

  document
    .getElementById("toggleButton")
    .addEventListener("click", function () {
      const formContainer = document.getElementById("formContainer");
      formContainer.style.display =
        formContainer.style.display === "none" ? "block" : "none";
    });
  const formContainer = document.getElementById("formContainer");
  formContainer.style.display = "none";

  const checkButton = document.getElementById("checkButton");
  const spinnerContainer = document.getElementById("loadingIndicator"); // Cambiado el ID del contenedor del spinner

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
    // Mostrar el spinner
    spinnerContainer.style.display = "block";

    // Guardar las credenciales antes de realizar la verificación de la API
    saveCredentials();

    const resultDiv = document.getElementById("eventTableBody");
    resultDiv.innerText = "Verificando API...";

    // Envía un mensaje al script de fondo con los valores de los campos de entrada
    chrome.runtime.sendMessage(
      {
        action: "saveCredentials",
        credentials: {
          dns: dns,
          apiPass: apiPass,
          username: username,
          password: password,
        },
      },
      function (response) {
        if (response && response.success) {
          resultDiv.innerText = "¡API verificada con éxito!";
        } else {
          resultDiv.innerText = "Error al verificar la API.";
        }
      }
    );

    // Ocultar el spinner después de 3 segundos
    setTimeout(function () {
      spinnerContainer.style.display = "none";
    }, 3000);
  });

  // Función para imprimir un mensaje con el ID del evento
  function imprimirMensaje(idEvento) {
    console.log("Hola mundo " + idEvento);
  }

  // Función para validar un evento por su ID
  function validarEventoPorId(idEvento) {
    // Construir la URL de la API con los parámetros necesarios
    const url = `https://${dns}/pandora_console/include/api.php?op=set&op2=validate_event_by_id&id=${idEvento}&apipass=${apiPass}&user=${username}&pass=${password}`;

    // Realizar la solicitud HTTP utilizando fetch
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al validar el evento");
        }
        return response.json();
      })
      .then((data) => {
        // Manejar la respuesta de la API
        console.log("Evento validado con éxito:", data);
      })
      .catch((error) => {
        // Manejar errores de la solicitud
        console.error("Error al validar el evento:", error);
      });
  }

  // Escuchar mensajes del script de fondo
  chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
  ) {
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
      let tableHTML = "";
      filteredEvents.forEach((event) => {
        tableHTML += `<tr><td>${event.evento}</td><td>${event.id_agente}</td>`;
        // Crear el nuevo botón y agregar el evento de clic
        tableHTML += `<td><button class="new-button" data-id="${event.id_evento}">Nuevo Botón</button></td></tr>`;
      });

      // Agregar las filas a la tabla existente
      const resultTableBody = document.getElementById("eventTableBody");
      resultTableBody.innerHTML = tableHTML;

      // Escuchar clics en los botones con la clase "new-button"
      const newButtons = document.querySelectorAll(".new-button");
      newButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const eventId = this.getAttribute("data-id");
          console.log("ID del evento:", eventId);
          imprimirMensaje(eventId);

          // Mostrar el spinner
          spinnerContainer.style.display = "block";

          // Ocultar el spinner después de 3 segundos
          setTimeout(function () {
            spinnerContainer.style.display = "none";
          }, 3000);

          // Validar el evento por su ID
          validarEventoPorId(eventId);
        });
      });
    }
  });
});
