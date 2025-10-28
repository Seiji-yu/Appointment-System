import React from "react";
import "../../Styles/About.css";

const About = () => {
  console.log("About.jsx is rendering!");

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-text">
          <h1>About Our Telemedicine Platform "THERAPH"</h1>
          <p>
            We are committed to providing accessible, efficient, and reliable
            healthcare through modern telemedicine solutions. Our system helps
            connect patients and doctors seamlessly.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="our-story">
        <h2>Our Story</h2>
        <div className="story-cards">
          <div className="story-card">
            <h3>Our Mission</h3>
            <p>
              To make healthcare accessible anytime, anywhere through innovative
              digital solutions.
            </p>
          </div>
          <div className="story-card">
            <h3>Our Vision</h3>
            <p>
              To revolutionize healthcare delivery by bridging the gap between
              patients and medical professionals.
            </p>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="our-team">
        <h2>Meet the Team</h2>
        <div className="team-members">
          <div className="team-card">
            <img src="/images/member1.jpg" alt="Team Member 1" />
            <h4>John Doe</h4>
            <p>Lead Developer</p>
          </div>
          <div className="team-card">
            <img src="/images/member2.jpg" alt="Team Member 2" />
            <h4>Jane Smith</h4>
            <p>UI/UX Designer</p>
          </div>
          <div className="team-card">
            <img src="/images/member3.jpg" alt="Team Member 3" />
            <h4>Mark Johnson</h4>
            <p>Backend Engineer</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-left">
            <h3>THERAPH System</h3>
            <p>Empowering healthcare through technology.</p>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <a href="/">Home</a>
            <a href="/About">About</a>
            <a href="/Settings">Settings</a>
          </div>

          <div className="footer-contact">
            <h4>Contact</h4>
            <p>Email: support@theraph.com</p>
            <p>Phone: +63 900 000 0000</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 THERAPH System | All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
