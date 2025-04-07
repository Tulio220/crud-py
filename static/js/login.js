const API_URL = "http://192.168.14.170:5000/api/auth";

document.addEventListener("DOMContentLoaded", () => {
  // Verificar token somente se não estiver já na página de cursos
  const token = localStorage.getItem("token");
  const currentPage = window.location.pathname.split("/").pop();

  if (token && currentPage !== "cursos.html") {
    window.location.replace("/cursos.html");
    return;
  }

  // Configurar formulários apenas se necessário
  if (document.getElementById("login-form")) {
    document.getElementById("login-form").addEventListener("submit", (e) => {
      e.preventDefault();
      fazerLogin();
    });
  }

  if (document.getElementById("cadastro-form")) {
    document.getElementById("cadastro-form").addEventListener("submit", (e) => {
      e.preventDefault();
      fazerCadastro();
    });
  }
});

function mostrarCadastro() {
  const loginContainer = document.getElementById("login-container");
  const cadastroContainer = document.getElementById("cadastro-container");

  if (loginContainer) loginContainer.style.display = "none";
  if (cadastroContainer) cadastroContainer.style.display = "block";
}

function mostrarLogin() {
  const loginContainer = document.getElementById("login-container");
  const cadastroContainer = document.getElementById("cadastro-container");

  if (loginContainer) loginContainer.style.display = "block";
  if (cadastroContainer) cadastroContainer.style.display = "none";
}

async function fazerLogin() {
  const email = document.getElementById("login-email").value;
  const senha = document.getElementById("login-senha").value;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem("token", data.token);

      // Redirecionamento seguro com replace
      setTimeout(() => {
        window.location.replace("/cursos.html");
      }, 50);
    } else {
      alert(data.message || "Erro no login");
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Erro ao conectar ao servidor");
  }
}

async function fazerCadastro() {
  const nome = document.getElementById("cadastro-nome").value;
  const email = document.getElementById("cadastro-email").value;
  const senha = document.getElementById("cadastro-senha").value;

  try {
    const response = await fetch(`${API_URL}/registrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha }),
    });

    const data = await response.json();

    if (data.success) {
      alert("Cadastro realizado! Faça login");
      mostrarLogin();
    } else {
      alert(data.message || "Erro no cadastro");
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Erro ao conectar ao servidor");
  }
}
