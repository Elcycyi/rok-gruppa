// Все обращения к серверу собраны здесь, чтобы компоненты не знали про fetch.
//
// ГЛАВНОЕ: в каждом запросе обязателен credentials: "include". Сервер узнаёт нас
// по куке sessionid, которую сам ставит при входе; она HttpOnly, то есть из
// JavaScript не видна и не читается — браузер прикладывает её сам, но только
// если явно разрешить отправку кук. Без этой строки любой защищённый адрес
// ответит 403 «Учетные данные не были предоставлены».

export const БАЗА = 'https://inai-col2.fishrungames.com'

export type Специализация = 'vocals' | 'guitar' | 'bass' | 'drums' | 'keys' | 'other'

export interface Профиль {
  first_name: string
  specialization: Специализация
  specialization_display: string
  bio: string
  fee: string
}

export interface Пользователь {
  id: number
  username: string
  profile: Профиль
}

export interface ВариантСпециализации {
  value: Специализация
  label: string
}

export interface Правки {
  first_name?: string
  specialization?: Специализация
  bio?: string
  fee?: string
}

/** Ошибка сервера с уже разобранным человеческим текстом. */
export class ОшибкаСервера extends Error {
  код: number
  constructor(код: number, текст: string) {
    super(текст)
    this.код = код
    this.name = 'ОшибкаСервера'
  }
}

// Сервер отвечает об ошибках в ДВУХ разных формах, и обе надо уметь читать,
// иначе на экране появится «undefined»:
//   { "detail": "Неверный логин или пароль." }                  — 401 и 403
//   { "username": ["Пользователь с таким именем уже существует."] } — 400
function текстОшибки(тело: unknown): string {
  if (!тело || typeof тело !== 'object') return 'Сервер ответил ошибкой'
  const данные = тело as Record<string, unknown>
  if (typeof данные.detail === 'string') return данные.detail
  const куски: string[] = []
  for (const [поле, значение] of Object.entries(данные)) {
    const строки = Array.isArray(значение) ? значение : [значение]
    куски.push(`${подпись(поле)}: ${строки.join(' ')}`)
  }
  return куски.length ? куски.join('\n') : 'Сервер ответил ошибкой'
}

function подпись(поле: string): string {
  const словарь: Record<string, string> = {
    username: 'Логин',
    password: 'Пароль',
    first_name: 'Имя',
    specialization: 'Специализация',
    bio: 'О себе',
    fee: 'Гонорар',
  }
  return словарь[поле] ?? поле
}

async function запрос<T>(путь: string, настройки: RequestInit = {}): Promise<T> {
  const ответ = await fetch(`${БАЗА}${путь}`, {
    ...настройки,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(настройки.headers ?? {}) },
  })
  const текст = await ответ.text()
  const тело = текст ? JSON.parse(текст) : null
  if (!ответ.ok) throw new ОшибкаСервера(ответ.status, текстОшибки(тело))
  return тело as T
}

export function зарегистрироваться(логин: string, пароль: string) {
  return запрос<Пользователь>('/api/register/', {
    method: 'POST',
    body: JSON.stringify({ username: логин, password: пароль }),
  })
}

export function войти(логин: string, пароль: string) {
  return запрос<Пользователь>('/api/login/', {
    method: 'POST',
    body: JSON.stringify({ username: логин, password: пароль }),
  })
}

export function выйти() {
  return запрос<{ detail: string }>('/api/logout/', { method: 'POST' })
}

export function мойПрофиль() {
  return запрос<Пользователь>('/api/profile/')
}

export function сохранитьПрофиль(правки: Правки) {
  return запрос<Пользователь>('/api/profile/', {
    method: 'PATCH',
    body: JSON.stringify(правки),
  })
}

export function списокСпециализаций() {
  return запрос<ВариантСпециализации[]>('/api/specializations/')
}

/** Гонорар сервер принимает только с ТОЧКОЙ: "2500,50" он отвергает с
 *  «Требуется численное значение.». На русской раскладке запятую ставят не
 *  задумываясь, поэтому меняем её сами и убираем пробелы. */
export function гонорарДляСервера(введено: string): string {
  return введено.trim().replace(',', '.').replace(/\s+/g, '')
}
