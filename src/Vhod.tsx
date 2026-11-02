import { useState } from 'react'
import { войти, зарегистрироваться, ОшибкаСервера } from './api'
import type { Пользователь } from './api'

type Режим = 'вход' | 'регистрация'

interface Свойства {
  приВходе: (кто: Пользователь) => void
}

export default function Вход({ приВходе }: Свойства) {
  const [режим, установитьРежим] = useState<Режим>('вход')
  const [логин, установитьЛогин] = useState('')
  const [пароль, установитьПароль] = useState('')
  const [ошибка, установитьОшибку] = useState<string | null>(null)
  const [ждём, установитьЖдём] = useState(false)

  const отправить = async (событие: React.FormEvent) => {
    событие.preventDefault()
    установитьОшибку(null)
    установитьЖдём(true)
    try {
      // Регистрация сразу открывает сессию: сервер отдаёт 201 и ставит ту же
      // куку sessionid, что и вход (проверено запросом). Поэтому второй раз
      // входить не надо — берём пользователя прямо из ответа.
      приВходе(
        режим === 'регистрация'
          ? await зарегистрироваться(логин, пароль)
          : await войти(логин, пароль),
      )
    } catch (сбой) {
      установитьОшибку(
        сбой instanceof ОшибкаСервера ? сбой.message : 'Сервер не отвечает',
      )
    } finally {
      установитьЖдём(false)
    }
  }

  return (
    <div className="карточка вход">
      <div className="вкладки">
        <button
          type="button"
          className={режим === 'вход' ? 'вкладка выбрана' : 'вкладка'}
          onClick={() => {
            установитьРежим('вход')
            установитьОшибку(null)
          }}
        >
          Вход
        </button>
        <button
          type="button"
          className={режим === 'регистрация' ? 'вкладка выбрана' : 'вкладка'}
          onClick={() => {
            установитьРежим('регистрация')
            установитьОшибку(null)
          }}
        >
          Регистрация
        </button>
      </div>

      <form onSubmit={отправить}>
        <label>
          Логин
          <input
            value={логин}
            onChange={(с) => установитьЛогин(с.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label>
          Пароль
          <input
            type="password"
            value={пароль}
            onChange={(с) => установитьПароль(с.target.value)}
            autoComplete={режим === 'вход' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />
        </label>
        {режим === 'регистрация' && (
          <p className="подсказка">Пароль — не короче 6 символов.</p>
        )}

        {ошибка && <p className="ошибка">{ошибка}</p>}

        <button type="submit" className="главная" disabled={ждём}>
          {ждём
            ? 'Минутку…'
            : режим === 'вход'
              ? 'Войти'
              : 'Зарегистрироваться'}
        </button>
      </form>
    </div>
  )
}
