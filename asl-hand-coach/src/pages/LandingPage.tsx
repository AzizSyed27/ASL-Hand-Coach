import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landingNav">
        <div className="landingBrand">
          <div className="logoDot" />
          <div>
            <div className="brandName">ASL Hand Coach</div>
            <div className="brandSub">On-device fingerspelling trainer</div>
          </div>
        </div>

        <nav className="landingNavActions">
          <a className="linkBtn" href="#how">
            How it works
          </a>
          <a className="linkBtn" href="#modes">
            Modes
          </a>
          <Link className="primaryBtn" to="/app">
            Open App
          </Link>
        </nav>
      </header>

      <main className="landingMain">
        <section className="hero">
          <div className="heroLeft">
            <div className="badge">MVP: A–Z + 0–9 (on-device)</div>

            <h1 className="heroTitle">
              Learn ASL fingerspelling
              <br />
              with real-time feedback.
            </h1>

            <p className="heroDesc">
              ASL Hand Coach uses your camera + hand landmarks to help you practice letters and numbers.
              No video upload. No backend for MVP. Everything runs locally in your browser.
            </p>

            <div className="heroActions">
              <Link className="primaryBtn" to="/app">
                Start Coaching
              </Link>
              <a className="secondaryBtn" href="#modes">
                See Modes
              </a>
            </div>

            <div className="finePrint">
              Note: motion letters (J, Z) use a static MVP shape for now. Motion support is coming soon.
            </div>
          </div>

          <div className="heroRight">
            <div className="heroCard">
              <div className="heroCardTitle">What you can do</div>
              <ul className="heroList">
                <li>
                  <strong>Teaching Mode</strong> — guided A–Z / 0–9 with hold-to-confirm
                </li>
                <li>
                  <strong>Quiz Mode</strong> — prompts + score + streak
                </li>
                <li>
                  <strong>Free Mode</strong> — “type” words with timer commit + repeat support
                </li>
              </ul>

              <div className="heroMiniGrid">
                <div className="mini">
                  <div className="miniTitle">Privacy</div>
                  <div className="miniText">Processed locally. No uploads.</div>
                </div>
                <div className="mini">
                  <div className="miniTitle">Tech</div>
                  <div className="miniText">React + TS + MediaPipe</div>
                </div>
                <div className="mini">
                  <div className="miniTitle">Recognition</div>
                  <div className="miniText">Template matching + stability</div>
                </div>
              </div>

              <div className="heroCardCta">
                <Link className="primaryBtn" to="/app">
                  Open App
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="modes" className="section">
          <h2 className="sectionTitle">3 MVP Modes</h2>
          <p className="sectionDesc">All modes share the same hand tracking + recognition pipeline.</p>

          <div className="cardGrid">
            <div className="card">
              <div className="cardTitle">Teaching Mode</div>
              <div className="cardBody">
                Step through A–Z and 0–9. You must hold the correct sign briefly before advancing.
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Quiz Mode</div>
              <div className="cardBody">
                Random prompts. Correct answers increase your streak; wrong answers reset it.
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Free Mode</div>
              <div className="cardBody">
                Type words by signing letters. Timer-based commit with lock/release so repeats (HELLO) work.
              </div>
            </div>
          </div>

          <div className="ctaRow">
            <Link className="primaryBtn" to="/app">
              Try it now
            </Link>
          </div>
        </section>

        <section id="how" className="section">
          <h2 className="sectionTitle">How it works (MVP)</h2>

          <div className="steps">
            <div className="step">
              <div className="stepNum">1</div>
              <div>
                <div className="stepTitle">Hand landmarks</div>
                <div className="stepText">
                  MediaPipe finds 21 hand landmarks from your camera feed in real-time.
                </div>
              </div>
            </div>

            <div className="step">
              <div className="stepNum">2</div>
              <div>
                <div className="stepTitle">Normalize</div>
                <div className="stepText">
                  We translate wrist → origin, scale by palm size, and mirror left hands so templates work for both.
                </div>
              </div>
            </div>

            <div className="step">
              <div className="stepNum">3</div>
              <div>
                <div className="stepTitle">Template match + stability</div>
                <div className="stepText">
                  Nearest-neighbor matching chooses the closest label (or Unknown). A stability filter reduces flicker.
                </div>
              </div>
            </div>
          </div>

          <div className="privacyBox">
            <div className="privacyTitle">Privacy</div>
            <div className="privacyText">
              Video stays on your device. No uploads and no backend required for MVP.
            </div>
          </div>
        </section>

        <footer className="landingFooter">
          <div className="muted">
            Built with React + TypeScript + MediaPipe Tasks Vision • MVP: fingerspelling only
          </div>
          <div className="footerLinks">
            <Link className="linkBtn" to="/app">
              Open App
            </Link>
            <a className="linkBtn" href="#how">
              Back to top
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}