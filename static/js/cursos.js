// static/js/cursos.js
let conteudoGeralTabela = [];

// ====================== FUNÇÕES DE AUTENTICAÇÃO ======================
function verificarAutenticacao() {
  const token = localStorage.getItem("token");
  if (!token && !window.location.href.includes("/login.html")) {
    window.location.href = "/login.html";
  }
}

// Adicione no topo do arquivo
(function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login.html";
  }
})();

function configurarFetch() {
  const _fetch = window.fetch;
  window.fetch = async (url, options = {}) => {
    const token = localStorage.getItem("token");

    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await _fetch(url, options);

    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login.html";
    }

    return response;
  };
}

verificarAutenticacao();
configurarFetch();

// ====================== FUNÇÕES DE INTERFACE ======================
function showNotification(message, type = "success") {
  const container = document.getElementById("notification-container");
  if (!container) return;

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  container.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateY(-20px)";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function toggleLoading(show) {
  const loader = document.getElementById("loading-overlay");
  if (loader) loader.style.display = show ? "flex" : "none";
}

// ====================== FUNÇÕES DE DADOS ======================
async function fetchAPI(url, method = "GET", body = null) {
  toggleLoading(true);
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Erro HTTP! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Erro na requisição ${method} para ${url}:`, error);
    showNotification("Erro na operação. Veja o console.", "error");
    throw error;
  } finally {
    toggleLoading(false);
  }
}

async function fetchCursos() {
  try {
    const data = await fetchAPI("http://192.168.14.170:5000/api/cursos");
    conteudoGeralTabela = data;

    console.log("Dados recebidos:", data);

    preencherTabela(data);
    return data;
  } catch (error) {
    return [];
  }
}

// ====================== MANIPULAÇÃO DA TABELA ======================
function preencherTabela(cursos) {
  const tbody = document.getElementById("lista");
  tbody.innerHTML = "";

  if (!Array.isArray(cursos) || cursos.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    Nenhum curso encontrado
                </td>
            </tr>`;
    return;
  }

  cursos.forEach((curso, index) => {
    const row = document.createElement("tr");
    row.dataset.index = index;

    console.log(curso);

    row.innerHTML = `
            <td>${curso.idcurso || "N/A"}</td>
            <td>${curso.nome || "N/A"}</td>
            <td>${curso.descricao || "N/A"}</td>
            <td>${curso.carga_horaria || "N/A"}h</td>
            <td>${formatarMoeda(curso.valor)}</td>
            <td class="btn-container">
                <button class="edit-btn" data-id="${curso.idcurso}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="delete-btn" data-id="${curso.idcurso}">
                    <i class="fas fa-trash-alt"></i> Excluir
                </button>
            </td>`;
    tbody.appendChild(row);
  });

  inicializarDataTable();
  ativarEventosBotoes();
}

function formatarMoeda(valor) {
  if (!valor) return "N/A";
  const numero = parseFloat(valor);
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

// ====================== DATATABLE CONFIG ======================
function inicializarDataTable() {
  if ($.fn.DataTable.isDataTable("#userTable")) {
    $("#userTable").DataTable().destroy();
  }

  $("#userTable").DataTable({
    pageLength: 5,
    lengthMenu: [5, 10, 25, 50],
    language: {
      emptyTable: "Nenhum registro encontrado",
      info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
      infoEmpty: "Mostrando 0 a 0 de 0 registros",
      infoFiltered: "(filtrado de _MAX_ registros totais)",
      lengthMenu: "Mostrar _MENU_ registros por página",
      loadingRecords: "Carregando...",
      processing: "Processando...",
      search: "Pesquisar:",
      searchPlaceholder: "Digite para pesquisar...",
      zeroRecords: "Nenhum registro correspondente encontrado",
      paginate: {
        first: "Primeiro",
        last: "Último",
        next: '<i class="fas fa-chevron-right"></i>',
        previous: '<i class="fas fa-chevron-left"></i>',
      },
    },
    order: [[0, "desc"]],
    responsive: true,
    dom: '<"top"fl>rt<"bottom"ip>',
  });
}

// ====================== EVENT HANDLERS ======================
function ativarEventosBotoes() {
  $(document)
    .off("click", ".edit-btn")
    .on("click", ".edit-btn", handleEditClick);

  $(document)
    .off("click", ".delete-btn")
    .on("click", ".delete-btn", handleDeleteClick);
}

async function handleEditClick(event) {
  const id = $(event.currentTarget).data("id");
  try {
    const curso = await fetchAPI(`http://192.168.14.170:5000/api/cursos/${id}`);

    $("#editId").val(curso.idcurso);
    $("#editNome").val(curso.nome);
    $("#editDescricao").val(curso.descricao);
    $("#editCargaHoraria").val(curso.carga_horaria);
    $("#editValor").val(curso.valor);

    const editModal = new bootstrap.Modal(document.getElementById("editModal"));
    editModal.show();

    $("#saveEdit")
      .off("click")
      .on("click", async () => {
        const updatedCurso = {
          nome: $("#editNome").val().trim(),
          descricao: $("#editDescricao").val().trim(),
          carga_horaria: Number($("#editCargaHoraria").val()),
          valor: parseFloat($("#editValor").val()),
        };

        if (!updatedCurso.nome || !updatedCurso.descricao) {
          showNotification("Preencha todos os campos obrigatórios", "error");
          return;
        }

        try {
          await fetchAPI(
            `http://192.168.14.170:5000/api/cursos/${id}`,
            "PUT",
            updatedCurso
          );

          Swal.fire({
            icon: "success",
            title: "Curso atualizado!",
            text: "As alterações foram salvas com sucesso.",
            timer: 2000, // Exibir por 2 segundos
            timerProgressBar: true,
            showConfirmButton: false,
          }).then(() => {
            editModal.hide();
            window.location.reload(); // Recarrega após o alerta desaparecer
          });

          await fetchCursos();
        } catch (error) {
          console.error("Erro ao atualizar:", error);
        }
      });
  } catch (error) {
    showNotification("Erro ao carregar curso", "error");
  }
}

async function handleDeleteClick(event) {
  const id = $(event.currentTarget).data("id");
  const deleteModal = new bootstrap.Modal(
    document.getElementById("deleteModal")
  );
  deleteModal.show();

  $("#confirmDelete")
    .off("click")
    .on("click", async () => {
      try {
        await fetchAPI(`http://192.168.14.170:5000/api/cursos/${id}`, "DELETE");

        Swal.fire({
          icon: "success",
          title: "Curso excluído!",
          text: "O curso foi removido com sucesso.",
          timer: 2000, // Exibir por 2 segundos
          timerProgressBar: true,
          showConfirmButton: false,
        }).then(() => {
          window.location.reload(); // Recarrega após o alerta desaparecer
        });

        await fetchCursos();
      } catch (error) {
        console.error("Erro ao excluir:", error);
      } finally {
        deleteModal.hide();
      }
    });
}

// ====================== CRIAÇÃO DE CURSO ======================
$("#saveCreate").click(async () => {
  const newCurso = {
    nome: $("#createNome").val().trim(),
    descricao: $("#createDescricao").val().trim(),
    carga_horaria: $("#createCargaHoraria").val(),
    valor: parseFloat($("#createValor").val()),
  };

  if (
    !newCurso.nome ||
    !newCurso.descricao ||
    isNaN(newCurso.carga_horaria) ||
    isNaN(newCurso.valor)
  ) {
    showNotification("Preencha todos os campos corretamente", "error");
    return;
  }

  try {
    await fetchAPI("http://192.168.14.170:5000/api/cursos", "POST", newCurso);

    Swal.fire({
      icon: "success",
      title: "Curso cadastrado!",
      text: "O curso foi adicionado com sucesso.",
      timer: 2000, // Tempo em milissegundos (2 segundos)
      timerProgressBar: true,
      showConfirmButton: false,
    }).then(() => {
      $("#createModal").modal("hide");
      $("#createForm")[0].reset();
      window.location.reload(); // Recarrega após o alerta sumir
    });

    await fetchCursos();
  } catch (error) {
    console.error("Erro ao criar curso:", error);
  }
});

// ====================== INICIALIZAÇÃO ======================
$(document).ready(function () {
  // Configuração inicial
  fetchCursos();

  // Tema escuro/claro
  if (localStorage.getItem("darkTheme") === "true") {
    $("body").addClass("dark-theme");
    $("#themeToggle").html('<i class="fas fa-sun"></i>');
  }

  $("#themeToggle").click(function () {
    $("body").toggleClass("dark-theme");
    localStorage.setItem("darkTheme", $("body").hasClass("dark-theme"));
    $(this).html(
      $("body").hasClass("dark-theme")
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>'
    );
  });

  // Configuração de eventos
  $("#searchInput").on("input", function () {
    $("#userTable").DataTable().search(this.value).draw();
  });

  // Logout
  $("header").append(`
        <button onclick="logout()" class="btn btn-danger logout-btn">
            <i class="fas fa-sign-out-alt"></i> Sair
        </button>
    `);
});

// ====================== FUNÇÃO DE LOGOUT ======================
function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login.html";
}
