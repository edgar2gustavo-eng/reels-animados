"""Sintetiza los efectos de sonido del motor (48 kHz, estéreo). Todo sale de este código: sin muestras
de terceros, así que se pueden publicar con la skill.

Uso: python sfx.py [carpeta-destino]      (por defecto: plantilla/motor/sfx)

Efectos (y dónde los usa el motor):
  whoosh        transición entre escenas, títulos, imágenes
  whoosh-corto  comparaciones, entradas rápidas
  subida        antes de un golpe o una cifra: crea tensión
  golpe         palabra gigante, entradas fuertes, flecha que se clava
  pop           tarjetas, objetos 3D, cifras
  clic          botones, mensajes propios
  tic           cada punto de una lista o etiqueta
  ding          cierre
  notificacion  notificaciones y mensajes recibidos
  exito         cierre con botón, logros
  dinero        monedas, ventas
  brillo        estrellas, emojis, ideas
  teclado       escribiendo (chat, código)
  trazo         lápiz que subraya (estilo cine)
  boom          golpe grave de cine: cierres y cambios fuertes
  enfoque       aire que crece y se corta: imagen que entra enfocándose
"""
import sys
from pathlib import Path

import numpy as np

SR = 48000
rng = np.random.default_rng(20260927)   # semilla fija: el mismo archivo cada vez


def t_(dur):
    return np.arange(int(SR * dur)) / SR


def ruido_rosa(n):
    # Ruido rosa por filtrado de ruido blanco (método de Voss simplificado con FFT).
    b = rng.standard_normal(n)
    f = np.fft.rfft(b)
    k = np.arange(len(f)); k[0] = 1
    f /= np.sqrt(k)
    x = np.fft.irfft(f, n)
    return x / (np.abs(x).max() + 1e-9)


def pasabanda_variable(x, centros, q=1.2):
    """Filtro pasa-banda (biquad) cuyo centro cambia muestra a muestra: el "barrido" de un whoosh."""
    y = np.zeros_like(x)
    x1 = x2 = y1 = y2 = 0.0
    for i in range(len(x)):
        w0 = 2 * np.pi * centros[i] / SR
        a = np.sin(w0) / (2 * q)
        b0, b2 = a, -a
        a0, a1, a2 = 1 + a, -2 * np.cos(w0), 1 - a
        yi = (b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2) / a0
        x2, x1 = x1, x[i]
        y2, y1 = y1, yi
        y[i] = yi
    return y


def pasabajos(x, corte):
    y = np.zeros_like(x); a = np.exp(-2 * np.pi * corte / SR); prev = 0.0
    for i in range(len(x)):
        prev = (1 - a) * x[i] + a * prev
        y[i] = prev
    return y


def envolvente(n, ataque, caida, forma=2.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(ataque, 1e-4)) * np.exp(-np.maximum(0, t - ataque) / caida)
    return e ** (forma / 2)


def campana(f, dur, indice=2.0, razon=3.5, caida=0.35):
    # Síntesis FM: una portadora modulada da ese brillo metálico de campana.
    t = t_(dur)
    mod = indice * np.exp(-t / (caida * 0.6)) * np.sin(2 * np.pi * f * razon * t)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t / caida)


def estereo(x, pan=None):
    if pan is None:
        return np.stack([x, x], axis=1)
    izq = np.cos(pan * np.pi / 2); der = np.sin(pan * np.pi / 2)
    return np.stack([x * izq, x * der], axis=1)


def normalizar(x, pico=-3.0):
    return x / (np.abs(x).max() + 1e-9) * 10 ** (pico / 20)


def whoosh(dur=0.62, f0=250, f1=3200, f2=700):
    n = int(SR * dur); t = np.linspace(0, 1, n)
    centros = np.where(t < 0.55, f0 * (f1 / f0) ** (t / 0.55), f1 * (f2 / f1) ** ((t - 0.55) / 0.45))
    x = pasabanda_variable(ruido_rosa(n), centros, q=0.9)
    env = np.sin(np.pi * np.clip(t, 0, 1)) ** 1.6
    pan = np.clip(t * 1.2 - 0.1, 0, 1)            # cruza de izquierda a derecha
    return normalizar(estereo(x * env, pan) * np.array([1, 1]), -4)


def subida(dur=1.1):
    n = int(SR * dur); t = np.linspace(0, 1, n); tt = t_(dur)
    frec = 180 * (2200 / 180) ** (t ** 1.4)
    fase = 2 * np.pi * np.cumsum(frec) / SR
    tono = np.sin(fase) * 0.35 + np.sin(fase * 2.01) * 0.12
    aire = pasabanda_variable(ruido_rosa(n), 400 + 5000 * t ** 2, q=0.7) * 0.8
    env = t ** 2.2 * (1 - np.clip((tt - (dur - 0.03)) / 0.03, 0, 1))
    return normalizar(estereo((tono + aire) * env), -4)


def golpe(dur=1.0):
    t = t_(dur)
    frec = 38 + 70 * np.exp(-t / 0.06)
    sub = np.sin(2 * np.pi * np.cumsum(frec) / SR) * np.exp(-t / 0.35)
    cuerpo = pasabajos(ruido_rosa(len(t)), 900) * np.exp(-t / 0.08) * 1.6
    chasquido = rng.standard_normal(len(t)) * np.exp(-t / 0.006) * 0.5
    x = np.tanh((sub * 1.3 + cuerpo + chasquido) * 1.6)   # saturación suave: más cuerpo
    return normalizar(estereo(x), -2)


def pop():
    dur = 0.16; t = t_(dur)
    frec = 380 + 1500 * (1 - np.exp(-t / 0.018))
    x = np.sin(2 * np.pi * np.cumsum(frec) / SR) * envolvente(len(t), 0.002, 0.035)
    return normalizar(estereo(x), -5)


def clic():
    dur = 0.05; t = t_(dur)
    x = (rng.standard_normal(len(t)) * np.exp(-t / 0.0015) * 0.6 + np.sin(2 * np.pi * 3200 * t) * np.exp(-t / 0.006))
    return normalizar(estereo(pasabajos(x, 9000)), -7)


def tic():
    dur = 0.09; t = t_(dur)
    x = np.sin(2 * np.pi * 1850 * t) * np.exp(-t / 0.012) + np.sin(2 * np.pi * 3700 * t) * np.exp(-t / 0.006) * 0.3
    return normalizar(estereo(x), -7)


def ding():
    x = campana(1318.5, 1.4, indice=1.6, razon=3.5, caida=0.45) + 0.4 * campana(2637, 1.4, indice=0.8, razon=2.0, caida=0.3)
    return normalizar(estereo(x), -6)


def notificacion():
    a = campana(1318.5, 0.5, 1.2, 2.0, 0.18)                 # mi
    b = campana(1975.5, 0.6, 1.2, 2.0, 0.22)                 # si
    x = np.zeros(int(SR * 0.75)); x[:len(a)] += a; x[int(SR * 0.12):int(SR * 0.12) + len(b)] += b
    return normalizar(estereo(x), -6)


def exito():
    notas = [1046.5, 1318.5, 1568.0, 2093.0]                # do-mi-sol-do
    x = np.zeros(int(SR * 1.2))
    for k, f in enumerate(notas):
        c = campana(f, 0.9, 1.0, 2.0, 0.28 + k * 0.05) * (0.8 if k < 3 else 1.0)
        i = int(SR * 0.075 * k); x[i:i + len(c)] += c
    return normalizar(estereo(x), -5)


def dinero():
    x = np.zeros(int(SR * 0.8))
    for k in range(7):                                        # varias monedas que chocan
        i = int(SR * (0.02 + 0.07 * k + rng.uniform(0, 0.03)))
        d = 0.35; t = t_(d)
        parciales = [rng.uniform(2800, 3400), rng.uniform(4500, 5200), rng.uniform(6400, 7300)]
        c = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t / rng.uniform(0.05, 0.12)) for f in parciales)
        c += rng.standard_normal(len(t)) * np.exp(-t / 0.003) * 0.4
        x[i:i + len(c)] += c[: len(x) - i] * (0.6 + 0.4 * rng.random())
    return normalizar(estereo(x, None), -6)


def brillo():
    dur = 0.9; x = np.zeros(int(SR * dur))
    for k in range(14):                                       # destellos agudos que suben
        f = 2600 * (1.12 ** k) * rng.uniform(0.97, 1.03)
        c = np.sin(2 * np.pi * f * t_(0.25)) * np.exp(-t_(0.25) / 0.06)
        i = int(SR * 0.045 * k); x[i:i + len(c)] += c[: len(x) - i] * (0.5 + 0.5 * k / 14)
    izq = x * np.linspace(1, 0.4, len(x)); der = x * np.linspace(0.4, 1, len(x))
    return normalizar(np.stack([izq, der], axis=1), -8)


def teclado():
    dur = 1.1; x = np.zeros(int(SR * dur)); tiempo = 0.03
    while tiempo < dur - 0.05:
        c = clic()[:, 0] * rng.uniform(0.5, 1.0)
        c = pasabajos(c, rng.uniform(3500, 7000))
        i = int(SR * tiempo); x[i:i + len(c)] += c[: len(x) - i]
        tiempo += rng.uniform(0.06, 0.13)
    return normalizar(estereo(x), -8)


def trazo():
    dur = 0.6; n = int(SR * dur); t = np.linspace(0, 1, n)
    x = pasabanda_variable(rng.standard_normal(n), 2500 + 1500 * np.sin(2 * np.pi * 3 * t) ** 2, q=1.4)
    golpes = np.abs(np.sin(np.pi * 3.2 * t)) ** 0.6              # tres pasadas del lápiz
    env = golpes * np.minimum(1, t / 0.05) * np.minimum(1, (1 - t) / 0.15)
    return normalizar(estereo(x * env, 0.35 + 0.3 * t), -9)


def boom(dur=2.2):
    t = t_(dur)
    frec = 34 + 46 * np.exp(-t / 0.18)
    sub = np.sin(2 * np.pi * np.cumsum(frec) / SR) * np.exp(-t / 0.9)
    cuerpo = pasabajos(ruido_rosa(len(t)), 420) * np.exp(-t / 0.35) * 1.4
    cola = pasabajos(ruido_rosa(len(t)), 1800) * np.exp(-t / 0.8) * 0.12
    x = np.tanh((sub * 1.5 + cuerpo + cola) * 1.3)
    return normalizar(estereo(x), -2)


def enfoque(dur=0.7):
    n = int(SR * dur); t = np.linspace(0, 1, n)
    x = pasabanda_variable(ruido_rosa(n), 600 + 6000 * t ** 2, q=0.8)
    env = t ** 3 * (1 - np.clip((t - 0.96) / 0.04, 0, 1))
    return normalizar(estereo(x * env), -6)


EFECTOS = {
    'whoosh': whoosh, 'whoosh-corto': lambda: whoosh(0.34, 400, 4200, 1200), 'subida': subida, 'golpe': golpe,
    'pop': pop, 'clic': clic, 'tic': tic, 'ding': ding, 'notificacion': notificacion, 'exito': exito,
    'dinero': dinero, 'brillo': brillo, 'teclado': teclado, 'trazo': trazo, 'boom': boom, 'enfoque': enfoque,
}


def guardar(ruta, x):
    import wave
    datos = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(str(ruta), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(datos.tobytes())


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    destino = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / 'plantilla' / 'motor' / 'sfx'
    destino.mkdir(parents=True, exist_ok=True)
    solo = sys.argv[2:]
    for nombre, f in EFECTOS.items():
        if solo and nombre not in solo:
            continue
        x = f()
        # 5 ms de fundido al final: ningún efecto termina con un "clic".
        n = int(SR * 0.005); x[-n:] *= np.linspace(1, 0, n)[:, None]
        guardar(destino / f'{nombre}.wav', x)
        print(f'✔ {nombre}.wav · {len(x) / SR:.2f} s')


if __name__ == '__main__':
    main()
