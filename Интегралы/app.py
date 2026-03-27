from flask import Flask, request, jsonify, send_from_directory
import math
import re

app = Flask(__name__, static_folder='public', static_url_path='')


# ==================== БЕЗОПАСНОЕ ВЫЧИСЛЕНИЕ ФУНКЦИЙ ====================

def safe_eval(expr, variables):
    """Безопасное вычисление математических выражений"""
    safe_dict = {
        'sin': math.sin, 'cos': math.cos, 'tan': math.tan,
        'sqrt': math.sqrt, 'exp': math.exp, 'log': math.log,
        'log10': math.log10, 'pi': math.pi, 'e': math.e,
        'abs': abs, 'pow': pow, 'factorial': math.factorial
    }
    safe_dict.update(variables)

    try:
        # Замена ^ на ** для степени
        expr = expr.replace('^', '**')
        return eval(expr, {"__builtins__": {}}, safe_dict)
    except Exception as e:
        raise ValueError(f"Ошибка вычисления: {str(e)}")


# ==================== ЛАБОРАТОРНАЯ РАБОТА №1 ====================

def left_rectangle(f_expr, a, b, n):
    h = (b - a) / n
    total = sum(safe_eval(f_expr, {'x': a + i * h}) for i in range(n))
    return h * total, h


def right_rectangle(f_expr, a, b, n):
    h = (b - a) / n
    total = sum(safe_eval(f_expr, {'x': a + i * h}) for i in range(1, n + 1))
    return h * total, h


def trapezoid(f_expr, a, b, n):
    h = (b - a) / n
    total = (safe_eval(f_expr, {'x': a}) + safe_eval(f_expr, {'x': b})) / 2
    total += sum(safe_eval(f_expr, {'x': a + i * h}) for i in range(1, n))
    return h * total, h


def simpson(f_expr, a, b, n):
    if n % 2 == 1:
        n += 1
    h = (b - a) / n
    total = safe_eval(f_expr, {'x': a}) + safe_eval(f_expr, {'x': b})
    for i in range(1, n):
        x = a + i * h
        total += (2 if i % 2 == 0 else 4) * safe_eval(f_expr, {'x': x})
    return (h / 3) * total, h


METHODS_1D = {
    'leftRect': left_rectangle,
    'rightRect': right_rectangle,
    'trapezoid': trapezoid,
    'simpson': simpson
}


# ==================== ЛАБОРАТОРНАЯ РАБОТА №2 ====================

def compute_inner_integral(f_expr, x_val, c, d, ny, method):
    if method == 'leftRect':
        h = (d - c) / ny
        total = sum(safe_eval(f_expr, {'x': x_val, 'y': c + i * h}) for i in range(ny))
        return h * total, h
    elif method == 'rightRect':
        h = (d - c) / ny
        total = sum(safe_eval(f_expr, {'x': x_val, 'y': c + i * h}) for i in range(1, ny + 1))
        return h * total, h
    elif method == 'trapezoid':
        h = (d - c) / ny
        total = (safe_eval(f_expr, {'x': x_val, 'y': c}) + safe_eval(f_expr, {'x': x_val, 'y': d})) / 2
        total += sum(safe_eval(f_expr, {'x': x_val, 'y': c + i * h}) for i in range(1, ny))
        return h * total, h
    elif method == 'simpson':
        if ny % 2 == 1:
            ny += 1
        h = (d - c) / ny
        total = safe_eval(f_expr, {'x': x_val, 'y': c}) + safe_eval(f_expr, {'x': x_val, 'y': d})
        for i in range(1, ny):
            y = c + i * h
            total += (2 if i % 2 == 0 else 4) * safe_eval(f_expr, {'x': x_val, 'y': y})
        return (h / 3) * total, h


def compute_double_integral(f_expr, a, b, c, d, nx, ny, method_outer, method_inner):
    hx = (b - a) / nx
    F_values = []
    hy_values = []

    for i in range(nx + 1):
        x_i = a + i * hx
        inner_result, hy = compute_inner_integral(f_expr, x_i, c, d, ny, method_inner)
        F_values.append(inner_result)
        hy_values.append(hy)

    if method_outer == 'leftRect':
        result = hx * sum(F_values[i] for i in range(nx))
    elif method_outer == 'rightRect':
        result = hx * sum(F_values[i] for i in range(1, nx + 1))
    elif method_outer == 'trapezoid':
        result = hx * ((F_values[0] + F_values[-1]) / 2 + sum(F_values[i] for i in range(1, nx)))
    elif method_outer == 'simpson':
        n = nx
        if n % 2 == 1:
            n += 1
        result = (hx / 3) * (F_values[0] + F_values[n] +
                             sum((2 if i % 2 == 0 else 4) * F_values[i] for i in range(1, n)))

    return {
        'result': result,
        'hx': hx,
        'hy': hy_values[0] if hy_values else (d - c) / ny,
        'nx': nx,
        'ny': ny,
        'F_values': F_values[:10]
    }


# ==================== ДИФФЕРЕНЦИАЛЬНЫЕ УРАВНЕНИЯ ====================

def euler_method(f, x0, y0, xn, h):
    x = x0
    y = y0
    results = [{'x': x, 'y_euler': y}]
    while x < xn:
        y = y + h * f(x, y)
        x = x + h
        results.append({'x': round(x, 6), 'y_euler': round(y, 6)})
    return results


def runge_kutta_4(f, x0, y0, xn, h):
    x = x0
    y = y0
    results = [{'x': x, 'y_rk': y}]
    while x < xn:
        k1 = h * f(x, y)
        k2 = h * f(x + h / 2, y + k1 / 2)
        k3 = h * f(x + h / 2, y + k2 / 2)
        k4 = h * f(x + h, y + k3)
        y = y + (k1 + 2 * k2 + 2 * k3 + k4) / 6
        x = x + h
        results.append({'x': round(x, 6), 'y_rk': round(y, 6)})
    return results


# ==================== ROUTES ====================

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('public', path)


@app.route('/api/calculate_single', methods=['POST'])
def calculate_single():
    data = request.json
    f_expr = data.get('function', 'x**2')
    a = float(data.get('a', 0))
    b = float(data.get('b', 1))
    n = int(data.get('n', 100))
    method = data.get('method', 'simpson')
    algorithm = data.get('algorithm', 'constant')

    try:
        if algorithm == 'constant':
            method_func = METHODS_1D.get(method, simpson)
            result, h = method_func(f_expr, a, b, n)
            ref_result, _ = simpson(f_expr, a, b, 10000)

            return jsonify({
                'success': True,
                'result': result,
                'h': h,
                'n': n,
                'method': method,
                'reference': ref_result,
                'error': abs(result - ref_result),
                'bounds': {'a': a, 'b': b}
            })
        else:
            epsilon = float(data.get('epsilon', 0.0001))
            initial_n = int(data.get('initial_n', 4))
            n = initial_n
            prev_result, _ = METHODS_1D[method](f_expr, a, b, n)

            for iteration in range(1, 20):
                n *= 2
                current_result, h = METHODS_1D[method](f_expr, a, b, n)
                if abs(current_result - prev_result) < epsilon:
                    return jsonify({
                        'success': True,
                        'result': current_result,
                        'h': h,
                        'n': n,
                        'iterations': iteration,
                        'converged': True,
                        'bounds': {'a': a, 'b': b}
                    })
                prev_result = current_result

            return jsonify({
                'success': True,
                'result': current_result,
                'h': h,
                'n': n,
                'iterations': 20,
                'converged': False,
                'bounds': {'a': a, 'b': b}
            })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/calculate_double', methods=['POST'])
def calculate_double():
    data = request.json
    f_expr = data.get('function', 'sin(x + y)')
    a = float(data.get('a', 0))
    b = float(data.get('b', math.pi / 2))
    c = float(data.get('c', 0))
    d = float(data.get('d', math.pi / 4))
    nx = int(data.get('nx', 20))
    ny = int(data.get('ny', 20))
    method_outer = data.get('method_outer', 'simpson')
    method_inner = data.get('method_inner', 'simpson')

    try:
        result = compute_double_integral(f_expr, a, b, c, d, nx, ny, method_outer, method_inner)
        ref = compute_double_integral(f_expr, a, b, c, d, 200, 200, 'simpson', 'simpson')

        return jsonify({
            'success': True,
            'result': result['result'],
            'hx': result['hx'],
            'hy': result['hy'],
            'nx': result['nx'],
            'ny': result['ny'],
            'reference': ref['result'],
            'error': abs(result['result'] - ref['result']),
            'F_values': result['F_values'],
            'bounds': {'x': [a, b], 'y': [c, d]},
            'methods': {'outer': method_outer, 'inner': method_inner}
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/compare_methods', methods=['POST'])
def compare_methods():
    data = request.json
    f_expr = data.get('function', 'x**2')
    a = float(data.get('a', 0))
    b = float(data.get('b', 1))
    n_values = [int(n) for n in data.get('n_values', [10, 50, 100, 500, 1000])]

    try:
        results = []
        ref_result, _ = simpson(f_expr, a, b, 10000)

        for n in n_values:
            row = {'n': n}
            for method_name, method_func in METHODS_1D.items():
                result, h = method_func(f_expr, a, b, n)
                row[method_name] = {
                    'result': result,
                    'h': h,
                    'error': abs(result - ref_result)
                }
            results.append(row)

        return jsonify({
            'success': True,
            'results': results,
            'reference': ref_result,
            'bounds': {'a': a, 'b': b}
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/compare_double_methods', methods=['POST'])
def compare_double_methods():
    data = request.json
    f_expr = data.get('function', 'sin(x + y)')
    a = float(data.get('a', 0))
    b = float(data.get('b', math.pi / 2))
    c = float(data.get('c', 0))
    d = float(data.get('d', math.pi / 4))
    nx = int(data.get('nx', 20))
    ny = int(data.get('ny', 20))

    try:
        methods = ['leftRect', 'rightRect', 'trapezoid', 'simpson']
        results = {}
        ref = compute_double_integral(f_expr, a, b, c, d, 200, 200, 'simpson', 'simpson')

        for outer in methods:
            for inner in methods:
                res = compute_double_integral(f_expr, a, b, c, d, nx, ny, outer, inner)
                key = f"{outer}_{inner}"
                results[key] = {
                    'result': res['result'],
                    'error': abs(res['result'] - ref['result'])
                }

        return jsonify({
            'success': True,
            'results': results,
            'reference': ref['result'],
            'n': {'nx': nx, 'ny': ny}
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/ode_first_order', methods=['POST'])
def ode_first_order():
    data = request.json
    f_expr = data.get('function', 'y * (1 - x)')
    x0 = float(data.get('x0', 0))
    y0 = float(data.get('y0', 1))
    xn = float(data.get('xn', 1))
    h = float(data.get('h', 0.1))

    try:
        def f(x, y):
            return safe_eval(f_expr, {'x': x, 'y': y})

        euler_result = euler_method(f, x0, y0, xn, h)
        rk_result = runge_kutta_4(f, x0, y0, xn, h)

        combined = []
        for i in range(min(len(euler_result), len(rk_result))):
            combined.append({
                'x': euler_result[i]['x'],
                'y_euler': euler_result[i]['y_euler'],
                'y_rk': rk_result[i]['y_rk'],
                'difference': abs(euler_result[i]['y_euler'] - rk_result[i]['y_rk'])
            })

        return jsonify({
            'success': True,
            'results': combined
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/ode_second_order', methods=['POST'])
def ode_second_order():
    data = request.json
    f1_expr = data.get('f1', 'z')
    f2_expr = data.get('f2', '(-z / x) - y')
    x0 = float(data.get('x0', 1))
    y0 = float(data.get('y0', 0.77))
    z0 = float(data.get('z0', -0.44))
    xn = float(data.get('xn', 1.5))
    h = float(data.get('h', 0.1))

    try:
        def f1(x, y, z):
            return safe_eval(f1_expr, {'x': x, 'y': y, 'z': z})

        def f2(x, y, z):
            return safe_eval(f2_expr, {'x': x, 'y': y, 'z': z})

        # Euler
        x, y, z = x0, y0, z0
        euler_results = [{'x': x, 'y': y, 'z': z}]
        steps = int((xn - x0) / h)
        for _ in range(steps):
            y_new = y + h * f1(x, y, z)
            z_new = z + h * f2(x, y, z)
            x = x + h
            y, z = y_new, z_new
            euler_results.append({'x': round(x, 6), 'y': round(y, 6), 'z': round(z, 6)})

        # RK4
        x, y, z = x0, y0, z0
        rk_results = [{'x': x, 'y': y, 'z': z}]
        for _ in range(steps):
            k1_y = h * f1(x, y, z)
            k1_z = h * f2(x, y, z)
            k2_y = h * f1(x + h / 2, y + k1_y / 2, z + k1_z / 2)
            k2_z = h * f2(x + h / 2, y + k1_y / 2, z + k1_z / 2)
            k3_y = h * f1(x + h / 2, y + k2_y / 2, z + k2_z / 2)
            k3_z = h * f2(x + h / 2, y + k2_y / 2, z + k2_z / 2)
            k4_y = h * f1(x + h, y + k3_y, z + k3_z)
            k4_z = h * f2(x + h, y + k3_y, z + k3_z)
            y = y + (k1_y + 2 * k2_y + 2 * k3_y + k4_y) / 6
            z = z + (k1_z + 2 * k2_z + 2 * k3_z + k4_z) / 6
            x = x + h
            rk_results.append({'x': round(x, 6), 'y': round(y, 6), 'z': round(z, 6)})

        combined = []
        for i in range(min(len(euler_results), len(rk_results))):
            combined.append({
                'x': euler_results[i]['x'],
                'y_euler': euler_results[i]['y'],
                'y_rk': rk_results[i]['y'],
                'z_euler': euler_results[i]['z'],
                'z_rk': rk_results[i]['z']
            })

        return jsonify({'success': True, 'results': combined})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/ode_system', methods=['POST'])
def ode_system():
    data = request.json
    fx_expr = data.get('fx', '-2*x + 5*z')
    fy_expr = data.get('fy', 'sin(t-1)*x - y + 3*z')
    fz_expr = data.get('fz', '-x + 2*z')
    t0 = float(data.get('t0', 0))
    x0 = float(data.get('x0', 2))
    y0 = float(data.get('y0', 1))
    z0 = float(data.get('z0', 1))
    tn = float(data.get('tn', 0.3))
    h = float(data.get('h', 0.003))

    try:
        def fx(t, x, y, z):
            return safe_eval(fx_expr, {'t': t, 'x': x, 'y': y, 'z': z})

        def fy(t, x, y, z):
            return safe_eval(fy_expr, {'t': t, 'x': x, 'y': y, 'z': z})

        def fz(t, x, y, z):
            return safe_eval(fz_expr, {'t': t, 'x': x, 'y': y, 'z': z})

        t, x, y, z = t0, x0, y0, z0
        results = [{'t': t, 'x': x, 'y': y, 'z': z}]
        steps = int((tn - t0) / h)

        for _ in range(steps):
            x_new = x + h * fx(t, x, y, z)
            y_new = y + h * fy(t, x, y, z)
            z_new = z + h * fz(t, x, y, z)
            t = t + h
            x, y, z = x_new, y_new, z_new
            results.append({'t': round(t, 6), 'x': round(x, 6), 'y': round(y, 6), 'z': round(z, 6)})

        return jsonify({'success': True, 'results': results})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)