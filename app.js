// ==============================
// VARS, LOCALSTORAGE & INIT
// ==============================

let gastosPorMes = {};
let ingresosFijos = {};
let ingresosExtras = {};
let ahorros = {};
let cuotasPendientes = {};
let objetivos = [];
let gastosRecurrentes = [];
let misCategorias = [
  { nombre: "Comida", icono: "🍔", color: "#ffab91" },
  { nombre: "Transporte", icono: "🚗", color: "#81d4fa" },
  { nombre: "Salud", icono: "💊", color: "#ce93d8" },
  { nombre: "Ocio", icono: "🎉", color: "#ffd54f" },
  { nombre: "Supermercado", icono: "🛒", color: "#aed581" },
  { nombre: "Finanzas", icono: "💳", color: "#90caf9" },
  { nombre: "Servicios", icono: "📱", color: "#a1887f" },
  { nombre: "Electrodomésticos", icono: "📺", color: "#bcaaa4" },
  { nombre: "Otros", icono: "📦", color: "#e0e0e0" }
];
let logros = [];

document.addEventListener("DOMContentLoaded", () => {
  // ========== LOGIN/REGISTRO ==========

  const loginContainer = document.getElementById("login-container");
  const registerContainer = document.getElementById("register-container");
  const mainDashboard = document.querySelector(".finzn-main-grid");
  const header = document.querySelector(".finzn-header-pc");

  // Ocultar dashboard y header al principio
  header.style.display = "none";
  mainDashboard.style.display = "none";
  loginContainer.style.display = "flex";
  registerContainer.style.display = "none";

  // LOGIN
  document.getElementById("login-btn").addEventListener("click", async (e) => {
    e.preventDefault();
    const user = document.getElementById("login-user").value.trim();
    const pass = document.getElementById("login-pass").value;
    if (!user || !pass) {
      document.getElementById("login-error").textContent = "Completá usuario y contraseña";
      return;
    }
    try {
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, pass }),
      });
      const data = await res.json();
      if (data.ok) {
        document.getElementById("usuario-logueado").textContent = `👤 ${user}`;
        loginContainer.style.display = "none";
        header.style.display = "";
        mainDashboard.style.display = "grid";
        localStorage.setItem("usuarioActual", user);
        inicializarDatosUsuario();
      } else {
        document.getElementById("login-error").textContent = data.error || "Login incorrecto";
      }
    } catch {
      // Prueba offline: siempre entra
      document.getElementById("usuario-logueado").textContent = `👤 ${user}`;
      loginContainer.style.display = "none";
      header.style.display = "";
      mainDashboard.style.display = "grid";
      localStorage.setItem("usuarioActual", user);
      inicializarDatosUsuario();
    }
  });
  document.getElementById("show-register").addEventListener("click", (e) => {
    e.preventDefault();
    loginContainer.style.display = "none";
    registerContainer.style.display = "flex";
  });
  document.getElementById("show-login").addEventListener("click", (e) => {
    e.preventDefault();
    registerContainer.style.display = "none";
    loginContainer.style.display = "flex";
  });
  document.getElementById("register-btn").addEventListener("click", async () => {
    const user = document.getElementById("register-user").value.trim();
    const pass = document.getElementById("register-pass").value;
    if (!user || !pass) {
      document.getElementById("register-error").textContent = "Completá usuario y contraseña";
      return;
    }
    try {
      const res = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, pass }),
      });
      const data = await res.json();
      if (data.ok) {
        registerContainer.style.display = "none";
        loginContainer.style.display = "flex";
        document.getElementById("login-error").textContent = "¡Cuenta creada! Ahora iniciá sesión.";
      } else {
        document.getElementById("register-error").textContent = data.error || "No se pudo crear la cuenta";
      }
    } catch {
      registerContainer.style.display = "none";
      loginContainer.style.display = "flex";
      document.getElementById("login-error").textContent = "¡Cuenta creada! Ahora iniciá sesión.";
    }
  });

  // ========== LOCALSTORAGE & INICIALIZACIÓN ==========
  function getUser() {
    return localStorage.getItem("usuarioActual") || "invitado";
  }
  function guardarDatos() {
    const user = getUser();
    const data = { ingresosFijos, ingresosExtras, ahorros, cuotasPendientes, gastosRecurrentes, misCategorias, logros };
    localStorage.setItem("finzn-data-" + user, JSON.stringify(data));
  }
  function cargarDatos() {
    const user = getUser();
    const data = localStorage.getItem("finzn-data-" + user);
    if (data) {
      const parsed = JSON.parse(data);
      Object.assign(ingresosFijos, parsed.ingresosFijos || {});
      Object.assign(ingresosExtras, parsed.ingresosExtras || {});
      Object.assign(ahorros, parsed.ahorros || {});
      Object.assign(cuotasPendientes, parsed.cuotasPendientes || {});
      gastosRecurrentes = parsed.gastosRecurrentes || [];
      misCategorias = parsed.misCategorias || misCategorias;
      logros = parsed.logros || [];
    }
  }
  function inicializarDatosUsuario() {
    cargarDatos();
    cargarObjetivos();
    renderObjetivos();
    renderCategorias();
    renderLogros();
    render();
  }
  // ========== FECHAS Y MESES ==========
  function obtenerMesActual() {
    const fecha = new Date();
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
  }
  function avanzarMes(mesStr, cantidad) {
    const [año, mes] = mesStr.split("-").map(Number);
    const fecha = new Date(año, mes - 1 + cantidad, 1);
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
  }
  cargarDatos();
  let mesActual = obtenerMesActual();

  // ========== SELECTOR DE MESES ==========
  const selectorMes = document.getElementById("mes-selector");
  function generarOpcionesMeses() {
    const años = [2024, 2025, 2026];
    selectorMes.innerHTML = "";
    años.forEach(año => {
      for (let mes = 1; mes <= 12; mes++) {
        const value = `${año}-${String(mes).padStart(2, "0")}`;
        const option = document.createElement("option");
        option.value = value;
        option.textContent = `${value}`;
        selectorMes.appendChild(option);
      }
    });
    selectorMes.value = mesActual;
  }
  selectorMes.addEventListener("change", () => {
    mesActual = selectorMes.value;
    aplicarRecurrentes();
    aplicarIngresosFijos();
    render();
  });

  // ========== INGRESO FIJO ==========
  const formFijo = document.getElementById("fijo-form");
  formFijo && formFijo.addEventListener("submit", (e) => {
    e.preventDefault();
    const monto = parseFloat(document.getElementById("fijo-input").value);
    if (!isNaN(monto)) {
      ingresosFijos["monto"] = monto;
      document.getElementById("fijo-input").value = "";
      aplicarIngresosFijos();
      render();
      guardarDatos();
    }
  });
  function aplicarIngresosFijos() {
    if (!ingresosFijos["monto"]) return;
    const años = [2024, 2025, 2026];
    años.forEach(año => {
      for (let mes = 1; mes <= 12; mes++) {
        const mesClave = `${año}-${String(mes).padStart(2, "0")}`;
        ingresosFijos[mesClave] = ingresosFijos["monto"];
      }
    });
  }

  // ========== INGRESO EXTRA ==========
  const formExtra = document.getElementById("extra-form");
  formExtra && formExtra.addEventListener("submit", (e) => {
    e.preventDefault();
    const desc = document.getElementById("extra-desc").value.trim();
    const monto = parseFloat(document.getElementById("extra-input").value);
    const categoria = document.getElementById("extra-cat").value;
    if (desc && !isNaN(monto) && categoria) {
      if (!ingresosExtras[mesActual]) ingresosExtras[mesActual] = [];
      ingresosExtras[mesActual].push({ desc, monto, categoria });
      document.getElementById("extra-input").value = "";
      document.getElementById("extra-desc").value = "";
      document.getElementById("extra-cat").value = "";
      render();
      guardarDatos();
    }
  });

  // ========== POPUPS ==========
  document.getElementById("abrir-popup").addEventListener("click", () => {
    document.getElementById("popup-gasto").classList.add("visible");
  });
  document.getElementById("cerrar-popup").addEventListener("click", () => {
    document.getElementById("popup-gasto").classList.remove("visible");
  });
  document.getElementById("cerrar-informe").addEventListener("click", () => {
    document.getElementById("popup-informe").classList.remove("visible");
  });
  document.getElementById('abrir-popup-objetivos').addEventListener('click', () => {
    document.getElementById('popup-overlay-objetivos').classList.add('visible');
  });
  document.getElementById('cerrar-popup-objetivos').addEventListener('click', () => {
    document.getElementById('popup-overlay-objetivos').classList.remove('visible');
  });

  // ========== AGREGAR GASTO (+ RECURRENTE) ==========
  document.getElementById("popup-agregar").addEventListener("click", () => {
    const desc = document.getElementById("popup-desc").value.trim();
    const monto = parseFloat(document.getElementById("popup-monto").value);
    const cuotas = parseInt(document.getElementById("popup-cuotas").value) || 1;
    const esRecurrente = document.getElementById("gasto-recurrente").checked;
    if (!desc || isNaN(monto)) {
      alert("Por favor completá bien los datos");
      return;
    }
    const cat = obtenerCategoriaAutomatica(desc);
    const montoCuota = monto / cuotas;
    const idGasto = Date.now();

    for (let i = 0; i < cuotas; i++) {
      const fecha = avanzarMes(mesActual, i);
      if (!cuotasPendientes[fecha]) cuotasPendientes[fecha] = [];
      cuotasPendientes[fecha].push({
        desc,
        monto: montoCuota,
        cat,
        cuotaActual: i + 1,
        totalCuotas: cuotas,
        id: idGasto,
        recurrente: esRecurrente && i === 0
      });
    }
    // Si es recurrente, guardalo aparte
    if (esRecurrente) {
      gastosRecurrentes.push({
        desc,
        monto,
        cat,
        id: idGasto,
        fechaInicio: mesActual
      });
    }
    guardarDatos();
    document.getElementById("popup-desc").value = "";
    document.getElementById("popup-monto").value = "";
    document.getElementById("popup-cuotas").value = "";
    document.getElementById("gasto-recurrente").checked = false;
    document.getElementById("popup-gasto").classList.remove("visible");
    render();
  });

  // ========== RECURRENTES: CADA MES ==========
  function aplicarRecurrentes() {
    // Si el gasto recurrente no está ya en el mes actual, agrégalo
    gastosRecurrentes.forEach(gr => {
      if (!cuotasPendientes[mesActual]) cuotasPendientes[mesActual] = [];
      const yaEsta = (cuotasPendientes[mesActual] || []).some(g => g.desc === gr.desc && g.cat === gr.cat && g.monto === (gr.monto));
      if (!yaEsta) {
        cuotasPendientes[mesActual].push({
          desc: gr.desc,
          monto: gr.monto,
          cat: gr.cat,
          cuotaActual: 1,
          totalCuotas: 1,
          id: Date.now() + Math.random(),
          recurrente: true
        });
      }
    });
    guardarDatos();
  }

  // ========== INFORME POPUP & EXPORTAR ==========
  document.getElementById("btn-informe").addEventListener("click", () => {
    document.getElementById("popup-informe").classList.add("visible");
    const informeContainer = document.getElementById("informe-contenedor");
    informeContainer.innerHTML = "";
    const gastos = cuotasPendientes[mesActual] || [];
    const total = gastos.reduce((sum, g) => sum + g.monto, 0);
    const porCategoria = {};
    gastos.forEach(g => {
      porCategoria[g.cat] = (porCategoria[g.cat] || 0) + g.monto;
    });
    const titulo = document.createElement("h3");
    titulo.textContent = `Informe de gastos (${mesActual})`;
    informeContainer.appendChild(titulo);
    const lista = document.createElement("ul");
    Object.entries(porCategoria).forEach(([cat, monto]) => {
      const li = document.createElement("li");
      const porcentaje = (monto / total) * 100;
      li.textContent = `${cat}: $${monto.toFixed(2)} (${porcentaje.toFixed(1)}%)`;
      lista.appendChild(li);
    });
    informeContainer.appendChild(lista);
    const recomendaciones = document.createElement("div");
    recomendaciones.innerHTML = "<h4>Recomendaciones:</h4>";
    Object.entries(porCategoria).forEach(([cat, monto]) => {
      const porcentaje = (monto / total) * 100;
      const p = document.createElement("p");
      if (porcentaje > 30) {
        p.textContent = `⚠️ Estás gastando mucho en ${cat} (${porcentaje.toFixed(1)}%). ¿Podés recortar ahí?`;
      } else if (porcentaje < 5) {
        p.textContent = `✅ Buen control en ${cat}.`;
      }
      recomendaciones.appendChild(p);
    });
    informeContainer.appendChild(recomendaciones);

    const btnDescargar = document.createElement("button");
    btnDescargar.textContent = "📥 Descargar Informe";
    btnDescargar.style.marginTop = "10px";
    btnDescargar.addEventListener("click", () => {
      let contenido = `Informe de gastos (${mesActual})\n\n`;
      Object.entries(porCategoria).forEach(([cat, monto]) => {
        const porcentaje = (monto / total) * 100;
        contenido += `${cat}: $${monto.toFixed(2)} (${porcentaje.toFixed(1)}%)\n`;
      });
      contenido += `\nRecomendaciones:\n`;
      Object.entries(porCategoria).forEach(([cat, monto]) => {
        const porcentaje = (monto / total) * 100;
        if (porcentaje > 30) {
          contenido += `⚠️ Gastás mucho en ${cat} (${porcentaje.toFixed(1)}%)\n`;
        } else if (porcentaje < 5) {
          contenido += `✅ Buen control en ${cat}\n`;
        }
      });
      const blob = new Blob([contenido], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `informe_gastos_${mesActual}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    informeContainer.appendChild(btnDescargar);
  });

  // EXPORTAR A CSV
  document.getElementById("exportar-csv").addEventListener("click", () => {
    let rows = [
      ["Fecha", "Descripción", "Monto", "Categoría", "Cuota", "Total Cuotas", "Recurrente"]
    ];
    for (const mes in cuotasPendientes) {
      cuotasPendientes[mes].forEach(g => {
        rows.push([
          mes,
          g.desc,
          g.monto,
          g.cat,
          g.cuotaActual || 1,
          g.totalCuotas || 1,
          g.recurrente ? "Sí" : ""
        ]);
      });
    }
    let csv = rows.map(e => e.map(x => `"${x}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finzn_gastos.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // ========== IMPORTADOR CSV BÁSICO ==========
  document.getElementById("import-csv").addEventListener("change", function(e){
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const lines = event.target.result.split('\n').filter(x=>x.trim());
        lines.shift(); // header
        lines.forEach(line => {
          let [mes,desc,monto,cat,cuotaActual,totalCuotas,recurrente] = line.split(',').map(x=>x.replace(/"/g,'').trim());
          monto = parseFloat(monto);
          cuotaActual = parseInt(cuotaActual)||1;
          totalCuotas = parseInt(totalCuotas)||1;
          if (!cuotasPendientes[mes]) cuotasPendientes[mes]=[];
          cuotasPendientes[mes].push({desc, monto, cat, cuotaActual, totalCuotas, recurrente: recurrente==="Sí"});
        });
        document.getElementById("import-status").innerText = "Importación exitosa!";
        guardarDatos();
        render();
      } catch(err){
        document.getElementById("import-status").innerText = "Error al importar el archivo.";
      }
      setTimeout(()=>{document.getElementById("import-status").innerText="";}, 3500);
    };
    reader.readAsText(file);
  });

  // ========== CATEGORÍAS PERSONALIZADAS ==========
  function renderCategorias() {
    const ul = document.getElementById("lista-categorias");
    if (!ul) return;
    ul.innerHTML = "";
    misCategorias.forEach((cat, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${cat.icono}</span> ${cat.nombre} <button class="del-cat" title="Eliminar" data-i="${i}">x</button>`;
      ul.appendChild(li);
    });
    ul.querySelectorAll('.del-cat').forEach(btn => {
      btn.onclick = function() {
        const i = btn.getAttribute('data-i');
        if (misCategorias.length > 1) { misCategorias.splice(i,1); guardarDatos(); renderCategorias(); render(); }
      }
    });
  }
  document.getElementById("agregar-categoria").addEventListener("click",()=>{
    const nombre = document.getElementById("nueva-cat-nombre").value.trim();
    const icono = document.getElementById("nueva-cat-icono").value.trim() || "❓";
    const color = document.getElementById("nueva-cat-color").value || "#a1887f";
    if(nombre.length<2) return alert("Nombre de categoría muy corto");
    if(misCategorias.some(cat=>cat.nombre.toLowerCase()===nombre.toLowerCase())) return alert("Ya existe esa categoría");
    misCategorias.push({nombre, icono, color});
    guardarDatos();
    renderCategorias();
    render();
    document.getElementById("nueva-cat-nombre").value="";
    document.getElementById("nueva-cat-icono").value="";
  });

  // ========== CATEGORÍA AUTOMÁTICA ==========
  function obtenerCategoriaAutomatica(descripcion) {
    const desc = descripcion.toLowerCase();
    for (const cat of misCategorias) {
      if (desc.includes(cat.nombre.toLowerCase())) return cat.nombre;
    }
    return "Otros";
  }

  // ========== OBJETIVOS ==========

  function guardarObjetivos() {
    const user = getUser();
    localStorage.setItem('objetivosAhorro-' + user, JSON.stringify(objetivos));
  }
  function cargarObjetivos() {
    const user = getUser();
    objetivos = JSON.parse(localStorage.getItem('objetivosAhorro-' + user)) || [];
  }
  document.getElementById('agregar-objetivo-btn').addEventListener('click', () => {
    const nombre = document.getElementById('nombre').value.trim();
    const montoObjetivo = parseFloat(document.getElementById('montoObjetivo').value);
    const montoAcumulado = parseFloat(document.getElementById('montoAcumulado').value);
    if (!nombre || isNaN(montoObjetivo) || isNaN(montoAcumulado) || montoObjetivo <= 0 || montoAcumulado < 0) {
      alert('Completa todos los campos correctamente.');
      return;
    }
    objetivos.push({ nombre, montoObjetivo, montoAcumulado });
    guardarObjetivos();
    renderObjetivos();
    document.getElementById('nombre').value = '';
    document.getElementById('montoObjetivo').value = '';
    document.getElementById('montoAcumulado').value = '';
    document.getElementById('popup-overlay-objetivos').classList.remove('visible');
  });
  window.eliminarObjetivo = function(index) {
    if (confirm('¿Eliminar este objetivo?')) {
      objetivos.splice(index, 1);
      guardarObjetivos();
      renderObjetivos();
    }
  };
  function renderObjetivos() {
    const lista = document.getElementById('listaObjetivos');
    if (!lista) return;
    lista.innerHTML = '';
    objetivos.forEach((obj, index) => {
      const porcentaje = Math.min((obj.montoAcumulado / obj.montoObjetivo) * 100, 100).toFixed(1);
      const div = document.createElement('div');
      div.className = 'objetivo';
      div.innerHTML = `
        <strong>${obj.nombre}</strong><br/>
        $${obj.montoAcumulado} / $${obj.montoObjetivo} (${porcentaje}%)
        <div class="progress-container">
          <div class="progress-bar" style="width: ${porcentaje}%"></div>
        </div>
        <button class="delete-btn" onclick="eliminarObjetivo(${index})">Eliminar</button>
      `;
      lista.appendChild(div);
    });
  }

  // ========== AHORRO, BALANCE, GASTOS ==========
  function calcularAhorro(mes) {
    const ingreso = ingresosFijos[mes] || 0;
    const gastos = (cuotasPendientes[mes] || []).reduce((sum, g) => sum + g.monto, 0);
    const saldo = ingreso - gastos;
    if (saldo > 0) {
      ahorros[mes] = saldo;
    } else {
      delete ahorros[mes];
    }
    guardarDatos();
  }

  // ========== LOGROS ==========

  function checkLogros() {
    let nuevos = [];
    if (objetivos.some(o=>o.montoAcumulado>=o.montoObjetivo) && !logros.includes("🎯 Primer objetivo cumplido")) {
      logros.push("🎯 Primer objetivo cumplido");
      nuevos.push("🎯 Primer objetivo cumplido");
    }
    if (Object.keys(ahorros).length > 3 && !logros.includes("💰 3 meses de ahorro consecutivos")) {
      logros.push("💰 3 meses de ahorro consecutivos");
      nuevos.push("💰 3 meses de ahorro consecutivos");
    }
    if (gastosRecurrentes.length > 0 && !logros.includes("♻️ Usás gastos recurrentes")) {
      logros.push("♻️ Usás gastos recurrentes");
      nuevos.push("♻️ Usás gastos recurrentes");
    }
    guardarDatos();
    if (nuevos.length) renderLogros();
  }
  function renderLogros() {
    const ul = document.getElementById("logros-list");
    if (!ul) return;
    ul.innerHTML = "";
    logros.forEach(l => {
      const li = document.createElement("li");
      li.innerHTML = `${l}`;
      ul.appendChild(li);
    });
  }

  // ========== RESUMEN SEMANAL ==========
  function renderResumenSemanal() {
    const gastos = cuotasPendientes[mesActual] || [];
    const hoy = new Date();
    let total = 0;
    let gastosPorDia = {};
    gastos.forEach(g => {
      const dia = hoy.getDate(); // solo del mes actual
      total += g.monto;
      gastosPorDia[dia] = (gastosPorDia[dia]||0)+g.monto;
    });
    document.getElementById("total-semana").innerText = "$" + total.toLocaleString("es-AR");
    let diaTop = Object.keys(gastosPorDia).reduce((a,b)=>gastosPorDia[a]>gastosPorDia[b]?a:b,0);
    document.getElementById("dia-top").innerText = diaTop ? `Día ${diaTop}` : "-";
  }

  // ========== COMPARADOR MENSUAL ==========
  function renderComparadorMensual() {
    const [anio, mes] = mesActual.split("-");
    const mesPrev = mes == "01" ? `${+anio-1}-12` : `${anio}-${(String(+mes-1).padStart(2,"0"))}`;
    const actual = (cuotasPendientes[mesActual]||[]).reduce((s,g)=>s+g.monto,0);
    const anterior = (cuotasPendientes[mesPrev]||[]).reduce((s,g)=>s+g.monto,0);
    let texto = "";
    if (anterior===0 && actual===0) texto = "Sin datos";
    else if (anterior===0) texto = "Es tu primer mes registrado 🎉";
    else if (actual>anterior) texto = `Gastaste ${((actual-anterior)/anterior*100).toFixed(1)}% más que el mes pasado.`;
    else if (actual<anterior) texto = `Gastaste ${((1-actual/anterior)*100).toFixed(1)}% menos que el mes pasado 👏`;
    else texto = "Gastaste lo mismo que el mes pasado";
    document.getElementById("comparador-texto").innerText = texto;
  }

  // ========== GRAFICOS AVANZADOS ==========
  function generarGraficoGastosPorCategoria() {
    const canvas = document.getElementById("graficoGastosCategoria");
    if (!canvas) return;
    const gastos = cuotasPendientes[mesActual] || [];
    const gastosPorCategoria = {};
    gastos.forEach(gasto => {
      const categoria = gasto.cat || "Sin categoría";
      gastosPorCategoria[categoria] = (gastosPorCategoria[categoria] || 0) + gasto.monto;
    });
    const labels = Object.keys(gastosPorCategoria);
    const datos = Object.values(gastosPorCategoria);
    const colors = labels.map(label => {
      const cat = misCategorias.find(c=>c.nombre===label);
      return cat?cat.color:'#ccc';
    });
    const ctx = canvas.getContext("2d");
    if (window.graficoTortaGastos) window.graficoTortaGastos.destroy();
    window.graficoTortaGastos = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: 'Gastos por categoría',
          data: datos,
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const dataset = context.dataset.data;
                const total = dataset.reduce((acc, val) => acc + val, 0);
                const porcentaje = total === 0 ? 0 : ((value / total) * 100);
                const formattedValue = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(value);
                const formattedPorcentaje = porcentaje.toFixed(1) + "%";
                return `${label}: ${formattedValue} (${formattedPorcentaje})`;
              }
            }
          }
        }
      }
    });
  }
  // Gráfico de barras mensual
  function generarGraficoBarras() {
    const canvas = document.getElementById("graficoBarrasMes");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const meses = [];
    const totales = [];
    let fecha = new Date();
    for(let i=5;i>=0;i--){
      let mes = new Date(fecha.getFullYear(),fecha.getMonth()-i,1);
      let key = `${mes.getFullYear()}-${String(mes.getMonth()+1).padStart(2,"0")}`;
      meses.push(key);
      totales.push((cuotasPendientes[key]||[]).reduce((a,b)=>a+b.monto,0));
    }
    if(window.graficoBarras) window.graficoBarras.destroy();
    window.graficoBarras = new Chart(ctx,{
      type:'bar',
      data:{
        labels: meses,
        datasets:[{
          label:'Gastos',
          data:totales,
          backgroundColor:'#7e61e7'
        }]
      },
      options:{
        plugins:{legend:{display:false}}
      }
    });
  }
  // Gráfico de saldo histórico
  function generarGraficoSaldo() {
    const canvas = document.getElementById("graficoSaldoMes");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const meses = [];
    const saldos = [];
    let fecha = new Date();
    for(let i=5;i>=0;i--){
      let mes = new Date(fecha.getFullYear(),fecha.getMonth()-i,1);
      let key = `${mes.getFullYear()}-${String(mes.getMonth()+1).padStart(2,"0")}`;
      meses.push(key);
      saldos.push(ahorros[key]||0);
    }
    if(window.graficoSaldo) window.graficoSaldo.destroy();
    window.graficoSaldo = new Chart(ctx,{
      type:'line',
      data:{
        labels: meses,
        datasets:[{
          label:'Ahorro',
          data:saldos,
          borderColor:'#ffd54f',
          backgroundColor:'#ffe27a44'
        }]
      },
      options:{
        plugins:{legend:{display:false}}
      }
    });
  }

  // ========== SALDO, LISTAS Y CARDS ==========
  function render() {
    aplicarRecurrentes();
    checkLogros();

    // Gastos recientes/lista
    const lista = document.getElementById("expense-list");
    const buscador = document.getElementById("buscador-gastos");
    let filtro = buscador?.value?.toLowerCase() || "";
    if (lista) {
      lista.innerHTML = "";
      let gastos = cuotasPendientes[mesActual] || [];
      if(filtro.length>0){
        gastos = gastos.filter(g => g.desc.toLowerCase().includes(filtro) || (g.cat||"").toLowerCase().includes(filtro));
      }
      gastos.forEach(g => {
        const cat = misCategorias.find(c=>c.nombre===g.cat)||{icono:"💸", color:"#ccc"};
        const li = document.createElement("li");
        li.innerHTML = `${cat.icono} <strong>${g.desc}</strong> - $${g.monto.toFixed(2)} <span>[${g.cat}]</span>`;
        li.style.borderLeft = `6px solid ${cat.color}`;
        lista.appendChild(li);
      });
    }
    // Saldo, gastos, cuotas
    const ingresoFijo = ingresosFijos[mesActual] || 0;
    const extras = ingresosExtras[mesActual] || [];
    const ingresoExtra = extras.reduce((sum, e) => sum + (e.monto || 0), 0);
    const ingreso = ingresoFijo + ingresoExtra;
    calcularAhorro(mesActual);
    const totalGastosMes = (cuotasPendientes[mesActual] || []).reduce((sum, g) => sum + g.monto, 0);
    document.getElementById("balance-neto").textContent = `$${(ingreso-totalGastosMes).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
    document.getElementById("gasto-total-mes").textContent = `$${totalGastosMes.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
    const cuotasMes = (cuotasPendientes[mesActual] || []).filter(g => g.totalCuotas > 1).length;
    document.getElementById("cuotas-mes").textContent = cuotasMes;
    // Totales cuentas
    renderCuentasTotales();
    // Ahorros y logros
    renderAhorros();
    renderLogros();
    // Graficos
    generarGraficoGastosPorCategoria();
    generarGraficoBarras();
    generarGraficoSaldo();
    // Resumen semanal, comparador mensual
    renderResumenSemanal();
    renderComparadorMensual();
    // Alertas
    chequearAlertas();
  }

  // ========== CUENTAS TOTALES (panel izquierdo) ==========
  function renderCuentasTotales() {
    const mes = mesActual || obtenerMesActual();
    const fijo = (ingresosFijos && ingresosFijos[mes]) ? ingresosFijos[mes] : 0;
    document.getElementById('cuenta-fijo').textContent = `$${Number(fijo).toLocaleString('es-AR', {minimumFractionDigits:2})}`;
    let totalAhorro = 0;
    if (typeof ahorros === 'object') {
      for (const k in ahorros) totalAhorro += Number(ahorros[k] || 0);
    }
    document.getElementById('cuenta-ahorro').textContent = `$${Number(totalAhorro).toLocaleString('es-AR', {minimumFractionDigits:2})}`;
    let totalExtra = 0;
    if (ingresosExtras && ingresosExtras[mes]) {
      for (const extra of ingresosExtras[mes]) {
        totalExtra += Number(extra.monto || 0);
      }
    }
    document.getElementById('cuenta-extra').textContent = `$${Number(totalExtra).toLocaleString('es-AR', {minimumFractionDigits:2})}`;
  }

  // ========== AHORROS ==========
  function renderAhorros() {
    const ul = document.getElementById("ahorro-list");
    if (!ul) return;
    ul.innerHTML = "";
    let total = 0;
    for (const mes in ahorros) {
      const li = document.createElement("li");
      li.textContent = `Mes ${mes}: $${ahorros[mes].toFixed(2)}`;
      ul.appendChild(li);
      total += ahorros[mes];
    }
    if (document.getElementById("ahorro-total"))
      document.getElementById("ahorro-total").textContent = total.toLocaleString("es-AR", { minimumFractionDigits: 2 });
  }

  // ========== BUSCADOR DE GASTOS ==========
  const buscador = document.getElementById("buscador-gastos");
  if(buscador) buscador.addEventListener("input",()=>render());

  // ========== SIMULADOR DE AHORRO ==========
  document.getElementById("sim-calcular").addEventListener("click",()=>{
    const objetivo = parseFloat(document.getElementById("sim-objetivo").value);
    const ahorro = parseFloat(document.getElementById("sim-ahorro").value);
    if(isNaN(objetivo)||isNaN(ahorro)||objetivo<=0||ahorro<=0) return alert("Completá los datos");
    const meses = Math.ceil(objetivo/ahorro);
    document.getElementById("sim-resultado").innerText = `Lo lograrás en ${meses} mes${meses===1?"":"es"} (${(meses/12).toFixed(1)} años)`;
  });

  // ========== ALERTAS ==========
  function chequearAlertas() {
    let alerta = '';
    // Alerta por objetivo cerca
    if(objetivos.some(o=>(o.montoAcumulado/o.montoObjetivo)>0.89)) alerta += "¡Estás cerca de cumplir un objetivo! ";
    // Alerta por categoría excesiva
    const gastos = cuotasPendientes[mesActual] || [];
    const porCategoria = {};
    gastos.forEach(g => { porCategoria[g.cat] = (porCategoria[g.cat]||0) + g.monto; });
    const total = gastos.reduce((sum, g) => sum + g.monto, 0);
    Object.entries(porCategoria).forEach(([cat, monto])=>{
      if((monto/total)>0.6) alerta += `Cuidado: gastaste mucho en ${cat}. `;
    });
    // Alerta por falta de ingreso fijo
    if(!ingresosFijos[mesActual] || ingresosFijos[mesActual]===0) alerta += "No cargaste tu ingreso fijo este mes. ";
    if (alerta) {
      document.getElementById("alerta-financiera").innerText = alerta;
      document.getElementById("alerta-financiera").style.display = "block";
    } else {
      document.getElementById("alerta-financiera").style.display = "none";
    }
  }

  // ========== DARK MODE ==========
  document.getElementById("toggle-darkmode").addEventListener("click",()=>{
    document.body.classList.toggle("darkmode");
  });

  // ========== MASCOTITA CHAT ==========
  const mascota = document.getElementById("mascota-icono");
  const burbuja = document.getElementById("chat-burbuja");
  const enviar = document.getElementById("enviar-mensaje");
  const input = document.getElementById("chat-input");
  const mensajes = document.getElementById("chat-mensajes");
  mascota?.addEventListener("click", () => { burbuja?.classList.toggle("oculto"); });
  enviar?.addEventListener("click", async () => {
    const msg = input.value.trim();
    if (!msg) return;
    mensajes.innerHTML += `<p><strong>Vos:</strong> ${msg}</p>`;
    input.value = "";
    const escribiendo = document.createElement("p");
    escribiendo.innerHTML = `<em>Mascotita está escribiendo...</em>`;
    mensajes.appendChild(escribiendo);
    mensajes.scrollTop = mensajes.scrollHeight;
    try {
      const res = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) {
        escribiendo.remove();
        mensajes.innerHTML += `<p style="color:red;"><strong>Mascotita:</strong> El servidor respondió con un error (${res.status}: ${res.statusText}).</p>`;
        mensajes.scrollTop = mensajes.scrollHeight;
        return;
      }
      const data = await res.json();
      escribiendo.remove();
      if (data.reply) {
        mensajes.innerHTML += `<p><strong>Mascotita:</strong> ${data.reply}</p>`;
      } else {
        mensajes.innerHTML += `<p style="color:red;"><strong>Mascotita:</strong> La IA no envió ninguna respuesta válida.</p>`;
      }
      mensajes.scrollTop = mensajes.scrollHeight;
    } catch (err) {
      escribiendo.remove();
      mensajes.innerHTML += `<p style="color:red;"><strong>Mascotita:</strong> Error de conexión: no se pudo contactar al servidor de IA.<br>Revisá tu conexión o probá más tarde.</p>`;
    }
  });

  // ========== INICIALIZACIÓN ==========
  generarOpcionesMeses();
  aplicarIngresosFijos();
  renderCategorias();
  aplicarRecurrentes();
  renderObjetivos();
  renderLogros();
  render();
});
