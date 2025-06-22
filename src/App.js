document.addEventListener("DOMContentLoaded", () => {
  const gastosPorMes = {};
  const ingresosFijos = {};
  const ingresosExtras = {};
  const ahorros = {};
  const cuotasPendientes = {};
  function guardarDatos() {
    const data = {
      ingresosFijos,
      ingresosExtras,
      ahorros,
      cuotasPendientes
    };
    localStorage.setItem("finzn-data", JSON.stringify(data));
  }

  function cargarDatos() {
    const data = localStorage.getItem("finzn-data");
    if (data) {
      const parsed = JSON.parse(data);
      Object.assign(ingresosFijos, parsed.ingresosFijos || {});
      Object.assign(ingresosExtras, parsed.ingresosExtras || {});
      Object.assign(ahorros, parsed.ahorros || {});
      Object.assign(cuotasPendientes, parsed.cuotasPendientes || {});
    }
  }

  cargarDatos();

  let mesActual = obtenerMesActual();
  let chart;

  document.getElementById("popup-agregar").addEventListener("click", () => {
    const desc = document.getElementById("popup-desc").value.trim();
    const monto = parseFloat(document.getElementById("popup-monto").value);
    const cuotas = parseInt(document.getElementById("popup-cuotas").value) || 1;

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
        id: idGasto
      });
    }

    // Limpiar y cerrar
    document.getElementById("popup-desc").value = "";
    document.getElementById("popup-monto").value = "";
    document.getElementById("popup-cuotas").value = "";
    document.getElementById("popup-gasto").classList.remove("visible");

    render();
    guardarDatos();
  });

  document.getElementById("btn-informe").addEventListener("click", () => {
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

  const categoriasPorLugar = {
    
    "starbucks": "Comida",
    "mcdonalds": "Comida",
    "burger king": "Comida",
    "farmacity": "Salud",
    "farmacia": "Salud",
    "ypf": "Transporte",
    "shell": "Transporte",
    "sube": "Transporte",
    "cine": "Ocio",
    "spotify": "Ocio",
    "jumbo": "Supermercado",
    "carrefour": "Supermercado",
    "galicia": "Finanzas",
    "personal": "Servicios",
    "movistar": "Servicios",
    "open sports": "Ocio",
    "sanatorio": "Salud"
  };
  const estiloPorCategoria = {
  "Comida": { emoji: "🍔", color: "#ffab91" },
  "Transporte": { emoji: "🚗", color: "#81d4fa" },
  "Salud": { emoji: "💊", color: "#ce93d8" },
  "Ocio": { emoji: "🎉", color: "#ffd54f" },
  "Supermercado": { emoji: "🛒", color: "#aed581" },
  "Finanzas": { emoji: "💳", color: "#90caf9" },
  "Servicios": { emoji: "📱", color: "#a1887f" },
  "Electrodomésticos": { emoji: "📺", color: "#bcaaa4" },
  "Otros": { emoji: "📦", color: "#e0e0e0" }
};

  function obtenerCategoriaAutomatica(descripcion) {
    const desc = descripcion.toLowerCase();
    for (const lugar in categoriasPorLugar) {
      if (desc.includes(lugar)) {
        return categoriasPorLugar[lugar];
      }
    }
    return "Otros";
  }

  const selectorMes = document.getElementById("mes-selector");
  const formFijo = document.getElementById("fijo-form");
  const formExtra = document.getElementById("extra-form");

  function obtenerMesActual() {
    const fecha = new Date();
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
  }

  // Flashcards de consejos financieros
  const frasesFinancieras = [
    "Que tu dinero sea como tu hijo, cuidalo.",
    "Tu dinero debe trabajar para vos.",
    "Un presupuesto no te limita, te libera.",
    "Controlar tus gastos es poder.",
    "Invertí en lo que te da retorno.",
    "Evitá gastos hormiga, suman más de lo que pensás.",
    "El ahorro es un hábito, no un monto.",
    "Pagate a vos primero cada mes.",
    "La libertad financiera comienza con claridad.",
    "Gastá menos de lo que ganás. Siempre."
  ];

  let fraseIndex = 0;
  const flashcard = document.getElementById('flashcard');

  function actualizarFlashcard() {
    if (!flashcard) return;
    flashcard.style.opacity = 0;
    flashcard.style.transform = "translateY(10px)";
    setTimeout(() => {
      flashcard.textContent = frasesFinancieras[fraseIndex];
      flashcard.style.opacity = 1;
      flashcard.style.transform = "translateY(0)";
      fraseIndex = (fraseIndex + 1) % frasesFinancieras.length;
    }, 400);
  }

  setInterval(actualizarFlashcard, 6000);

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
    aplicarIngresosFijos();
    render();
  });

  formFijo.addEventListener("submit", (e) => {
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

  function avanzarMes(mesStr, cantidad) {
    const [año, mes] = mesStr.split("-").map(Number);
    const fecha = new Date(año, mes - 1 + cantidad, 1);
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
  }

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

  function render() {
    const lista = document.getElementById("expense-list");
    lista.innerHTML = "";
    const gastos = cuotasPendientes[mesActual] || [];
    let totalGastos = 0;

    gastos.forEach(g => {
      const li = document.createElement("li");
      const estilo = estiloPorCategoria[g.cat] || estiloPorCategoria["Otros"];
li.innerHTML = `${estilo.emoji} <strong>${g.desc}</strong> - $${g.monto.toFixed(2)} <span>[${g.cat}]</span>`;
li.style.borderLeft = `6px solid ${estilo.color}`;
      lista.appendChild(li);
      totalGastos += g.monto;
    });

    const ingresoFijo = ingresosFijos[mesActual] || 0;
    const extras = ingresosExtras[mesActual] || [];
    const ingresoExtra = extras.reduce((sum, e) => sum + e.monto, 0);
    const ingreso = ingresoFijo + ingresoExtra;
    calcularAhorro(mesActual);
    const balance = ingreso - totalGastos;
    document.getElementById("balance-neto").textContent = `$${balance.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
    const gastoTotalElemento = document.getElementById("gasto-total-mes");
    if (gastoTotalElemento) {
      gastoTotalElemento.textContent = `$${totalGastos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
    }

    // Mostrar la cantidad de cuotas activas del mes actual
    const cuotasMes = (cuotasPendientes[mesActual] || []).filter(g => g.totalCuotas > 1).length;
    const cuotasElemento = document.getElementById("cuotas-mes");
    if (cuotasElemento) {
      cuotasElemento.textContent = cuotasMes;
    }

    renderGrafico(gastos);
    renderAhorros();
    renderCuotasActivas();
  }

  function renderGrafico(gastos) {
    const porCategoria = {};
    gastos.forEach(g => {
      porCategoria[g.cat] = (porCategoria[g.cat] || 0) + g.monto;
    });

    const labels = Object.keys(porCategoria);
    const valores = Object.values(porCategoria);

    if (chart) chart.destroy();
    <PieChart width={220} height={220}>
  <Pie
    data={datosGrafico}
    dataKey="value"
    nameKey="name"
    cx="50%"
    cy="50%"
    outerRadius={80}
    label
  >
    {datosGrafico.map((entry, idx) => (
      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
    ))}
  </Pie>
  <Tooltip />
  <Legend />
</PieChart>
    tooltip: {
      callbacks: {
        label: function(context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const value = context.raw;
          const porcentaje = ((value / total) * 100).toFixed(1);
          const categoria = context.label;
          return `${categoria}: ${porcentaje}%`;
        }
      }
    }
  }
}
    });
  }

  function renderAhorros() {
    const ul = document.getElementById("ahorro-list");
    ul.innerHTML = "";
    let total = 0;
    for (const mes in ahorros) {
      const li = document.createElement("li");
      li.textContent = `Mes ${mes}: $${ahorros[mes].toFixed(2)}`;
      ul.appendChild(li);
      total += ahorros[mes];
    }
    document.getElementById("ahorro-total").textContent = total.toLocaleString("es-AR", { minimumFractionDigits: 2 });
  }

  function renderCuotasActivas() {
    const lista = document.getElementById("cuotas-activas-list");
    lista.innerHTML = "";
    const acumulado = {};

    for (const mes in cuotasPendientes) {
      cuotasPendientes[mes].forEach(g => {
        if (g.totalCuotas === 1) return; // 👉 ignora los gastos sin cuotas

        const key = `${g.id}`;
        if (!acumulado[key]) {
          acumulado[key] = {
            desc: g.desc,
            cat: g.cat,
            totalCuotas: g.totalCuotas,
            pagadas: 0
          };
        }
        if (mes < mesActual) acumulado[key].pagadas++;
      });
    }

    Object.values(acumulado).forEach(q => {
      const li = document.createElement("li");
      const estilo = estiloPorCategoria[q.cat] || estiloPorCategoria["Otros"];
      li.innerHTML = `${estilo.emoji} <strong>${q.desc}</strong> <span>[${q.cat}]</span> - Cuota ${q.pagadas + 1} de ${q.totalCuotas}`;
      li.style.borderLeft = `6px solid ${estilo.color}`;
      li.style.background = `${estilo.color}33`; // color con transparencia
      lista.appendChild(li);
    });
  }

  generarOpcionesMeses();
  aplicarIngresosFijos();
  render();

  // Popup funcionalidad
  document.getElementById("abrir-popup").addEventListener("click", () => {
    document.getElementById("popup-gasto").classList.add("visible");
  });

  document.getElementById("cerrar-popup").addEventListener("click", () => {
    document.getElementById("popup-gasto").classList.remove("visible");
  });

  formExtra.addEventListener("submit", (e) => {
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
});
function clasificarCategoria(desc) {
  const texto = desc.toLowerCase();
  if (texto.includes("farmacia") || texto.includes("medico")) return "Salud";
  if (texto.includes("uber") || texto.includes("nafta") || texto.includes("subte")) return "Transporte";
  if (texto.includes("cine") || texto.includes("netflix") || texto.includes("spotify")) return "Ocio";
  if (texto.includes("super") || texto.includes("bar") || texto.includes("restaurant") || texto.includes("comida")) return "Comida";
  return "Otros";
}