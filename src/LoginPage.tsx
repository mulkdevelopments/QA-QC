import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from './api'
import BrandMark from './BrandMark'
import './App.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app login-page">
      <div className="bg-grid" aria-hidden />

      <form className="login-card" onSubmit={onSubmit}>
        <BrandMark size="lg" stacked />
        <p className="login-lead">Sign in to manage and share document links.</p>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn primary wide" disabled={loading}>
          {loading ? 'Alubond Connect...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
