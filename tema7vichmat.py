import numpy as np
import math
import matplotlib.pyplot as plt

print("=" * 60)
print("ИНТЕРПОЛЯЦИЯ И ЭКСТРАПОЛЯЦИЯ ФУНКЦИЙ")
print("=" * 60)


# ============================================================================
# МЕТОД 1: ИНТЕРПОЛЯЦИЯ ЛАГРАНЖА
# ============================================================================
def lagrange_interpolation(x, y, x_interp):
    n = len(x)
    result = 0
    for i in range(n):
        term = y[i]
        for j in range(n):
            if j != i:
                term = term * (x_interp - x[j]) / (x[i] - x[j])
        result += term
    return result


# ============================================================================
# МЕТОД 2: ЛИНЕЙНАЯ ИНТЕРПОЛЯЦИЯ
# ============================================================================
def linear_interpolation(x, y, x_interp):
    for i in range(len(x) - 1):
        if x[i] <= x_interp <= x[i + 1]:
            return y[i] + (y[i + 1] - y[i]) * (x_interp - x[i]) / (x[i + 1] - x[i])
    return None


# ============================================================================
# МЕТОД 3: НЬЮТОН (РАВНООТСТОЯЩИЕ УЗЛЫ)
# ============================================================================
def newton_forward(x, y, x_interp):
    n = len(x)
    h = x[1] - x[0]
    q = (x_interp - x[0]) / h

    diff_table = np.zeros((n, n))
    diff_table[:, 0] = y

    for j in range(1, n):
        for i in range(n - j):
            diff_table[i, j] = diff_table[i + 1, j - 1] - diff_table[i, j - 1]

    result = diff_table[0, 0]
    q_prod = 1
    for i in range(1, n):
        q_prod = q_prod * (q - i + 1)
        result += q_prod * diff_table[0, i] / math.factorial(i)

    return result


def newton_backward(x, y, x_interp):
    n = len(x)
    h = x[1] - x[0]
    q = (x_interp - x[n - 1]) / h

    diff_table = np.zeros((n, n))
    diff_table[:, 0] = y

    for j in range(1, n):
        for i in range(n - j):
            diff_table[i, j] = diff_table[i + 1, j - 1] - diff_table[i, j - 1]

    result = diff_table[n - 1, 0]
    q_prod = 1
    for i in range(1, n):
        q_prod = q_prod * (q + i - 1)
        result += q_prod * diff_table[n - 1 - i, i] / math.factorial(i)

    return result


# ============================================================================
# ПРИМЕР 1: ИЗ ЛЕКЦИИ (Задача с sin(πx))
# ============================================================================
print("\n" + "=" * 60)
print("ПРИМЕР 1: Интерполяция Лагранжа (из лекции)")
print("=" * 60)

x1 = [0, 1 / 6, 1 / 2]
y1 = [0, 0.5, 1]

print("Узлы интерполяции:")
for i in range(len(x1)):
    print(f"  x{i} = {x1[i]:.4f}, y{i} = {y1[i]:.4f}")

x_interp1 = 1 / 4
x_interp2 = 1 / 3

result1 = lagrange_interpolation(x1, y1, x_interp1)
result2 = lagrange_interpolation(x1, y1, x_interp2)

print(f"\nИнтерполяция при x = 1/4 = {x_interp1:.4f}")
print(f"  L({x_interp1:.4f}) = {result1:.4f}")

print(f"\nИнтерполяция при x = 1/3 = {x_interp2:.4f}")
print(f"  L({x_interp2:.4f}) = {result2:.4f}")

# ============================================================================
# ПРИМЕР 2: ИЗ ЛЕКЦИИ (Задача 2 с таблицей)
# ============================================================================
print("\n" + "=" * 60)
print("ПРИМЕР 2: Формулы Ньютона (из лекции)")
print("=" * 60)

x2 = [1.215, 1.220, 1.225, 1.230, 1.235, 1.240, 1.245, 1.250, 1.255, 1.260]
y2 = [0.106044, 0.113276, 0.119671, 0.125324, 0.130328, 0.134776,
      0.138759, 0.142367, 0.145688, 0.148809]

print("Таблица данных:")
for i in range(len(x2)):
    print(f"  x{i} = {x2[i]:.3f}, y{i} = {y2[i]:.6f}")

test_points = [1.2273, 1.210, 1.253, 1.2638]

for x_test in test_points:
    if x_test <= 1.2375:
        result = newton_forward(x2, y2, x_test)
        method = "Ньютон (вперед)"
    else:
        result = newton_backward(x2, y2, x_test)
        method = "Ньютон (назад)"

    print(f"\nx = {x_test:.4f}: y = {result:.6f} ({method})")

# ============================================================================
# ПРИМЕР 3: ЛИНЕЙНАЯ ИНТЕРПОЛЯЦИЯ (из лекции про кактус)
# ============================================================================
print("\n" + "=" * 60)
print("ПРИМЕР 3: Линейная интерполяция")
print("=" * 60)

x3 = [9, 13, 27, 41, 83, 107, 131, 157]
y3 = [0.15, 0.30, 1.5, 3.0, 6.1, 7.6, 9.1, 10.7]

print("Зависимость высоты кактуса от возраста:")
for i in range(len(x3)):
    print(f"  Возраст: {x3[i]} лет, Рост: {y3[i]} м")

age_interp = 50
height = linear_interpolation(x3, y3, age_interp)
print(f"\nВозраст {age_interp} лет: прогнозируемый рост = {height:.2f} м")

age_interp2 = 100
height2 = linear_interpolation(x3, y3, age_interp2)
print(f"Возраст {age_interp2} лет: прогнозируемый рост = {height2:.2f} м")

# ============================================================================
# ГРАФИКИ
# ============================================================================
print("\n" + "=" * 60)
print("ПОСТРОЕНИЕ ГРАФИКОВ")
print("=" * 60)

plt.figure(figsize=(10, 8))

plt.subplot(2, 2, 1)
x_plot1 = np.linspace(0, 0.5, 100)
y_plot1 = [lagrange_interpolation(x1, y1, x) for x in x_plot1]
plt.plot(x1, y1, 'ro', label='Узлы')
plt.plot(x_plot1, y_plot1, 'b-', label='Lagrange')
plt.xlabel('x')
plt.ylabel('y')
plt.title('Интерполяция Лагранжа')
plt.legend()
plt.grid(True)

plt.subplot(2, 2, 2)
x_plot2 = np.linspace(1.215, 1.260, 100)
y_plot2 = [newton_forward(x2, y2, x) if x <= 1.2375 else newton_backward(x2, y2, x) for x in x_plot2]
plt.plot(x2, y2, 'ro', label='Узлы')
plt.plot(x_plot2, y_plot2, 'g-', label='Newton')
plt.xlabel('x')
plt.ylabel('y')
plt.title('Интерполяция Ньютона')
plt.legend()
plt.grid(True)

plt.subplot(2, 2, 3)
x_plot3 = np.linspace(9, 157, 100)
y_plot3 = [linear_interpolation(x3, y3, x) if linear_interpolation(x3, y3, x) is not None else np.nan for x in x_plot3]
plt.plot(x3, y3, 'ro', label='Данные')
plt.plot(x_plot3, y_plot3, 'm-', label='Linear')
plt.xlabel('Возраст (лет)')
plt.ylabel('Рост (м)')
plt.title('Рост кактуса')
plt.legend()
plt.grid(True)

plt.tight_layout()
plt.savefig('interpolation_plots.png', dpi=300)
print("Графики сохранены в файл: interpolation_plots.png")
plt.show()

print("\n" + "=" * 60)
print("ВЫЧИСЛЕНИЯ ЗАВЕРШЕНЫ")
print("=" * 60)