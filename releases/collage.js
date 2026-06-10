// Screenshot dataset matching the local gallery files
const screenshots = [
  {
    index: "01",
    title: "Secure Login Portal",
    desc: "Clean authentication interface with secure credentials sign-in.",
    desktopImg: "gallery/desktop/desktop_01_login.png",
    mobileImg: "gallery/mobile/mobile_01_login.png.png",
    tags: ["security", "auth", "login"]
  },
  {
    index: "02",
    title: "Guided Onboarding",
    desc: "Interactive configuration wizard to set up credentials and schedules.",
    desktopImg: "gallery/desktop/desktop_02_onboarding.png",
    mobileImg: "gallery/mobile/mobile_02_onboarding.png.png",
    tags: ["setup", "onboarding", "wizard"]
  },
  {
    index: "03",
    title: "Analytics Dashboard",
    desc: "Real-time KPIs, active courses, pending tasks, and finances overview.",
    desktopImg: "gallery/desktop/desktop_03_dashboard.png",
    mobileImg: "gallery/mobile/mobile_03_dashboard.png.png",
    tags: ["analytics", "dashboard", "overview"]
  },
  {
    index: "04",
    title: "Batch Management",
    desc: "Monitor academic cohorts, assign teachers, allocate rooms, and track size.",
    desktopImg: "gallery/desktop/desktop_04_batches.png",
    mobileImg: "gallery/mobile/mobile_04_batches.png.png",
    tags: ["batches", "courses", "scheduler"]
  },
  {
    index: "05",
    title: "Student Profile Hub",
    desc: "Comprehensive database record of student academic histories and registration.",
    desktopImg: "gallery/desktop/desktop_05_student_profile.png",
    mobileImg: "gallery/mobile/mobile_05_student_profile.png.png",
    tags: ["profile", "student", "records"]
  },
  {
    index: "06",
    title: "Dossier Ledger",
    desc: "Detailed administrative documentation system for student dossiers.",
    desktopImg: "gallery/desktop/desktop_06_dossier_ledger.png",
    mobileImg: "gallery/mobile/mobile_06_dossier_chart.png.png",
    tags: ["dossier", "ledger", "charts"]
  },
  {
    index: "07",
    title: "Attendance Manager",
    desc: "Automated roll call check verification with attendance statistics.",
    desktopImg: "gallery/desktop/desktop_07_attendance.png",
    mobileImg: "gallery/mobile/mobile_07_mark_attendance.png.png",
    tags: ["attendance", "analytics", "tracking"]
  },
  {
    index: "08",
    title: "Financial Console",
    desc: "Fee collection tracking, payment statements, and accounting ledgers.",
    desktopImg: "gallery/desktop/desktop_08_finances.png",
    mobileImg: "gallery/mobile/mobile_08_finances.png.png",
    tags: ["finances", "accounting", "billing"]
  },
  {
    index: "09",
    title: "Exams & Grading",
    desc: "Academic examinations setup, scheduling, and digital report cards.",
    desktopImg: "gallery/desktop/desktop_09_exams.png",
    mobileImg: "gallery/mobile/mobile_09_exams.png.png",
    tags: ["exams", "grades", "evaluation"]
  },
  {
    index: "10",
    title: "AI Reports Engine",
    desc: "Automated analysis tool generating student behavioral logs and forecasts.",
    desktopImg: "gallery/desktop/desktop_10_ai_reports.png",
    mobileImg: "gallery/mobile/mobile_10_ai_reports.png.png",
    tags: ["ai", "reports", "insights"]
  },
  {
    index: "11",
    title: "Invoice & Receipting",
    desc: "Generates receipt logs and downloadable printable invoice PDFs.",
    desktopImg: "gallery/desktop/desktop_11_pdf_invoice.png",
    mobileImg: "gallery/mobile/mobile_11_print_receipt.png.jpg",
    tags: ["invoice", "receipt", "billing"]
  }
];

// Active State variables
let currentLightboxIndex = 0;
let currentLightboxView = "desktop"; // "desktop" or "mobile"

// DOM Elements
const browserTrack = document.getElementById("browser-track");
const phoneTrack = document.getElementById("phone-track");

const browserViewport = document.getElementById("browser-viewport");
const phoneViewport = document.getElementById("phone-viewport");

const desktopDots = document.getElementById("desktop-dots");
const mobileDots = document.getElementById("mobile-dots");

const desktopPrev = document.getElementById("desktop-prev");
const desktopNext = document.getElementById("desktop-next");
const mobilePrev = document.getElementById("mobile-prev");
const mobileNext = document.getElementById("mobile-next");

const lightbox = document.getElementById("lightbox");
const lightboxTitle = document.getElementById("lightbox-title");
const lightboxSubtitle = document.getElementById("lightbox-subtitle");
const lightboxBody = document.getElementById("lightbox-body");
const lightboxFooter = document.getElementById("lightbox-footer");
const closeBtn = document.getElementById("lightbox-close");
const prevBtn = document.getElementById("lightbox-prev");
const nextBtn = document.getElementById("lightbox-next");

// Initial Setup
document.addEventListener("DOMContentLoaded", () => {
  renderSlides();
  
  // Initialize Drag & Navigation behavior for devices
  initDraggableCarousel(browserViewport, desktopDots, desktopPrev, desktopNext, "desktop");
  initDraggableCarousel(phoneViewport, mobileDots, mobilePrev, mobileNext, "mobile");
  
  setupLightboxListeners();
  
  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

// Render images into browser and phone tracks
function renderSlides() {
  browserTrack.innerHTML = "";
  phoneTrack.innerHTML = "";

  screenshots.forEach((item, idx) => {
    // Desktop slide
    const desktopSlide = document.createElement("div");
    desktopSlide.className = "browser-slide";
    desktopSlide.innerHTML = `
      <img src="${item.desktopImg}" alt="${item.title} Desktop View" onclick="openLightbox(${idx}, 'desktop')">
      <div class="zoom-indicator-overlay"><i data-lucide="zoom-in"></i></div>
    `;
    browserTrack.appendChild(desktopSlide);

    // Mobile slide
    const mobileSlide = document.createElement("div");
    mobileSlide.className = "phone-slide";
    mobileSlide.innerHTML = `
      <img src="${item.mobileImg}" alt="${item.title} Mobile View" onclick="openLightbox(${idx}, 'mobile')">
      <div class="zoom-indicator-overlay"><i data-lucide="zoom-in"></i></div>
    `;
    phoneTrack.appendChild(mobileSlide);
  });
}

// Reusable Carousel Drag & Snap Controller
function initDraggableCarousel(viewport, dotsContainer, prevBtn, nextBtn, deviceType) {
  let isDown = false;
  let startX;
  let scrollLeft;
  let dragThreshold = 5;
  let hasDragged = false;
  let localActiveIndex = 0;

  // Generate Navigation Dots
  generateIndicators(viewport, dotsContainer);

  // Initial Sync
  updateActiveDot(viewport, dotsContainer);
  updateArrowStates(viewport, prevBtn, nextBtn);
  updateMetadata(deviceType, 0);

  // Mouse drag events
  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    hasDragged = false;
    viewport.classList.add("dragging");
    startX = e.pageX - viewport.offsetLeft;
    scrollLeft = viewport.scrollLeft;
  });

  viewport.addEventListener("mouseleave", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("dragging");
    snapToClosest(viewport, deviceType);
  });

  viewport.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("dragging");
    
    if (hasDragged) {
      snapToClosest(viewport, deviceType);
    }
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    
    const x = e.pageX - viewport.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag sensitivity
    
    if (Math.abs(walk) > dragThreshold) {
      hasDragged = true;
    }
    
    viewport.scrollLeft = scrollLeft - walk;
  });

  // Track scrolling events (updates dots, metadata, arrows)
  viewport.addEventListener("scroll", () => {
    const currentIndex = getActiveIndex(viewport, deviceType);
    if (currentIndex !== localActiveIndex) {
      localActiveIndex = currentIndex;
      updateActiveDot(viewport, dotsContainer);
      updateArrowStates(viewport, prevBtn, nextBtn);
      updateMetadata(deviceType, currentIndex);
    }
  });

  // Attach Arrow Button Events
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      const currentIndex = getActiveIndex(viewport, deviceType);
      if (currentIndex > 0) {
        scrollToIndex(viewport, currentIndex - 1, deviceType);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const currentIndex = getActiveIndex(viewport, deviceType);
      const totalItems = screenshots.length;
      if (currentIndex < totalItems - 1) {
        scrollToIndex(viewport, currentIndex + 1, deviceType);
      }
    });
  }
}

// Generate Indicator Dots
function generateIndicators(viewport, dotsContainer) {
  dotsContainer.innerHTML = "";
  
  screenshots.forEach((_, idx) => {
    const dot = document.createElement("button");
    dot.className = "indicator-dot";
    dot.setAttribute("aria-label", `Jump to slide ${idx + 1}`);
    dot.addEventListener("click", () => {
      scrollToIndex(viewport, idx);
    });
    dotsContainer.appendChild(dot);
  });
}

// Get the index of the slide closest to the viewport center
function getActiveIndex(viewport, deviceType) {
  const slideClass = deviceType === "desktop" ? "browser-slide" : "phone-slide";
  const items = viewport.querySelectorAll(`.${slideClass}`);
  if (items.length === 0) return 0;
  
  const vpCenter = viewport.scrollLeft + (viewport.clientWidth / 2);
  let activeIndex = 0;
  let minDistance = Infinity;

  items.forEach((item, index) => {
    const itemCenter = item.offsetLeft + (item.clientWidth / 2);
    const distance = Math.abs(vpCenter - itemCenter);
    
    if (distance < minDistance) {
      minDistance = distance;
      activeIndex = index;
    }
  });

  return activeIndex;
}

// Scroll to specific index in viewport
function scrollToIndex(viewport, index, deviceType) {
  const slideClass = deviceType === "desktop" ? "browser-slide" : "phone-slide";
  const items = viewport.querySelectorAll(`.${slideClass}`);
  if (index >= 0 && index < items.length) {
    const item = items[index];
    const offset = item.offsetLeft - (viewport.clientWidth - item.clientWidth) / 2;
    viewport.scrollTo({
      left: offset,
      behavior: "smooth"
    });
  }
}

// Snap scroll to closest element after drag release
function snapToClosest(viewport, deviceType) {
  const activeIdx = getActiveIndex(viewport, deviceType);
  scrollToIndex(viewport, activeIdx, deviceType);
}

// Update Dots selection class
function updateActiveDot(viewport, dotsContainer) {
  const activeIdx = getActiveIndex(viewport, viewport.id.includes("browser") ? "desktop" : "mobile");
  const dots = dotsContainer.querySelectorAll(".indicator-dot");
  
  dots.forEach((dot, idx) => {
    if (idx === activeIdx) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
}

// Enable/Disable navigation arrow controls
function updateArrowStates(viewport, prevBtn, nextBtn) {
  const activeIdx = getActiveIndex(viewport, viewport.id.includes("browser") ? "desktop" : "mobile");
  const totalItems = screenshots.length;
  
  if (prevBtn) prevBtn.disabled = activeIdx === 0;
  if (nextBtn) nextBtn.disabled = activeIdx === totalItems - 1;
}

// Dynamically update Title and Description panels below devices
function updateMetadata(deviceType, index) {
  const item = screenshots[index];
  const panel = document.getElementById(`${deviceType}-info-panel`);
  if (!panel) return;

  const indexEl = panel.querySelector(".card-index");
  const titleEl = panel.querySelector(".card-title");
  const descEl = panel.querySelector(".card-desc");

  // Subtle opacity transition
  panel.style.opacity = 0.3;
  
  setTimeout(() => {
    if (indexEl) indexEl.textContent = `Module #${item.index}`;
    if (titleEl) titleEl.textContent = item.title;
    if (descEl) descEl.textContent = item.desc;
    panel.style.opacity = 1;
  }, 100);
}

// Lightbox Listeners & Navigation
function setupLightboxListeners() {
  closeBtn.addEventListener("click", closeLightbox);
  prevBtn.addEventListener("click", navigateLightboxPrev);
  nextBtn.addEventListener("click", navigateLightboxNext);

  // Keyboard controls
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") navigateLightboxPrev();
    if (e.key === "ArrowRight") navigateLightboxNext();
  });

  // Click background to close
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target === lightboxBody) {
      closeLightbox();
    }
  });
}

function openLightbox(index, viewType) {
  currentLightboxIndex = index;
  currentLightboxView = viewType;
  
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden"; // block background scroll
  
  renderLightboxContent();
}

function renderLightboxContent() {
  const item = screenshots[currentLightboxIndex];
  
  lightboxTitle.textContent = item.title;
  lightboxSubtitle.textContent = item.desc;
  
  lightboxBody.innerHTML = "";
  
  if (currentLightboxView === "desktop") {
    lightboxBody.innerHTML = `
      <div class="lightbox-content-wrapper">
        <div class="device-frame-browser">
          <div class="browser-bar">
            <div class="browser-dots">
              <span class="browser-dot red"></span>
              <span class="browser-dot yellow"></span>
              <span class="browser-dot green"></span>
            </div>
            <div class="browser-address">https://tutorpro.app/portal/${item.title.toLowerCase().replace(/ /g, "-")}</div>
          </div>
          <div class="browser-content">
            <img src="${item.desktopImg}" alt="${item.title} Desktop View">
          </div>
        </div>
      </div>
    `;
    
    lightboxFooter.innerHTML = `
      <span><i data-lucide="monitor"></i> Desktop Showcase</span>
      <span>${currentLightboxIndex + 1} / ${screenshots.length}</span>
    `;
  } else {
    lightboxBody.innerHTML = `
      <div class="lightbox-content-wrapper">
        <div class="device-frame-phone">
          <div class="phone-notch"></div>
          <div class="phone-content">
            <img src="${item.mobileImg}" alt="${item.title} Mobile View">
          </div>
        </div>
      </div>
    `;
    
    lightboxFooter.innerHTML = `
      <span><i data-lucide="smartphone"></i> Mobile Showcase</span>
      <span>${currentLightboxIndex + 1} / ${screenshots.length}</span>
    `;
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = ""; // restore background scroll
  lightboxBody.innerHTML = "";
}

function navigateLightboxPrev() {
  currentLightboxIndex = (currentLightboxIndex - 1 + screenshots.length) % screenshots.length;
  updateLightboxDetails();
}

function navigateLightboxNext() {
  currentLightboxIndex = (currentLightboxIndex + 1) % screenshots.length;
  updateLightboxDetails();
}

function updateLightboxDetails() {
  lightboxBody.style.transform = "scale(0.96)";
  lightboxBody.style.opacity = "0.4";
  
  setTimeout(() => {
    renderLightboxContent();
    lightboxBody.style.transform = "scale(1)";
    lightboxBody.style.opacity = "1";
  }, 150);
}
