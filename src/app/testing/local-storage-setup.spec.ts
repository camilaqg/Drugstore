// Archivo de setup global de pruebas (registrado en angular.json como
// `test.options.setupFiles`, por lo que NO se ejecuta como suite: el
// builder lo excluye del patrón de tests y lo corre antes de cada
// archivo de prueba). No declara describe/it a propósito: los setup
// files de Vitest corren dentro del contexto de cada suite.
//
// Problema que resuelve: con Node >= 22.4 `globalThis.localStorage` es
// una propiedad propia de Node que, sin el flag `--localstorage-file`,
// es undefined (warning "localStorage is not available"). Vitest, al
// poblar el entorno jsdom, omite las claves que ya existen en
// globalThis (ver getWindowKeys), así que el getter de jsdom no se
// instala y dentro de los tests `localStorage` es undefined, aunque la
// aplicación lo usa para toda la sesión (token, rol, usuario).
//
// jsdom igualmente crea el Storage y lo expone como
// `globalThis._localStorage` (copia de la ventana de jsdom). Aquí se
// restaura `localStorage` y `sessionStorage` apuntando a ese Storage.
// En un navegador real (o si el entorno ya trae localStorage funcional)
// no hace nada.

const jsdomLocalStorage = (globalThis as unknown as { _localStorage?: Storage })._localStorage;
const jsdomSessionStorage = (globalThis as unknown as { _sessionStorage?: Storage })._sessionStorage;

// `typeof` sobre la propiedad de Node dispara el getter experimental:
// se compara contra 'object' para detectar solo el caso roto.
function estaRoto(storage: unknown): boolean {
  try {
    return typeof storage !== 'object' || storage === null;
  } catch {
    return true;
  }
}

if (jsdomLocalStorage && estaRoto(globalThis.localStorage)) {
  Object.defineProperty(globalThis, 'localStorage', {
    get: () => jsdomLocalStorage,
    configurable: true,
  });
}

if (jsdomSessionStorage && estaRoto(globalThis.sessionStorage)) {
  Object.defineProperty(globalThis, 'sessionStorage', {
    get: () => jsdomSessionStorage,
    configurable: true,
  });
}
