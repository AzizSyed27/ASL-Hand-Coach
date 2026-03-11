import { Link } from "react-router-dom";
import heroImg from "../assets/landing-hero.jpg"; // put your image here
import "../styles/landing-page.css"

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landingNav">
        <div className="landingLogo">Logo</div>

        <nav className="landingNavCenter">
          <a className="landingNavLink" href="#how">
            How it works
          </a>
          <a className="landingNavLink" href="#features">
            Features
          </a>
          <a className="landingNavLink" href="#blog">
            Blog
          </a>
          <a className="landingNavLink" href="#more">
            More
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
