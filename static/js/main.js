/**
 * Main JavaScript for Agricultural Analysis System
 * Handles landing page interactions and animations
 */

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    initAnimations();
    initStatsCounter();
    initSmoothScroll();
    initNewsletterForm();
    initTestimonialSlider();
    initBackToTop();
    checkEarthEngineStatus();
});

/**
 * Initialize animations on scroll
 */
function initAnimations() {
    // Animate elements when they come into view
    const animatedElements = document.querySelectorAll('.card, .step-circle, .feature-icon');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    
    animatedElements.forEach(el => observer.observe(el));
    
    // Add CSS for animations if not present
    if (!document.querySelector('#animation-styles')) {
        const style = document.createElement('style');
        style.id = 'animation-styles';
        style.textContent = `
            .card, .step-circle, .feature-icon {
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.6s ease, transform 0.6s ease;
            }
            
            .card.fade-in, .step-circle.fade-in, .feature-icon.fade-in {
                opacity: 1;
                transform: translateY(0);
            }
            
            .step-circle {
                transition-delay: calc(0.1s * var(--step-index));
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            .pulse {
                animation: pulse 2s infinite;
            }
            
            .status-badge {
                display: inline-block;
                padding: 5px 10px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
            }
            
            .status-online {
                background-color: #d4edda;
                color: #155724;
            }
            
            .status-offline {
                background-color: #f8d7da;
                color: #721c24;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Set step indices for staggered animation
    document.querySelectorAll('.step-circle').forEach((el, index) => {
        el.style.setProperty('--step-index', index);
    });
}

/**
 * Animate statistics counters
 */
function initStatsCounter() {
    const stats = [
        { element: '#stat-images', target: 50000, suffix: '+', label: 'Satellite Images' },
        { element: '#stat-acres', target: 2.5, suffix: 'M', label: 'Acres Analyzed' },
        { element: '#stat-farmers', target: 15000, suffix: '+', label: 'Farmers Supported' },
        { element: '#stat-accuracy', target: 94, suffix: '%', label: 'Analysis Accuracy' }
    ];
    
    // Create stats section if it doesn't exist
    if (!document.querySelector('.stats-section')) {
        createStatsSection(stats);
    }
    
    // Start counting when stats come into view
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    stats.forEach(stat => {
                        animateCounter(stat.element, stat.target, stat.suffix);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(statsSection);
    }
}

/**
 * Create statistics section
 */
function createStatsSection(stats) {
    const statsSection = document.createElement('section');
    statsSection.className = 'stats-section py-5 bg-light';
    statsSection.innerHTML = `
        <div class="container">
            <div class="row">
                ${stats.map(stat => `
                    <div class="col-md-3 col-6 mb-4">
                        <div class="stat-card text-center">
                            <h2 class="display-4 text-success" id="${stat.element.substring(1)}">0${stat.suffix}</h2>
                            <p class="text-muted">${stat.label}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Insert after hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.parentNode.insertBefore(statsSection, hero.nextSibling);
    }
}

/**
 * Animate counter from 0 to target
 */
function animateCounter(elementId, target, suffix = '') {
    const element = document.querySelector(elementId);
    if (!element) return;
    
    let current = 0;
    const increment = target / 100; // Update 100 times
    const duration = 2000; // 2 seconds
    const stepTime = duration / 100;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        // Format number
        let displayValue;
        if (target >= 1000000) {
            displayValue = (current / 1000000).toFixed(1) + 'M';
        } else if (target >= 1000) {
            displayValue = Math.round(current).toLocaleString();
        } else {
            displayValue = current.toFixed(target % 1 === 0 ? 0 : 1);
        }
        
        element.textContent = displayValue + suffix;
    }, stepTime);
}

/**
 * Smooth scroll for anchor links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Handle newsletter subscription
 */
function initNewsletterForm() {
    // Create newsletter section if it doesn't exist
    if (!document.querySelector('.newsletter-section')) {
        createNewsletterSection();
    }
    
    // Add form handler
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('newsletter-email').value;
            const button = this.querySelector('button[type="submit"]');
            const originalText = button.textContent;
            
            // Show loading state
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Subscribing...';
            
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Show success message
                showNotification('Successfully subscribed to newsletter!', 'success');
                this.reset();
            } catch (error) {
                showNotification('Subscription failed. Please try again.', 'error');
            } finally {
                button.disabled = false;
                button.textContent = originalText;
            }
        });
    }
}

/**
 * Create newsletter section
 */
function createNewsletterSection() {
    const newsletterSection = document.createElement('section');
    newsletterSection.className = 'newsletter-section py-5 bg-success text-white';
    newsletterSection.innerHTML = `
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-8 text-center">
                    <h3>Stay Updated with Agricultural Insights</h3>
                    <p class="mb-4">Subscribe to our newsletter for the latest updates on crop monitoring and analysis techniques.</p>
                    <form id="newsletter-form" class="row g-3 justify-content-center">
                        <div class="col-md-8">
                            <div class="input-group">
                                <input type="email" class="form-control form-control-lg" 
                                       id="newsletter-email" placeholder="Enter your email" required>
                                <button type="submit" class="btn btn-light btn-lg">Subscribe</button>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="privacy-check" required>
                                <label class="form-check-label small" for="privacy-check">
                                    I agree to the <a href="#" class="text-white">Privacy Policy</a> and 
                                    <a href="#" class="text-white">Terms of Service</a>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Insert before footer
    const footer = document.querySelector('footer');
    if (footer) {
        footer.parentNode.insertBefore(newsletterSection, footer);
    }
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification-toast toast show position-fixed bottom-0 end-0 m-3`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.setAttribute('aria-atomic', 'true');
    notification.style.zIndex = '9999';
    
    const bgColor = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';
    const textColor = 'text-white';
    
    notification.innerHTML = `
        <div class="toast-header ${bgColor} ${textColor}">
            <strong class="me-auto">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} me-2"></i>
                ${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'}
            </strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/**
 * Initialize testimonial slider
 */
function initTestimonialSlider() {
    // Create testimonials if they don't exist
    if (!document.querySelector('.testimonials-section')) {
        createTestimonialsSection();
    }
    
    // Add slider functionality
    let currentSlide = 0;
    const slides = document.querySelectorAll('.testimonial-item');
    const prevBtn = document.querySelector('.testimonial-prev');
    const nextBtn = document.querySelector('.testimonial-next');
    
    if (slides.length && prevBtn && nextBtn) {
        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.style.display = i === index ? 'block' : 'none';
            });
        }
        
        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        });
        
        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        });
        
        // Auto advance slides every 5 seconds
        setInterval(() => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }, 5000);
    }
}

/**
 * Create testimonials section
 */
function createTestimonialsSection() {
    const testimonials = [
        {
            name: 'John Farmer',
            role: 'Corn Producer, Iowa',
            image: 'https://via.placeholder.com/64',
            text: 'This analysis system helped me increase my yield by 25% through early stress detection. The soil analysis recommendations were spot on!',
            rating: 5
        },
        {
            name: 'Sarah Grower',
            role: 'Organic Farm, California',
            image: 'https://via.placeholder.com/64',
            text: 'The crop type mapping is incredibly accurate. It saves me hours of manual surveying and helps with precision agriculture decisions.',
            rating: 5
        },
        {
            name: 'Mike Agronomist',
            role: 'Agricultural Consultant',
            image: 'https://via.placeholder.com/64',
            text: 'I recommend this tool to all my clients. The time series analysis and yield predictions are invaluable for farm planning.',
            rating: 5
        }
    ];
    
    const section = document.createElement('section');
    section.className = 'testimonials-section py-5';
    section.innerHTML = `
        <div class="container">
            <h2 class="text-center mb-5">What Our Users Say</h2>
            <div class="row justify-content-center">
                <div class="col-md-8">
                    <div class="testimonial-slider position-relative">
                        ${testimonials.map((t, i) => `
                            <div class="testimonial-item text-center ${i === 0 ? '' : 'd-none'}" data-index="${i}">
                                <img src="${t.image}" class="rounded-circle mb-3" alt="${t.name}" width="80">
                                <h5>${t.name}</h5>
                                <p class="text-muted mb-3">${t.role}</p>
                                <div class="mb-3">
                                    ${Array(t.rating).fill('<i class="fas fa-star text-warning"></i>').join('')}
                                </div>
                                <p class="lead">"${t.text}"</p>
                            </div>
                        `).join('')}
                        
                        <button class="testimonial-prev btn btn-outline-success position-absolute start-0 top-50 translate-middle-y">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="testimonial-next btn btn-outline-success position-absolute end-0 top-50 translate-middle-y">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        
                        <div class="testimonial-dots text-center mt-3">
                            ${testimonials.map((_, i) => `
                                <button class="btn btn-sm btn-link ${i === 0 ? 'active' : ''}" data-slide="${i}">
                                    <i class="fas fa-circle fa-xs"></i>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insert after features
    const features = document.querySelector('.features');
    if (features) {
        features.parentNode.insertBefore(section, features.nextSibling);
    }
    
    // Add dot navigation
    setTimeout(() => {
        document.querySelectorAll('.testimonial-dots button').forEach(btn => {
            btn.addEventListener('click', () => {
                const slideIndex = btn.dataset.slide;
                document.querySelectorAll('.testimonial-item').forEach((item, i) => {
                    item.style.display = i == slideIndex ? 'block' : 'none';
                });
                document.querySelectorAll('.testimonial-dots button').forEach(b => {
                    b.classList.toggle('active', b.dataset.slide === slideIndex);
                });
            });
        });
    }, 100);
}

/**
 * Back to top button
 */
function initBackToTop() {
    const backToTop = document.createElement('button');
    backToTop.id = 'back-to-top';
    backToTop.className = 'btn btn-success btn-lg rounded-circle position-fixed';
    backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTop.style.cssText = `
        bottom: 30px;
        left: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: none;
        z-index: 1000;
        padding: 0;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(backToTop);
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.style.display = 'block';
        } else {
            backToTop.style.display = 'none';
        }
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Check Earth Engine API status
 */
async function checkEarthEngineStatus() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        // Add status indicator to navbar
        const navbar = document.querySelector('.navbar .container');
        if (navbar && !document.querySelector('.ee-status')) {
            const statusDiv = document.createElement('div');
            statusDiv.className = 'ee-status ms-3';
            statusDiv.innerHTML = `
                <span class="status-badge ${data.earth_engine ? 'status-online' : 'status-offline'}">
                    <i class="fas ${data.earth_engine ? 'fa-check-circle' : 'fa-exclamation-circle'} me-1"></i>
                    Earth Engine: ${data.earth_engine ? 'Online' : 'Offline'}
                </span>
            `;
            navbar.appendChild(statusDiv);
        }
    } catch (error) {
        console.error('Error checking Earth Engine status:', error);
    }
}

/**
 * Add loading spinner utility
 */
function showLoading(show = true) {
    let spinner = document.querySelector('.global-spinner');
    
    if (show) {
        if (!spinner) {
            spinner = document.createElement('div');
            spinner.className = 'global-spinner position-fixed top-50 start-50 translate-middle';
            spinner.style.zIndex = '9999';
            spinner.innerHTML = `
                <div class="spinner-border text-success" style="width: 3rem; height: 3rem;" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="text-center mt-2 text-success">Loading...</div>
            `;
            document.body.appendChild(spinner);
        }
    } else {
        if (spinner) {
            spinner.remove();
        }
    }
}

/**
 * Add mobile menu improvements
 */
function initMobileMenu() {
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navbarToggler.contains(e.target) && !navbarCollapse.contains(e.target)) {
                navbarCollapse.classList.remove('show');
            }
        });
        
        // Close menu when clicking a nav link
        navbarCollapse.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navbarCollapse.classList.remove('show');
            });
        });
    }
}

/**
 * Add search functionality
 */
function initSearch() {
    // Add search box to navbar if not exists
    const navbar = document.querySelector('.navbar .container');
    if (navbar && !document.querySelector('.navbar-search')) {
        const searchForm = document.createElement('form');
        searchForm.className = 'navbar-search d-flex ms-3';
        searchForm.onsubmit = (e) => e.preventDefault();
        searchForm.innerHTML = `
            <div class="input-group input-group-sm">
                <input type="search" class="form-control" placeholder="Search documentation..." 
                       aria-label="Search" id="global-search">
                <button class="btn btn-outline-light" type="submit">
                    <i class="fas fa-search"></i>
                </button>
            </div>
        `;
        
        // Insert before EE status
        const eeStatus = document.querySelector('.ee-status');
        if (eeStatus) {
            navbar.insertBefore(searchForm, eeStatus);
        } else {
            navbar.appendChild(searchForm);
        }
        
        // Add search handler
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const query = searchInput.value.trim();
                    if (query.length > 2) {
                        performSearch(query);
                    }
                }, 500);
            });
        }
    }
}

/**
 * Perform search (simulated)
 */
function performSearch(query) {
    console.log('Searching for:', query);
    showNotification(`Searching for "${query}"...`, 'info');
    // In production, this would call a search API
}

// Initialize mobile menu and search after DOM load
setTimeout(() => {
    initMobileMenu();
    initSearch();
}, 500);

// Export functions for use in other scripts
window.AgriAnalyzer = {
    showNotification,
    showLoading,
    animateCounter,
    checkEarthEngineStatus
};

// Add Font Awesome if not present
if (!document.querySelector('link[href*="font-awesome"]')) {
    const faLink = document.createElement('link');
    faLink.rel = 'stylesheet';
    faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    document.head.appendChild(faLink);
}

// Add Bootstrap JS if not present
if (typeof bootstrap === 'undefined') {
    const bsScript = document.createElement('script');
    bsScript.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js';
    document.body.appendChild(bsScript);
}