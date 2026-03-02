import { useState, useEffect } from 'react'
import './index.css'

function App() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      }
    } catch (e) {
      console.error('Failed to fetch posts', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <nav className="navbar">
        <div className="logo">📝 ScribeBoard</div>
        <div>
          <button className="btn" style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}>
            Login Engine
          </button>
        </div>
      </nav>

      <main className="container">
        <section className="hero">
          <h1>Modern Blog CMS Backend</h1>
          <p>
            Experience a full-fledged content management service capable of complex publishing workflows right from this elegant interface.
          </p>
          <button className="btn" onClick={fetchPosts}>
            {loading ? 'Connecting...' : 'Test API Connection'}
          </button>
        </section>

        {posts.length > 0 && (
          <div style={{ marginBottom: '4rem', padding: '2rem', background: 'var(--bg-card)', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Latest API Data</h2>
            <pre style={{ color: 'var(--text-muted)', overflowX: 'auto' }}>
              {JSON.stringify(posts, null, 2)}
            </pre>
          </div>
        )}

        <section className="features">
          <div className="card">
            <h3>Publishing Workflows</h3>
            <p>Draft, Review, Publish, and Unpublish features built right in. Manage content seamlessly with status changes.</p>
          </div>
          <div className="card">
            <h3>User Roles</h3>
            <p>Comprehensive RBAC configuration allowing Admin, Editor, Author, and Reader roles to control the entire system securely.</p>
          </div>
          <div className="card">
            <h3>Categories & Tags</h3>
            <p>Never lose your content. Structure the blog system dynamically using precise tags and categorical hierarchies.</p>
          </div>
        </section>
      </main>
    </>
  )
}

export default App
