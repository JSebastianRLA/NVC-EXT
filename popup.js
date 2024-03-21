document.addEventListener('DOMContentLoaded', function() {
  const checkButton = document.getElementById('checkButton');
  const resultDiv = document.getElementById('result');

  // Función para guardar las credenciales en el almacenamiento local
  function saveCredentials() {
    const dns = document.getElementById('dns').value;
    const apiPass = document.getElementById('apiPass').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Almacenar las credenciales en el almacenamiento local
    chrome.storage.local.set({
      "dns": dns,
      "apiPass": apiPass,
      "username": username,
      "password": password
    });
  }

  // Recuperar las credenciales almacenadas del almacenamiento local y establecerlas en los campos de entrada
  chrome.storage.local.get(["dns", "apiPass", "username", "password"], function(items) {
      document.getElementById("dns").value = items.dns || "";
      document.getElementById("apiPass").value = items.apiPass || "";
      document.getElementById("username").value = items.username || "";
      document.getElementById("password").value = items.password || "";
  });

  checkButton.addEventListener('click', function() {
      // Guardar las credenciales antes de realizar la verificación de la API
      saveCredentials();

      // Obtener los valores de los campos de entrada
      const dns = document.getElementById('dns').value;
      const apiPass = document.getElementById('apiPass').value;
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      resultDiv.innerText = 'Verificando API...';

      // Envía un mensaje al script de fondo con los valores de los campos de entrada
      chrome.runtime.sendMessage({
          action: 'checkAPI',
          dns: dns,
          apiPass: apiPass,
          username: username,
          password: password
      }, function(response) {
          if (response && response.success) { // Verifica si response está definido
              resultDiv.innerText = '¡API verificada con éxito!';
          } else {
              resultDiv.innerText = 'Error al verificar la API.';
          }
      });
  });
});
