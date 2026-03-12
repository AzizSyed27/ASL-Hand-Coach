import { Link } from "react-router-dom";
import heroImg from "../assets/landing-hero.png"; // put your image here
import logo from "../assets/asl_logo.png"; // put your logo here
import "../styles/landing-page.css"

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landingNav">
        <div className="landingLogo">
          <img src={logo} alt="ASL Hand Coach logo" className="logoImage" />
        </div>

        <nav className="landingNavCenter">
          <a className="landingNavLink" href="#how">
            How it works
          </a>
          <a className="landingNavLink" href="#features">
            Features
          </a>
          <a className="landingNavLink" href="#blog">
            Where to begin
          </a>
          
        </nav>

        <div className="landingNavRight">
          <Link className="landingStartBtn" to="/app">
            Start
          </Link>
        </div>
      </header>

      <main className="landingMain">
        <section className="heroMockup">
          <div className="heroMockupText">
            <h1 className="heroMockupTitle">
              Learn ASL <br />
              fingerspelling with <br />
              real-time <br />
              hand Tracking
            </h1>

            <p className="heroMockupDesc">
              ASL Hand Coach uses your camera to teach you American Sign
              Language fingerspelling from A to Z and 0 to 9. Watch your hands
              move in real time with real time feedbackas you learn each letter and number.
            </p>

            <div className="heroMockupActions">
              <Link className="heroDownloadBtn" to="/app">
                Try it Now
              </Link>

              <a className="heroLearnBtn" href="#how">
                Learn more
              </a>
            </div>
          </div>

          <div className="heroMockupImageWrap">
            <img
              src={heroImg}
              alt="Landing page hero"
              className="heroMockupImage"
            />
          </div>
        </section>



        {/*}
        <section id="features" className="section">
          <h2 className="sectionTitle">3 MVP Modes</h2>
          <p className="sectionDesc">
            All modes share the same hand tracking + recognition pipeline.
          </p>

          <div className="cardGrid">
            <div className="card">
              <div className="cardTitle">Teaching Mode</div>
              <div className="cardBody">
                Step through A–Z and 0–9. You must hold the correct sign briefly
                before advancing.
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Quiz Mode</div>
              <div className="cardBody">
                Random prompts. Correct answers increase your streak; wrong
                answers reset it.
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Free Mode</div>
              <div className="cardBody">
                Type words by signing letters. Timer-based commit with
                lock/release so repeats work.
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
                  MediaPipe finds 21 hand landmarks from your camera feed in
                  real-time.
                </div>
              </div>
            </div>

            <div className="step">
              <div className="stepNum">2</div>
              <div>
                <div className="stepTitle">Normalize</div>
                <div className="stepText">
                  We translate wrist to origin, scale by palm size, and mirror
                  left hands so templates work for both.
                </div>
              </div>
            </div>

            <div className="step">
              <div className="stepNum">3</div>
              <div>
                <div className="stepTitle">Template match + stability</div>
                <div className="stepText">
                  Nearest-neighbor matching chooses the closest label. A
                  stability filter reduces flicker.
                </div>
              </div>
            </div>
          </div>

          <div className="privacyBox">
            <div className="privacyTitle">Privacy</div>
            <div className="privacyText">
              Video stays on your device. No uploads and no backend required for
              MVP.
            </div>
          </div>
        </section>

        <footer className="landingFooter">
          <div className="muted">
            Built with React + TypeScript + MediaPipe Tasks Vision
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

        */}
      </main>
    </div>
  );
}
