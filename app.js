document.addEventListener("DOMContentLoaded", () => {
  const gastosPorMes = {};
  const ingresosFijos = {};
  const ahorros = {};
  const cuotasPendientes = {};
  let mesActual = obtenerMesActual();
  let chart;

  const selectorMes = document.getElementById("mes-selector");
  const formFijo = document.getElementById("fijo-form");
  const formGasto = document.getElementById("expense-form");

  function obtenerMesActual() {
    const fecha = new Date();
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
  }

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

  formGasto.addEventListener("submit", (e) => {
    e.preventDefault();
    const desc = document.getElementById("description").value;
    const monto = parseFloat(document.getElementById("amount").value);
    const cat = document.getElementById("category").value;
    const cuotas = parseInt(document.getElementById("cuotas").value) || 1;

    if (!desc || isNaN(monto) || !cat) return;

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

    document.getElementById("description").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("category").value = "";
    document.getElementById("cuotas").value = "";

    render();
  });

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
  }

  function render() {
    const lista = document.getElementById("expense-list");
    lista.innerHTML = "";
    const gastos = cuotasPendientes[mesActual] || [];
    let totalGastos = 0;

    gastos.forEach(g => {
      const li = document.createElement("li");
      li.innerHTML = `${g.desc} - $${g.monto.toFixed(2)} [${g.cat}] <div class="cuota-info">(Cuota ${g.cuotaActual} de ${g.totalCuotas})</div>`;
      lista.appendChild(li);
      totalGastos += g.monto;
    });

    const ingreso = ingresosFijos[mesActual] || 0;
    calcularAhorro(mesActual);
    const balance = ingreso - totalGastos;
    document.getElementById("balance-neto").textContent = `$${balance.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;

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
    chart = new Chart(document.getElementById("pieChart"), {
      type: "pie",
      data: {
        labels,
        datasets: [{
          data: valores,
          backgroundColor: ["#f48fb1", "#aed581", "#81d4fa", "#ffe0b2", "#ce93d8", "#ffab91", "#90caf9"],
        }]
      },
      options: {
        plugins: {
          legend: {
            labels: { color: "#fff", font: { size: 14 } }
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

  //hola
  function renderCuotasActivas() {
    const lista = document.getElementById("cuotas-activas-list");
    lista.innerHTML = "";
    const acumulado = {};

    for (const mes in cuotasPendientes) {
      cuotasPendientes[mes].forEach(g => {
        const key = `${g.id}`;
        if (!acumulado[key]) {
          acumulado[key] = {
            desc: g.desc,
            cat: g.cat,
            totalCuotas: g.totalCuotas,
            pagadas: 0
          };
        }
        if (mes <= mesActual) acumulado[key].pagadas++;
      });
    }

    Object.values(acumulado).forEach(q => {
      const li = document.createElement("li");
      li.textContent = `${q.desc} [${q.cat}] - Cuota ${q.pagadas + 1} de ${q.totalCuotas}`;
      lista.appendChild(li);
    });
  }

  generarOpcionesMeses();
  aplicarIngresosFijos();
  render();
});