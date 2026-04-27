import { useState } from 'react'
import './about_css.css'

interface Props {
  onBack: () => void
  onTryPrompt: (prompt: string) => void
}

const SAMPLE_PROMPTS = [
  "I want a warm beach destination for a week-long trip on a budget",
  "Solo backpacker looking for vibrant nightlife and street food in Southeast Asia",
  "Family-friendly city with great museums and mild weather for spring break",
  "Romantic getaway with mountains and cozy cafes, medium budget, one week",
  "Adventure trip with hiking and nature, somewhere cold and remote",
  "I want to party in a tropical location for spring break, cheap flights preferred",
  "Cultural immersion trip — history, architecture, local cuisine, Europe",
  "Digital nomad looking for a city with great coffee shops and fast internet",
]

function AboutPage({ onBack, onTryPrompt }: Props): JSX.Element {
  const [copied, setCopied] = useState<number | null>(null)

  const handlePrompt = (prompt: string, idx: number) => {
    onTryPrompt(prompt)
    setCopied(idx)
    setTimeout(() => setCopied(null), 1200)
  }

  return (
    <div className="about-page">
      <button className="back-btn" onClick={onBack}>← back</button>

      <div className="about-hero">
        <div className="search-logo" style={{ marginBottom: '8px' }}>
          GOAT<span>aways</span>
        </div>
        <p className="about-tagline">
          The Greatest Of All Time travel recommender — built with real IR.
        </p>
      </div>

      {/* ── Why we built this ── */}
      <section className="about-section">
        <h2 className="about-section-title">✈️ Why GOATaways?</h2>
        <p className="about-section-body">
          Most travel recommendation tools are either generic listicles or black-box
          ML models that give you no insight into <em>why</em> a destination was
          chosen. GOATaways is different — it's built on transparent, explainable
          Information Retrieval techniques so you can see exactly how your query
          maps to a city recommendation, right down to the individual scoring
          components.
        </p>
      </section>

      {/* ── How the algorithm works ── */}
      <section className="about-section">
        <h2 className="about-section-title">🧠 How the Algorithm Works</h2>
        <p className="about-section-body" style={{ marginBottom: '20px' }}>
          Your query flows through four layers before a ranked list appears:
        </p>

        <div className="about-steps">

          <div className="about-step">
            <div className="about-step-num">1</div>
            <div className="about-step-content">
              <h3>Query Parsing</h3>
              <p>
                Your natural-language input is parsed to extract signals like
                trip length (<em>weekend</em>, <em>week</em>, <em>long trip</em>),
                weather preference (<em>warm</em>, <em>cold</em>, <em>tropical</em>),
                and a cleaned keyword string for the retrieval step. We also pass it through the Spark LLM to generate an IR-optimised query variant, which is used in parallel for retrieval and can boost recall.
              </p>
            </div>
          </div>

          <div className="about-step">
            <div className="about-step-num">2</div>
            <div className="about-step-content">
              <h3>Hybrid TF-IDF + SVD Retrieval</h3>
              <p>
                The keyword string is run against an index of real traveller reviews
                for every city in our dataset. Each city receives two scores:
              </p>
              <ul className="about-list">
                <li>
                  <strong>TF-IDF score (25%)</strong> — classic sparse keyword
                  matching. How often do your exact terms appear in reviews for
                  this city?
                </li>
                <li>
                  <strong>SVD / LSA score (75%)</strong> — Latent Semantic
                  Analysis via Singular Value Decomposition. The TF-IDF matrix is
                  decomposed into latent "concept" dimensions. Your query is
                  projected into this latent space and compared to each city's
                  projection — capturing semantic similarity even when exact words
                  don't match.
                </li>
              </ul>
              <p style={{ marginTop: '10px' }}>
                The two are combined into a single <strong>hybrid review score</strong>.
              </p>
            </div>
          </div>

          <div className="about-step">
            <div className="about-step-num">3</div>
            <div className="about-step-content">
              <h3>Climate &amp; Distance Scoring</h3>
              <p>
                Two additional signals are layered on top of the text score:
              </p>
              <ul className="about-list">
                <li>
                  <strong>Climate score (15%)</strong> — your weather preference
                  is matched against real monthly temperature data. If you
                  provide your location, the score is relative to your home
                  climate (so "warm" means warmer than where you are, not a fixed
                  temperature).
                </li>
                <li>
                  <strong>Distance score (7%)</strong> — trip length inference
                  shapes this. A "weekend trip" favours nearby cities; a "long
                  trip" rewards farther destinations.
                </li>
              </ul>
            </div>
          </div>

          <div className="about-step">
            <div className="about-step-num">4</div>
            <div className="about-step-content">
              <h3>Final Ranking</h3>
              <p>
                The three components are combined into a final score:
              </p>
              <div className="about-formula">
                <code>
                  Final = 0.78 × (hybrid review score)<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.15 × (climate score)<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.07 × (distance score)
                </code>
              </div>
              <p style={{ marginTop: '10px' }}>
                Cities are ranked highest-to-lowest and the top 10 are returned.
                The review score itself is <em>gated</em> by climate — a city
                with amazing reviews but completely wrong weather is penalised.
              </p>
            </div>
          </div>

          <div className="about-step">
            <div className="about-step-num">5</div>
            <div className="about-step-content">
              <h3>RAG — AI Summary Layer</h3>
              <p>
                After the IR results are displayed, a Retrieval-Augmented
                Generation (RAG) step fires in the background:
              </p>
              <ul className="about-list">
                <li>
                  The Spark LLM converts your natural-language query into an
                  IR-optimised keyword string (shown as the "LLM-generated IR
                  query" in the results).
                </li>
                <li>
                  The top-10 ranked cities are passed as context to the LLM,
                  which writes a friendly paragraph explaining why they match
                  your request — grounded entirely in the retrieved data, not
                  hallucinated.
                </li>
              </ul>
              <p style={{ marginTop: '10px' }}>
                The IR results are <strong>always shown in full</strong> — the AI
                summary is an enhancement, not a replacement.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── What you can see ── */}
      <section className="about-section">
        <h2 className="about-section-title">🔍 Explainability — See the Maths</h2>
        <p className="about-section-body">
          Every result card shows a breakdown of all scoring components. Click
          <strong> "Read more"</strong> on any city to open the detail drawer,
          where you'll see the exact SVD latent dimensions that fired for your
          query — including the query weight, city weight, and their dot-product
          contribution — plus the formula used to compute the final text score.
          Nothing is hidden.
        </p>
      </section>

      {/* ── Sample prompts ── */}
      <section className="about-section">
        <h2 className="about-section-title">💡 Try a Sample Prompt</h2>
        <p className="about-section-body" style={{ marginBottom: '16px' }}>
          Click any prompt below to load it into the search bar and run it instantly.
        </p>
        <div className="sample-prompts-grid">
          {SAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              className={`sample-prompt-btn${copied === idx ? ' sample-prompt-btn--copied' : ''}`}
              onClick={() => handlePrompt(prompt, idx)}
              type="button"
            >
              {copied === idx ? '✓ Loaded!' : `"${prompt}"`}
            </button>
          ))}
        </div>
      </section>

      <div className="about-footer">
        Built for Cornell INFO/CS 4300 · Spring 2026
      </div>
    </div>
  )
}

export default AboutPage