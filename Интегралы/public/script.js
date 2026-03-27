// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ ГРАФИКОВ ===
let intChartInstance = null;
let odeChart1 = null;
let odeChart2 = null;
let odeChart3 = null;

// === УПРАВЛЕНИЕ МОДУЛЯМИ (ГЛАВНОЕ МЕНЮ) ===
function switchModule(moduleId) {
    document.querySelectorAll('.module-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.main-nav-btn').forEach(btn => btn.classList.remove('active'));

    const target = document.getElementById('module-' + moduleId);
    if (target) {
        target.classList.add('active');
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// === УПРАВЛЕНИЕ ВКЛАДКАМИ ИНТЕГРИРОВАНИЯ ===
function openIntTab(id) {
    document.querySelectorAll('#module-integration .tab-content').forEach(div => div.classList.remove('active'));
    document.querySelectorAll('#module-integration .tab-btn').forEach(btn => btn.classList.remove('active'));

    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
    }
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// === УПРАВЛЕНИЕ ВКЛАДКАМИ ДИФФЕРЕНЦИАЛЬНЫХ УРАВНЕНИЙ ===
function openOdeTab(id) {
    document.querySelectorAll('#module-ode .tab-content').forEach(div => div.classList.remove('active'));
    document.querySelectorAll('#module-ode .tab-btn').forEach(btn => btn.classList.remove('active'));

    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
    }
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// === УТИЛИТЫ ===

function toggleToleranceInput() {
    const alg = document.getElementById('int_algorithm');
    const container = document.getElementById('int_tol_container');
    if (alg && container) {
        container.style.display = (alg.value === 'variable') ? 'flex' : 'none';
    }
}

function loadIntExample(id) {
    const examples = [
        {f:'x**2', a:0, b:1},
        {f:'sin(x)', a:0, b:3.14159},
        {f:'exp(x)', a:0, b:1}
    ];
    const ex = examples[id - 1];
    if (ex) {
        document.getElementById('int_function').value = ex.f;
        document.getElementById('int_a').value = ex.a;
        document.getElementById('int_b').value = ex.b;
    }
}

function loadDoubleExample(id) {
    const examples = [
        {f:'sin(x+y)', a:0, b:1.5708, c:0, d:0.7854},
        {f:'x*y', a:0, b:1, c:0, d:1}
    ];
    const ex = examples[id - 1];
    if (ex) {
        document.getElementById('double_function').value = ex.f;
        document.getElementById('double_a').value = ex.a;
        document.getElementById('double_b').value = ex.b;
        document.getElementById('double_c').value = ex.c;
        document.getElementById('double_d').value = ex.d;
    }
}

function parseUserFunction(bodyStr, args) {
    try {
        const mathKeys = Object.getOwnPropertyNames(Math);
        let mathContext = "";
        mathKeys.forEach(key => mathContext += `const ${key} = Math.${key};\n`);
        bodyStr = bodyStr.replace(/\^/g, '**');
        return new Function(...args, `${mathContext} return (${bodyStr});`);
    } catch (e) {
        alert("Ошибка в формуле: " + e.message);
        return null;
    }
}

// ==========================================
// МОДУЛЬ 1: ЧИСЛЕННОЕ ИНТЕГРИРОВАНИЕ (ЛР1)
// ==========================================

async function calculateIntegral() {
    const funcStr = document.getElementById('int_function').value;
    const methodId = document.getElementById('int_method').value;
    const algo = document.getElementById('int_algorithm').value;
    const a = parseFloat(document.getElementById('int_a').value);
    const b = parseFloat(document.getElementById('int_b').value);
    const n = parseInt(document.getElementById('int_n').value);
    const tol = parseFloat(document.getElementById('int_tolerance').value);

    if (isNaN(a) || isNaN(b) || a >= b) {
        alert("Ошибка: Проверьте пределы интегрирования (a < b)");
        return;
    }

    try {
        const response = await fetch('/api/calculate_single', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                function: funcStr,
                a: a,
                b: b,
                n: n,
                method: methodId,
                algorithm: algo,
                epsilon: tol,
                initial_n: 4
            })
        });

        const data = await response.json();

        if (data.success) {
            displaySingleResults(data, methodId, algo);
            setTimeout(() => {
                renderIntegrationChart(a, b, n, methodId, funcStr);
            }, 100);
        } else {
            alert('Ошибка сервера: ' + data.error);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка соединения: ' + error.message + '\nУбедитесь, что сервер запущен.');
    }
}

function displaySingleResults(data, method, algo) {
    const resContainer = document.getElementById('int_resultsSection');
    if (!resContainer) return;
    resContainer.classList.remove('hidden');

    const analysisDiv = document.getElementById('int_analysis');
    if (!analysisDiv) return;

    let analysisHTML = `<h3>Результат вычисления интеграла</h3>`;

    if (algo === 'variable') {
        analysisHTML += `<p style="color: #2d3748; font-weight: 600;">✓ Адаптивный метод (итераций: ${data.iterations})</p>`;
        analysisHTML += `<p>Сходимость: ${data.converged ? 'Достигнута' : 'Не достигнута'}</p>`;
    }

    analysisHTML += `
        <p><strong>Метод:</strong> ${method}</p>
        <p><strong>Интеграл:</strong> <span style="font-size: 1.3em; color: #2d3748; font-weight: 700;">${data.result.toFixed(10)}</span></p>
        <p><strong>Референсное значение:</strong> ${data.reference.toFixed(10)}</p>
        <p><strong>Абсолютная погрешность:</strong> ${data.error ? data.error.toExponential(6) : 'N/A'}</p>
        <p><strong>Шаг (h):</strong> ${data.h.toFixed(10)}</p>
        <p><strong>Разбиений (n):</strong> ${data.n}</p>
    `;

    analysisDiv.innerHTML = analysisHTML;

    const tableDiv = document.getElementById('int_resultsTable');
    if (tableDiv) {
        tableDiv.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Метод</th>
                            <th>Функция</th>
                            <th>Пределы [a, b]</th>
                            <th>Результат</th>
                            <th>n</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${method}</td>
                            <td style="font-family: monospace;">${document.getElementById('int_function').value}</td>
                            <td>[${data.bounds.a}, ${data.bounds.b}]</td>
                            <td style="font-weight: 700; color: #667eea;">${data.result.toFixed(10)}</td>
                            <td>${data.n}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
}

async function compareAllMethods() {
    const funcStr = document.getElementById('int_function').value;
    const a = parseFloat(document.getElementById('int_a').value);
    const b = parseFloat(document.getElementById('int_b').value);

    try {
        const response = await fetch('/api/compare_methods', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                function: funcStr,
                a: a,
                b: b,
                n_values: [10, 50, 100, 500, 1000]
            })
        });

        const data = await response.json();
        if (data.success) {
            const resContainer = document.getElementById('int_resultsSection');
            if (resContainer) resContainer.classList.remove('hidden');

            const analysisDiv = document.getElementById('int_analysis');
            if (analysisDiv) {
                analysisDiv.innerHTML = `
                    <h3>Сравнение методов (ЛР1 Часть 2)</h3>
                    <p><strong>Референсное значение:</strong> ${data.reference.toFixed(10)}</p>
                    <p><strong>Пределы:</strong> [${data.bounds.a}, ${data.bounds.b}]</p>
                `;
            }

            const tableDiv = document.getElementById('int_resultsTable');
            if (tableDiv) {
                let html = '<div class="table-container"><table><thead><tr>';
                html += '<th>n</th><th>Левые прям.</th><th>Правые прям.</th><th>Трапеции</th><th>Симпсон</th>';
                html += '</tr></thead><tbody>';

                data.results.forEach(row => {
                    html += `<tr>
                        <td>${row.n}</td>
                        <td>${row.leftRect.result.toFixed(8)}<br><small>ε=${row.leftRect.error.toExponential(2)}</small></td>
                        <td>${row.rightRect.result.toFixed(8)}<br><small>ε=${row.rightRect.error.toExponential(2)}</small></td>
                        <td>${row.trapezoid.result.toFixed(8)}<br><small>ε=${row.trapezoid.error.toExponential(2)}</small></td>
                        <td>${row.simpson.result.toFixed(8)}<br><small>ε=${row.simpson.error.toExponential(2)}</small></td>
                    </tr>`;
                });

                html += '</tbody></table></div>';
                tableDiv.innerHTML = html;
            }
        }
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

function renderIntegrationChart(a, b, n, method, funcStr) {
    const canvas = document.getElementById('int_chart');
    if (!canvas) {
        console.error('Canvas элемент не найден!');
        return;
    }

    const ctx = canvas.getContext('2d');

    if (window.intChartInstance) {
        window.intChartInstance.destroy();
    }

    const f = parseUserFunction(funcStr, ['x']);
    if (!f) {
        console.error('Не удалось создать функцию');
        return;
    }

    const steps = Math.min(n, 200);
    const h = (b - a) / steps;
    const labels = [];
    const dataPoints = [];

    for (let i = 0; i <= steps; i++) {
        const x = a + i * h;
        labels.push(x.toFixed(2));
        try {
            dataPoints.push(f(x));
        } catch (e) {
            dataPoints.push(0);
        }
    }

    let steppedConfig = false;
    if (method === 'leftRect') steppedConfig = 'before';
    else if (method === 'rightRect') steppedConfig = 'after';

    window.intChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `f(x) = ${funcStr}`,
                data: dataPoints,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                stepped: steppedConfig,
                pointRadius: 2,
                pointHoverRadius: 5,
                tension: method === 'simpson' || method === 'trapezoid' ? 0.4 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: `График функции на интервале [${a}, ${b}]`,
                    font: { size: 16 }
                }
            }
        }
    });
}

// ==========================================
// МОДУЛЬ 2: ДВОЙНЫЕ ИНТЕГРАЛЫ (ЛР2)
// ==========================================

async function calculateDoubleIntegral() {
    const funcStr = document.getElementById('double_function').value;
    const a = parseFloat(document.getElementById('double_a').value);
    const b = parseFloat(document.getElementById('double_b').value);
    const c = parseFloat(document.getElementById('double_c').value);
    const d = parseFloat(document.getElementById('double_d').value);
    const nx = parseInt(document.getElementById('double_nx').value);
    const ny = parseInt(document.getElementById('double_ny').value);
    const methodOuter = document.getElementById('double_method_outer').value;
    const methodInner = document.getElementById('double_method_inner').value;

    try {
        const response = await fetch('/api/calculate_double', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                function: funcStr,
                a: a, b: b, c: c, d: d,
                nx: nx, ny: ny,
                method_outer: methodOuter,
                method_inner: methodInner
            })
        });

        const data = await response.json();

        if (data.success) {
            displayDoubleResults(data);
        } else {
            alert('Ошибка: ' + data.error);
        }
    } catch (error) {
        alert('Ошибка соединения: ' + error.message);
    }
}

function displayDoubleResults(data) {
    const resContainer = document.getElementById('double_resultsSection');
    if (!resContainer) return;
    resContainer.classList.remove('hidden');

    const analysisDiv = document.getElementById('double_analysis');
    if (!analysisDiv) return;

    analysisDiv.innerHTML = `
        <h3>Результат вычисления двойного интеграла (ЛР2)</h3>
        <p><strong>∬ f(x,y) dx dy</strong></p>
        <p><strong>Пределы:</strong> x ∈ [${data.bounds.x[0]}, ${data.bounds.x[1]}], y ∈ [${data.bounds.y[0]}, ${data.bounds.y[1]}]</p>
        <p><strong>Методы:</strong> внешний — ${data.methods.outer}, внутренний — ${data.methods.inner}</p>
        <p><strong>Разбиения:</strong> nₓ = ${data.nx}, nᵧ = ${data.ny}</p>
        <p><strong>Шаги:</strong> hₓ = ${data.hx.toFixed(8)}, hᵧ = ${data.hy.toFixed(8)}</p>
        <hr style="margin: 15px 0; border: 0; border-top: 1px solid #ccc;">
        <p><strong>Значение интеграла:</strong> <span style="font-size:1.2em;color:#27ae60; font-weight:bold;">${data.result.toFixed(10)}</span></p>
        <p><strong>Референсное значение:</strong> ${data.reference.toFixed(10)}</p>
        <p><strong>Абсолютная погрешность:</strong> ${data.error.toExponential(6)}</p>
    `;

    const tableDiv = document.getElementById('double_resultsTable');
    if (tableDiv && data.F_values && data.F_values.length > 0) {
        let html = '<h4>Значения внутреннего интеграла F(xᵢ):</h4>';
        html += '<div class="table-container"><table><thead><tr><th>i</th><th>xᵢ</th><th>F(xᵢ)</th></tr></thead><tbody>';

        const hx = data.hx;
        data.F_values.forEach((val, i) => {
            html += `<tr>
                <td>${i}</td>
                <td>${(data.bounds.x[0] + i * hx).toFixed(6)}</td>
                <td>${val.toFixed(10)}</td>
            </tr>`;
        });

        html += '</tbody></table></div>';
        tableDiv.innerHTML = html;
    }
}

async function compareDoubleMethods() {
    const funcStr = document.getElementById('double_function').value;
    const a = parseFloat(document.getElementById('double_a').value);
    const b = parseFloat(document.getElementById('double_b').value);
    const c = parseFloat(document.getElementById('double_c').value);
    const d = parseFloat(document.getElementById('double_d').value);
    const nx = parseInt(document.getElementById('double_nx').value);
    const ny = parseInt(document.getElementById('double_ny').value);

    try {
        const response = await fetch('/api/compare_double_methods', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                function: funcStr,
                a: a, b: b, c: c, d: d,
                nx: nx, ny: ny
            })
        });

        const data = await response.json();

        if (data.success) {
            displayDoubleComparison(data);
        } else {
            alert('Ошибка: ' + data.error);
        }
    } catch (error) {
        alert('Ошибка соединения: ' + error.message);
    }
}

function displayDoubleComparison(data) {
    const resContainer = document.getElementById('double_resultsSection');
    if (!resContainer) return;
    resContainer.classList.remove('hidden');

    const analysisDiv = document.getElementById('double_analysis');
    if (!analysisDiv) return;

    analysisDiv.innerHTML = `
        <h3>Сравнение комбинаций методов (ЛР2)</h3>
        <p><strong>nₓ = ${data.n.nx}, nᵧ = ${data.n.ny}</strong></p>
        <p><strong>Референсное значение:</strong> ${data.reference.toFixed(10)}</p>
    `;

    const tableDiv = document.getElementById('double_resultsTable');
    if (!tableDiv) return;

    let html = '<div class="table-container"><table><thead><tr>';
    html += '<th>Внешний \\ Внутренний</th>';
    html += '<th>leftRect</th><th>rightRect</th><th>trapezoid</th><th>simpson</th>';
    html += '</tr></thead><tbody>';

    const methods = ['leftRect', 'rightRect', 'trapezoid', 'simpson'];

    methods.forEach(outer => {
        html += `<tr><td><strong>${outer}</strong></td>`;
        methods.forEach(inner => {
            const key = `${outer}_${inner}`;
            const res = data.results[key];
            const cls = res.error < 1e-6 ? 'style="background:#d5f5e3;"' : '';
            html += `<td ${cls}>${res.result.toFixed(6)}<br><small>ε=${res.error.toExponential(2)}</small></td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    html += '<p style="margin-top:10px;"><small>🟩 Выделены результаты с погрешностью &lt; 10⁻⁶</small></p>';

    tableDiv.innerHTML = html;
}

// ==========================================
// МОДУЛЬ 3: ДИФФЕРЕНЦИАЛЬНЫЕ УРАВНЕНИЯ
// ==========================================

async function solveOdeFirstOrder() {
    const funcStr = document.getElementById('ode1_func').value;
    const x0 = parseFloat(document.getElementById('ode1_x0').value);
    const y0 = parseFloat(document.getElementById('ode1_y0').value);
    const xn = parseFloat(document.getElementById('ode1_xn').value);
    const h = parseFloat(document.getElementById('ode1_h').value);

    try {
        const response = await fetch('/api/ode_first_order', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                function: funcStr,
                x0: x0, y0: y0, xn: xn, h: h
            })
        });

        const data = await response.json();

        if (data.success) {
            displayOde1Results(data);
        } else {
            alert('Ошибка: ' + data.error);
        }
    } catch (error) {
        alert('Ошибка соединения: ' + error.message);
    }
}

function displayOde1Results(data) {
    const resContainer = document.getElementById('ode1_results');
    if (!resContainer) return;
    resContainer.classList.remove('hidden');

    const analysisDiv = document.getElementById('ode1_analysis');
    if (!analysisDiv) return;

    analysisDiv.innerHTML = `
        <h3>Результаты решения ДУ 1-го порядка</h3>
        <p><strong>Уравнение:</strong> y' = ${document.getElementById('ode1_func').value}</p>
        <p><strong>Начальные условия:</strong> y(${data.results[0].x}) = ${data.results[0].y_euler}</p>
        <p><strong>Методы:</strong> Эйлер vs Рунге-Кутта 4</p>
    `;

    const tableDiv = document.getElementById('ode1_table');
    if (!tableDiv) return;

    let html = '<div class="table-container"><table><thead><tr><th>x</th><th>y (Эйлер)</th><th>y (РК4)</th><th>Разница</th></tr></thead><tbody>';
    data.results.forEach(row => {
        html += `<tr>
            <td>${row.x.toFixed(4)}</td>
            <td>${row.y_euler.toFixed(6)}</td>
            <td>${row.y_rk.toFixed(6)}</td>
            <td>${row.difference.toExponential(4)}</td>
        </tr>`;
    });
    html += '</tbody></table></div>';

    tableDiv.innerHTML = html;

    const canvas = document.getElementById('ode1_chart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (odeChart1) odeChart1.destroy();

        odeChart1 = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.results.map(r => r.x.toFixed(2)),
                datasets: [
                    { label: 'Эйлер', data: data.results.map(r => r.y_euler), borderColor: 'blue', fill: false },
                    { label: 'Рунге-Кутта 4', data: data.results.map(r => r.y_rk), borderColor: 'red', fill: false }
                ]
            },
            options: { responsive: true }
        });
    }
}

async function solveOdeSecondOrder() {
    const f1 = document.getElementById('ode2_f1').value;
    const f2 = document.getElementById('ode2_f2').value;
    const x0 = parseFloat(document.getElementById('ode2_x0').value);
    const y0 = parseFloat(document.getElementById('ode2_y0').value);
    const z0 = parseFloat(document.getElementById('ode2_z0').value);
    const xn = parseFloat(document.getElementById('ode2_xn').value);
    const h = parseFloat(document.getElementById('ode2_h').value);

    try {
        const response = await fetch('/api/ode_second_order', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                f1: f1, f2: f2,
                x0: x0, y0: y0, z0: z0,
                xn: xn, h: h
            })
        });

        const data = await response.json();

        if (data.success) {
            displayOde2Results(data);
        } else {
            alert('Ошибка: ' + data.error);
        }
    } catch (error) {
        alert('Ошибка соединения: ' + error.message);
    }
}

function displayOde2Results(data) {
    const resContainer = document.getElementById('ode2_results');
    if (!resContainer) return;
    resContainer.classList.remove('hidden');

    const analysisDiv = document.getElementById('ode2_analysis');
    if (!analysisDiv) return;

    analysisDiv.innerHTML = `
        <h3>Результаты решения ДУ 2-го порядка</h3>
        <p><strong>y' = ${document.getElementById('ode2_f1').value}</strong></p>
        <p><strong>z' = ${document.getElementById('ode2_f2').value}</strong></p>
    `;

    const tableDiv = document.getElementById('ode2_table');
    if (!tableDiv) return;

    let html = '<div class="table-container"><table><thead><tr><th>x</th><th>y (Эйлер)</th><th>y (РК4)</th><th>z (Эйлер)</th><th>z (РК4)</th></tr></thead><tbody>';
    data.results.forEach(row => {
        html += `<tr>
            <td>${row.x.toFixed(4)}</td>
            <td>${row.y_euler.toFixed(6)}</td>
            <td>${row.y_rk.toFixed(6)}</td>
            <td>${row.z_euler.toFixed(6)}</td>
            <td>${row.z_rk.toFixed(6)}</td>
        </tr>`;
    });
    html += '</tbody></table></div>';

    tableDiv.innerHTML = html;

    const canvas = document.getElementById('ode2_chart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (odeChart2) odeChart2.destroy();

        odeChart2 = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.results.map(r => r.x.toFixed(2)),
                datasets: [
                    { label: 'y (Эйлер)', data: data.results.map(r => r.y_euler), borderColor: 'green', fill: false },
                    { label: 'y (РК4)', data: data.results.map(r => r.y_rk), borderColor: 'orange', fill: false }
                ]
            },
            options: { responsive: true }
        });
    }
}

async function solveOdeSystem() {
    const fx = document.getElementById('ode3_fx').value;
    const fy = document.getElementById('ode3_fy').value;
    const fz = document.getElementById('ode3_fz').value;
    const t0 = parseFloat(document.getElementById('ode3_t0').value);
    const x0 = parseFloat(document.getElementById('ode3_x0').value);
    const y0 = parseFloat(document.getElementById('ode3_y0').value);
    const z0 = parseFloat(document.getElementById('ode3_z0').value);
    const tn = parseFloat(document.getElementById('ode3_tn').value);
    const h = parseFloat(document.getElementById('ode3_h').value);

    try {
        const response = await fetch('/api/ode_system', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                fx: fx, fy: fy, fz: fz,
                t0: t0, x0: x0, y0: y0, z0: z0,
                tn: tn, h: h
            })
        });

        const data = await response.json();

        if (data.success) {
            displayOde3Results(data);
        } else {
            alert('Ошибка: ' + data.error);
        }
    } catch (error) {
        alert('Ошибка соединения: ' + error.message);
    }
}

function displayOde3Results(data) {
    const resContainer = document.getElementById('ode3_results');
    if (!resContainer) return;
    resContainer.classList.remove('hidden');

    const analysisDiv = document.getElementById('ode3_analysis');
    if (!analysisDiv) return;

    analysisDiv.innerHTML = `
        <h3>Результаты решения системы ДУ</h3>
        <p><strong>dx/dt = ${document.getElementById('ode3_fx').value}</strong></p>
        <p><strong>dy/dt = ${document.getElementById('ode3_fy').value}</strong></p>
        <p><strong>dz/dt = ${document.getElementById('ode3_fz').value}</strong></p>
        <p><strong>Всего шагов:</strong> ${data.results.length}</p>
    `;

    const tableDiv = document.getElementById('ode3_table');
    if (!tableDiv) return;

    let html = '<div class="table-container"><table><thead><tr><th>t</th><th>x(t)</th><th>y(t)</th><th>z(t)</th></tr></thead><tbody>';
    data.results.forEach(row => {
        html += `<tr>
            <td>${row.t.toFixed(4)}</td>
            <td>${row.x.toFixed(6)}</td>
            <td>${row.y.toFixed(6)}</td>
            <td>${row.z.toFixed(6)}</td>
        </tr>`;
    });
    html += '</tbody></table></div>';

    tableDiv.innerHTML = html;

    const canvas = document.getElementById('ode3_chart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (odeChart3) odeChart3.destroy();

        odeChart3 = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.results.map(r => r.t.toFixed(3)),
                datasets: [
                    { label: 'x(t)', data: data.results.map(r => r.x), borderColor: 'red', fill: false },
                    { label: 'y(t)', data: data.results.map(r => r.y), borderColor: 'blue', fill: false },
                    { label: 'z(t)', data: data.results.map(r => r.z), borderColor: 'green', fill: false }
                ]
            },
            options: { responsive: true }
        });
    }
}