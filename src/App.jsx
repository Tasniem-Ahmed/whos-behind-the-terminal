import { useState, useEffect, useRef } from 'react';

// Base URL helper for GitHub Pages and local Vite development
const rawBase = import.meta.env.BASE_URL || '/';
const ASSETS_BASE = `${rawBase.endsWith('/') ? rawBase : rawBase + '/'}Portofolio Assets`;

// Helper for encoding paths with spaces
const getAssetUrl = (relativePath) => {
  return `${ASSETS_BASE}/${relativePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('all');
  const [expandedProject, setExpandedProject] = useState(null);
  const [ciscoImageIdx, setCiscoImageIdx] = useState(0);
  const [activeCertModal, setActiveCertModal] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSecSubLab, setActiveSecSubLab] = useState('ohsint');

  // Custom cursor states
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [cursorTrailingPos, setCursorTrailingPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  const canvasRef = useRef(null);
  const heroRef = useRef(null);

  // 1. Interactive Motion Canvas (Network Nodes + Cursor Proximity)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Node particle setup
    const numNodes = Math.min(Math.floor((width * height) / 22000), 55);
    const nodes = [];

    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.8 + 1,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    let mouseCoord = { x: -1000, y: -1000 };
    const handleMouseMove = (e) => {
      mouseCoord = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (!prefersReducedMotion) {
        // Draw lines between proximate nodes
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 130) {
              const alpha = (1 - dist / 130) * 0.18;
              ctx.strokeStyle = `rgba(184, 28, 46, ${alpha})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.stroke();
            }
          }

          // Line to mouse cursor if nearby
          const mdx = nodes[i].x - mouseCoord.x;
          const mdy = nodes[i].y - mouseCoord.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 160) {
            const mAlpha = (1 - mdist / 160) * 0.28;
            ctx.strokeStyle = `rgba(74, 114, 255, ${mAlpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(mouseCoord.x, mouseCoord.y);
            ctx.stroke();
          }

          // Move nodes
          nodes[i].x += nodes[i].vx;
          nodes[i].y += nodes[i].vy;

          if (nodes[i].x < 0) nodes[i].x = width;
          if (nodes[i].x > width) nodes[i].x = 0;
          if (nodes[i].y < 0) nodes[i].y = height;
          if (nodes[i].y > height) nodes[i].y = 0;

          // Render Node
          ctx.fillStyle = `rgba(220, 38, 38, ${nodes[i].alpha})`;
          ctx.beginPath();
          ctx.arc(nodes[i].x, nodes[i].y, nodes[i].radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // 2. Custom Technical Cursor Handling
  useEffect(() => {
    let animationFrame;
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;

    const onMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setCursorPos({ x: targetX, y: targetY });

      // Check if hovering over interactive elements
      const target = e.target;
      if (
        target.closest('a') ||
        target.closest('button') ||
        target.closest('.project-card') ||
        target.closest('.interactive-tilt') ||
        target.closest('.tab-btn') ||
        target.closest('.cert-image-frame')
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const updateTrailing = () => {
      // Smooth lerp (linear interpolation) for the outer technical ring
      currentX += (targetX - currentX) * 0.2;
      currentY += (targetY - currentY) * 0.2;
      setCursorTrailingPos({ x: currentX, y: currentY });
      animationFrame = requestAnimationFrame(updateTrailing);
    };

    window.addEventListener('mousemove', onMouseMove);
    animationFrame = requestAnimationFrame(updateTrailing);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  // 3D Card Hover Interaction Helper (Only rotates if card is NOT expanded)
  const handleCardMouseMove = (e, isCardExpanded) => {
    if (isCardExpanded) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleCardMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
  };

  // Projects Master Data
  const projects = [
    {
      id: 'portfolio',
      title: 'Portfolio Website',
      category: 'development',
      subtitle: 'Responsive Personal Showcase (Vanilla HTML/CSS/JS)',
      description:
        'A multi-section personal portfolio website developed using clean semantic HTML5, modern CSS3 layout techniques, and vanilla JavaScript for dynamic interactions and DOM manipulation.',
      previewImg: getAssetUrl('Projects/Portofolio/Screenshot 2026-09-28 141855.png'),
      fallbackLabel: 'Portfolio Website Interface Preview',
      tags: ['HTML5', 'CSS3', 'JavaScript', 'Responsive Web Design', 'Git'],
      liveDemo: 'https://tasniem-ahmed.github.io/portfolio/',
      github: 'https://github.com/Tasniem-Ahmed/Portfolio',
      caseStudy: {
        overview:
          'This project represents my foundational work in frontend development. It was built strictly with pure HTML, CSS, and vanilla JavaScript without external UI frameworks, prioritizing clean code structure and semantic accessibility.',
        objective:
          'Design and code a responsive personal website from scratch to showcase academic projects and technical competencies, focusing on lightweight performance, clear typographic hierarchy, and responsive mobile-first behavior.',
        built: [
          'Handcrafted semantic HTML5 layout with accessible landmarks and structured sections.',
          'Custom CSS styling utilizing Flexbox, CSS Grid, and custom variables for consistent dark theme palettes.',
          'Vanilla JavaScript event listeners for smooth internal page scrolling and mobile navigation menu toggling.',
          'Cross-browser tested and optimized for rapid page loading and responsive viewport scaling.',
        ],
        technologies: ['HTML5', 'CSS3', 'JavaScript (ES6)', 'Git', 'GitHub Pages'],
        challenges:
          'Building fluid responsive navigation and maintaining clean styling without relying on CSS frameworks like Bootstrap required meticulous media query breakpoints and structured CSS architecture.',
        learned:
          'Solidified mastery of the DOM, CSS positioning mechanics, layout mathematics, and clean Git version control workflows.',
      },
    },
    {
      id: 'restaurant',
      title: 'Restaurant Website',
      category: 'development',
      subtitle: 'Modern Responsive Dining & Menu Showcase',
      previewImg: getAssetUrl('Projects/Resturant/Screenshot 2026-09-28 142327.png'),
      fallbackLabel: 'Restaurant Website Interface Preview',
      description:
        'An engaging, responsive web interface crafted for a restaurant, featuring an inviting hero showcase, organized menu presentation, and interactive booking sections.',
      tags: ['HTML5', 'CSS3', 'JavaScript', 'Responsive UI', 'Flexbox/Grid'],
      liveDemo: 'https://tasniem-ahmed.github.io/Resturant-Website/',
      github: 'https://github.com/Tasniem-Ahmed/Resturant-Website',
      caseStudy: {
        overview:
          'A responsive single-page culinary website designed to present menu specialties, restaurant ambience, customer reviews, and table reservation options.',
        objective:
          'Create an aesthetically pleasing, responsive landing page with rich imagery, interactive dish categories, and intuitive navigation.',
        built: [
          'High-contrast visual hero section with primary Call-to-Action routing.',
          'Categorized meal and beverage grids with responsive card layouts.',
          'Interactive reservation form interface with client-side field validation.',
          'Smooth scroll transitions between menu sections, specials, and footer contact details.',
        ],
        technologies: ['HTML5', 'CSS3', 'JavaScript', 'Responsive Design', 'Git'],
        challenges:
          'Ensuring that high-resolution culinary imagery loaded promptly while preserving crisp aspect ratios across both compact mobile screens and wide desktop displays.',
        learned:
          'Deepened understanding of responsive image handling, CSS transitions, hover feedback, and user-centric frontend design.',
      },
    },
    {
      id: 'cisco-network',
      title: 'Network Design & Simulation',
      category: 'networking',
      subtitle: 'Cisco Packet Tracer Enterprise Topology Simulation',
      previewImg: getAssetUrl('Projects/Cisco/1.png'),
      fallbackLabel: 'Cisco Enterprise Topology Diagram',
      description:
        'A comprehensive enterprise campus network designed in Cisco Packet Tracer, featuring multi-VLAN segmentation, DHCP server pools, Wireless LAN Controller integration, and access layer routing.',
      tags: ['Cisco Packet Tracer', 'TCP/IP', 'VLANs', 'DHCP Pools', 'WLC', 'Routing & Switching'],
      gallery: [
        { url: getAssetUrl('Projects/Cisco/1.png'), caption: 'Core & Distribution Enterprise Topology Overview' },
        { url: getAssetUrl('Projects/Cisco/2.png'), caption: 'VLAN Allocation, IP Addressing & Subnet Architecture' },
        { url: getAssetUrl('Projects/Cisco/3.png'), caption: 'Switch CLI Configuration & Verification Commands' },
        { url: getAssetUrl('Projects/Cisco/4.png'), caption: 'Wireless LAN Controller (WLC) & Access Point Pool Status' },
      ],
      caseStudy: {
        overview:
          'An end-to-end simulated enterprise network incorporating layered switching, VLAN traffic isolation, centralized DHCP services, and secure wireless infrastructure via Lightweight APs and a Wireless LAN Controller.',
        objective:
          'Simulate a reliable, secure corporate infrastructure with segmented departments, automated client IP provisioning, and verified end-to-end IP reachability.',
        built: [
          'Structured multi-switch hierarchy (Core, Distribution, and Access layers).',
          'Configured 7 distinct VLANs to logically segregate corporate departments, guest traffic, and management.',
          'Deployed dedicated DHCP server pools for automated IPv4 address leasing per subnet.',
          'Integrated Wireless LAN Controller (WLC) with Lightweight Access Points (LAPs) for unified wireless management.',
          'Conducted thorough ICMP connectivity tests and CLI verification (`show ip route`, `show vlan brief`).',
        ],
        technologies: ['Cisco Packet Tracer', 'VLAN Segmentation', 'Inter-VLAN Routing', 'DHCP', 'WLC / LAPs', 'TCP/IP'],
        challenges:
          'Resolving inter-VLAN routing bottlenecks and ensuring proper trunking encapsulation (802.1Q) across multilayer switches while synchronizing DHCP relay agents.',
        learned:
          'Gained hands-on proficiency in network topology planning, packet flow analysis, subnetting, and enterprise wireless controller operations.',
      },
    },
    {
      id: 'cybersecurity-labs',
      title: 'Cybersecurity Labs & Assessments',
      category: 'cybersecurity',
      subtitle: 'Documented Hands-On Penetration Testing & Reconnaissance Labs',
      previewImg: null,
      description:
        'Hands-on vulnerability assessments and security labs covering open-source intelligence (OSINT), target enumeration, NetBIOS/SMB auditing, and penetration testing on vulnerable virtual targets.',
      tags: ['Nmap', 'OSINT', 'Linux Fundamentals', 'Vulnerability Assessment', 'SMB Security', 'Controlled Exploitation'],
      caseStudy: {
        overview:
          'This case study encapsulates practical security assessments conducted in controlled, ethical lab environments. Every finding, tool, and methodology presented is directly documented in the authentic laboratory reports.',
        objective:
          'Apply systematic penetration testing workflows: from passive and active reconnaissance to vulnerability identification, verification, and defense-in-depth remediation.',
        labs: [
          {
            key: 'ohsint',
            name: 'OhSINT — Open Source Intelligence Lab',
            target: 'Passive Open-Source Reconnaissance & Tracking',
            tools: ['ExifTool', 'Wigle.net', 'Search Engine Dorking', 'Social Profiling'],
            pdfReport: getAssetUrl('Projects/Cybersecurity/OhSINT/Report.pdf'),
            findings:
              'Extracted critical GPS and camera metadata from an unstripped photo using ExifTool. Queried extracted BSSID strings on Wigle.net to identify physical geographic coordinates and matched associated usernames across Twitter and GitHub repositories.',
            remediation:
              'Enforce metadata stripping (EXIF data removal) on all publicly accessible web uploads and educate personnel on social media operational security (OPSEC).',
          },
          {
            key: 'metasploitable',
            name: 'Metasploitable 2 — Vulnerability Assessment',
            target: 'Vulnerable Linux Target (192.168.x.x)',
            tools: ['Nmap', 'Metasploit Framework', 'Linux CLI', 'Service Fingerprinting'],
            pdfReport: getAssetUrl('Projects/Cybersecurity/Metasploitable Security Assessment/Metasploitable.pdf'),
            findings:
              'Conducted comprehensive TCP/UDP port scans with Nmap to discover open attack surfaces. Fingerprinted misconfigured and outdated services including vsftpd 2.3.4 (backdoor execution) and distcc v1. Verified exploitable conditions in a controlled, isolated sandbox environment.',
            remediation:
              'Decommission deprecated legacy daemons, update server packages to vendor-supported baselines, and enforce strict ingress firewall rules blocking unauthorized service ports.',
          },
          {
            key: 'smb',
            name: 'SMB / NetBIOS Audit & Assessment',
            target: 'SMB Shares & NetBIOS Protocols (Ports 139 & 445)',
            tools: ['Nmap NSE', 'enum4linux', 'smbclient', 'RPCclient'],
            pdfReport: getAssetUrl('Projects/Cybersecurity/SMB/SMB (NetBIOS) Walkthrough.pdf'),
            findings:
              'Executed Nmap SMB enumeration scripts and enum4linux against the target. Identified exposed NetBIOS names, enumerated active workgroups, and successfully listed readable anonymous/null-session shares containing sensitive configuration files.',
            remediation:
              'Disable SMBv1 entirely, restrict anonymous/null session access (`RestrictNullSessAccess`), enforce SMB signing, and isolate file-sharing traffic behind secure VLAN boundaries.',
          },
        ],
        technologies: ['Nmap', 'ExifTool', 'enum4linux', 'Wigle.net', 'Metasploit', 'Linux CLI'],
        learned:
          'Developed a structured, disciplined methodology: discovering how web and network misconfigurations create security vulnerabilities, and how rigorous documentation forms the backbone of security assessments.',
      },
    },
  ];

  // Certifications Master Data
  const certificates = [
    {
      id: 'pre-security',
      title: 'Pre Security',
      issuer: 'TryHackMe',
      image: getAssetUrl('Projects/Certificates/Pre security.png'),
      skills: ['Network Fundamentals', 'Linux Fundamentals', 'Web Basics', 'Security Principles'],
    },
    {
      id: 'cyber-beginners',
      title: 'Cybersecurity for Beginners',
      issuer: 'MaharaTech',
      image: getAssetUrl('Projects/Certificates/Cybersecurity For Beginnere.png'),
      skills: ['Information Security Basics', 'Threat Landscapes', 'Cyber Hygiene', 'Safe Architecture'],
    },
    {
      id: 'cisco-networking',
      title: 'Networking Basics',
      issuer: 'Cisco Networking Academy',
      image: getAssetUrl('Projects/Certificates/Networking Basics Cisco.png'),
      skills: ['TCP/IP Model', 'IPv4/IPv6 Addressing', 'Subnetting', 'Media & Cabling'],
    },
    {
      id: 'cisco-cybersecurity',
      title: 'Introduction to Cybersecurity',
      issuer: 'Cisco Networking Academy',
      image: getAssetUrl('Projects/Certificates/Introduction to Cybersecurity Cisco.png'),
      skills: ['Confidentiality, Integrity, Availability', 'Network Defense', 'Malware Types', 'Ethics'],
    },
  ];

  const filteredProjects =
    activeTab === 'all' ? projects : projects.filter((p) => p.category === activeTab);

  return (
    <div className="portfolio-root">
      {/* Precision Custom Cursor */}
      <div
        className="custom-cursor-dot"
        style={{
          transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`,
        }}
        aria-hidden="true"
      />
      <div
        className={`custom-cursor-ring ${isHovered ? 'cursor-hovered' : ''}`}
        style={{
          transform: `translate3d(${cursorTrailingPos.x}px, ${cursorTrailingPos.y}px, 0)`,
        }}
        aria-hidden="true"
      />

      {/* Interactive Mesh & Ambient Canvas */}
      <canvas ref={canvasRef} className="interactive-canvas" aria-hidden="true" />

      {/* Ambient Mouse-Tracking Radial Backdrop Light */}
      <div
        className="cursor-spotlight"
        style={{
          transform: `translate3d(${cursorTrailingPos.x}px, ${cursorTrailingPos.y}px, 0)`,
        }}
        aria-hidden="true"
      />

      {/* Navigation */}
      <header className="navbar-container">
        <nav className="navbar" aria-label="Main Navigation">
          <a href="#hero" className="brand-wordmark" aria-label="Tasniem Portfolio Home">
            Tasniem<span className="brand-accent">.</span>
          </a>

          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>

          <ul className={`nav-links ${mobileMenuOpen ? 'nav-open' : ''}`}>
            <li><a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a></li>
            <li><a href="#journey" onClick={() => setMobileMenuOpen(false)}>Journey</a></li>
            <li><a href="#work" onClick={() => setMobileMenuOpen(false)}>Work</a></li>
            <li><a href="#approach" onClick={() => setMobileMenuOpen(false)}>Approach</a></li>
            <li><a href="#skills" onClick={() => setMobileMenuOpen(false)}>Skills</a></li>
            <li><a href="#certifications" onClick={() => setMobileMenuOpen(false)}>Certifications</a></li>
            <li>
              <a href="#contact" className="nav-cta-btn" onClick={() => setMobileMenuOpen(false)}>
                Connect
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        {/* HERO SECTION */}
        <section id="hero" className="hero-section" ref={heroRef}>
          <div className="hero-floating-elements" aria-hidden="true">
            <div className="float-badge badge-1">
              <span className="badge-pulse"></span> [ 200 OK ] GET /index.html
            </div>
            <div className="float-badge badge-2">
              <span className="badge-pulse pulse-blue"></span> TCP SYN/ACK :445
            </div>
            <div className="float-badge badge-3">
              <span className="badge-pulse"></span> SHA-256 :: VERIFIED
            </div>
            <div className="float-badge badge-4">
              <span className="badge-pulse pulse-blue"></span> VLAN 10 :: TRUNK 802.1Q
            </div>
          </div>

          <div className="hero-content">
            <div className="hero-badge-wrapper">
              <span className="status-indicator"></span>
              <span className="hero-badge-text">Currently exploring: Penetration Testing</span>
            </div>

            <h1 className="hero-title">
              Exploring the Web.<br />
              <span className="text-gradient">Learning to Secure It.</span>
            </h1>

            <p className="hero-subtitle">
              I'm Tasniem, a Computer Science student exploring frontend development while building
              my skills in cybersecurity and penetration testing.
            </p>

            <p className="hero-supporting-line">
              "I build to understand, test to learn, and document what I discover."
            </p>

            <div className="hero-cta-group">
              <a href="#work" className="btn btn-primary magnetic-btn">
                <span>Explore My Work</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </a>
              <a href="#about" className="btn btn-secondary">
                <span>Read Background</span>
              </a>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="section-container about-section">
          <div className="section-header">
            <span className="section-label">FOCUS & INTERSECTION</span>
            <h2 className="section-title">Where Building Meets Testing</h2>
            <p className="section-description">
              Connecting user interface architecture with defensive and offensive security principles.
            </p>
          </div>

          <div className="about-grid">
            <div className="about-card interactive-tilt" onMouseMove={(e) => handleCardMouseMove(e, false)} onMouseLeave={handleCardMouseLeave}>
              <div className="about-card-header">
                <div className="icon-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                <h3>Frontend Construction</h3>
              </div>
              <p>
                Developing user interfaces with semantic HTML, modern responsive CSS, and JavaScript
                teaches me how web applications render, manage client-side state, send requests, and
                render data. Building clean code is the first step in understanding potential client-side
                attack surfaces.
              </p>
            </div>

            <div className="about-card interactive-tilt" onMouseMove={(e) => handleCardMouseMove(e, false)} onMouseLeave={handleCardMouseLeave}>
              <div className="about-card-header">
                <div className="icon-box icon-security">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <h3>Security Fundamentals</h3>
              </div>
              <p>
                Studying penetration testing reveals the flip side of web design: inspecting HTTP
                headers, mapping open ports, understanding how misconfigurations allow unauthorized access,
                and testing defenses safely in controlled laboratory environments.
              </p>
            </div>

            <div className="about-card interactive-tilt" onMouseMove={(e) => handleCardMouseMove(e, false)} onMouseLeave={handleCardMouseLeave}>
              <div className="about-card-header">
                <div className="icon-box icon-network">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </div>
                <h3>Network Mechanics</h3>
              </div>
              <p>
                Security and web development both rest upon networking primitives. Designing multi-VLAN
                topologies and inspecting protocols like TCP/IP, ARP, ICMP, and SMB grounds my security
                reasoning in how bits actually traverse routers and firewalls.
              </p>
            </div>
          </div>
        </section>

        {/* JOURNEY SECTION */}
        <section id="journey" className="section-container journey-section">
          <div className="section-header">
            <span className="section-label">MILESTONES</span>
            <h2 className="section-title">My Learning Journey</h2>
            <p className="section-description">
              A chronological progression of academic foundations, web construction, and cybersecurity training.
            </p>
          </div>

          <div className="timeline-wrapper">
            <div className="timeline-line" aria-hidden="true"></div>

            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-card">
                <span className="timeline-year">2023</span>
                <h3 className="timeline-heading">University Foundation & Problem Solving</h3>
                <p className="timeline-desc">
                  Began undergraduate studies in Computer Science and Information Technology.
                  Built core foundations in algorithmic problem solving, discrete math, data
                  structures, and computing logic.
                </p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-card">
                <span className="timeline-year">2024 – 2025</span>
                <h3 className="timeline-heading">Programming, Web Development & Discovering Cybersecurity</h3>
                <p className="timeline-desc">
                  Immersed myself in frontend web development using HTML, modern CSS, and JavaScript.
                  Simultaneously discovered computer networking and the foundations of cybersecurity
                  through Cisco certifications and hands-on packet simulation.
                </p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-card">
                <span className="timeline-year">2026</span>
                <h3 className="timeline-heading">Deeper Focus on Cybersecurity & Penetration Testing</h3>
                <p className="timeline-desc">
                  Transitioned into active security assessments in controlled labs. Mastered Nmap service
                  auditing, Linux security, ExifTool metadata inspection, and TryHackMe practical modules.
                </p>
              </div>
            </div>

            <div className="timeline-item timeline-current">
              <div className="timeline-dot pulse-current"></div>
              <div className="timeline-card highlight-card">
                <span className="timeline-badge-active">Current Specialization</span>
                <span className="timeline-year">2026 → Present</span>
                <h3 className="timeline-heading">DEPI — Penetration Testing Track</h3>
                <p className="timeline-desc">
                  Enrolled in the intensive DEPI Penetration Testing Track, systematically learning
                  methodical reconnaissance, vulnerability assessment, ethical hacking methodologies,
                  and technical reporting.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WORK SECTION */}
        <section id="work" className="section-container work-section">
          <div className="section-header">
            <span className="section-label">SELECTED WORK</span>
            <h2 className="section-title">Featured Projects & Case Studies</h2>
            <p className="section-description">
              Real projects from my archive. Click any card to expand its complete in-place technical case study,
              methodology, and documented findings without layout jumps.
            </p>
          </div>

          <div className="filter-tabs" role="tablist">
            {['all', 'development', 'networking', 'cybersecurity'].map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                className={`tab-btn ${activeTab === tab ? 'active-tab' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="projects-grid">
            {filteredProjects.map((project) => {
              const isExpanded = expandedProject === project.id;

              return (
                <article
                  key={project.id}
                  className={`project-card ${isExpanded ? 'card-expanded' : ''}`}
                  onMouseMove={(e) => handleCardMouseMove(e, isExpanded)}
                  onMouseLeave={handleCardMouseLeave}
                >
                  <div className="card-border-glow"></div>

                  <div className="project-preview-frame">
                    {project.id === 'cybersecurity-labs' ? (
                      <div className="sec-preview-canvas">
                        <div className="sec-preview-grid">
                          <div className="sec-audit-badge">
                            <span className="sec-tag">LAB 01</span>
                            <strong>OhSINT: ExifTool / Wigle</strong>
                            <p>BSSID Geolocation & Target Pivoting</p>
                          </div>
                          <div className="sec-audit-badge">
                            <span className="sec-tag sec-tag-red">LAB 02</span>
                            <strong>Metasploitable 2 Assessment</strong>
                            <p>vsftpd 2.3.4 & Port Auditing</p>
                          </div>
                          <div className="sec-audit-badge">
                            <span className="sec-tag sec-tag-blue">LAB 03</span>
                            <strong>SMB / NetBIOS Audit</strong>
                            <p>Enum4linux & Null Session Analysis</p>
                          </div>
                        </div>
                        <div className="sec-status-bar">
                          <span>Verified Technical Reports: 3 PDF Artifacts</span>
                          <span className="text-crimson">Target Status: 100% Documented</span>
                        </div>
                      </div>
                    ) : (
                      <div className="image-wrapper">
                        <img
                          src={project.previewImg}
                          alt={project.title}
                          className="project-img"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextElementSibling) {
                              e.target.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="img-fallback" style={{ display: 'none' }}>
                          <div className="fallback-technical-box">
                            <div className="fallback-icon">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                <line x1="9" y1="21" x2="9" y2="9"></line>
                              </svg>
                            </div>
                            <span className="fallback-title">{project.fallbackLabel}</span>
                            <span className="fallback-sub">Verified Asset Archive</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="project-category-badge">{project.category}</div>
                  </div>

                  <div className="project-card-body">
                    <h3 className="project-card-title">{project.title}</h3>
                    <p className="project-card-subtitle">{project.subtitle}</p>
                    <p className="project-card-desc">{project.description}</p>

                    <div className="project-tags">
                      {project.tags.map((tag, idx) => (
                        <span key={idx} className="tag-pill">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="project-card-actions">
                      <button
                        className="btn-expand"
                        onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <>
                            <span>Close Case Study</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                          </>
                        ) : (
                          <>
                            <span>Read Full Case Study</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                          </>
                        )}
                      </button>

                      {project.liveDemo && (
                        <a
                          href={project.liveDemo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-icon-btn"
                          title="View Live Demo"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </a>
                      )}

                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-icon-btn"
                          title="View GitHub Repository"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* IN-PLACE EXPANDED CASE STUDY (No annoying jumps or card displacement) */}
                  {isExpanded && (
                    <div className="case-study-expanded" id={`case-study-${project.id}`}>
                      <div className="case-study-divider"></div>

                      <div className="case-study-content">
                        <div className="cs-section">
                          <h4 className="cs-title">1. Overview</h4>
                          <p>{project.caseStudy.overview}</p>
                        </div>

                        <div className="cs-section">
                          <h4 className="cs-title">2. Objective</h4>
                          <p>{project.caseStudy.objective}</p>
                        </div>

                        {project.caseStudy.built && (
                          <div className="cs-section">
                            <h4 className="cs-title">3. What Was Built & Key Features</h4>
                            <ul className="cs-bullet-list">
                              {project.caseStudy.built.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Cisco Slide Gallery Fix: Key attribute guarantees instant image re-render */}
                        {project.id === 'cisco-network' && project.gallery && (
                          <div className="cs-section">
                            <h4 className="cs-title">Topology & Switch Configuration Gallery</h4>
                            <div className="cisco-gallery-container">
                              <div className="cisco-main-viewport">
                                <img
                                  key={project.gallery[ciscoImageIdx].url}
                                  src={project.gallery[ciscoImageIdx].url}
                                  alt={project.gallery[ciscoImageIdx].caption}
                                  className="cisco-active-img"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextElementSibling) {
                                      e.target.nextElementSibling.style.display = 'flex';
                                    }
                                  }}
                                />
                                <div className="cisco-fallback" style={{ display: 'none' }}>
                                  <p>{project.gallery[ciscoImageIdx].caption}</p>
                                </div>
                                <div className="cisco-caption-bar">
                                  <span>Diagram {ciscoImageIdx + 1} of {project.gallery.length}:</span>
                                  <strong>{project.gallery[ciscoImageIdx].caption}</strong>
                                </div>
                              </div>

                              <div className="cisco-thumb-row">
                                {project.gallery.map((item, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    className={`cisco-thumb-btn ${idx === ciscoImageIdx ? 'thumb-active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCiscoImageIdx(idx);
                                    }}
                                  >
                                    <span>0{idx + 1}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Cybersecurity Sub-Labs Switcher */}
                        {project.id === 'cybersecurity-labs' && project.caseStudy.labs && (
                          <div className="cs-section">
                            <h4 className="cs-title">Documented Laboratory Assessments</h4>
                            <div className="sub-lab-tabs">
                              {project.caseStudy.labs.map((lab) => (
                                <button
                                  key={lab.key}
                                  className={`sub-lab-btn ${activeSecSubLab === lab.key ? 'sub-lab-active' : ''}`}
                                  onClick={() => setActiveSecSubLab(lab.key)}
                                >
                                  {lab.name.split('—')[0]}
                                </button>
                              ))}
                            </div>

                            {project.caseStudy.labs
                              .filter((l) => l.key === activeSecSubLab)
                              .map((lab) => (
                                <div key={lab.key} className="sub-lab-panel">
                                  <div className="sub-lab-header">
                                    <div>
                                      <h5>{lab.name}</h5>
                                      <span className="sub-lab-target">Scope: {lab.target}</span>
                                    </div>
                                    <a
                                      href={lab.pdfReport}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn-pdf-view"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                      <span>Open Original Report (PDF)</span>
                                    </a>
                                  </div>

                                  <div className="sub-lab-tools">
                                    <strong>Tools Utilized:</strong>
                                    <div className="tools-pills">
                                      {lab.tools.map((t, idx) => (
                                        <span key={idx} className="tool-pill">
                                          {t}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="sub-lab-block">
                                    <h6>Technical Findings (from Report):</h6>
                                    <p>{lab.findings}</p>
                                  </div>

                                  <div className="sub-lab-block">
                                    <h6>Remediation & Defense Guidance:</h6>
                                    <p>{lab.remediation}</p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}

                        <div className="cs-section">
                          <h4 className="cs-title">Technologies & Tools</h4>
                          <div className="tools-pills">
                            {project.caseStudy.technologies.map((tech, i) => (
                              <span key={i} className="tool-pill-light">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>

                        {project.caseStudy.challenges && (
                          <div className="cs-section">
                            <h4 className="cs-title">Challenges & Solutions</h4>
                            <p>{project.caseStudy.challenges}</p>
                          </div>
                        )}

                        <div className="cs-section">
                          <h4 className="cs-title">What I Learned</h4>
                          <p>{project.caseStudy.learned}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* APPROACH SECTION */}
        <section id="approach" className="section-container approach-section">
          <div className="section-header">
            <span className="section-label">METHODOLOGY</span>
            <h2 className="section-title">How I Approach My Work</h2>
            <p className="section-description">
              A structured five-step cycle guiding how I construct web projects, inspect networks,
              and execute ethical vulnerability assessments.
            </p>
          </div>

          <div className="approach-grid">
            {[
              {
                step: '01',
                title: 'Understand',
                desc: 'Clarify the core objectives, study documentation, map RFC specifications, and define scope boundaries before writing code or running scans.',
              },
              {
                step: '02',
                title: 'Explore',
                desc: 'Research attack surfaces or UI requirements. Gather OSINT passively or analyze layout mechanics, inspecting inputs and network packet flow.',
              },
              {
                step: '03',
                title: 'Build / Test',
                desc: 'Write clean, semantic frontend code or execute targeted scans with Nmap in isolated virtual sandboxes, validating each step carefully.',
              },
              {
                step: '04',
                title: 'Document',
                desc: 'Record command flags, IP logs, screenshots, and configuration snippets. Transparent technical writing ensures every step is reproducible.',
              },
              {
                step: '05',
                title: 'Learn & Improve',
                desc: 'Reflect upon bottlenecks, resolve root security flaws with defensive hardening, and iterate code structure for better reliability.',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="approach-card interactive-tilt"
                onMouseMove={(e) => handleCardMouseMove(e, false)}
                onMouseLeave={handleCardMouseLeave}
              >
                <div className="approach-number">{item.step}</div>
                <h3 className="approach-card-title">{item.title}</h3>
                <p className="approach-card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SKILLS SECTION */}
        <section id="skills" className="section-container skills-section">
          <div className="section-header">
            <span className="section-label">CAPABILITIES</span>
            <h2 className="section-title">Skills & Technical Competencies</h2>
            <p className="section-description">
              Verified skills built through university coursework, laboratory evaluations, and technical certifications.
            </p>
          </div>

          <div className="skills-grid">
            <div className="skill-category-card">
              <div className="skill-category-header">
                <div className="icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                </div>
                <h3>Frontend Development</h3>
              </div>
              <div className="skills-tag-cloud">
                {['HTML5', 'CSS3', 'JavaScript', 'Responsive Web Design', 'Git & GitHub'].map((skill, i) => (
                  <span key={i} className="skill-chip">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="skill-category-card">
              <div className="skill-category-header">
                <div className="icon-box icon-security">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <h3>Cybersecurity</h3>
              </div>
              <div className="skills-tag-cloud">
                {[
                  'Linux Fundamentals',
                  'Networking Fundamentals',
                  'Nmap',
                  'OSINT',
                  'Web Security Fundamentals',
                  'Vulnerability Assessment',
                  'Penetration Testing Fundamentals',
                ].map((skill, i) => (
                  <span key={i} className="skill-chip skill-chip-sec">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="skill-category-card">
              <div className="skill-category-header">
                <div className="icon-box icon-network">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                </div>
                <h3>Networking</h3>
              </div>
              <div className="skills-tag-cloud">
                {[
                  'TCP/IP',
                  'DNS',
                  'ARP',
                  'ICMP',
                  'TCP/UDP',
                  'Ports & Services',
                  'Cisco Packet Tracer',
                ].map((skill, i) => (
                  <span key={i} className="skill-chip skill-chip-net">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CERTIFICATIONS SECTION */}
        <section id="certifications" className="section-container certs-section">
          <div className="section-header">
            <span className="section-label">CREDENTIALS</span>
            <h2 className="section-title">Certifications & Learning</h2>
            <p className="section-description">
              Verified certifications earned from Cisco Networking Academy, TryHackMe, and MaharaTech.
            </p>
          </div>

          <div className="certs-grid">
            {certificates.map((cert) => (
              <div key={cert.id} className="cert-card interactive-tilt" onMouseMove={(e) => handleCardMouseMove(e, false)} onMouseLeave={handleCardMouseLeave}>
                <div className="cert-image-frame" onClick={() => setActiveCertModal(cert)}>
                  <img
                    src={cert.image}
                    alt={`${cert.title} Certificate`}
                    className="cert-img"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextElementSibling) {
                        e.target.nextElementSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="cert-fallback" style={{ display: 'none' }}>
                    <div className="fallback-inner">
                      <span className="cert-badge-type">{cert.issuer}</span>
                      <h4>{cert.title}</h4>
                      <p>View Credential Image</p>
                    </div>
                  </div>
                  <div className="cert-overlay">
                    <span>Click to inspect certificate</span>
                  </div>
                </div>

                <div className="cert-info">
                  <span className="cert-issuer">{cert.issuer}</span>
                  <h3 className="cert-title">{cert.title}</h3>
                  <div className="cert-skills">
                    {cert.skills.map((s, idx) => (
                      <span key={idx} className="cert-skill-pill">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact" className="section-container contact-section">
          <div className="contact-box interactive-tilt" onMouseMove={(e) => handleCardMouseMove(e, false)} onMouseLeave={handleCardMouseLeave}>
            <div className="contact-decor-glow"></div>
            <span className="section-label">GET IN TOUCH</span>
            <h2 className="contact-title">Let's Connect</h2>
            <p className="contact-subtitle">
              Whether you want to talk about a project, share an opportunity, or just connect,
              feel free to reach out.
            </p>

            <div className="contact-cta-wrapper">
              <a
                href="mailto:tasniemahmedhamed@gmail.com"
                className="btn btn-primary btn-large magnetic-btn"
              >
                <span>Send Me a Message</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </a>
            </div>

            <div className="contact-direct-links">
              <a href="mailto:tasniemahmedhamed@gmail.com" className="contact-link-pill">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <span>tasniemahmedhamed@gmail.com</span>
              </a>

              <a
                href="https://github.com/Tasniem-Ahmed"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link-pill"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                <span>GitHub</span>
              </a>

              <a
                href="https://www.linkedin.com/in/tasniem-ahmed"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link-pill"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="brand-wordmark footer-logo">Tasniem<span className="brand-accent">.</span></span>
            <p className="footer-tagline">"Exploring the Web. Learning to Secure It."</p>
          </div>

          <div className="footer-nav">
            <a href="https://github.com/Tasniem-Ahmed" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <span className="dot-sep">·</span>
            <a href="https://www.linkedin.com/in/tasniem-ahmed" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <span className="dot-sep">·</span>
            <a href="mailto:tasniemahmedhamed@gmail.com">
              Email
            </a>
          </div>

          <div className="footer-copy">
            © 2026 Tasniem. Authentic Work & Laboratory Archive.
          </div>
        </div>
      </footer>

      {/* CERTIFICATE MODAL */}
      {activeCertModal && (
        <div className="modal-backdrop" onClick={() => setActiveCertModal(null)} role="dialog" aria-modal="true">
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setActiveCertModal(null)}
              aria-label="Close modal"
            >
              ×
            </button>
            <div className="modal-body">
              <img
                src={activeCertModal.image}
                alt={activeCertModal.title}
                className="modal-cert-img"
              />
              <div className="modal-caption">
                <h4>{activeCertModal.title}</h4>
                <p>Issued by {activeCertModal.issuer} • Verified Credential Asset</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STYLESHEET */}
      <style>{`
        :root {
          --bg-dark: #090a0d;
          --bg-surface: #111318;
          --bg-surface-elevated: #181b22;
          --border-color: rgba(255, 255, 255, 0.08);
          --border-color-hover: rgba(220, 38, 38, 0.45);
          
          --accent-crimson: #dc2626;
          --accent-crimson-hover: #ef4444;
          --accent-glow: rgba(220, 38, 38, 0.22);
          
          --accent-blue: #3b82f6;
          --accent-blue-glow: rgba(59, 130, 246, 0.18);
          
          --text-primary: #f3f4f6;
          --text-secondary: #9ca3af;
          --text-muted: #6b7280;

          --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          --font-heading: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          background-color: var(--bg-dark);
          color: var(--text-primary);
          font-family: var(--font-sans);
          line-height: 1.6;
          overflow-x: hidden;
        }

        /* 1. Precision Custom Cursor */
        @media (hover: hover) and (pointer: fine) {
          body {
            cursor: none !important;
          }
          a, button, input, select, textarea, [role="button"], [role="tab"] {
            cursor: none !important;
          }
        }

        .custom-cursor-dot {
          position: fixed;
          top: 0;
          left: 0;
          width: 6px;
          height: 6px;
          margin-top: -3px;
          margin-left: -3px;
          background-color: var(--accent-crimson);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          box-shadow: 0 0 8px rgba(220, 38, 38, 0.8);
          will-change: transform;
        }

        .custom-cursor-ring {
          position: fixed;
          top: 0;
          left: 0;
          width: 32px;
          height: 32px;
          margin-top: -16px;
          margin-left: -16px;
          border: 1px solid rgba(220, 38, 38, 0.45);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9998;
          transition: width 0.22s ease-out, height 0.22s ease-out, border-color 0.22s ease-out, background-color 0.22s ease-out, margin 0.22s ease-out;
          will-change: transform;
        }

        .cursor-hovered {
          width: 48px;
          height: 48px;
          margin-top: -24px;
          margin-left: -24px;
          border-color: var(--accent-crimson);
          background-color: rgba(220, 38, 38, 0.08);
        }

        /* Disable custom cursor on mobile / touch */
        @media (hover: none) or (pointer: coarse) {
          .custom-cursor-dot,
          .custom-cursor-ring {
            display: none !important;
          }
          body, a, button {
            cursor: auto !important;
          }
        }

        /* 2. Interactive Canvas & Spotlight */
        .interactive-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 0;
          opacity: 0.65;
        }

        .cursor-spotlight {
          position: fixed;
          top: -250px;
          left: -250px;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(220, 38, 38, 0.06) 0%, rgba(59, 130, 246, 0.03) 40%, transparent 70%);
          pointer-events: none;
          z-index: 1;
        }

        .portfolio-root {
          position: relative;
          z-index: 2;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Typography */
        h1, h2, h3, h4, h5, h6 {
          font-family: var(--font-heading);
          color: var(--text-primary);
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        p {
          color: var(--text-secondary);
        }

        .brand-wordmark {
          font-family: var(--font-heading);
          font-size: 1.45rem;
          font-weight: 700;
          color: var(--text-primary);
          text-decoration: none;
          letter-spacing: -0.03em;
          display: inline-block;
          transition: color 0.2s ease;
        }

        .brand-accent {
          color: var(--accent-crimson);
        }

        .brand-wordmark:hover {
          color: #ffffff;
        }

        /* Navigation */
        .navbar-container {
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          background-color: rgba(9, 10, 13, 0.82);
          border-bottom: 1px solid var(--border-color);
        }

        .navbar {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
        }

        .nav-links {
          display: flex;
          gap: 1.75rem;
          align-items: center;
          list-style: none;
        }

        .nav-links a {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.92rem;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .nav-links a:hover {
          color: var(--text-primary);
        }

        .nav-cta-btn {
          padding: 0.45rem 1.1rem;
          border-radius: 6px;
          background-color: rgba(220, 38, 38, 0.12);
          border: 1px solid var(--accent-crimson);
          color: var(--accent-crimson) !important;
          transition: all 0.2s ease !important;
        }

        .nav-cta-btn:hover {
          background-color: var(--accent-crimson) !important;
          color: #ffffff !important;
        }

        .mobile-toggle {
          display: none;
          background: none;
          border: none;
          padding: 0.5rem;
        }

        .hamburger-bar {
          display: block;
          width: 22px;
          height: 2px;
          background-color: var(--text-primary);
          position: relative;
          transition: background-color 0.2s;
        }

        .hamburger-bar::before, .hamburger-bar::after {
          content: '';
          position: absolute;
          width: 22px;
          height: 2px;
          background-color: var(--text-primary);
          transition: transform 0.2s ease;
        }

        .hamburger-bar::before { top: -6px; }
        .hamburger-bar::after { bottom: -6px; }

        .hamburger-bar.open {
          background-color: transparent;
        }

        .hamburger-bar.open::before {
          transform: translateY(6px) rotate(45deg);
        }

        .hamburger-bar.open::after {
          transform: translateY(-6px) rotate(-45deg);
        }

        /* Buttons & Interactions */
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.4rem;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          border: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--accent-crimson) 0%, #b91c1c 100%);
          color: #ffffff;
          box-shadow: 0 4px 18px var(--accent-glow);
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, var(--accent-crimson-hover) 0%, var(--accent-crimson) 100%);
          box-shadow: 0 6px 24px rgba(220, 38, 38, 0.35);
          transform: translateY(-2px);
        }

        .btn-secondary {
          background-color: var(--bg-surface-elevated);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .btn-secondary:hover {
          border-color: rgba(255, 255, 255, 0.2);
          background-color: #212631;
          transform: translateY(-2px);
        }

        .btn-large {
          padding: 0.9rem 1.9rem;
          font-size: 1.05rem;
        }

        /* Section Layouts & Centering */
        .section-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 5.5rem 1.5rem;
        }

        .section-header {
          margin-bottom: 3.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .section-label {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: var(--accent-crimson);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
          display: block;
          text-align: center;
        }

        .section-title {
          font-size: 2.3rem;
          margin-bottom: 0.75rem;
          text-align: center;
        }

        .section-description {
          max-width: 650px;
          font-size: 1.05rem;
          text-align: center;
          margin: 0 auto;
        }

        .interactive-tilt {
          transform-style: preserve-3d;
          transition: transform 0.18s ease-out, border-color 0.25s ease, box-shadow 0.25s ease;
          position: relative;
        }

        /* HERO SECTION */
        .hero-section {
          min-height: calc(88vh - 70px);
          display: flex;
          align-items: center;
          position: relative;
          padding: 4rem 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero-floating-elements {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        .float-badge {
          position: absolute;
          padding: 0.4rem 0.85rem;
          background: rgba(17, 19, 24, 0.75);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--text-secondary);
          backdrop-filter: blur(8px);
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          animation: floatDrift 7s ease-in-out infinite alternate;
        }

        .badge-1 { top: 18%; right: 12%; animation-duration: 6.5s; }
        .badge-2 { bottom: 25%; right: 8%; animation-duration: 8.5s; animation-delay: 1s; }
        .badge-3 { top: 28%; left: 3%; animation-duration: 7.8s; animation-delay: 1.5s; }
        .badge-4 { bottom: 20%; left: 8%; animation-duration: 9.2s; animation-delay: 0.5s; }

        .badge-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--accent-crimson);
          box-shadow: 0 0 8px var(--accent-crimson);
        }

        .pulse-blue {
          background-color: var(--accent-blue);
          box-shadow: 0 0 8px var(--accent-blue);
        }

        @keyframes floatDrift {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-16px) rotate(1.5deg); }
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 820px;
        }

        .hero-badge-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.4rem 0.95rem;
          background-color: rgba(220, 38, 38, 0.08);
          border: 1px solid rgba(220, 38, 38, 0.25);
          border-radius: 20px;
          margin-bottom: 1.6rem;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          background-color: var(--accent-crimson);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--accent-crimson);
          animation: blink 2s infinite ease-in-out;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        .hero-badge-text {
          font-family: var(--font-mono);
          font-size: 0.82rem;
          color: #fca5a5;
          letter-spacing: 0.02em;
        }

        .hero-title {
          font-size: clamp(2.4rem, 5.5vw, 4.2rem);
          line-height: 1.1;
          margin-bottom: 1.5rem;
        }

        .text-gradient {
          background: linear-gradient(135deg, #ffffff 40%, #fca5a5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.15rem;
          color: var(--text-primary);
          line-height: 1.6;
          margin-bottom: 1rem;
          max-width: 680px;
        }

        .hero-supporting-line {
          font-size: 0.98rem;
          color: var(--text-muted);
          font-style: italic;
          margin-bottom: 2.2rem;
        }

        .hero-cta-group {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        /* ABOUT SECTION */
        .about-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.75rem;
        }

        .about-card {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 2.2rem;
          position: relative;
          overflow: hidden;
        }

        .about-card:hover {
          border-color: var(--border-color-hover);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
        }

        .about-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .icon-box {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: rgba(220, 38, 38, 0.1);
          color: var(--accent-crimson);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-security {
          background: rgba(220, 38, 38, 0.15);
          color: #ef4444;
        }

        .icon-network {
          background: rgba(59, 130, 246, 0.12);
          color: #60a5fa;
        }

        /* TIMELINE (JOURNEY) */
        .timeline-wrapper {
          position: relative;
          max-width: 780px;
          margin: 0 auto;
          padding-left: 2rem;
        }

        .timeline-line {
          position: absolute;
          left: 0;
          top: 8px;
          bottom: 15px;
          width: 2px;
          background: linear-gradient(180deg, var(--accent-crimson) 0%, rgba(220, 38, 38, 0.15) 100%);
        }

        .timeline-item {
          position: relative;
          margin-bottom: 2.75rem;
        }

        .timeline-dot {
          position: absolute;
          left: -2rem;
          top: 6px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--bg-dark);
          border: 2px solid var(--accent-crimson);
          transform: translateX(-6px);
        }

        .pulse-current {
          background: var(--accent-crimson);
          box-shadow: 0 0 12px var(--accent-crimson);
        }

        .timeline-card {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1.4rem 1.6rem;
        }

        .highlight-card {
          border-color: rgba(220, 38, 38, 0.35);
          background: linear-gradient(145deg, #13151b 0%, var(--bg-surface) 100%);
        }

        .timeline-year {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: var(--accent-crimson);
          margin-bottom: 0.25rem;
          display: inline-block;
        }

        .timeline-badge-active {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          background-color: rgba(220, 38, 38, 0.15);
          color: #fca5a5;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }

        .timeline-heading {
          font-size: 1.18rem;
          margin-bottom: 0.45rem;
        }

        .timeline-desc {
          font-size: 0.95rem;
          line-height: 1.55;
        }

        /* WORK SECTION & TABS */
        .filter-tabs {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
        }

        .tab-btn {
          padding: 0.5rem 1.1rem;
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          border-radius: 6px;
          font-size: 0.88rem;
          transition: all 0.2s ease;
        }

        .tab-btn:hover {
          color: var(--text-primary);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .active-tab {
          background-color: var(--bg-surface-elevated);
          border-color: var(--accent-crimson);
          color: #ffffff;
        }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 2rem;
          align-items: start;
        }

        .project-card {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .project-card:hover {
          border-color: var(--border-color-hover);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
        }

        /* In-place expansion: NO movement, translation, or horizontal grid shifting */
        .card-expanded {
          border-color: rgba(220, 38, 38, 0.5) !important;
          transform: none !important;
        }

        .project-preview-frame {
          height: 220px;
          width: 100%;
          background-color: #0d0f14;
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid var(--border-color);
        }

        .image-wrapper {
          width: 100%;
          height: 100%;
        }

        .project-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top;
          transition: transform 0.4s ease;
        }

        .project-card:hover .project-img {
          transform: scale(1.03);
        }

        .img-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, #11141c 0%, #0d0f14 100%);
          padding: 1.5rem;
          text-align: center;
        }

        .fallback-technical-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
        }

        .fallback-icon {
          color: var(--accent-crimson);
          margin-bottom: 0.2rem;
        }

        .fallback-title {
          font-family: var(--font-heading);
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .fallback-sub {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        /* Cybersecurity Special Preview */
        .sec-preview-canvas {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #101218 0%, #0c0e12 100%);
          padding: 1.2rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .sec-preview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.6rem;
        }

        .sec-audit-badge {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          padding: 0.6rem 0.5rem;
        }

        .sec-audit-badge strong {
          display: block;
          font-size: 0.76rem;
          color: var(--text-primary);
          margin-top: 0.3rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sec-audit-badge p {
          font-size: 0.68rem;
          color: var(--text-muted);
          line-height: 1.2;
          margin-top: 0.2rem;
        }

        .sec-tag {
          font-family: var(--font-mono);
          font-size: 0.62rem;
          color: #f87171;
          background: rgba(220, 38, 38, 0.15);
          padding: 0.1rem 0.35rem;
          border-radius: 3px;
        }

        .sec-tag-blue {
          color: #60a5fa;
          background: rgba(59, 130, 246, 0.15);
        }

        .sec-status-bar {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--text-muted);
          border-top: 1px solid var(--border-color);
          padding-top: 0.5rem;
        }

        .text-crimson {
          color: var(--accent-crimson);
        }

        .project-category-badge {
          position: absolute;
          top: 0.85rem;
          right: 0.85rem;
          padding: 0.25rem 0.65rem;
          background-color: rgba(9, 10, 13, 0.85);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-secondary);
        }

        .project-card-body {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .project-card-title {
          font-size: 1.35rem;
          margin-bottom: 0.25rem;
        }

        .project-card-subtitle {
          font-size: 0.85rem;
          color: var(--accent-crimson);
          font-family: var(--font-mono);
          margin-bottom: 0.85rem;
        }

        .project-card-desc {
          font-size: 0.94rem;
          line-height: 1.6;
          margin-bottom: 1.25rem;
          flex-grow: 1;
        }

        .project-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-bottom: 1.5rem;
        }

        .tag-pill {
          font-family: var(--font-mono);
          font-size: 0.74rem;
          padding: 0.2rem 0.55rem;
          background-color: var(--bg-surface-elevated);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: var(--text-secondary);
        }

        .project-card-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: auto;
        }

        .btn-expand {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(220, 38, 38, 0.08);
          border: 1px solid rgba(220, 38, 38, 0.25);
          color: #fca5a5;
          padding: 0.55rem 1rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .btn-expand:hover {
          background-color: var(--accent-crimson);
          color: #ffffff;
        }

        .link-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          background-color: var(--bg-surface-elevated);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .link-icon-btn:hover {
          color: var(--text-primary);
          border-color: rgba(255, 255, 255, 0.3);
        }

        /* STABLE IN-PLACE CASE STUDY: No movement or jump */
        .case-study-expanded {
          background-color: #0c0e12;
          padding: 2.2rem;
          border-top: 1px solid var(--border-color);
          animation: stableFadeIn 0.25s ease-out;
        }

        @keyframes stableFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .case-study-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border-color-hover), transparent);
          margin-bottom: 2rem;
        }

        .cs-section {
          margin-bottom: 1.8rem;
        }

        .cs-title {
          font-size: 1.05rem;
          color: var(--accent-crimson);
          margin-bottom: 0.6rem;
          letter-spacing: 0.01em;
        }

        .cs-bullet-list {
          list-style-type: none;
          padding-left: 0;
        }

        .cs-bullet-list li {
          position: relative;
          padding-left: 1.4rem;
          margin-bottom: 0.45rem;
          font-size: 0.95rem;
          color: var(--text-secondary);
        }

        .cs-bullet-list li::before {
          content: '▹';
          position: absolute;
          left: 0;
          color: var(--accent-crimson);
        }

        .tools-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.4rem;
        }

        .tool-pill, .tool-pill-light {
          font-family: var(--font-mono);
          font-size: 0.76rem;
          padding: 0.25rem 0.6rem;
          border-radius: 4px;
        }

        .tool-pill {
          background-color: rgba(220, 38, 38, 0.12);
          color: #fca5a5;
          border: 1px solid rgba(220, 38, 38, 0.25);
        }

        .tool-pill-light {
          background-color: var(--bg-surface-elevated);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        /* Cisco Packet Tracer Gallery View */
        .cisco-gallery-container {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
          margin-top: 0.75rem;
        }

        .cisco-main-viewport {
          position: relative;
          background-color: #08090c;
          min-height: 280px;
        }

        .cisco-active-img {
          width: 100%;
          max-height: 480px;
          object-fit: contain;
          display: block;
        }

        .cisco-caption-bar {
          background-color: rgba(12, 14, 18, 0.92);
          padding: 0.75rem 1rem;
          border-top: 1px solid var(--border-color);
          font-size: 0.85rem;
          display: flex;
          gap: 0.6rem;
        }

        .cisco-thumb-row {
          display: flex;
          background-color: var(--bg-surface-elevated);
          padding: 0.5rem;
          gap: 0.5rem;
          border-top: 1px solid var(--border-color);
        }

        .cisco-thumb-btn {
          flex: 1;
          padding: 0.45rem;
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 0.78rem;
          transition: all 0.18s ease;
        }

        .thumb-active {
          border-color: var(--accent-crimson);
          color: var(--accent-crimson);
          background-color: rgba(220, 38, 38, 0.1);
        }

        /* Sub-lab selector for Cybersecurity */
        .sub-lab-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
        }

        .sub-lab-btn {
          padding: 0.45rem 0.9rem;
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .sub-lab-active {
          border-color: var(--accent-crimson);
          color: #ffffff;
          background-color: rgba(220, 38, 38, 0.15);
        }

        .sub-lab-panel {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1.4rem;
        }

        .sub-lab-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.2rem;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .sub-lab-header h5 {
          font-size: 1.15rem;
          margin-bottom: 0.2rem;
        }

        .sub-lab-target {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: var(--accent-crimson);
        }

        .btn-pdf-view {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 0.9rem;
          background-color: var(--bg-surface-elevated);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 0.82rem;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .btn-pdf-view:hover {
          border-color: var(--accent-crimson);
          background-color: rgba(220, 38, 38, 0.1);
        }

        .sub-lab-block {
          margin-top: 1rem;
        }

        .sub-lab-block h6 {
          font-size: 0.9rem;
          color: var(--text-primary);
          margin-bottom: 0.35rem;
        }

        .sub-lab-block p {
          font-size: 0.92rem;
          line-height: 1.55;
        }

        /* APPROACH SECTION */
        .approach-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 1.25rem;
        }

        .approach-card {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1.75rem 1.4rem;
          position: relative;
        }

        .approach-card:hover {
          border-color: var(--border-color-hover);
        }

        .approach-number {
          font-family: var(--font-mono);
          font-size: 1.6rem;
          font-weight: 700;
          color: rgba(220, 38, 38, 0.4);
          margin-bottom: 0.6rem;
        }

        .approach-card-title {
          font-size: 1.15rem;
          margin-bottom: 0.6rem;
        }

        .approach-card-desc {
          font-size: 0.88rem;
          line-height: 1.5;
        }

        /* SKILLS SECTION */
        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.75rem;
        }

        .skill-category-card {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 2rem;
        }

        .skill-category-header {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          margin-bottom: 1.5rem;
        }

        .skill-category-header h3 {
          font-size: 1.2rem;
        }

        .skills-tag-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
        }

        .skill-chip {
          padding: 0.45rem 0.85rem;
          background-color: var(--bg-surface-elevated);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 0.88rem;
          color: var(--text-primary);
          transition: all 0.2s ease;
        }

        .skill-chip:hover {
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .skill-chip-sec:hover {
          border-color: var(--accent-crimson);
          background-color: rgba(220, 38, 38, 0.08);
        }

        .skill-chip-net:hover {
          border-color: var(--accent-blue);
          background-color: rgba(59, 130, 246, 0.08);
        }

        /* CERTIFICATIONS SECTION */
        .certs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.75rem;
        }

        .cert-card {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          overflow: hidden;
        }

        .cert-card:hover {
          border-color: var(--border-color-hover);
        }

        .cert-image-frame {
          height: 180px;
          background-color: #0a0b0e;
          position: relative;
          overflow: hidden;
        }

        .cert-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .cert-card:hover .cert-img {
          transform: scale(1.05);
        }

        .cert-overlay {
          position: absolute;
          inset: 0;
          background-color: rgba(9, 10, 13, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          font-size: 0.8rem;
          color: var(--text-primary);
        }

        .cert-image-frame:hover .cert-overlay {
          opacity: 1;
        }

        .cert-info {
          padding: 1.4rem;
        }

        .cert-issuer {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--accent-crimson);
          display: block;
          margin-bottom: 0.3rem;
        }

        .cert-title {
          font-size: 1.1rem;
          margin-bottom: 0.85rem;
        }

        .cert-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .cert-skill-pill {
          font-size: 0.72rem;
          padding: 0.15rem 0.45rem;
          background-color: var(--bg-surface-elevated);
          border-radius: 4px;
          color: var(--text-muted);
        }

        /* CONTACT SECTION */
        .contact-box {
          background: linear-gradient(145deg, #11141c 0%, var(--bg-surface) 100%);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 4rem 2.5rem;
          text-align: center;
          max-width: 820px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }

        .contact-box:hover {
          border-color: rgba(220, 38, 38, 0.4);
        }

        .contact-title {
          font-size: 2.4rem;
          margin: 0.4rem 0 1rem;
        }

        .contact-subtitle {
          max-width: 580px;
          margin: 0 auto 2.2rem;
          font-size: 1.05rem;
        }

        .contact-cta-wrapper {
          margin-bottom: 2.5rem;
        }

        .contact-direct-links {
          display: flex;
          justify-content: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .contact-link-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 1.1rem;
          background-color: var(--bg-surface-elevated);
          border: 1px solid var(--border-color);
          border-radius: 25px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.88rem;
          transition: all 0.2s ease;
        }

        .contact-link-pill:hover {
          color: var(--text-primary);
          border-color: var(--accent-crimson);
          background-color: rgba(220, 38, 38, 0.08);
          transform: translateY(-2px);
        }

        /* FOOTER */
        .footer {
          border-top: 1px solid var(--border-color);
          padding: 3rem 1.5rem 2.5rem;
          background-color: #060709;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.4rem;
          text-align: center;
        }

        .footer-logo {
          font-size: 1.6rem;
        }

        .footer-tagline {
          font-size: 0.9rem;
          color: var(--text-muted);
          font-style: italic;
          margin-top: 0.2rem;
        }

        .footer-nav {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .footer-nav a {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s ease;
        }

        .footer-nav a:hover {
          color: var(--accent-crimson);
        }

        .dot-sep {
          color: var(--text-muted);
        }

        .footer-copy {
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        /* CERTIFICATE MODAL */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(5, 6, 8, 0.88);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1.5rem;
        }

        .modal-dialog {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          max-width: 850px;
          width: 100%;
          position: relative;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
        }

        .modal-close-btn {
          position: absolute;
          top: 1rem;
          right: 1.25rem;
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 1.5rem;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-cert-img {
          width: 100%;
          max-height: 72vh;
          object-fit: contain;
          border-radius: 6px;
        }

        .modal-caption {
          padding-top: 1.2rem;
          text-align: center;
        }

        .modal-caption h4 {
          font-size: 1.2rem;
          margin-bottom: 0.25rem;
        }

        .modal-caption p {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        /* ACCESSIBILITY & PREFERS-REDUCED-MOTION */
        @media (prefers-reduced-motion: reduce) {
          *, ::before, ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
          .interactive-canvas, .cursor-spotlight, .float-badge, .custom-cursor-dot, .custom-cursor-ring {
            display: none !important;
          }
        }

        /* RESPONSIVE BREAKPOINTS */
        @media (max-width: 900px) {
          .hero-section {
            min-height: auto;
            padding: 5rem 1.5rem 3.5rem;
          }
          .badge-1, .badge-2, .badge-3, .badge-4 {
            display: none;
          }
          .sec-preview-grid {
            grid-template-columns: 1fr;
          }
          .cisco-caption-bar {
            flex-direction: column;
            gap: 0.2rem;
          }
        }

        @media (max-width: 768px) {
          .mobile-toggle {
            display: block;
          }

          .nav-links {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: var(--bg-surface);
            border-bottom: 1px solid var(--border-color);
            flex-direction: column;
            padding: 1.5rem;
            gap: 1.25rem;
            display: none;
          }

          .nav-open {
            display: flex;
          }

          .section-title {
            font-size: 1.9rem;
          }

          .hero-title {
            font-size: 2.3rem;
          }

          .timeline-wrapper {
            margin-left: 0.5rem;
            padding-left: 1.5rem;
          }

          .timeline-dot {
            left: -1.5rem;
          }

          .projects-grid, .skills-grid, .certs-grid {
            grid-template-columns: 1fr;
          }

          .contact-box {
            padding: 2.8rem 1.5rem;
          }

          .contact-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}